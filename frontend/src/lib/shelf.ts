// The shelf on the home page: a cache with four slots in front of the back room. You ask for
// books, and the shelf hits or misses, and evicts when it is full. Pure functions, so the rules
// are unit tested without a browser.

export const BOOKS = [
  'Dune',
  'Piranesi',
  'Middlemarch',
  'The Overstory',
  'Orbital',
  'Prophet Song',
] as const

export type Book = (typeof BOOKS)[number]

export type Policy = 'lru' | 'fifo'

export const POLICIES: Record<Policy, { name: string; rule: string }> = {
  lru: { name: 'LRU', rule: 'evicts the book used least recently' },
  fifo: { name: 'FIFO', rule: 'evicts the book shelved first' },
}

export const CAPACITY = 4

export type Visit = { book: Book; hit: boolean; evicted: Book | null }

export type Shelf = {
  policy: Policy
  capacity: number
  /** The books on the shelf, next to be evicted first. */
  order: Book[]
  history: Visit[]
}

export function empty(policy: Policy, capacity: number = CAPACITY): Shelf {
  return { policy, capacity, order: [], history: [] }
}

export function request(shelf: Shelf, book: Book): Shelf {
  const hit = shelf.order.includes(book)
  let order = [...shelf.order]
  let evicted: Book | null = null
  if (hit && shelf.policy === 'lru') {
    order = [...order.filter((b) => b !== book), book] // used just now: last to go
  }
  if (!hit) {
    order.push(book)
    if (order.length > shelf.capacity) evicted = order.shift() ?? null
  }
  return { ...shelf, order, history: [...shelf.history, { book, hit, evicted }] }
}

export function play(policy: Policy, books: readonly Book[]): Shelf {
  return books.reduce(request, empty(policy))
}

export function stats(shelf: Shelf): { hits: number; misses: number; rate: number } {
  const hits = shelf.history.filter((visit) => visit.hit).length
  const misses = shelf.history.length - hits
  return { hits, misses, rate: shelf.history.length ? hits / shelf.history.length : 0 }
}

export function fetches(shelf: Shelf, book: Book): number {
  return shelf.history.filter((visit) => visit.book === book && !visit.hit).length
}

/** Every other visit is the bestseller, as in case 06. */
export const BESTSELLER: readonly Book[] = [
  'Dune',
  'Piranesi',
  'Dune',
  'Middlemarch',
  'Dune',
  'The Overstory',
  'Dune',
  'Orbital',
  'Dune',
  'Prophet Song',
  'Dune',
]
