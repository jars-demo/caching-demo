// Hazel, the squirrel who keeps the shop's stash. For each page: a short note and two quiz
// questions, each with one right answer and the reason it is right.

export type Question = {
  q: string
  options: readonly string[]
  answer: number
  why: string
}

export type Notes = { note: string; quiz: readonly Question[] }

const HOME: Notes = {
  note: 'I am Hazel. Squirrels hide food all autumn and find it again from memory, so I take caches seriously. Try the shelf on this page: play the bestseller pattern with FIFO, then with LRU, and watch whether Dune stays.',
  quiz: [
    {
      q: 'A cache hits 99% of the time. Where does most of the time go?',
      options: ['The hits', 'The misses', 'About half and half'],
      answer: 1,
      why: 'A hit costs almost nothing. With a 20 ms miss, the 1% of misses add 0.2 ms to every request on average, which is nearly all of the total.',
    },
    {
      q: 'What belongs in a cache key?',
      options: [
        'The whole request, to be safe',
        'Everything that changes the answer, and nothing else',
        'Only the id of the thing asked for',
      ],
      answer: 1,
      why: 'Too much in the key and the cache never hits. Too little and it hands one person the answer meant for another.',
    },
  ],
}

const WORKSHOP: Notes = {
  note: 'Eight chapters, one bug each. Do them in order: the stampede in chapter 05 makes more sense once you have met expiry in chapter 04.',
  quiz: [
    {
      q: 'Every check tests two things. Which two?',
      options: ['Speed and memory', 'Right answers and fewer trips', 'Hits and evictions'],
      answer: 1,
      why: 'Turning the cache off gives right answers, and a broken key can still save trips. A real fix has to do both.',
    },
    {
      q: 'Where do the fixed versions of the cases live?',
      options: ['lab/tests/solutions/', 'lab/shop/', 'Nowhere, you write them'],
      answer: 0,
      why: 'Peek only when truly stuck. The tests run every check against them, so they are known to pass.',
    },
  ],
}

const CHAPTERS: Record<string, Notes> = {
  '01-hits-and-misses': {
    note: 'Print shop.cache after the case runs. Twenty keys for four books tells you the whole story.',
    quiz: [
      {
        q: 'Twenty visits to four books, with a good key. How many catalogue trips?',
        options: ['4', '16', '20'],
        answer: 0,
        why: 'One miss per book while the cache is cold. After that, every visit is a hit.',
      },
      {
        q: 'Which belongs in the key for a book page?',
        options: ['utm_source', 'The book id', 'The time of the visit'],
        answer: 1,
        why: 'Only the book id changes the page. The others make every key different, so nothing ever hits.',
      },
    ],
  },
  '02-invalidation': {
    note: 'When the truth changes, the copy has to go. Delete is the safer default: two deletes can never disagree.',
    quiz: [
      {
        q: 'Why delete the entry on a write, rather than overwrite it?',
        options: [
          'Deleting is faster',
          'Two racing overwrites can leave the older value in the cache',
          'A dict cannot be overwritten',
        ],
        answer: 1,
        why: 'Writer A can set the cache after writer B, though B wrote the database last. The cache then holds A’s value for good.',
      },
      {
        q: 'What stops the stale-set race from lasting forever?',
        options: [
          'A bigger cache',
          'A TTL on every entry',
          'Reading the cache before the database',
        ],
        answer: 1,
        why: 'The stale value cannot outlive its TTL. Versions and leases close the gap completely.',
      },
    ],
  },
  '03-whose-answer': {
    note: 'Before you cache anything, list every input that can change it. Who is asking is the one people forget.',
    quiz: [
      {
        q: 'Ben sees Asha’s basket. What is missing from the key?',
        options: ['The time', 'The user', 'The number of books'],
        answer: 1,
        why: 'The header depends on who is asking. A key without the user gives everyone the first visitor’s header.',
      },
      {
        q: 'What does a version prefix like v3 in a key do?',
        options: [
          'Makes keys shorter',
          'Lets you ignore every old entry at once when the value changes shape',
          'Encrypts the value',
        ],
        answer: 1,
        why: 'Bump it to v4 and every lookup uses new keys. The old entries are never read again and expire on their own.',
      },
    ],
  },
  '04-expiry': {
    note: 'Follow expires_at. If a read moves it, a popular entry can live forever.',
    quiz: [
      {
        q: 'Sliding expiry is the right choice for…',
        options: [
          'A price',
          'A login session that ends after 20 idle minutes',
          'A bestseller list',
        ],
        answer: 1,
        why: 'A session should live while it is used. A copy of data that can change needs a fixed bound on its age.',
      },
      {
        q: 'Which clock should measure a TTL inside one process?',
        options: ['time.time()', 'time.monotonic()', 'The database server’s clock'],
        answer: 1,
        why: 'The monotonic clock only moves forward. The wall clock can jump when the system corrects it.',
      },
    ],
  },
  '05-stampedes': {
    note: 'Fifty threads all looked before any of them acted. It is check-then-act again, with a database bill attached.',
    quiz: [
      {
        q: 'Why is the second look inside the lock needed?',
        options: [
          'To count hits',
          'Without it, each waiting thread runs the query when its turn comes',
          'Locks always need two reads',
        ],
        answer: 1,
        why: 'The first thread fills the cache. The second look lets everyone queued behind it find the answer instead of querying again.',
      },
      {
        q: 'Why not one lock for the whole shop?',
        options: [
          'It uses more memory',
          'Visitors to one shelf would wait for another shelf’s query',
          'Python forbids it',
        ],
        answer: 1,
        why: 'A global lock stops the stampede and serialises unrelated keys. One lock per key keeps them independent.',
      },
    ],
  },
  '06-eviction': {
    note: 'A read is a use. If get does not move the entry to the back, the cache is FIFO, whatever its name says.',
    quiz: [
      {
        q: 'LFU won on steady traffic. When did it collapse?',
        options: ['With a crawler', 'When tastes changed', 'With a bigger cache'],
        answer: 1,
        why: 'Its counts remembered yesterday’s favourites, so they kept their places while the new favourites were evicted.',
      },
      {
        q: 'What does Ruff’s rule B019 warn about?',
        options: [
          'lru_cache on a method keeps every self alive',
          'Caches without a TTL',
          'Keys that cannot be hashed',
        ],
        answer: 0,
        why: 'The cache holds a reference to every object it has seen in its keys, so none of them can be freed.',
      },
    ],
  },
  '07-caching-nothing': {
    note: 'bool(0) is False, and so is bool(None). A lookup that asks “is it truthy?” treats both as misses.',
    quiz: [
      {
        q: 'Which lookup treats a stored 0 as a hit?',
        options: ['if cache.get(key):', 'if key in cache:', 'if cache[key] is not None:'],
        answer: 1,
        why: 'It asks whether the key is there, not what the value is. The third raises KeyError on a miss.',
      },
      {
        q: 'Why give “not found” a shorter TTL?',
        options: [
          'It saves memory',
          'When the book is added, it soon stops being reported as missing',
          'Negative answers are less accurate',
        ],
        answer: 1,
        why: 'Nobody remembers to invalidate a “not found”. A short TTL corrects it on its own.',
      },
    ],
  },
  '08-http-caching': {
    note: 'no-cache does not mean “do not cache”. It means “ask me first”. To keep something out of every cache, send no-store.',
    quiz: [
      {
        q: 'An ETag must change whenever…',
        options: ['The path changes', 'The content changes', 'A day passes'],
        answer: 1,
        why: 'The browser sends the tag back to ask “is my copy still this version?”. If the tag ignores the content, the answer is always yes.',
      },
      {
        q: 'Which header suits app.3f9a2c.js?',
        options: ['no-cache', 'public, max-age=31536000, immutable', 'private, no-store'],
        answer: 1,
        why: 'Its name changes whenever its content does, so a stored copy can never be wrong. Cache it for a year.',
      },
    ],
  },
}

export const NOTE_SLUGS = Object.keys(CHAPTERS)

export function notesFor(pathname: string): Notes {
  if (pathname === '/workshop') return WORKSHOP
  const slug = pathname.replace(/^\/workshop\//, '')
  return CHAPTERS[slug] ?? HOME
}
