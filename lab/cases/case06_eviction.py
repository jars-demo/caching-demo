"""Case 06: the bestseller that kept leaving.

The cover images live in a small cache with room for five. Half of all visits are for Dune, the
bestseller, yet Dune keeps falling out of the cache and has to be fetched again and again. The
cache says it evicts the least recently used cover. It does not.
Run it: uv run python -m shop run 6
"""

from collections import OrderedDict

MISSING = object()


class LRUCache:
    """Keeps at most `capacity` entries. When full, it evicts the least recently used one."""

    def __init__(self, capacity: int) -> None:
        self.capacity = capacity
        self.data: OrderedDict[str, str] = OrderedDict()  # oldest first

    def get(self, key: str) -> object:
        if key in self.data:
            return self.data[key]
        return MISSING

    def put(self, key: str, value: str) -> None:
        self.data[key] = value
        self.data.move_to_end(key)
        if len(self.data) > self.capacity:
            self.data.popitem(last=False)  # evict the oldest


class Storage:
    """Where the covers really live: slow, so every fetch is counted."""

    def __init__(self) -> None:
        self.fetches: dict[str, int] = {}

    def cover(self, book: str) -> str:
        self.fetches[book] = self.fetches.get(book, 0) + 1
        return f"<img alt='{book}'>"


class Shop:
    def __init__(self, storage: Storage, capacity: int = 5) -> None:
        self.storage = storage
        self.cache = LRUCache(capacity)
        self.largest = 0  # the most entries the cache ever held

    def cover(self, book: str) -> str:
        image = self.cache.get(book)
        if image is MISSING:
            image = self.storage.cover(book)
            self.cache.put(book, image)
        self.largest = max(self.largest, len(self.cache.data))
        return str(image)


# Every other visit is Dune. In between, a long tail of a hundred books, each looked at once.
TRAFFIC = [book for n in range(100) for book in ("Dune", f"book {n:03}")]


def browse(traffic: list[str] = TRAFFIC) -> Shop:
    shop = Shop(Storage())
    for book in traffic:
        shop.cover(book)
    return shop


def run() -> None:
    shop = browse()
    fetched = sum(shop.storage.fetches.values())
    print(f"visits:          {len(TRAFFIC)}, half of them for Dune")
    print(f"Dune fetches:    {shop.storage.fetches['Dune']}")
    print(f"total fetches:   {fetched}")
    print(f"hit rate:        {1 - fetched / len(TRAFFIC):.0%}")
