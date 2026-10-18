# Stampedes

> A cache protects the database right up to the moment a hot key goes missing. Then everyone misses at once.

**Time:** 20 minutes

## Goal

See why a cache can multiply the load on the database at the worst possible moment, and stop it with single-flight: one caller fetches, everyone else waits for that answer. Know the other tools too: serving stale data, refreshing early and jitter.

## The case

```bash
uv run python -m shop run 5
```

```text
visitors at 09:00:   50
bestseller queries:  50 (one would have done)
database time spent: 10.0 s
```

The bestseller list takes 0.2 s to compute. At nine o'clock the entry is gone and fifty visitors arrive at the same moment, so the database does ten seconds of work to produce one list fifty times. Open `lab/cases/case05_stampede.py` and read `Shop.top` as fifty threads would.

## The stampede

This failure has several names: **cache stampede**, **thundering herd**, **dog-piling**. The shape is always the same:

1. A hot key is missing: it expired, was invalidated, was evicted, or the cache was just restarted.
2. Many requests look for it in the same moment. Each one sees a miss.
3. Each one goes to the database for the same answer.

It strikes the hottest keys, the ones with the most callers, and so it strikes at peak traffic. A database sized for the 1% of requests that miss suddenly gets the whole crowd at once. It slows down, so the misses take longer, so more requests pile up behind them. Stampedes are a common way for a cache to turn a small blip into an outage.

Look at the check in `top`: "is it in the cache?". It is the check-then-act pattern from concurrency: fifty threads all check before any of them acts.

## Single-flight

The fix is to let **one** caller go to the database for a key, and make everyone else who wants the same key wait for that one answer. This is called single-flight or request coalescing. Go has it as a library (`golang.org/x/sync/singleflight`), and many CDNs do it for you at the edge.

With threads, it is a lock and a second look:

```python
def get(key):
    if key in cache:                 # fast path: no lock when it is a hit
        return cache[key]
    with lock_for(key):              # one fetcher per key at a time
        if key in cache:             # someone filled it while we waited
            return cache[key]
        value = fetch(key)
        cache[key] = value
        return value
```

Both looks are needed. Without the first, every hit pays for a lock. Without the second, the waiting threads go to the database one after another as soon as each gets the lock: fifty queries in a row, slower than before.

**One lock per key, not one lock for everything.** A single global lock stops the stampede and also makes a visitor who wants the new releases wait for the bestsellers query to finish. The checker tests exactly that.

The locks themselves are shared state. Creating "the lock for this key" must be safe when two threads do it at once, so guard the dictionary of locks with its own small lock, and use `setdefault` inside it.

With asyncio, the idea is the same: keep the running fetch in a dict as a task, and have later callers `await` that same task instead of starting their own.

## Other defences

Single-flight in one process does not stop fifty servers from each sending one query. Further tools, often combined:

- **Serve stale while refreshing.** Keep the old value past its TTL. One caller refreshes it in the background, and everyone else gets the slightly old value right away. HTTP has a name for this, `stale-while-revalidate` (chapter 08).
- **Refresh early.** Recompute a hot entry a little before it expires, so it never goes missing. The paper "Optimal Probabilistic Cache Stampede Prevention" (Vattani, Chierichetti and Lowenstein, 2015) shows how each caller can decide at random, with rising probability as expiry nears, so that usually exactly one refreshes.
- **Jitter the TTL.** Entries set together expire together. Adding a few random seconds to each TTL spreads the misses out.
- **Warm the cache** after a deploy or restart, before real traffic arrives.
- **A lock across servers**, such as Redis `SET key value NX PX 5000`, so only one server refreshes. It needs a timeout, for when the holder dies.

## Fix the case

Give `Shop.top` single-flight with one lock per shelf, as described above. Keep the `time.sleep` in `Database.top`.

## Check it works

```bash
uv run python -m shop check 5
```

```text
  PASS  all 50 visitors get the bestseller list
  PASS  the query runs once, not once per visitor (ran 1)
  PASS  with two shelves at once, each shelf is queried once
  PASS  one shelf does not wait for the other (took 0.21 s, under 0.35 s)
  PASS  the query still takes time (keep the sleep)
```

## Exercise

Remove the second `if shelf in self.cache` inside the lock and run the check. Predict how many queries run, and roughly how long fifty visitors take, before you look.

### More to try

- Replace your per-shelf locks with one lock for the whole shop. Which check fails, and what would a visitor notice?
- What happens to the forty-nine waiting visitors if the one query raises an exception? Change `Database.top` to fail once and find out. What should they get?
