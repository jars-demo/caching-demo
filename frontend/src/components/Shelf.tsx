'use client'

import { useState } from 'react'

import {
  BESTSELLER,
  type Book,
  BOOKS,
  CAPACITY,
  empty,
  fetches,
  play,
  type Policy,
  POLICIES,
  request,
  stats,
} from '@/lib/shelf'

// The shelf: four slots in front of the back room. Ask for books and see each one hit or miss,
// and which book is evicted when the shelf is full.

const SPINES: Record<Book, string> = {
  Dune: '#c27a2c',
  Piranesi: '#3e6b8a',
  Middlemarch: '#7a4b6b',
  'The Overstory': '#4f7a3a',
  Orbital: '#2e3f63',
  'Prophet Song': '#8f2d2a',
}

function Spine({ book }: { book: Book }) {
  return (
    <span
      aria-hidden="true"
      className="w-1.5 shrink-0 self-stretch rounded-full"
      style={{ background: SPINES[book] }}
    />
  )
}

function Mark({ hit }: { hit: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" className="shrink-0">
      {hit ? (
        <path d="M2.5 7.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" />
      ) : (
        <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  )
}

export function Shelf() {
  const [shelf, setShelf] = useState(() => empty('fifo'))
  const last = shelf.history.at(-1)
  const { hits, misses, rate } = stats(shelf)
  const slots = Array.from({ length: CAPACITY }, (_, i) => shelf.order[i] ?? null)

  const choose = (policy: Policy) => setShelf(empty(policy))

  return (
    <div className="index-card flex flex-col gap-5 p-4 sm:p-6">
      <div className="card-head flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <fieldset className="flex flex-wrap items-center gap-2">
          <legend className="sr-only">Eviction policy</legend>
          <span aria-hidden="true" className="text-[13px] font-semibold text-ink-2">
            Eviction policy
          </span>
          {(Object.keys(POLICIES) as Policy[]).map((policy) => (
            <label
              key={policy}
              className={`inline-flex h-9 cursor-pointer items-center rounded-full border px-4 text-[14px] font-semibold has-focus-visible:outline-2 has-focus-visible:outline-brass ${
                shelf.policy === policy
                  ? 'border-green bg-green text-on-green'
                  : 'border-rule-strong bg-surface text-ink hover:border-brass'
              }`}
            >
              <input
                type="radio"
                name="policy"
                value={policy}
                checked={shelf.policy === policy}
                onChange={() => choose(policy)}
                className="sr-only"
              />
              {POLICIES[policy].name}
            </label>
          ))}
        </fieldset>
        <p className="text-[13.5px] text-muted">
          {POLICIES[shelf.policy].name} {POLICIES[shelf.policy].rule}.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between text-[12.5px] text-muted">
          <span>The shelf: room for {CAPACITY}</span>
          <span aria-hidden="true">next out on the left</span>
        </div>
        <ol
          aria-label="Books on the shelf, next to be evicted first"
          className="grid grid-cols-2 gap-2 border-b-4 border-[#b98a4a] pb-2 sm:grid-cols-4"
        >
          {slots.map((book, index) => (
            <li
              key={book ?? `empty-${index}`}
              className={`flex min-h-16 items-center gap-2.5 rounded-[6px] border px-2.5 py-2 ${
                book
                  ? 'book-in border-rule bg-surface text-ink'
                  : 'border-dashed border-rule-strong text-muted'
              }`}
            >
              {book ? <Spine book={book} /> : null}
              <span className="flex min-w-0 flex-col">
                <span className="font-serif text-[16.5px] leading-tight font-semibold">
                  {book ?? 'Empty'}
                </span>
                {book && index === 0 && shelf.order.length === CAPACITY ? (
                  <span className="text-[11.5px] font-semibold tracking-[0.06em] text-miss uppercase">
                    Next out
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div
        role="status"
        className={`flex min-h-12 items-center gap-2.5 rounded-[8px] px-3.5 py-2.5 text-[14.5px] ${
          !last
            ? 'bg-surface-2 text-ink-2'
            : last.hit
              ? 'bg-hit-wash text-hit'
              : 'bg-miss-wash text-miss'
        }`}
      >
        {last ? <Mark hit={last.hit} /> : null}
        <span>
          {!last ? (
            'The shelf is empty. Ask for a book, or play the bestseller pattern.'
          ) : last.hit ? (
            <>
              <strong>Hit.</strong> {last.book} was on the shelf.
            </>
          ) : (
            <>
              <strong>Miss.</strong> {last.book} fetched from the back room.
              {last.evicted ? ` ${last.evicted} evicted to make room.` : ''}
            </>
          )}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-ink-2">Ask for a book</span>
        <div className="flex flex-wrap gap-2">
          {BOOKS.map((book) => (
            <button
              key={book}
              type="button"
              onClick={() => setShelf(request(shelf, book))}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-rule-strong bg-surface pr-3.5 pl-2.5 text-[14px] font-medium text-ink hover:border-brass"
            >
              <span
                aria-hidden="true"
                className="size-3 rounded-full"
                style={{ background: SPINES[book] }}
              />
              {book}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setShelf(play(shelf.policy, BESTSELLER))}
          className="inline-flex h-10 items-center rounded-full bg-green px-4.5 text-[14px] font-semibold text-on-green hover:bg-green-2"
        >
          Play the bestseller pattern
        </button>
        <button
          type="button"
          onClick={() => setShelf(empty(shelf.policy))}
          className="inline-flex h-10 items-center rounded-full border border-rule-strong bg-surface px-4.5 text-[14px] font-semibold text-ink hover:border-brass"
        >
          Reset
        </button>
      </div>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[8px] border border-rule bg-rule sm:grid-cols-4">
        {[
          ['Visits', String(shelf.history.length)],
          ['Hits', String(hits)],
          ['Hit rate', shelf.history.length ? `${Math.round(rate * 100)}%` : 'none yet'],
          ['Dune fetched', String(fetches(shelf, 'Dune'))],
        ].map(([term, value]) => (
          <div key={term} className="flex flex-col gap-0.5 bg-surface px-3.5 py-2.5">
            <dt className="text-[12px] text-muted">{term}</dt>
            <dd className="font-mono text-[18px] text-ink" data-testid={term}>
              {value}
            </dd>
          </div>
        ))}
      </dl>

      {shelf.history.length ? (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-ink-2">
            Every visit, in order ({misses} {misses === 1 ? 'miss' : 'misses'})
          </span>
          <ol className="flex flex-wrap gap-1.5">
            {shelf.history.map((visit, index) => (
              <li
                key={index}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12.5px] ${
                  visit.hit ? 'bg-hit-wash text-hit' : 'bg-miss-wash text-miss'
                }`}
              >
                <Mark hit={visit.hit} />
                {visit.book}
                <span className="sr-only">{visit.hit ? ', hit' : ', miss'}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </div>
  )
}
