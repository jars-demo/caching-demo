# AGENTS.md

Guidance for AI coding agents and developers. Humans: start with [README.md](README.md).

## What this is

"Caching, from first principles": eight chapters, each a caching idea explained in depth and a
real bug in a small bookshop that shows it. `lab/` holds the cases and the checker; `workshop/`
the chapters; `frontend/` the site.

## Map

```text
lab/cases/caseNN_*.py       one deliberate caching bug each; run() shows the symptom
lab/shop/checks.py          check_NN(module) -> [(label, ok)]; tests right answers and trips
lab/shop/experiments.py     `shop try latency | eviction | stale-set | http`
lab/shop/__main__.py        CLI: list, run, check, hint, try; case titles live here
lab/tests/                  each case fails as shipped and passes with tests/solutions/
frontend/src/lib/site.ts    cases and measured numbers: every value is real lab output
frontend/src/lib/shelf.ts   the shelf simulator's rules, unit tested
frontend/src/lib/hazel.ts   Hazel's note and quiz for each page
frontend/src/lib/tokens.ts  colour pairs; a test checks them against globals.css and WCAG AA
```

## Commands

```bash
cd lab && uv sync && uv run pytest && uv run ruff check .
cd frontend && npm ci && npm run verify
```

## Rules

1. **The bugs are the product.** Never fix a bug in `lab/cases/`. Change a case, its check and
   its solution together, and keep `test_case_is_broken_as_shipped` passing.
2. **A cache has two jobs.** Every check tests the right answer and the saved trips, so that
   switching the cache off never passes.
3. **Bugs must be deterministic.** A case shows its symptom on every run, on any OS. Use a pretend
   clock, barriers and events rather than hoping for bad timing.
4. **Standard library only** in `lab/`.
5. **Every number is real.** Output and timings in chapters and on the site come from real runs,
   and unit tests compare the site's numbers with the chapters.
6. **Writing style.** Plain English, short sentences, no em dashes. Conventional Commits, no AI
   attribution trailers.
