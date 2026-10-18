import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { CopyButton } from '@/components/CopyButton'
import { headingsOf, Markdown } from '@/components/Markdown'
import { CASES } from '@/lib/site'
import { type Chapter, CHAPTERS, findChapter } from '@/lib/workshop'

export function generateStaticParams() {
  return CHAPTERS.map((chapter) => ({ slug: chapter.slug }))
}

export async function generateMetadata(props: PageProps<'/workshop/[slug]'>): Promise<Metadata> {
  const { slug } = await props.params
  const chapter = findChapter(slug)
  return { title: chapter ? `${chapter.number}. ${chapter.title}` : 'Chapter' }
}

function Outline({ chapter }: { chapter: Chapter }) {
  return (
    <ul className="flex flex-col gap-1.5 text-[14px]">
      {headingsOf(chapter.body).map((heading) => (
        <li key={heading.id}>
          <a href={`#${heading.id}`} className="text-ink-2 hover:text-ink hover:underline">
            {heading.text}
          </a>
        </li>
      ))}
    </ul>
  )
}

function Chapters({ current }: { current: Chapter }) {
  return (
    <ol className="flex flex-col gap-1 text-[14px]">
      {CHAPTERS.map((chapter) => {
        const here = chapter.slug === current.slug
        return (
          <li key={chapter.slug}>
            <Link
              href={`/workshop/${chapter.slug}`}
              aria-current={here ? 'page' : undefined}
              className={`flex gap-2.5 rounded-[6px] px-2 py-1 ${
                here ? 'bg-surface-2 font-semibold text-ink' : 'text-ink-2 hover:text-ink'
              }`}
            >
              <span className="w-5 shrink-0 text-brass">{chapter.number}</span>
              {chapter.title}
            </Link>
          </li>
        )
      })}
    </ol>
  )
}

export default async function ChapterPage(props: PageProps<'/workshop/[slug]'>) {
  const { slug } = await props.params
  const chapter = findChapter(slug)
  if (!chapter) notFound()
  const index = CHAPTERS.indexOf(chapter)
  const previous = CHAPTERS[index - 1]
  const next = CHAPTERS[index + 1]
  const item = CASES.find((c) => c.number === chapter.number)
  const n = Number(chapter.number)
  const commands = `uv run python -m shop run ${n}\nuv run python -m shop check ${n}\nuv run python -m shop hint ${n}`

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-24">
      <nav aria-label="Breadcrumb" className="text-[14px] text-muted">
        <Link href="/workshop" className="hover:text-ink hover:underline">
          Chapters
        </Link>
        <span aria-hidden="true"> / </span>
        <span className="text-ink-2">{chapter.number}</span>
      </nav>

      <header className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-14">
        <div className="flex min-w-0 flex-col gap-4">
          <span className="eyebrow">
            Chapter {chapter.number} · {chapter.minutes} minutes
          </span>
          <h1 className="font-serif text-[42px] leading-[1.05] font-semibold tracking-[-0.02em] text-balance sm:text-[58px]">
            {chapter.title}
          </h1>
          <p className="max-w-2xl font-serif text-[21px] leading-relaxed text-ink-2 italic">
            {chapter.summary}
          </p>
        </div>
        {item ? (
          <aside aria-label={`Case ${chapter.number}`} className="index-card min-w-0 self-end p-4">
            <div className="card-head flex items-baseline justify-between gap-3 pb-2">
              <span className="text-[12.5px] font-semibold tracking-[0.06em] text-brass uppercase">
                Case {chapter.number}
              </span>
              <span className="text-[12px] text-muted">what you will see</span>
            </div>
            <p className="mt-3 font-serif text-[18px] leading-snug font-semibold text-ink">
              {item.title}
            </p>
            <pre className="mt-3 rounded-[6px] bg-miss-wash px-3 py-2 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-miss [overflow-wrap:anywhere]">
              {item.symptom}
            </pre>
          </aside>
        ) : null}
      </header>

      <div className="mt-12 grid gap-10 border-t border-rule pt-4 lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-14">
        <article className="min-w-0">
          <details className="card mt-4 lg:hidden">
            <summary className="cursor-pointer px-4 py-3 text-[14.5px] font-semibold">
              On this page
            </summary>
            <div className="border-t border-rule px-4 py-3">
              <Outline chapter={chapter} />
            </div>
          </details>

          <div className="prose-shop max-w-[42rem]">
            <Markdown>{chapter.body}</Markdown>
          </div>

          <section
            aria-labelledby="commands"
            className="code mt-14 max-w-[42rem] overflow-hidden rounded-[8px]"
          >
            <div className="flex items-center justify-between border-b border-[#26342d] px-4 py-2.5">
              <h2
                id="commands"
                className="text-[11.5px] font-semibold tracking-[0.08em] text-code-muted uppercase"
              >
                Chapter {chapter.number} · commands, from lab/
              </h2>
              <CopyButton text={commands} />
            </div>
            <pre className="overflow-x-auto px-4 py-4 text-[13px] leading-relaxed">{commands}</pre>
          </section>

          <nav
            aria-label="Previous and next"
            className="mt-8 grid max-w-[42rem] gap-3 sm:grid-cols-2"
          >
            {previous ? (
              <Link
                href={`/workshop/${previous.slug}`}
                className="index-card flex flex-col gap-1 p-4 hover:border-brass"
              >
                <span className="eyebrow">Previous</span>
                <span className="font-serif text-[18px] font-semibold">
                  {previous.number}. {previous.title}
                </span>
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/workshop/${next.slug}`}
                className="index-card flex flex-col gap-1 p-4 text-right hover:border-brass"
              >
                <span className="eyebrow">Next</span>
                <span className="font-serif text-[18px] font-semibold">
                  {next.number}. {next.title}
                </span>
              </Link>
            ) : (
              <Link
                href="/#checklist"
                className="index-card flex flex-col gap-1 p-4 text-right hover:border-brass"
              >
                <span className="eyebrow">All eight fixed</span>
                <span className="font-serif text-[18px] font-semibold">The caching checklist</span>
              </Link>
            )}
          </nav>
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-6 flex flex-col gap-8 pt-6">
            <nav aria-label="On this page" className="flex flex-col gap-3">
              <span className="eyebrow">On this page</span>
              <Outline chapter={chapter} />
            </nav>
            <nav aria-label="Chapters" className="flex flex-col gap-3">
              <span className="eyebrow">Chapters</span>
              <Chapters current={chapter} />
            </nav>
          </div>
        </aside>
      </div>
    </div>
  )
}
