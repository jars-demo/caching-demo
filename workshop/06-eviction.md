# Eviction

> A cache with no limit is a memory leak with good intentions. A cache with a limit has to decide what to forget.

**Time:** 20 minutes

## Goal

Know why caches need a size limit, understand FIFO, LRU, LFU and random eviction, measure them on realistic traffic, and learn why no policy wins everywhere.

## The case

```bash
uv run python -m shop run 6
```

```text
visits:          200, half of them for Dune
Dune fetches:    20
total fetches:   120
hit rate:        40%
```

The cover cache has room for five. Half of all visits are for Dune, so Dune should never leave. It is fetched twenty times. Open `lab/cases/case06_eviction.py`. The class is called `LRUCache`. Read `get` and `put` and decide what it really does.

## Why a limit

Memory is finite. A cache that only ever adds entries grows until the process runs out of memory, usually slowly, and usually on the day traffic peaks. Every cache needs a bound: a number of entries, or a number of bytes. When it is full and a new entry arrives, something must go. Which one is the **eviction policy**.

An ideal policy would evict the entry that will be needed furthest in the future. No real cache knows the future, so each policy guesses from the past.

## Four policies

| Policy | Evicts                                   | Guess it makes                          |
| ------ | ---------------------------------------- | --------------------------------------- |
| FIFO   | the entry stored first                   | old entries are no longer needed        |
| LRU    | the entry used least recently            | what was used lately will be used again |
| LFU    | the entry used least often               | what was popular stays popular          |
| random | any entry                                | none, and that is cheap                 |

The case's cache keeps entries in an `OrderedDict`, oldest first, and evicts from the front. `put` moves an entry to the back. `get` does not. So the order is the order of **storing**, not of **using**, and the "LRU" cache is FIFO. Dune is used every other visit, and still falls off the front every five new books.

Real systems use cleverer versions. Operating systems approximate LRU cheaply for their page caches, with algorithms such as CLOCK. Redis offers approximate LRU and LFU (its `maxmemory-policy` setting), checking a small random sample of keys instead of tracking every one. Java's Caffeine library uses W-TinyLFU, which combines recency and frequency.

## Measure them

```bash
uv run python -m shop try eviction
```

```text
Hit rate for shoppers, by eviction policy and cache size

Steady traffic: 50,000 visits to 1,000 books
  cache size       FIFO      LRU      LFU   random
  10              18.4%    21.2%    35.2%    18.5%
  50              40.7%    46.2%    57.8%    40.6%
  100             52.3%    57.7%    65.3%    52.3%

The same, plus a crawler reading 200 one-off books every 1,000 visits
  cache size       FIFO      LRU      LFU   random
  10              18.3%    21.1%    35.2%    18.4%
  50              40.2%    45.3%    57.8%    39.4%
  100             50.8%    55.5%    65.2%    49.8%

Tastes change: after 25,000 visits, a different set of books is popular
  cache size       FIFO      LRU      LFU   random
  10              18.5%    21.5%     3.7%    18.6%
  50              41.0%    46.5%     5.3%    41.1%
  100             52.5%    58.0%     8.1%    52.1%
```

The traffic follows a Zipf curve, like real shops: the most popular book gets twice the visits of the second and ten times the visits of the tenth. The random seed is fixed, so you will see these exact numbers. Read them in order:

1. **Size matters most.** Going from 10 to 100 entries, 1% to 10% of the books, nearly triples the hit rate for FIFO, LRU and random, and nearly doubles it for LFU.
2. **LRU beats FIFO** by three to six points, because it keeps what is in use.
3. **LFU wins on steady traffic.** When popularity never changes, counting uses is the best guess of all.
4. **A crawler** fills the cache with books nobody will read again. LRU and FIFO lose hits for real shoppers. LFU does not notice, because a book seen once never outranks a bestseller.
5. **When tastes change, LFU collapses** to between 4% and 8%. Its counts remember the old favourites, which now sit in the cache with huge scores while the new favourites are evicted every time. LRU barely notices: its numbers match the steady table.

So there is no best policy, only a best policy for your traffic. Real LFU caches make old counts fade over time for exactly this reason, and Redis's LFU decays its counters. Before choosing, measure your hit rate on your own traffic.

## Python's own cache

`functools.lru_cache(maxsize=128)` is a real LRU cache for function results. `maxsize=None` makes it unbounded, which is fine for small fixed inputs and a leak for anything else. Read its numbers with `fn.cache_info()`.

One trap: decorating a **method** with `lru_cache` puts `self` in every key, and the cache holds a reference to every object it has seen, so none of them can be freed. Ruff and flake8-bugbear warn about it (rule B019).

## Fix the case

Make `LRUCache.get` count a read as a use, so the least recently **used** entry is the one evicted. One line.

## Check it works

```bash
uv run python -m shop check 6
```

```text
  PASS  Dune is fetched once and stays (fetches: 1)
  PASS  the cache never holds more than 5 (largest 5)
  PASS  after a, b, c, a read of a, then d: b is evicted
```

The hit rate rises from 40% to 50%, the most possible here: each of the hundred one-off books has to be fetched once, whatever the policy.

## Exercise

Look at the steady traffic table. At size 50, LFU hits 57.8% and LRU 46.2%. Explain in two sentences what LFU knows that LRU forgets. Then explain, using the third table, what that same knowledge costs.

### More to try

- Make the cover cache hold two entries instead of five. Does Dune still stay? What about one?
- Open `shop/experiments.py` and give `LFU` a memory that fades: every 1,000 requests, halve every count. Run `try eviction` again and compare the third table.
