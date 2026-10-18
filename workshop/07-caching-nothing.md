# Caching nothing

> Zero is an answer. "No such book" is an answer. A cache that cannot store them sends those questions to the database every time.

**Time:** 15 minutes

## Goal

Tell "not in the cache" apart from "the answer is empty", cache negative answers on purpose, and know what a negative cache cannot protect you from.

## The case

```bash
uv run python -m shop run 7
```

```text
Dune (12 on the shelf):       checks: 20   database reads: 1
Piranesi (sold out):          checks: 20   database reads: 20
a book that does not exist:   checks: 20   database reads: 20
```

The cache works for Dune and does nothing at all for the other two. Open `lab/cases/case07_nothing.py` and read the first line of `Shop.stock` slowly.

## Falsy is not missing

```python
if cached := self.cache.get(slug):
    return cached
```

This reads well, and it mixes up two different questions. `self.cache.get(slug)` returns `None` when the key is missing. It also returns `None` when the stored answer is `None`, and `0` when the stored answer is 0. The `if` then asks "is this truthy?", and in Python all of these are falsy:

```text
None   False   0   0.0   ""   []   {}   set()
```

A sold-out book is stored as `0`, and an unknown book as `None`. Both are stored correctly, and both are treated as misses, so every check goes to the database. The cache is right and the lookup is wrong.

There are two clean ways to ask "is it there?":

```python
if slug in self.cache:              # ask the dict directly
    return self.cache[slug]

MISSING = object()                  # a sentinel: equal to nothing else
cached = self.cache.get(slug, MISSING)
if cached is not MISSING:
    return cached
```

The second needs only one lookup, and it works for caches that are not dicts. Chapter 04's `TTLCache` uses the same `MISSING` sentinel for this reason.

## Negative caching

Storing "there is no such thing" is called **negative caching**. It matters more than it looks, for two reasons:

- **Empty answers are common.** Sold-out books, users with no orders, searches with no results, feature flags that are off.
- **Missing keys are what bots ask for.** Scrapers and scanners request addresses that do not exist all day. Without negative caching, each request is a database read.

Give negative answers a **shorter TTL** than positive ones. When a book is added, you want it to stop being "missing" soon, even if nobody remembers to invalidate the "not found" entry. DNS works this way: resolvers cache "this name does not exist" answers for a limited time, set out in RFC 2308.

## What it cannot do

A negative cache stores answers to questions already asked. An attacker who asks for a different book that does not exist on every request, `/books/7f3a…`, `/books/91c2…`, never repeats a key, so every request misses. This is sometimes called **cache penetration**. Defences live in front of the cache:

- **Validate the key** before looking anything up. If book ids are numbers below a million, reject the rest at once.
- **Rate limit** clients that produce many misses.
- **A Bloom filter** of the ids that exist. It answers "definitely not here" without touching the database, using a few bits per id. It can give false positives, never false negatives.

## Errors are not answers

The opposite mistake is caching an error as if it were an answer. If the database times out and the code stores `None`, the shop says "no such book" for a book that exists, for the whole TTL. Store only real answers. If you cache failures at all, to stop a struggling database being hammered, keep them for seconds and mark them clearly as failures. `functools.lru_cache` does not cache exceptions, which is the safe default.

## Fix the case

Change the lookup in `Shop.stock` so that a stored 0 or `None` counts as a hit. Either style above will pass.

## Check it works

```bash
uv run python -m shop check 7
```

```text
  PASS  every answer is right: 12, 0 and no such book
  PASS  a book on the shelf is read once
  PASS  a sold-out book is read once (1)
  PASS  a book that does not exist is read once (1)
```

## Exercise

A bot asks for 1,000 different books that do not exist, once each. With your fix, how many database reads happen? Which defence from "What it cannot do" would bring that number down, and to what?

### More to try

- Search your own code for `if cache.get(` and `if (x := ` near a cache. How many could treat 0, an empty list or `None` as a miss?
- Give `Shop` a second dict for negative answers with its own, shorter TTL. Use the `Clock` from case 04.
