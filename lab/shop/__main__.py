"""shop: eight caching bugs in one small bookshop.

list        every case, and which ones are fixed
run N       run case N and watch the bug happen
check N     check your fix: right answers, and fewer trips
hint N      a nudge from Hazel
try NAME    run an experiment: latency, eviction, stale-set or http
"""

import argparse
import importlib
import sys

from shop.checks import CHECKS
from shop.experiments import EXPERIMENTS

CASES = {
    1: ("case01_keys", "The cache that never hits"),
    2: ("case02_invalidation", "The price that would not change"),
    3: ("case03_whose_answer", "Someone else's basket"),
    4: ("case04_expiry", "The offer that never ended"),
    5: ("case05_stampede", "The nine o'clock stampede"),
    6: ("case06_eviction", "The bestseller that kept leaving"),
    7: ("case07_nothing", "The cache that forgot zero"),
    8: ("case08_http", "The 304 that lied"),
}

HINTS = {
    1: [
        "Print the keys in shop.cache. How many are there, and how many books?",
        "A key should hold everything that changes the answer, and nothing else.",
        "Does utm_source change the page? Key on the path: urlsplit(url).path.",
    ],
    2: [
        "Two copies of the price exist now: one in the database, one in the cache.",
        "When the truth changes, the copy has to go.",
        "In change_price, after the database write: self.cache.pop(book_id, None).",
    ],
    3: [
        "What does the header depend on? Is all of it in the key?",
        "In case 01 the key held too much. Here it holds too little.",
        'Put the user in the key: f"header:{user}".',
    ],
    4: [
        "Watch expires_at for the banner. When does it move?",
        "Every get pushes the expiry five minutes further away.",
        "A TTL limits how old the data can be. Set the expiry once, in set, and never again.",
    ],
    5: [
        "Fifty threads look in the cache at the same moment. All fifty see nothing.",
        "Only one of them should ask the database. The rest should wait for its answer.",
        "One lock per shelf. Inside it, look in the cache again before you query.",
    ],
    6: [
        "Least recently used: which entry was used least recently? How does the cache know?",
        "self.data is ordered oldest first. Does a read change the order?",
        "In get, call self.data.move_to_end(key) on a hit.",
    ],
    7: [
        "What is bool(0)? What is bool(None)?",
        "The walrus line treats every falsy answer as a miss.",
        "Ask the dict whether the key is there: if slug in self.cache.",
    ],
    8: [
        "An ETag says: this exact version. When should it change?",
        "Look at what etag() hashes. The body is passed in, and ignored.",
        "Hash the body, not the path.",
    ],
}


def say(text: str) -> None:
    print("    ,_   _")
    print(f"   (  \\ (o>   {text}")
    print("    \\_\\/ )", flush=True)


def module(number: int):
    name = f"cases.{CASES[number][0]}"
    sys.modules.pop(name, None)  # always the code as it is on disk now
    return importlib.import_module(name)


def fixed(number: int) -> bool:
    return all(ok for _, ok in CHECKS[number](module(number)))


def cmd_list(args: argparse.Namespace) -> None:
    for number, (_, title) in CASES.items():
        print(f"  {number}  {title:<36} {'fixed' if fixed(number) else ''}", flush=True)


def cmd_run(args: argparse.Namespace) -> None:
    say(f"Case {args.n}: {CASES[args.n][1]}.")
    print()
    module(args.n).run()


def cmd_check(args: argparse.Namespace) -> None:
    results = CHECKS[args.n](module(args.n))
    for label, ok in results:
        print(f"  {'PASS' if ok else 'TODO'}  {label}")
    print()
    if all(ok for _, ok in results):
        say(f"Case {args.n} fixed. Into the stash it goes.")
    else:
        say(f"Not yet. Try: uv run python -m shop hint {args.n}")
        sys.exit(1)


def cmd_hint(args: argparse.Namespace) -> None:
    say("Here is what I would look at:")
    for hint in HINTS[args.n]:
        print(f"  - {hint}")


def cmd_try(args: argparse.Namespace) -> None:
    EXPERIMENTS[args.name]()


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")  # the same output on every terminal
    parser = argparse.ArgumentParser(prog="shop", description="Eight caching bugs.")
    sub = parser.add_subparsers(required=True)
    sub.add_parser("list", help="every case and which are fixed").set_defaults(func=cmd_list)
    for name, func, text in [
        ("run", cmd_run, "run case N and watch the bug"),
        ("check", cmd_check, "check your fix"),
        ("hint", cmd_hint, "a nudge from Hazel"),
    ]:
        p = sub.add_parser(name, help=text)
        p.add_argument("n", type=int, choices=CASES, metavar="N")
        p.set_defaults(func=func)
    p = sub.add_parser("try", help="run an experiment: " + ", ".join(EXPERIMENTS))
    p.add_argument("name", choices=EXPERIMENTS)
    p.set_defaults(func=cmd_try)
    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
