# HTTP caching

> Every response you send can be cached by browsers and proxies you will never see. HTTP headers are how you tell them what they may do.

**Time:** 20 minutes

## Goal

Read and write `Cache-Control`, tell freshness from validation, use ETags and 304 Not Modified correctly, keep private pages out of shared caches, and cache static files forever.

## The case

```bash
uv run python -m shop run 8
```

```text
first visit:   200  <h1>Book 1</h1><p>price 12.00</p>
the price drops to 9.99
second visit:  304  <h1>Book 1</h1><p>price 12.00</p>
```

The browser asked "has this page changed?", the server said no, and the browser showed the old price. Open `lab/cases/case08_http.py`. `Browser` behaves like a real browser. Look at how `Server.etag` builds the tag.

## The caches you do not run

Between your server and the person reading a page there may be several caches: the browser's own, a company proxy, and a CDN in front of your site. You do not run them, but they follow rules, and the response headers you send are the rules for each response. Unless you set them, browsers make their own guesses about how long a response stays fresh.

## Two ways to reuse a response

A cache can reuse a stored response in two ways:

1. **Fresh: reuse it without asking.** For `max-age` seconds after it was received, the response is fresh and served straight from the cache. No request is sent at all, so this is the fastest case. The server also cannot take it back.
2. **Stale: ask first.** After that, or always with `no-cache`, the cache asks the server whether its copy is still good. This is **revalidation**. If it is, the server answers `304 Not Modified` with no body, and the cache reuses its copy.

Revalidation needs a **validator**, a way to name one exact version of the response:

| Validator       | Sent by the server   | Sent back by the cache          |
| --------------- | -------------------- | ------------------------------- |
| entity tag      | `ETag: "f60735be…"`  | `If-None-Match: "f60735be…"`    |
| last change     | `Last-Modified: …`   | `If-Modified-Since: …`          |

Watch a real exchange with a server on your machine:

```bash
uv run python -m shop try http
```

```text
First visit
  request:  GET /books/1  (no validator)
  response: 200 OK, 31 bytes of body
            ETag: "f60735be0d7b8fe1"

Second visit, nothing changed
  request:  GET /books/1  (If-None-Match: "f60735be0d7b8fe1")
  response: 304 Not Modified, 0 bytes of body
            ETag: "f60735be0d7b8fe1"

Third visit, after the price drops
  request:  GET /books/1  (If-None-Match: "f60735be0d7b8fe1")
  response: 200 OK, 30 bytes of body
            ETag: "f4ea6e03214d27c0"
```

The third visit is the important one. The content changed, so the ETag changed, so the old tag no longer matches, and the server sends the new page. The whole system rests on one rule: **an ETag must change whenever the content changes.**

The case's server builds its ETag from the path. The path never changes, so the tag never changes, and the server tells every browser its copy is still good. The usual safe way to make an ETag is a hash of the body, as the experiment does. A version number or an updated-at time from the database also works, as long as every change moves it. A tag in the form `W/"…"` is a weak ETag: it promises the same meaning, not the same bytes.

## Cache-Control

The `Cache-Control` header carries the rules. The ones you will use:

| Directive                    | Meaning                                                              |
| ---------------------------- | -------------------------------------------------------------------- |
| `max-age=600`                | fresh for 600 seconds: reuse without asking                          |
| `s-maxage=600`               | the same, for shared caches (CDNs and proxies) only                  |
| `no-cache`                   | may be stored, but must be revalidated before every reuse            |
| `no-store`                   | must not be stored anywhere                                          |
| `private`                    | only the browser may store it, never a shared cache                  |
| `public`                     | shared caches may store it, even for requests that carried auth      |
| `must-revalidate`            | once stale, never reuse without asking, even if the server is down   |
| `stale-while-revalidate=60`  | after going stale, may be served for 60 more seconds while refreshing |
| `immutable`                  | will never change: do not revalidate even on reload                  |

`no-cache` is the most misread header in HTTP. It does not mean "do not cache". It means "check with me first". The case uses it correctly. To keep something out of every cache, use `no-store`.

## Private pages and Vary

Chapter 03's leak can happen in a CDN too. A shared cache keys on the URL, so if `/account` is sent with `public, max-age=60`, the CDN may serve one person's account page to the next visitor. Personal pages should be `private`, and sensitive ones `no-store`.

When a response depends on a request header, say so with `Vary`. `Vary: Accept-Encoding` tells caches to store gzip and plain versions separately. `Vary: Cookie` is technically correct for personal pages, but every visitor has different cookies, so a shared cache can never hit. It is usually better to mark those pages `private`.

## Cache static files forever

The best HTTP caching setup for most sites is short and has two rules:

- **HTML:** `Cache-Control: no-cache` with an ETag. Browsers always check, and get a cheap 304 when nothing changed.
- **Fingerprinted assets** like `app.3f9a2c.js`, whose name changes whenever the content does: `Cache-Control: public, max-age=31536000, immutable`. Cached for a year, never revalidated. A new release means a new file name, so nobody can be stuck with old code.

Next.js, Vite and most other build tools fingerprint assets for you, which is why this rule works.

## Fix the case

Make `Server.etag` change whenever the page changes. The body is already passed in.

## Check it works

```bash
uv run python -m shop check 8
```

```text
  PASS  the first visit shows 12.00
  PASS  after the drop, the browser shows 9.99 (status 200)
  PASS  an unchanged page is not sent again: the server says 304 (304)
```

## Exercise

The shop adds an account page at `/account` showing the visitor's name, address and orders. Write its `Cache-Control` header and explain each directive. Then write the header for `/static/cover-dune.4be1c0.jpg`.

### More to try

- Change the experiment's `Shopfront` to send `Cache-Control: max-age=60` instead of `no-cache`. A real browser would not even send the second request. What would the reader see for the next minute after the price drops?
- Open your browser's developer tools on any site you use, reload, and read the `Cache-Control` and `ETag` headers of the HTML page and of a script. Which of the patterns above do they follow?

## The caching checklist

You have now met every way a cache goes wrong in this workshop. Keep this list:

1. List everything a cached answer depends on, and put all of it in the key.
2. Leave out of the key whatever does not change the answer.
3. When the truth changes, write it first, then delete the copy.
4. Give every entry a TTL, even when you invalidate. It is the safety net.
5. Set expiry once, when the value is stored, unless you mean sliding expiry.
6. Let one caller refresh a hot key, and let the rest wait or take the stale copy.
7. Bound the cache's size, and measure the hit rate on your own traffic.
8. Store zero, empty and "not found" on purpose, with a shorter TTL for "not found".
9. Never let a shared cache store a private page: `private` or `no-store`.
10. Make ETags from the content, and fingerprint static files so they can be cached forever.
