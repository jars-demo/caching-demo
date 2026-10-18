# Whose answer is it?

> In chapter 01 the key held too much, so the cache never hit. This chapter is the other side: a key that holds too little, so the cache hits when it should not.

**Time:** 15 minutes

## Goal

Find everything a cached answer depends on, keep private answers private, and split a page into the part everyone shares and the part that belongs to one person.

## The case

```bash
uv run python -m shop run 3
```

```text
asha sees:  Hello Asha, 2 books in your basket
ben sees:   Hello Asha, 2 books in your basket
chen sees:  Hello Asha, 2 books in your basket
```

Asha came first, so her header went into the cache, and everyone after her gets it. Open `lab/cases/case03_whose_answer.py` and look at the key in `Shop.header`.

## Too little in the key

The header looked the same on every page, so someone cached it under one name, `"header"`. It is the same on every page **for one user**. The answer depends on who is asking, and the key does not say.

When the key leaves out something the answer depends on, the cache answers a different question from the one asked. Most of the time that is a wrong number or the wrong language. When the missing part is the user, it is a data leak: one person's name, basket, address or order history shown to someone else.

This is not a made-up danger. On Christmas Day 2015, a caching configuration change at Steam served some users pages belonging to other people's accounts. Valve said about 34,000 users were affected.

## What does the answer depend on?

Before you cache anything, list every input that can change it. Typical ones:

| Input          | Example                                         |
| -------------- | ----------------------------------------------- |
| who is asking  | user id, account, tenant, role or permissions   |
| what they want | the resource id, filters, page number, sort     |
| how to show it | language, currency, time zone, device, format   |
| which version  | the template or code version, a feature flag    |

Every input on the list goes into the key, or the answer must not depend on it. A good key reads like a sentence: `header:v3:user=asha:lang=en`. The `v3` is a version prefix. Bump it when the shape of the cached value changes, and every old entry is ignored at once, without a flush.

## Shared and private parts

A page usually has a big part that is the same for everyone and a small part that is personal. Cache them separately:

- the book list, shared by every visitor, cached once under `books:page=1`
- the greeting, cached per user under `header:user=asha`, or not cached at all if it is cheap

This is fragment caching. It keeps the expensive shared part hot for everyone, and the personal part can never leak, because it is never stored under a shared key.

The same rule applies to HTTP caches you do not run, like a CDN, which by default keys on the address alone. Chapter 08 shows how to tell them a response is private.

## Fix the case

Put the user in the key in `Shop.header`. Every visitor should see their own basket, and a second visit by the same person should still be a hit.

## Check it works

```bash
uv run python -m shop check 3
```

```text
  PASS  every visitor sees their own basket, every time
  PASS  three visitors, three database reads (3)
```

```text
asha sees:  Hello Asha, 2 books in your basket
ben sees:   Hello Ben, 1 book in your basket
chen sees:  Hello Chen, 0 books in your basket
```

## Exercise

Asha adds a book to her basket. With your fix, what does her header say on the next page? Combine what you learned in chapter 02 and write the line that keeps it right. Where in a real shop would that line go?

### More to try

- Add a `lang` argument to `header` that switches "Hello" to "Hola". Make the key hold everything the answer now depends on.
- Change the key to `f"header:{user.lower()}"`. Is `"Asha"` the same user as `"asha"`? When is normalising a key a fix, and when is it a new leak?
