import { describe, expect, it } from 'vitest'

import { BESTSELLER, empty, fetches, play, request, stats } from '@/lib/shelf'

describe('the shelf', () => {
  it('misses the first time a book is asked for, then hits', () => {
    const shelf = play('lru', ['Dune', 'Dune'])

    expect(shelf.history.map((visit) => visit.hit)).toEqual([false, true])
  })

  it('never holds more books than it has room for', () => {
    const shelf = play('fifo', ['Dune', 'Piranesi', 'Middlemarch', 'The Overstory', 'Orbital'])

    expect(shelf.order).toEqual(['Piranesi', 'Middlemarch', 'The Overstory', 'Orbital'])
    expect(shelf.history.at(-1)?.evicted).toBe('Dune')
  })

  it('with FIFO, evicts the bestseller although it is read every other visit', () => {
    const shelf = play('fifo', BESTSELLER)

    expect(fetches(shelf, 'Dune')).toBe(2)
    expect(stats(shelf)).toMatchObject({ hits: 4, misses: 7 })
  })

  it('with LRU, keeps the bestseller because every read is a use', () => {
    const shelf = play('lru', BESTSELLER)

    expect(fetches(shelf, 'Dune')).toBe(1)
    expect(stats(shelf)).toMatchObject({ hits: 5, misses: 6 })
    expect(shelf.history.some((visit) => visit.evicted === 'Dune')).toBe(false)
  })

  it('moves a book to the back of the queue on a hit with LRU, and not with FIFO', () => {
    const books = ['Dune', 'Piranesi', 'Dune'] as const

    expect(play('lru', books).order).toEqual(['Piranesi', 'Dune'])
    expect(play('fifo', books).order).toEqual(['Dune', 'Piranesi'])
  })

  it('starts empty, with no hit rate to report', () => {
    expect(stats(empty('lru'))).toEqual({ hits: 0, misses: 0, rate: 0 })
  })

  it('does not change the shelf it was given', () => {
    const before = play('lru', ['Dune'])

    request(before, 'Piranesi')

    expect(before.order).toEqual(['Dune'])
  })
})
