# Invalidation

> "There are only two hard things in Computer Science: cache invalidation and naming things." Phil Karlton

**Time:** 20 minutes

## Goal

Understand that a cache creates a second copy of the truth, keep that copy honest when the data changes, choose between deleting and updating, and see the race that can still leave a cache stale.

## The case

```bash
uv run python -m shop run 2
```

```text
before the sale:   shop shows 12.00
the database says: 9.99
after the sale:    shop shows 12.00
```

The sale has started, the database knows it, and the shop does not. Open `lab/cases/case02_invalidation.py`. Reading prices works well. Look at what `change_price` does, and what it does not do.

## Two copies of the truth

The moment you cache a price, it exists in two places: the database, which is the **source of truth**, and the cache, which is a copy. Copies do not update themselves. When the truth changes, every copy is wrong until something removes or replaces it. That something is **invalidation**.

The shop uses the most common pattern, **cache-aside** (also called lazy loading):

```text
read:  look in the cache → on a miss, read the database → store the answer in the cache
write: write the database → ??? 
```

The application owns both paths. The read path is in the case and works. The write path stops at the database, so the old price stays in the cache for as long as the process lives.

## Delete, or update?

There are two honest things the write path can do with the cache:

- **Delete** the entry. The next read misses and fetches the new price. This is **invalidate on write**.
- **Overwrite** the entry with the new value. This is **write-through**: the write goes to both places.

Overwriting looks better, since the next read is a hit. It has a trap when two writers run at once:

| Step | Writer A (price 9.99)  | Writer B (price 8.00)  | Database | Cache |
| ---- | ---------------------- | ---------------------- | -------- | ----- |
| 1    | writes 9.99 to the db  |                        | 9.99     | 12.00 |
| 2    |                        | writes 8.00 to the db  | 8.00     | 12.00 |
| 3    |                        | sets the cache to 8.00 | 8.00     | 8.00  |
| 4    | sets the cache to 9.99 |                        | 8.00     | 9.99  |

The database says 8.00 and the cache says 9.99, and nothing will ever correct it. Deleting cannot go wrong this way. Two deletes in any order leave an empty entry, and the next read fetches whatever the database holds. That is why **delete** is the usual default: it is simpler to get right, and a miss is cheap compared with a wrong price.

Write-through is still useful when a value is written by one place only, or when every write carries a version the cache can compare.

## Order matters: write, then delete

Delete before the write and you leave a gap: a reader misses, reads the old price from the database (the write has not landed yet), and puts it back into the cache. So the order is: **write the database first, then delete the cache entry.**

Even that order has a gap. It is narrow, but it is real. Watch it happen:

```bash
uv run python -m shop try stale-set
```

```text
  reader   cache miss for dune
  reader   reads the database: 12.00
  writer   writes 9.99 to the database
  writer   deletes dune from the cache
  reader   puts 12.00 in the cache

  database: 9.99   cache: 12.00
  The cache now holds the old price, with nothing left to remove it. Only a TTL will.
```

The reader read the old price, then paused (a slow network, a garbage collection pause, a busy CPU), and the write and the delete both happened during that pause. When the reader woke up, it stored the old price after the delete. The experiment uses two `threading.Event`s to force that order every time. In production it happens rarely, on your busiest keys, which are the ones that hurt most.

Defences, from simplest to strongest:

- **A TTL on every entry** (chapter 04). The stale copy cannot outlive it. This is the safety net under every other approach.
- **Versions.** Store a version or an updated-at time with the value, and refuse to store an answer older than what the cache already saw.
- **Leases.** The cache hands a token to the first reader that misses, and a delete cancels the token, so the late `set` is rejected. Facebook described this in its paper "Scaling Memcache at Facebook" (2013).

## More than one cache

The case has one process and one dict. Real services run several copies of the application, each with its own in-memory cache. Deleting the entry on the server that handled the write leaves the other servers holding the old price.

Either keep the cache in one shared place (Redis or Memcached) so a single delete reaches everyone, or broadcast invalidations to every server, or keep in-process caches small and give them short TTLs.

## Fix the case

In `change_price`, after the database write, remove that book's entry from the cache. Remove only that book: the other prices are still right, and the checker makes sure they stay cached.

## Check it works

```bash
uv run python -m shop check 2
```

```text
  PASS  before the sale, the shop shows 12.00
  PASS  after the sale, the shop shows 9.99
  PASS  10 views of the page, at most 2 database reads (2)
  PASS  changing one price leaves the other books in the cache
```

Two reads for ten views: one before the sale, one after it.

## Exercise

Replace your delete with write-through: set `self.cache[book_id] = price` instead. The check still passes. Explain, using the table above, why this is riskier on a real site than deleting, and describe the one situation where it is perfectly safe.

### More to try

- Use `self.cache.clear()` instead of deleting one key. The fourth check fails. Why does throwing the whole cache away hurt a busy shop? (Chapter 05 answers this.)
- In `shop/experiments.py`, change `stale_set` so that the writer deletes the cache entry **before** writing the database. Does the stale value still end up in the cache?
