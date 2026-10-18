"""Case 02: the price that would not change.

The autumn sale starts and Dune drops from 12.00 to 9.99. The database has the new price. The shop
still shows the old one, and it will until someone restarts the server.
Run it: uv run python -m shop run 2
"""

PRICES = {1: 12.00, 2: 8.50, 3: 10.00}


class Database:
    """The source of truth. Each read is counted, because each read costs time."""

    def __init__(self) -> None:
        self.rows = dict(PRICES)
        self.reads = 0

    def read_price(self, book_id: int) -> float:
        self.reads += 1
        return self.rows[book_id]

    def write_price(self, book_id: int, price: float) -> None:
        self.rows[book_id] = price


class Shop:
    """Cache-aside: look in the cache first. On a miss, read the database and keep the answer."""

    def __init__(self, db: Database) -> None:
        self.db = db
        self.cache: dict[int, float] = {}

    def price(self, book_id: int) -> float:
        if book_id not in self.cache:
            self.cache[book_id] = self.db.read_price(book_id)
        return self.cache[book_id]

    def change_price(self, book_id: int, price: float) -> None:
        self.db.write_price(book_id, price)
        self.cache.pop(book_id, None)  # the next read fetches the new price


def sale() -> tuple[Shop, list[float], list[float]]:
    shop = Shop(Database())
    before = [shop.price(1) for _ in range(5)]
    shop.change_price(1, 9.99)
    after = [shop.price(1) for _ in range(5)]
    return shop, before, after


def run() -> None:
    shop, before, after = sale()
    print(f"before the sale:   shop shows {before[-1]:.2f}")
    print(f"the database says: {shop.db.rows[1]:.2f}")
    print(f"after the sale:    shop shows {after[-1]:.2f}")
