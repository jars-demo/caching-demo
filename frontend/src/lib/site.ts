// Facts shown on the site. Every symptom and number is real output from the lab:
// `uv run python -m shop run N` and `shop try`.

export const REPO_URL = 'https://github.com/jars-demo/caching-demo'

export type Case = {
  number: string
  title: string
  topics: string
  symptom: string
}

export const CASES: readonly Case[] = [
  {
    number: '01',
    title: 'The cache that never hits',
    topics: 'keys, hit rate, latency',
    symptom: 'catalogue trips: 20\nhit rate:        0%',
  },
  {
    number: '02',
    title: 'The price that would not change',
    topics: 'cache-aside, delete or update',
    symptom: 'the database says: 9.99\nafter the sale:    shop shows 12.00',
  },
  {
    number: '03',
    title: "Someone else's basket",
    topics: 'keys, privacy, fragments',
    symptom: 'ben sees:   Hello Asha, 2 books in your basket',
  },
  {
    number: '04',
    title: 'The offer that never ended',
    topics: 'TTLs, sliding expiry, clocks',
    symptom: '18:00  banner shows:        20% off poetry',
  },
  {
    number: '05',
    title: "The nine o'clock stampede",
    topics: 'stampedes, single-flight',
    symptom: 'bestseller queries:  50 (one would have done)',
  },
  {
    number: '06',
    title: 'The bestseller that kept leaving',
    topics: 'LRU, LFU, FIFO, sizing',
    symptom: 'Dune fetches:    20',
  },
  {
    number: '07',
    title: 'The cache that forgot zero',
    topics: 'negative caching, sentinels',
    symptom: 'Piranesi (sold out):          checks: 20   database reads: 20',
  },
  {
    number: '08',
    title: 'The 304 that lied',
    topics: 'Cache-Control, ETags, 304',
    symptom: 'second visit:  304  <h1>Book 1</h1><p>price 12.00</p>',
  },
]

// Measured with `shop try latency` and computed with `shop try eviction` on one laptop. The
// eviction numbers use a fixed random seed, so anyone who runs it sees the same ones.
export const MEASURED = {
  machine: 'Python 3.13.7, Windows, 16 CPUs',
  latency: [
    { label: 'dict lookup', shown: '34 ns', seconds: 34e-9, inProcess: true },
    { label: 'functools.lru_cache hit', shown: '53 ns', seconds: 53e-9, inProcess: true },
    { label: 'SQLite query by key', shown: '22.9 µs', seconds: 22.9e-6, inProcess: false },
    { label: 'open and read a 4 KB file', shown: '46.3 µs', seconds: 46.3e-6, inProcess: false },
    { label: 'HTTP GET to localhost', shown: '239.9 µs', seconds: 239.9e-6, inProcess: false },
  ],
  policies: ['FIFO', 'LRU', 'LFU', 'random'],
  eviction: [
    {
      title: 'Steady traffic',
      rows: [
        { size: 10, rates: ['18.4%', '21.2%', '35.2%', '18.5%'] },
        { size: 50, rates: ['40.7%', '46.2%', '57.8%', '40.6%'] },
        { size: 100, rates: ['52.3%', '57.7%', '65.3%', '52.3%'] },
      ],
    },
    {
      title: 'Tastes change',
      rows: [
        { size: 10, rates: ['18.5%', '21.5%', '3.7%', '18.6%'] },
        { size: 50, rates: ['41.0%', '46.5%', '5.3%', '41.1%'] },
        { size: 100, rates: ['52.5%', '58.0%', '8.1%', '52.1%'] },
      ],
    },
  ],
} as const

export const CHECKLIST: readonly string[] = [
  'List everything a cached answer depends on, and put all of it in the key.',
  'Leave out of the key whatever does not change the answer.',
  'When the truth changes, write it first, then delete the copy.',
  'Give every entry a TTL, even when you invalidate. It is the safety net.',
  'Set expiry once, when the value is stored, unless you mean sliding expiry.',
  'Let one caller refresh a hot key, and let the rest wait or take the stale copy.',
  "Bound the cache's size, and measure the hit rate on your own traffic.",
  'Store zero, empty and "not found" on purpose, with a shorter TTL for "not found".',
  'Never let a shared cache store a private page: private or no-store.',
  'Make ETags from the content, and fingerprint static files so they can be cached forever.',
]

export const QUICKSTART = `git clone https://github.com/jars-demo/caching-demo.git
cd caching-demo/lab
uv sync
uv run python -m shop run 1`

// Real output of `shop run 2`, then `shop check 2` once the cache entry is deleted on write.
export const CASE_TWO = {
  run: [
    'before the sale:   shop shows 12.00',
    'the database says: 9.99',
    'after the sale:    shop shows 12.00',
  ],
  fix: ['self.db.write_price(book_id, price)', 'self.cache.pop(book_id, None)'],
  check: [
    'PASS  before the sale, the shop shows 12.00',
    'PASS  after the sale, the shop shows 9.99',
    'PASS  10 views of the page, at most 2 database reads (2)',
    'PASS  changing one price leaves the other books in the cache',
  ],
}
