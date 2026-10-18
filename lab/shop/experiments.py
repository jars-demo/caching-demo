"""Four experiments to run on your own machine. Every number they print is measured or computed
there and then.

latency    how long one read takes from memory, a file, SQLite and a local HTTP server
eviction   FIFO, LRU, LFU and random eviction on the same traffic, at three cache sizes
stale-set  the race that puts an old value back into the cache right after you deleted it
http       a real HTTP server on localhost: 200 with an ETag, then 304, then a change
"""

import functools
import hashlib
import http.client
import os
import platform
import random
import sqlite3
import statistics
import sys
import tempfile
import threading
import time
from collections import OrderedDict
from collections.abc import Callable
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def describe() -> str:
    return f"Python {sys.version.split()[0]}, {platform.system()}, {os.cpu_count()} CPUs"


# latency


def per_call(fn: Callable[[], object], calls: int) -> float:
    """The median time for one call, in seconds, over five rounds."""
    rounds = []
    for _ in range(5):
        start = time.perf_counter()
        for _ in range(calls):
            fn()
        rounds.append((time.perf_counter() - start) / calls)
    return statistics.median(rounds)


def readable(seconds: float) -> str:
    if seconds < 1e-6:
        return f"{seconds * 1e9:6.0f} ns"
    if seconds < 1e-3:
        return f"{seconds * 1e6:6.1f} µs"
    return f"{seconds * 1e3:6.2f} ms"


class Page(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"  # keep the connection open between requests
    body = b"<h1>Dune</h1><p>price 12.00</p>"

    def do_GET(self) -> None:
        self.send_response(200)
        self.send_header("Content-Length", str(len(self.body)))
        self.end_headers()
        self.wfile.write(self.body)

    def log_message(self, *args: object) -> None:  # keep the output clean
        pass


def latency() -> None:
    print(describe())
    print()
    book = {"dune": "Dune", "piranesi": "Piranesi"}

    @functools.lru_cache(maxsize=128)
    def title(slug: str) -> str:
        return book[slug]

    title("dune")
    with tempfile.TemporaryDirectory() as folder:
        page = Path(folder, "dune.html")
        page.write_bytes(os.urandom(4096))
        db = sqlite3.connect(Path(folder, "shop.db"))
        db.execute("create table books (slug text primary key, title text)")
        db.executemany("insert into books values (?, ?)", book.items())
        db.commit()
        server = ThreadingHTTPServer(("127.0.0.1", 0), Page)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        client = http.client.HTTPConnection("127.0.0.1", server.server_address[1])

        def fetch() -> bytes:
            client.request("GET", "/books/dune")
            return client.getresponse().read()

        rows = [
            ("dict lookup", per_call(lambda: book["dune"], 1_000_000)),
            ("functools.lru_cache hit", per_call(lambda: title("dune"), 1_000_000)),
            ("open and read a 4 KB file", per_call(page.read_bytes, 2_000)),
            (
                "SQLite query by key",
                per_call(
                    lambda: db.execute(
                        "select title from books where slug = ?", ("dune",)
                    ).fetchone(),
                    20_000,
                ),
            ),
            ("HTTP GET to localhost", per_call(fetch, 1_000)),
        ]
        client.close()
        server.shutdown()
        server.server_close()
        db.close()
    base = rows[0][1]
    print(f"  {'one read from':<28} {'time':>9}   {'vs a dict':>10}")
    for label, seconds in rows:
        print(f"  {label:<28} {readable(seconds)}   {seconds / base:>9,.0f}x")
    print()
    print(
        "  A call to another machine adds a network round trip on top, which this does not measure."
    )


# eviction


class Policy:
    name = "none"

    def __init__(self, capacity: int) -> None:
        self.capacity = capacity
        self.hits = 0

    def request(self, key: int) -> None:
        raise NotImplementedError


class FIFO(Policy):
    name = "FIFO"

    def __init__(self, capacity: int) -> None:
        super().__init__(capacity)
        self.data: OrderedDict[int, None] = OrderedDict()

    def request(self, key: int) -> None:
        if key in self.data:
            self.hits += 1
            return
        self.data[key] = None
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)


class LRU(FIFO):
    name = "LRU"

    def request(self, key: int) -> None:
        if key in self.data:
            self.data.move_to_end(key)
        super().request(key)


class LFU(Policy):
    """Evict the entry used least often while it has been in the cache."""

    name = "LFU"

    def __init__(self, capacity: int) -> None:
        super().__init__(capacity)
        self.uses: dict[int, int] = {}

    def request(self, key: int) -> None:
        if key in self.uses:
            self.hits += 1
            self.uses[key] += 1
            return
        if len(self.uses) >= self.capacity:
            del self.uses[min(self.uses, key=self.uses.__getitem__)]
        self.uses[key] = 1


class Random(Policy):
    name = "random"

    def __init__(self, capacity: int) -> None:
        super().__init__(capacity)
        self.keys: list[int] = []
        self.where: dict[int, int] = {}
        self.rng = random.Random(1)

    def request(self, key: int) -> None:
        if key in self.where:
            self.hits += 1
            return
        if len(self.keys) >= self.capacity:
            slot = self.rng.randrange(len(self.keys))
            del self.where[self.keys[slot]]
            self.keys[slot] = key
        else:
            slot = len(self.keys)
            self.keys.append(key)
        self.where[key] = slot


BOOKS = 1_000


def shoppers(rng: random.Random, visits: int) -> list[int]:
    """A few books are very popular and most are rarely looked at: a Zipf curve, like real
    shops. Book 0 is the most popular."""
    weights = [1 / rank for rank in range(1, BOOKS + 1)]
    return rng.choices(range(BOOKS), weights=weights, k=visits)


def scenarios() -> list[tuple[str, list[tuple[int, bool]]]]:
    """Each scenario is a list of (book, counted). Only counted visits go into the hit rate."""
    rng = random.Random(7)
    steady = [(book, True) for book in shoppers(rng, 50_000)]

    crawled = iter(range(BOOKS, BOOKS * 100))  # books nobody else ever looks at
    crawler: list[tuple[int, bool]] = []
    for n, visit in enumerate(steady, 1):
        crawler.append(visit)
        if n % 1_000 == 0:
            crawler.extend((next(crawled), False) for _ in range(200))

    fashion = list(range(BOOKS))
    random.Random(3).shuffle(fashion)  # new favourites: every book gets a new rank
    before = [(book, False) for book in shoppers(rng, 25_000)]
    after = [(fashion[book], True) for book in shoppers(rng, 25_000)]

    return [
        ("Steady traffic: 50,000 visits to 1,000 books", steady),
        ("The same, plus a crawler reading 200 one-off books every 1,000 visits", crawler),
        ("Tastes change: after 25,000 visits, a different set of books is popular", before + after),
    ]


def eviction() -> None:
    policies = [FIFO, LRU, LFU, Random]
    print("Hit rate for shoppers, by eviction policy and cache size")
    print()
    for title, visits in scenarios():
        print(title)
        print(f"  {'cache size':<12}" + "".join(f"{p.name:>9}" for p in policies))
        for size in (10, 50, 100):
            rates = []
            for policy in policies:
                cache = policy(size)
                hits = counted = 0
                for book, count in visits:
                    before = cache.hits
                    cache.request(book)
                    if count:
                        counted += 1
                        hits += cache.hits - before
                rates.append(hits / counted)
            print(f"  {size:<12}" + "".join(f"{rate:>9.1%}" for rate in rates))
        print()


# stale-set


def stale_set() -> None:
    """Cache-aside, deleting after the write, can still leave the cache stale forever. Two events
    force the unlucky order, so you see it every time instead of once a month."""
    db = {"dune": "12.00"}
    cache: dict[str, str] = {}
    read_done = threading.Event()
    write_done = threading.Event()

    def say(who: str, what: str) -> None:
        print(f"  {who:<8} {what}")

    def reader() -> None:
        say("reader", "cache miss for dune")
        price = db["dune"]
        say("reader", f"reads the database: {price}")
        read_done.set()
        write_done.wait()  # a pause: a slow network, a garbage collection, a busy CPU
        cache["dune"] = price
        say("reader", f"puts {price} in the cache")

    def writer() -> None:
        read_done.wait()
        db["dune"] = "9.99"
        say("writer", "writes 9.99 to the database")
        cache.pop("dune", None)
        say("writer", "deletes dune from the cache")
        write_done.set()

    threads = [threading.Thread(target=reader), threading.Thread(target=writer)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    print()
    print(f"  database: {db['dune']}   cache: {cache['dune']}")
    print("  The cache now holds the old price, with nothing left to remove it. Only a TTL will.")


# http


class Shopfront(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    price = "12.00"

    def do_GET(self) -> None:
        body = f"<h1>Dune</h1><p>price {self.price}</p>".encode()
        tag = '"' + hashlib.sha256(body).hexdigest()[:16] + '"'
        if self.headers.get("If-None-Match") == tag:
            self.send_response(304)
            self.send_header("ETag", tag)
            self.send_header("Cache-Control", "no-cache")
            self.end_headers()
            return
        self.send_response(200)
        self.send_header("ETag", tag)
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args: object) -> None:
        pass


def http_demo() -> None:
    server = ThreadingHTTPServer(("127.0.0.1", 0), Shopfront)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    client = http.client.HTTPConnection("127.0.0.1", server.server_address[1])
    etag = ""

    def get(note: str) -> None:
        nonlocal etag
        headers = {"If-None-Match": etag} if etag else {}
        client.request("GET", "/books/1", headers=headers)
        response = client.getresponse()
        body = response.read()
        sent = f"If-None-Match: {etag}" if etag else "no validator"
        print(f"{note}")
        print(f"  request:  GET /books/1  ({sent})")
        print(f"  response: {response.status} {response.reason}, {len(body)} bytes of body")
        print(f"            ETag: {response.headers['ETag']}")
        print()
        if response.status == 200:
            etag = response.headers["ETag"]

    get("First visit")
    get("Second visit, nothing changed")
    Shopfront.price = "9.99"
    get("Third visit, after the price drops")
    client.close()
    server.shutdown()
    server.server_close()
    Shopfront.price = "12.00"


EXPERIMENTS = {"latency": latency, "eviction": eviction, "stale-set": stale_set, "http": http_demo}
