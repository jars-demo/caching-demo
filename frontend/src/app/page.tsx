import Link from 'next/link'

import { ChapterCards } from '@/components/ChapterList'
import { CopyButton } from '@/components/CopyButton'
import { Hazel } from '@/components/Hazel'
import { Ladder } from '@/components/Ladder'
import { Shelf } from '@/components/Shelf'
import { CASE_TWO, CHECKLIST, MEASURED, QUICKSTART, REPO_URL } from '@/lib/site'
import { CHAPTERS } from '@/lib/workshop'

function SectionHead({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex max-w-2xl flex-col gap-3">
      <span className="eyebrow">{eyebrow}</span>
      <h2
        id={id}
        className="font-serif text-[32px] leading-[1.1] font-semibold tracking-[-0.015em] text-ink sm:text-[40px]"
      >
        {title}
      </h2>
      {children ? <p className="text-[17px] leading-relaxed text-ink-2">{children}</p> : null}
    </div>
  )
}

export default function Home() {
  const minutes = CHAPTERS.reduce((sum, chapter) => sum + chapter.minutes, 0)
  return (
    <>
      <section className="on-green bg-green text-on-green">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-14 pb-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center lg:gap-16 lg:pt-20 lg:pb-24">
          <div className="flex min-w-0 flex-col gap-6">
            <span className="eyebrow">
              A hands-on workshop · {CHAPTERS.length} chapters · {minutes / 60} hours
            </span>
            <h1 className="font-serif text-[46px] leading-[1.02] font-semibold tracking-[-0.025em] text-balance sm:text-[64px]">
              Caching, from first principles.
            </h1>
            <p className="max-w-xl font-serif text-[20px] leading-relaxed text-on-green-muted sm:text-[22px]">
              A cache is a copy of an answer, kept closer than the original. Learn everything that
              goes wrong with that copy, one real bug at a time, in one small bookshop.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href={`/workshop/${CHAPTERS[0]?.slug ?? ''}`}
                className="inline-flex h-12 items-center rounded-full bg-brass-fill px-6 text-[15.5px] font-semibold text-green hover:bg-[#e6b456]"
              >
                Start chapter 01
              </Link>
              <a
                href={REPO_URL}
                className="inline-flex h-12 items-center rounded-full border border-on-green-muted px-6 text-[15.5px] font-semibold text-on-green hover:border-on-green"
              >
                Read the source
              </a>
            </div>
            <dl className="mt-4 grid max-w-lg grid-cols-3 gap-6 border-t border-green-line pt-6">
              {[
                ['8', 'real bugs to fix'],
                ['0', 'dependencies in the lab'],
                ['4', 'experiments you can run'],
              ].map(([value, label]) => (
                <div key={label} className="flex flex-col gap-1">
                  <dt className="sr-only">{label}</dt>
                  <dd className="font-serif text-[34px] leading-none font-semibold">{value}</dd>
                  <dd className="text-[13.5px] leading-snug text-on-green-muted">{label}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="min-w-0">
            <Ladder />
          </div>
        </div>
      </section>

      <section
        aria-labelledby="chapters"
        className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pt-20 pb-6"
      >
        <SectionHead id="chapters" eyebrow="The catalogue" title="Eight chapters, eight bugs">
          Each chapter explains one idea in depth, then hands you a cache that is wrong in exactly
          that way. You fix it, and the checker proves the fix: right answers, and fewer trips.
        </SectionHead>
        <ChapterCards />
      </section>

      <section
        id="shelf"
        aria-labelledby="shelf-title"
        className="mx-auto grid max-w-6xl scroll-mt-6 gap-10 px-4 pt-20 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-14 [&>*]:min-w-0"
      >
        <div className="flex flex-col gap-5">
          <SectionHead id="shelf-title" eyebrow="Try it" title="The shelf">
            Four slots in front of a slow back room. Every book you ask for is a hit if it is on the
            shelf, and a miss if it has to be fetched.
          </SectionHead>
          <ol className="flex flex-col gap-3 text-[15.5px] leading-relaxed text-ink-2">
            <li>
              <strong className="text-ink">1.</strong> With FIFO chosen, play the bestseller
              pattern. Dune is asked for every other visit, and is still evicted.
            </li>
            <li>
              <strong className="text-ink">2.</strong> Switch to LRU and play it again. Dune is
              fetched once and stays, because every read counts as a use.
            </li>
            <li>
              <strong className="text-ink">3.</strong> That one difference is case 06. Fix it in
              Python, in{' '}
              <Link
                href="/workshop/06-eviction"
                className="font-medium text-ink underline decoration-brass-fill decoration-2 underline-offset-3"
              >
                chapter 06
              </Link>
              .
            </li>
          </ol>
        </div>
        <Shelf />
      </section>

      <section
        aria-labelledby="method"
        className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pt-24"
      >
        <SectionHead id="method" eyebrow="How a case works" title="Run it, fix it, prove it">
          Every case is a few dozen lines of plain Python with one bug in it, and no dependencies to
          install. Here is case 02 from start to finish.
        </SectionHead>
        <ol className="grid gap-4 lg:grid-cols-3 [&>*]:min-w-0">
          {[
            {
              step: 'Run it',
              command: 'uv run python -m shop run 2',
              lines: CASE_TWO.run,
              tone: 'text-[#f0a99b]',
              note: 'The database has the sale price. The shop does not.',
            },
            {
              step: 'Fix it',
              command: 'lab/cases/case02_invalidation.py',
              lines: CASE_TWO.fix,
              tone: 'text-code-ink',
              note: 'After the write, remove the copy. Only that book.',
            },
            {
              step: 'Prove it',
              command: 'uv run python -m shop check 2',
              lines: CASE_TWO.check,
              tone: 'text-[#a9d39f]',
              note: 'Right prices, and the cache still saves trips.',
            },
          ].map((card, index) => (
            <li key={card.step} className="flex flex-col gap-3">
              <div className="flex items-baseline gap-3">
                <span className="font-serif text-[30px] leading-none font-semibold text-brass">
                  {index + 1}
                </span>
                <span className="text-[17px] font-semibold text-ink">{card.step}</span>
              </div>
              <div className="code flex flex-1 flex-col overflow-hidden rounded-[8px]">
                <div className="truncate border-b border-[#26342d] px-3.5 py-2 text-[12px] text-code-muted">
                  {card.command}
                </div>
                <pre
                  className={`px-3.5 py-3 text-[12.5px] leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere] ${card.tone}`}
                >
                  {card.lines.join('\n')}
                </pre>
              </div>
              <p className="text-[14.5px] text-ink-2">{card.note}</p>
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="measured"
        className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pt-24"
      >
        <SectionHead
          id="measured"
          eyebrow="Measured, not guessed"
          title="No policy wins everywhere"
        >
          Fifty thousand visits that follow a real shop&apos;s popularity curve, replayed through
          four eviction policies. LFU wins while tastes stay the same, and collapses the moment they
          change.
        </SectionHead>
        <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
          {MEASURED.eviction.map((table) => (
            <figure key={table.title} className="card overflow-hidden">
              <figcaption className="flex items-baseline justify-between gap-3 border-b border-rule bg-surface-2 px-4 py-3">
                <span className="font-serif text-[19px] font-semibold text-ink">{table.title}</span>
                <span className="text-[12.5px] text-muted">hit rate for shoppers</span>
              </figcaption>
              <div className="overflow-x-auto">
                <table className="w-full text-[14.5px]">
                  <thead>
                    <tr className="border-b border-rule text-left text-[12px] tracking-[0.06em] text-ink-2 uppercase">
                      <th scope="col" className="px-4 py-2.5 font-semibold">
                        Cache size
                      </th>
                      {MEASURED.policies.map((policy) => (
                        <th
                          key={policy}
                          scope="col"
                          className="px-3 py-2.5 text-right font-semibold"
                        >
                          {policy}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {table.rows.map((row) => (
                      <tr key={row.size} className="border-b border-rule last:border-0">
                        <th scope="row" className="px-4 py-2.5 text-left font-medium text-ink">
                          {row.size}
                        </th>
                        {row.rates.map((rate, index) => (
                          <td
                            key={MEASURED.policies[index]}
                            className={`px-3 py-2.5 text-right font-mono text-[13.5px] ${
                              MEASURED.policies[index] === 'LFU'
                                ? table.title === 'Tastes change'
                                  ? 'font-semibold text-miss'
                                  : 'font-semibold text-hit'
                                : 'text-ink-2'
                            }`}
                          >
                            {rate}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </figure>
          ))}
        </div>
        <p className="max-w-2xl text-[14.5px] leading-relaxed text-muted">
          From{' '}
          <code className="font-mono text-[13px] text-ink">uv run python -m shop try eviction</code>
          , with a fixed random seed, so you will see these exact numbers. Chapter 06 explains each
          one, and the third scenario: a crawler.
        </p>
      </section>

      <section
        aria-labelledby="checklist"
        className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pt-24"
      >
        <SectionHead id="checklist" eyebrow="Keep this" title="The caching checklist">
          Ten rules, one for every way a cache went wrong in the workshop.
        </SectionHead>
        <ol className="grid gap-x-12 gap-y-0 md:grid-cols-2">
          {CHECKLIST.map((item, index) => (
            <li
              key={item}
              className="flex gap-4 border-t border-rule py-4 text-[16px] leading-relaxed text-ink"
            >
              <span className="w-7 shrink-0 font-serif text-[22px] leading-7 font-semibold text-brass">
                {index + 1}
              </span>
              {item}
            </li>
          ))}
        </ol>
      </section>

      <section
        aria-labelledby="start"
        className="mx-auto grid max-w-6xl gap-10 px-4 pt-24 pb-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-center [&>*]:min-w-0"
      >
        <div className="flex flex-col gap-6">
          <SectionHead id="start" eyebrow="Start" title="Ten minutes to your first fix">
            You need uv and git. uv installs Python for you, and the lab uses the standard library
            only.
          </SectionHead>
          <div className="code overflow-hidden rounded-[8px]">
            <div className="flex items-center justify-between border-b border-[#26342d] px-4 py-2">
              <span className="text-[11.5px] font-semibold tracking-[0.08em] text-code-muted uppercase">
                Shell
              </span>
              <CopyButton text={QUICKSTART} />
            </div>
            <pre className="overflow-x-auto px-4 py-3.5 text-[13px] leading-relaxed">
              {QUICKSTART}
            </pre>
          </div>
        </div>
        <figure className="flex flex-col items-center gap-4 sm:flex-row sm:items-end lg:justify-center">
          <Hazel className="w-48 shrink-0 sm:w-56" />
          <figcaption className="index-card relative max-w-xs p-4 font-serif text-[17px] leading-relaxed text-ink">
            <span className="mb-1 block font-sans text-[12.5px] font-semibold tracking-[0.06em] text-brass uppercase">
              Hazel
            </span>
            Stuck on a case? Ask me in the corner of any page, or run{' '}
            <code className="font-mono text-[13px]">shop hint 1</code>. I know where every nut is
            buried. Mostly.
          </figcaption>
        </figure>
      </section>
    </>
  )
}
