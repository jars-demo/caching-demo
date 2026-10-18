"""Case 05: the nine o'clock stampede.

The bestseller list is an expensive query, so it is cached. At 09:00 the entry is gone and fifty
visitors arrive in the same instant. Every one of them misses, and every one of them runs the
query. The database does fifty times the work, at the moment it is busiest.
Run it: uv run python -m shop run 5
"""

import threading
import time

LISTS = {
    "bestsellers": ["Dune", "Piranesi", "Middlemarch"],
    "new": ["The Overstory", "Orbital", "Prophet Song"],
}


class Database:
    def __init__(self) -> None:
        self.queries: dict[str, int] = {}
        self._count = threading.Lock()  # so the count itself is right

    def top(self, shelf: str) -> list[str]:
        with self._count:
            self.queries[shelf] = self.queries.get(shelf, 0) + 1
        time.sleep(0.2)  # a heavy query: it scans every sale this week
        return list(LISTS[shelf])


class Shop:
    def __init__(self, db: Database) -> None:
        self.db = db
        self.cache: dict[str, list[str]] = {}

    def top(self, shelf: str) -> list[str]:
        if shelf in self.cache:
            return self.cache[shelf]
        value = self.db.top(shelf)
        self.cache[shelf] = value
        return value


def nine_oclock(
    shelves: tuple[str, ...] = ("bestsellers",), visitors: int = 50
) -> tuple[Database, list[tuple[str, list[str]]], float]:
    """Fifty visitors per shelf, all at once, against an empty cache."""
    db = Database()
    shop = Shop(db)
    wanted = [shelf for shelf in shelves for _ in range(visitors)]
    doors_open = threading.Barrier(len(wanted))
    results: list[tuple[str, list[str]]] = []

    def visitor(shelf: str) -> None:
        doors_open.wait()
        results.append((shelf, shop.top(shelf)))

    threads = [threading.Thread(target=visitor, args=(shelf,)) for shelf in wanted]
    start = time.perf_counter()
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join()
    return db, results, time.perf_counter() - start


def run() -> None:
    db, results, _ = nine_oclock()
    queries = db.queries.get("bestsellers", 0)
    print(f"visitors at 09:00:   {len(results)}")
    print(f"bestseller queries:  {queries} (one would have done)")
    print(f"database time spent: {queries * 0.2:.1f} s")
