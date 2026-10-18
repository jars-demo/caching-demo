import Link from 'next/link'

import { CASES } from '@/lib/site'
import { CHAPTERS } from '@/lib/workshop'

// Two ways to show the chapters: index cards for the home page, and a ledger with one row per
// chapter for the chapters page.

export function ChapterCards() {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CHAPTERS.map((chapter) => {
        const item = CASES.find((c) => c.number === chapter.number)
        return (
          <li key={chapter.slug} className="min-w-0">
            <Link
              href={`/workshop/${chapter.slug}`}
              className="index-card group flex h-full flex-col gap-3 p-4 hover:border-brass"
            >
              <span className="card-head flex items-baseline justify-between pb-2 text-[12.5px] text-muted">
                <span className="font-semibold tracking-[0.06em] text-brass uppercase">
                  No. {chapter.number}
                </span>
                <span>{chapter.minutes} min</span>
              </span>
              <span className="font-serif text-[21px] leading-tight font-semibold text-ink group-hover:underline group-hover:decoration-brass-fill group-hover:decoration-2 group-hover:underline-offset-4">
                {chapter.title}
              </span>
              <span className="text-[14px] leading-snug text-ink-2">{item?.title}</span>
              <span className="mt-auto text-[12.5px] text-muted">{item?.topics}</span>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}

export function ChapterList() {
  return (
    <ol className="card divide-y divide-rule overflow-hidden">
      {CHAPTERS.map((chapter) => {
        const item = CASES.find((c) => c.number === chapter.number)
        return (
          <li key={chapter.slug}>
            <Link
              href={`/workshop/${chapter.slug}`}
              className="group grid grid-cols-[2.75rem_1fr] gap-x-4 gap-y-1 px-4 py-4 hover:bg-surface-2 sm:grid-cols-[3.5rem_1fr_14rem_4rem] sm:items-center sm:px-5"
            >
              <span className="font-serif text-[26px] leading-none font-semibold text-brass">
                {chapter.number}
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="font-serif text-[19px] leading-snug font-semibold text-ink">
                  {chapter.title}
                </span>
                <span className="text-[14px] text-ink-2">Case: {item?.title}</span>
              </span>
              <span className="col-start-2 text-[13px] text-muted sm:col-start-auto">
                {item?.topics}
              </span>
              <span className="col-start-2 text-[13px] text-muted sm:col-start-auto sm:text-right">
                {chapter.minutes} min
              </span>
            </Link>
          </li>
        )
      })}
    </ol>
  )
}
