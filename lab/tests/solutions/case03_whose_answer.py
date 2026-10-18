"""Case 03: someone else's basket.

Every page starts with the same header: "Hello Asha, 2 books in your basket". It looked the same
on every page, so someone cached it. Now Ben and Chen see Asha's basket.
Run it: uv run python -m shop run 3
"""

BASKETS = {"asha": ["Dune", "Piranesi"], "ben": ["Middlemarch"], "chen": []}


class Database:
    def __init__(self) -> None:
        self.reads = 0

    def basket(self, user: str) -> list[str]:
        self.reads += 1
        return list(BASKETS[user])


def greeting(user: str, items: list[str]) -> str:
    books = "book" if len(items) == 1 else "books"
    return f"Hello {user.title()}, {len(items)} {books} in your basket"


class Shop:
    def __init__(self, db: Database) -> None:
        self.db = db
        self.cache: dict[str, str] = {}

    def header(self, user: str) -> str:
        key = f"header:{user}"
        if key not in self.cache:
            self.cache[key] = greeting(user, self.db.basket(user))
        return self.cache[key]


MORNING = ["asha", "ben", "chen", "asha", "ben", "chen"]


def morning(visits: list[str] = MORNING) -> tuple[Shop, list[tuple[str, str]]]:
    shop = Shop(Database())
    return shop, [(user, shop.header(user)) for user in visits]


def run() -> None:
    _, seen = morning()
    for user, header in seen[:3]:
        print(f"{user + ' sees:':<11} {header}")
