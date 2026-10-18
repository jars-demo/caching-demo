"""Case 01: the cache that never hits.

The book pages sit behind a cache, and the cache never hits. Twenty visitors look at four books,
and every single visit is a trip to the catalogue.
Run it: uv run python -m shop run 1
"""

import time
from urllib.parse import urlsplit

TITLES = {1: "Dune", 2: "Piranesi", 3: "Middlemarch", 4: "The Overstory"}

# Visitors arrive from newsletters, adverts and other sites, so every address carries its own
# tracking parameters. They change nothing about the page.
SOURCES = ["newsletter", "search", "social", "friend"]
VISITS = [
    f"/books/{n % 4 + 1}?utm_source={SOURCES[n // 4 % 4]}&click_id=c{n:04}" for n in range(20)
]


class Catalogue:
    """The source of truth. It is slow: every lookup is a trip to the back room."""

    def __init__(self) -> None:
        self.trips = 0

    def title(self, book_id: int) -> str:
        self.trips += 1
        time.sleep(0.02)  # the back room is a long way off
        return TITLES[book_id]


class Shop:
    def __init__(self, catalogue: Catalogue) -> None:
        self.catalogue = catalogue
        self.cache: dict[str, str] = {}
        self.hits = 0
        self.misses = 0

    def page(self, url: str) -> str:
        key = urlsplit(url).path  # only what changes the page
        if key in self.cache:
            self.hits += 1
            return self.cache[key]
        self.misses += 1
        book_id = int(urlsplit(url).path.rsplit("/", 1)[1])
        html = f"<h1>{self.catalogue.title(book_id)}</h1>"
        self.cache[key] = html
        return html


def browse(visits: list[str] = VISITS) -> Shop:
    shop = Shop(Catalogue())
    for url in visits:
        shop.page(url)
    return shop


def run() -> None:
    start = time.perf_counter()
    shop = browse()
    elapsed = time.perf_counter() - start
    print(f"pages served:    {len(VISITS)} (of {len(TITLES)} different books)")
    print(f"catalogue trips: {shop.catalogue.trips}")
    print(f"hit rate:        {shop.hits / len(VISITS):.0%}")
    print(f"took {elapsed:.2f} s")
