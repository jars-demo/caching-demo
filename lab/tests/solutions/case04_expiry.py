"""Case 04: the offer that never ended.

The banner on the home page is cached for five minutes. At 10:01 the offer changes. At 18:00 the
shop still shows the old offer, although nothing is meant to stay in the cache for more than five
minutes.
Run it: uv run python -m shop run 4
"""

MISSING = object()  # "not in the cache", which is different from a cached None


class Clock:
    """A pretend clock, so that a whole day passes in a blink."""

    def __init__(self, now: float = 10 * 3600) -> None:
        self.now = now  # seconds since midnight: 10:00

    def advance(self, seconds: float) -> None:
        self.now += seconds


def hhmm(seconds: float) -> str:
    return f"{int(seconds // 3600):02}:{int(seconds % 3600 // 60):02}"


class TTLCache:
    def __init__(self, clock: Clock, ttl: float) -> None:
        self.clock = clock
        self.ttl = ttl
        self.entries: dict[str, tuple[object, float]] = {}

    def get(self, key: str) -> object:
        entry = self.entries.get(key)
        if entry is None:
            return MISSING
        value, expires_at = entry
        if self.clock.now >= expires_at:
            del self.entries[key]
            return MISSING
        return value

    def set(self, key: str, value: object) -> None:
        self.entries[key] = (value, self.clock.now + self.ttl)


class Database:
    def __init__(self) -> None:
        self.offer = "20% off poetry"
        self.reads = 0

    def read_offer(self) -> str:
        self.reads += 1
        return self.offer


class Shop:
    def __init__(self, db: Database, clock: Clock) -> None:
        self.db = db
        self.cache = TTLCache(clock, ttl=300)  # five minutes

    def banner(self) -> str:
        offer = self.cache.get("banner")
        if offer is MISSING:
            offer = self.db.read_offer()
            self.cache.set("banner", offer)
        return str(offer)


CHANGE_AT = 10 * 3600 + 60  # 10:01
NEW_OFFER = "3 for 2 on crime"


def day(until: float = 18 * 3600, every: float = 60) -> tuple[Database, list[tuple[float, str]]]:
    """A visitor every minute from 10:00 to 18:00. The offer changes at 10:01."""
    clock = Clock()
    db = Database()
    shop = Shop(db, clock)
    seen = []
    while clock.now <= until:
        if clock.now == CHANGE_AT:
            db.offer = NEW_OFFER
        seen.append((clock.now, shop.banner()))
        clock.advance(every)
    return db, seen


def run() -> None:
    db, seen = day()
    print(f"{hhmm(seen[0][0])}  banner shows:        {seen[0][1]}")
    print(f"{hhmm(CHANGE_AT)}  the offer changes to: {NEW_OFFER}")
    print(f"{hhmm(seen[-1][0])}  banner shows:        {seen[-1][1]}")
    print()
    print(f"cache TTL: 5 minutes. Database reads all day: {db.reads}")
