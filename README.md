# Caching, from first principles

A hands-on caching workshop. Eight chapters, each explaining one idea in depth, each with a real bug in a small bookshop for you to fix: cache keys, invalidation, private answers, expiry, stampedes, eviction, negative caching and HTTP caching. **Hazel**, the squirrel who keeps the shop's stash, quizzes you along the way.

**Workshop site:** [caching.jishanahmed.in](https://caching.jishanahmed.in)

## Quick start

You need [uv](https://docs.astral.sh/uv/) and git. uv installs Python for you. The lab uses the Python standard library only.

```bash
git clone https://github.com/jars-demo/caching-demo.git
cd caching-demo/lab
uv sync
uv run python -m shop run 1
```

## How a case works

| Command                               | What it does                                        |
| ------------------------------------- | --------------------------------------------------- |
| `uv run python -m shop list`          | every case, and which ones are fixed                |
| `uv run python -m shop run N`         | run case N and watch the bug happen                 |
| `uv run python -m shop check N`       | check your fix: right answers, and fewer trips      |
| `uv run python -m shop hint N`        | a nudge from Hazel                                  |
| `uv run python -m shop try latency`   | one read from memory, a file, SQLite and local HTTP |
| `uv run python -m shop try eviction`  | FIFO, LRU, LFU and random on the same traffic       |
| `uv run python -m shop try stale-set` | the race that puts an old value back after a delete |
| `uv run python -m shop try http`      | a real local server: 200 with an ETag, then 304     |

Fix the code in `lab/cases/`. Start a case over with `git restore cases/` from `lab/`.

Every check tests both of a cache's jobs, so turning the cache off is never a fix.

## The chapters

| #   | Chapter                                            | The case                         |
| --- | -------------------------------------------------- | -------------------------------- |
| 01  | [Hits and misses](workshop/01-hits-and-misses.md)  | The cache that never hits        |
| 02  | [Invalidation](workshop/02-invalidation.md)        | The price that would not change  |
| 03  | [Whose answer is it?](workshop/03-whose-answer.md) | Someone else's basket            |
| 04  | [Expiry](workshop/04-expiry.md)                    | The offer that never ended       |
| 05  | [Stampedes](workshop/05-stampedes.md)              | The nine o'clock stampede        |
| 06  | [Eviction](workshop/06-eviction.md)                | The bestseller that kept leaving |
| 07  | [Caching nothing](workshop/07-caching-nothing.md)  | The cache that forgot zero       |
| 08  | [HTTP caching](workshop/08-http-caching.md)        | The 304 that lied                |

## Layout

```text
lab/cases/            the eight cases: one real caching bug each
lab/shop/             the CLI, the checks and the four experiments
lab/tests/            every case fails as shipped and passes with the fix in tests/solutions/
workshop/             the chapters, in Markdown
frontend/             the workshop site (Next.js), which renders workshop/
```

Run the lab's tests with `cd lab && uv run pytest`. The solutions are in `lab/tests/solutions/`: peek only when truly stuck.

## Run the site locally

```bash
cd frontend
npm ci
npm run dev
```

## License

[MIT](LICENSE)
