"""How each case is checked. Every check takes the case module, so the tests can check a fixed
copy too. A check says what it expects in plain words.

A cache has two jobs: give the right answer, and save trips. Every check tests both, so turning
the cache off is never a fix."""

import inspect
from collections.abc import Callable
from types import ModuleType

Check = tuple[str, bool]


def attempt(fn: Callable[[], object]) -> object:
    """Run fn and return its result, or the exception it raised."""
    try:
        return fn()
    except Exception as error:  # a crash is an answer too
        return error


def keeps(fn: Callable[..., object], line: str) -> bool:
    """The work that stands in for real life is still there: no deleting the sleep."""
    return line in inspect.getsource(fn)


def check_01(m: ModuleType) -> list[Check]:
    shop = attempt(m.browse)
    if isinstance(shop, Exception):
        return [(f"the shop serves pages (it raised {shop!r})", False)]
    trips = shop.catalogue.trips
    pages = [shop.page(url) for url in m.VISITS]
    expected = [f"<h1>{m.TITLES[n % 4 + 1]}</h1>" for n in range(20)]
    return [
        ("every visitor sees the book they asked for", pages == expected),
        (f"four books, four trips to the catalogue (made {trips})", trips == 4),
        ("the catalogue is still slow (keep the sleep)", keeps(m.Catalogue.title, "time.sleep")),
    ]


def check_02(m: ModuleType) -> list[Check]:
    result = attempt(m.sale)
    if isinstance(result, Exception):
        return [(f"the sale runs (it raised {result!r})", False)]
    shop, before, after = result
    reads = shop.db.reads
    shop.price(2)
    shop.change_price(1, 7.50)
    reads_of_two = shop.db.reads
    shop.price(2)
    return [
        ("before the sale, the shop shows 12.00", before == [12.00] * 5),
        ("after the sale, the shop shows 9.99", after == [9.99] * 5),
        (f"10 views of the page, at most 2 database reads ({reads})", reads <= 2),
        (
            "changing one price leaves the other books in the cache",
            shop.db.reads == reads_of_two and shop.price(1) == 7.50,
        ),
    ]


def check_03(m: ModuleType) -> list[Check]:
    result = attempt(m.morning)
    if isinstance(result, Exception):
        return [(f"the shop opens (it raised {result!r})", False)]
    shop, seen = result
    own = all(header == m.greeting(user, m.BASKETS[user]) for user, header in seen)
    return [
        ("every visitor sees their own basket, every time", own),
        (f"three visitors, three database reads ({shop.db.reads})", shop.db.reads == 3),
    ]


def check_04(m: ModuleType) -> list[Check]:
    result = attempt(m.day)
    if isinstance(result, Exception):
        return [(f"the day runs (it raised {result!r})", False)]
    db, seen = result
    first = next((when for when, banner in seen if banner == m.NEW_OFFER), None)
    shown = m.hhmm(first) if first is not None else "never"
    late = first is not None and first - m.CHANGE_AT <= 300
    still_new = all(banner == m.NEW_OFFER for when, banner in seen if first and when >= first)
    return [
        (f"the new offer is up within 5 minutes of the change (shown at {shown})", late),
        ("once it is up, the old offer never comes back", late and still_new),
        (f"the banner is still cached: at most 100 reads all day ({db.reads})", db.reads <= 100),
    ]


def check_05(m: ModuleType) -> list[Check]:
    one = attempt(m.nine_oclock)
    two = attempt(lambda: m.nine_oclock(shelves=("bestsellers", "new")))
    if isinstance(one, Exception) or isinstance(two, Exception):
        return [("the shop survives nine o'clock without crashing", False)]
    db, results, _ = one
    db_two, results_two, elapsed = two
    right = all(books == m.LISTS[shelf] for shelf, books in results + results_two)
    ran = db.queries.get("bestsellers", 0)
    return [
        ("all 50 visitors get the bestseller list", len(results) == 50 and right),
        (f"the query runs once, not once per visitor (ran {ran})", ran == 1),
        (
            "with two shelves at once, each shelf is queried once",
            db_two.queries == {"bestsellers": 1, "new": 1},
        ),
        (
            f"one shelf does not wait for the other (took {elapsed:.2f} s, under 0.35 s)",
            elapsed < 0.35,
        ),
        ("the query still takes time (keep the sleep)", keeps(m.Database.top, "time.sleep")),
    ]


def check_06(m: ModuleType) -> list[Check]:
    shop = attempt(m.browse)
    if isinstance(shop, Exception):
        return [(f"the shop serves covers (it raised {shop!r})", False)]
    dune = shop.storage.fetches.get("Dune", 0)
    small = m.LRUCache(3)
    for key in ("a", "b", "c"):
        small.put(key, key)
    small.get("a")
    small.put("d", "d")
    return [
        (f"Dune is fetched once and stays (fetches: {dune})", dune == 1),
        (f"the cache never holds more than 5 (largest {shop.largest})", shop.largest <= 5),
        (
            "after a, b, c, a read of a, then d: b is evicted",
            list(small.data) == ["c", "a", "d"],
        ),
    ]


def check_07(m: ModuleType) -> list[Check]:
    result = attempt(m.checks)
    if isinstance(result, Exception):
        return [(f"the stock checks run (they raised {result!r})", False)]
    shop, answers = result
    reads = shop.db.reads
    return [
        (
            "every answer is right: 12, 0 and no such book",
            answers == {"dune": [12] * 20, "piranesi": [0] * 20, "no-such-book": [None] * 20},
        ),
        ("a book on the shelf is read once", reads.get("dune") == 1),
        (f"a sold-out book is read once ({reads.get('piranesi')})", reads.get("piranesi") == 1),
        (
            f"a book that does not exist is read once ({reads.get('no-such-book')})",
            reads.get("no-such-book") == 1,
        ),
    ]


def check_08(m: ModuleType) -> list[Check]:
    result = attempt(m.sale)
    if isinstance(result, Exception):
        return [(f"the browser visits (it raised {result!r})", False)]
    browser, before, after = result
    server = browser.server
    browser.visit("/books/2")
    sent = server.full_pages
    browser.visit("/books/2")
    statuses = browser.statuses
    return [
        ("the first visit shows 12.00", "price 12.00" in before),
        (f"after the drop, the browser shows 9.99 (status {statuses[1]})", "price 9.99" in after),
        (
            f"an unchanged page is not sent again: the server says 304 ({statuses[-1]})",
            statuses[-1] == 304 and server.full_pages == sent,
        ),
    ]


CHECKS: dict[int, Callable[[ModuleType], list[Check]]] = {
    1: check_01,
    2: check_02,
    3: check_03,
    4: check_04,
    5: check_05,
    6: check_06,
    7: check_07,
    8: check_08,
}
