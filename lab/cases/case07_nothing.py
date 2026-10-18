"""Case 07: the cache that forgot zero.

The stock count for each book is cached. It works for books on the shelf. For a sold-out book,
every check goes to the database. For a book that does not exist, which is what bots ask for all
day, every check goes to the database too.
Run it: uv run python -m shop run 7
"""

STOCK = {"dune": 12, "piranesi": 0}  # Piranesi is sold out


class Database:
    def __init__(self) -> None:
        self.reads: dict[str, int] = {}

    def stock(self, slug: str) -> int | None:
        """How many copies are on the shelf, or None when there is no such book."""
        self.reads[slug] = self.reads.get(slug, 0) + 1
        return STOCK.get(slug)


class Shop:
    def __init__(self, db: Database) -> None:
        self.db = db
        self.cache: dict[str, int | None] = {}

    def stock(self, slug: str) -> int | None:
        if cached := self.cache.get(slug):
            return cached
        count = self.db.stock(slug)
        self.cache[slug] = count
        return count


BOOKS = {
    "dune": "Dune (12 on the shelf)",
    "piranesi": "Piranesi (sold out)",
    "no-such-book": "a book that does not exist",
}


def checks(times: int = 20) -> tuple[Shop, dict[str, list[int | None]]]:
    shop = Shop(Database())
    answers = {slug: [shop.stock(slug) for _ in range(times)] for slug in BOOKS}
    return shop, answers


def run() -> None:
    shop, answers = checks()
    for slug, label in BOOKS.items():
        reads = shop.db.reads[slug]
        print(f"{label + ':':<29} checks: {len(answers[slug])}   database reads: {reads}")
