# Expiry

> A TTL is a promise about age: nothing in this cache is older than this. Break the promise and the cache can keep a value forever.

**Time:** 20 minutes

## Goal

Use a time to live (TTL) as a bound on staleness, tell absolute expiry from sliding expiry, pick a TTL on purpose, and avoid the clock mistakes that break expiry.

## The case

```bash
uv run python -m shop run 4
```

```text
10:00  banner shows:        20% off poetry
10:01  the offer changes to: 3 for 2 on crime
18:00  banner shows:        20% off poetry

cache TTL: 5 minutes. Database reads all day: 1
```

The banner is cached for five minutes, and a visitor arrives every minute. Eight hours after the change, the old offer is still up, and the database was read once all day. Open `lab/cases/case04_expiry.py` and follow `expires_at` for the banner through `get` and `set`.

## What a TTL promises

Invalidation (chapter 02) keeps a cache right when you know about every change. You often do not: the data is changed by another service, a script, or someone in the database console. A **TTL** handles all of those the same way. Each entry carries an expiry time, and after it the entry is treated as a miss. Whatever happens, no answer is served that is older than the TTL.

That makes the TTL a **bound on staleness**: the longest you are willing to show an old answer. A TTL of five minutes says "being up to five minutes out of date is acceptable here". It is a product decision as much as a technical one.

Use a TTL even when you also invalidate. Chapter 02 showed a race that can leave a stale value with nothing left to remove it. The TTL is what removes it.

## Absolute and sliding expiry

There are two ways to set the expiry time:

- **Absolute:** expire at `stored at + TTL`. The clock starts when the value is stored and never resets.
- **Sliding:** expire at `last read + TTL`. Each read pushes expiry further away.

Sliding expiry is right for things that should live while they are in use and vanish when they are not: a login session that times out after twenty idle minutes, for example. For a copy of data that can change, sliding is a bug. A popular entry is read before it can expire, so it never does. The more popular the value, the longer it stays stale. That is exactly this case: one visitor a minute is enough to keep a five-minute entry alive all day.

## Choosing a TTL

Ask two questions:

1. **How stale can this be before someone is harmed or confused?** A price in a checkout: seconds, or not cached at all. A bestseller list: minutes. A book's description: hours.
2. **How often is it read, compared with how often it changes?** A value read a thousand times a minute is worth caching even for ten seconds. A value read once an hour gains nothing from a ten-second TTL.

Then check the cost. With the fix, the banner is read from the database once every five minutes: 97 reads in a day of 481 visits. A one-minute TTL would mean a read on every visit, and the cache would do nothing.

## How entries actually expire

The case's cache checks expiry when an entry is read, and deletes it then. That is **lazy expiry**. It is cheap, but an entry that is never read again stays in memory forever. Real caches combine it with a sweep. Redis, for example, expires keys lazily on access and also samples keys with a TTL in the background and removes the expired ones.

## Clocks

Expiry is only as good as the clock it uses:

- **Measure durations with a monotonic clock.** `time.time()` is the wall clock, and it can jump backwards or forwards when the system clock is corrected. `time.monotonic()` only moves forward. Use it for "has five minutes passed?".
- **Do not compare times across machines** for expiry decisions. Clocks on different servers drift apart. Let the cache server decide, which is what Redis's `EXPIRE` does.
- **Inject the clock** so you can test it, as the case does with `Clock`. A test that waits five real minutes will not get run.

## Fix the case

Make the banner's expiry absolute. The fix is small. When you have found it, ask yourself why the comment beside the buggy line sounds so reasonable.

## Check it works

```bash
uv run python -m shop check 4
```

```text
  PASS  the new offer is up within 5 minutes of the change (shown at 10:05)
  PASS  once it is up, the old offer never comes back
  PASS  the banner is still cached: at most 100 reads all day (97)
```

The change happened at 10:01 and appeared at 10:05, when the entry stored at 10:00 expired. Four minutes stale, inside the five-minute promise.

## Exercise

What is the longest possible delay between a change and the banner showing it, with a five-minute TTL and a visitor every minute? Work it out, then move `CHANGE_AT` in the case to prove it.

### More to try

- Every banner, price and list in a busy shop is set during the same busy minute after a deploy, all with a TTL of 300 seconds. What happens five minutes later? Add **jitter**: a TTL of `300 + random.uniform(-30, 30)`. Chapter 05 is about why this matters.
- Write a session cache for logged-in users with a 20-minute sliding expiry. Here sliding is the right choice. What makes the two situations different?
