# Hits and misses

> A cache is a copy of an answer, kept closer than the original. Everything else in this workshop follows from that one sentence.

**Time:** 20 minutes

## Goal

Know what a cache is and why it works, measure the gap between fast and slow reads on your own machine, work out what a hit rate is worth, and build a cache key that actually hits.

## The case

```bash
uv run python -m shop run 1
```

```text
pages served:    20 (of 4 different books)
catalogue trips: 20
hit rate:        0%
took 0.41 s
```

Twenty visitors, four books, twenty trips to the catalogue. The shop has a cache. It just never hits. Open `lab/cases/case01_keys.py` and look at `Shop.page` before you read on.

## What a cache is

Some answers are expensive to get: a database query, a call to another service, a page that takes work to render. A cache keeps a copy of the answer somewhere cheaper to reach, and hands out the copy the next time anyone asks the same question.

Every cache, from the one inside your CPU to a CDN on another continent, does the same three things:

1. **Look up** the question (the **key**) in the cache.
2. On a **hit**, return the stored answer. On a **miss**, get the answer from the source of truth.
3. **Store** the answer under that key, for next time.

That is the whole idea. The rest of this workshop is about what goes wrong with it: the copy gets old (chapters 02 and 04), the key is wrong (this chapter and 03), many callers miss at once (05), the cache fills up (06), some answers look like misses (07), and caches you do not own make their own decisions (08).

## How big is the gap?

Caching only pays when the copy is much cheaper than the original. Measure it on your machine:

```bash
uv run python -m shop try latency
```

```text
Python 3.13.7, Windows, 16 CPUs

  one read from                     time    vs a dict
  dict lookup                      34 ns           1x
  functools.lru_cache hit          53 ns           2x
  open and read a 4 KB file      46.3 µs       1,374x
  SQLite query by key            22.9 µs         679x
  HTTP GET to localhost         239.9 µs       7,118x

  A call to another machine adds a network round trip on top, which this does not measure.
```

Those are real numbers from one laptop. Yours will differ, but the shape will not: reading memory in your own process takes nanoseconds, and anything that leaves the process takes microseconds to milliseconds. An HTTP call that never even leaves the machine is seven thousand times slower than a dict lookup.

One surprise is worth a look. Opening and reading a small file is slower than an SQLite query. SQLite keeps its file open and its pages in memory, while `read_bytes` asks the operating system to open and close the file on every call. That is itself caching, one layer down. Measure, do not assume.

## What a hit rate is worth

The **hit rate** is the share of lookups that hit. It decides almost everything:

```text
average time = hit rate × hit time + miss rate × miss time
```

With the case's catalogue (20 ms a trip) and a dict as the cache:

| Hit rate | Average time per page |
| -------- | --------------------- |
| 0%       | 20 ms                 |
| 80%      | 4 ms                  |
| 99%      | 0.2 ms                |

Going from 80% to 99% is only 19 points, yet the average falls twenty times. When most lookups hit, the misses are almost all of the cost, so every miss you remove counts. This is also why the database's load is the better number to watch: at 99% hits it sees one request in a hundred.

## Why caches work at all

A cache only helps if the same questions come back. They do, for two reasons:

- **Popularity is skewed.** In a shop, a few books get most of the visits and most books are rarely seen. Chapter 06 measures this.
- **Locality in time.** Something asked for just now is likely to be asked for again soon: the page a visitor is reading, the user who is logged in.

If every request were for something new, no cache could help. A cache with a 0% hit rate, like the one in this case, is pure cost: memory, code and a lookup on every request, for nothing.

## The key

The key is the question the cache is answering. Getting it right is half of caching. The rule:

**The key holds everything that changes the answer, and nothing that does not.**

Break the rule in one direction and the cache never hits. Break it in the other and the cache hands out wrong answers. This case is the first kind. Chapter 03 is the second.

Here the key is the whole address:

```text
/books/1?utm_source=newsletter&click_id=c0000
/books/1?utm_source=search&click_id=c0004
```

The tracking parameters say where a visitor came from. They change nothing about the page, but they make every key different, so every lookup misses. This happens in real systems all the time: tracking parameters, session ids in the URL, a timestamp in the key, a request object whose identity is new on every request, or query parameters that arrive in a different order.

Fixes, from narrowest to widest:

- **Key on what the answer depends on.** Here, the book id in the path.
- **Normalise the key.** Drop known tracking parameters, sort the rest, lowercase what is not case sensitive. CDNs let you configure exactly this, because they hit the same problem.

## Fix the case

Change the key in `Shop.page` so that it holds only what changes the page. `urlsplit` is already imported. Keep the `time.sleep` in `Catalogue.title`: it stands for the slow back room.

## Check it works

```bash
uv run python -m shop check 1
```

```text
  PASS  every visitor sees the book they asked for
  PASS  four books, four trips to the catalogue (made 4)
  PASS  the catalogue is still slow (keep the sleep)
```

Run the case again: the hit rate is now 80% and the twenty pages take 0.08 s instead of 0.41 s. Four misses are the price of a cold cache, one per book.

## Exercise

A hundred visitors arrive, spread evenly over the same four books. Before you run anything, write down the hit rate and the number of catalogue trips you expect. Then change `browse` to send a hundred visits and check your answer.

### More to try

- Print `shop.cache` after the shipped case runs. Twenty keys for four books: the cache is also wasting memory.
- Python has a cache built in. Decorate a slow function with `@functools.lru_cache(maxsize=128)`, call it a few times, and read `fn.cache_info()`. It counts hits and misses for you.
- What if a visitor asks for `/books/01`? Is that the same page as `/books/1`? Should it be the same key?
