import fs from 'node:fs'
import path from 'node:path'

import { describe, expect, it } from 'vitest'

import { headingsOf, slugify } from '@/components/Markdown'
import { NOTE_SLUGS, notesFor } from '@/lib/hazel'
import { CASE_TWO, CASES, CHECKLIST, MEASURED } from '@/lib/site'
import { CHAPTERS, findChapter } from '@/lib/workshop'

const ROOT = path.join(process.cwd(), '..')
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), 'utf8')
const body = (slug: string) => findChapter(slug)?.body ?? ''

describe('chapters', () => {
  it('has eight chapters numbered in order', () => {
    expect(CHAPTERS.map((chapter) => Number(chapter.number))).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
  })

  it.each(CHAPTERS.map((chapter) => [chapter.slug, chapter] as const))(
    '%s has a summary, a time, the standard sections and its own case',
    (_slug, chapter) => {
      expect(chapter.summary.length).toBeGreaterThan(10)
      expect(chapter.minutes).toBeGreaterThan(0)
      expect(chapter.body).toMatch(/^## Goal$/m)
      expect(chapter.body).toMatch(/^## The case$/m)
      expect(chapter.body).toMatch(/^## Check it works$/m)
      expect(chapter.body).toMatch(/^## Exercise$/m)
      expect(chapter.body).toContain(`shop run ${Number(chapter.number)}`)
      expect(chapter.body).toContain(`shop check ${Number(chapter.number)}`)
    },
  )

  it('adds up to two and a half hours', () => {
    expect(CHAPTERS.reduce((sum, chapter) => sum + chapter.minutes, 0)).toBe(150)
  })

  it('only mentions lab files that exist', () => {
    const mentioned = new Set(
      CHAPTERS.flatMap((chapter) =>
        [...chapter.body.matchAll(/`(lab\/[\w./-]+\.\w+)`/g)].map((m) => m[1] ?? ''),
      ),
    )
    expect(mentioned.size).toBeGreaterThan(7)
    for (const file of mentioned) {
      expect(fs.existsSync(path.join(ROOT, file)), `${file} is missing`).toBe(true)
    }
  })

  it('shows check output exactly as the checker words it', () => {
    const checks = read('lab/shop/checks.py')
    const labels = CHAPTERS.flatMap((chapter) =>
      [...chapter.body.matchAll(/^ {2}PASS {2}(.+)$/gm)].map((m) => m[1] ?? ''),
    )
    expect(labels.length).toBeGreaterThan(20)
    for (const label of labels) {
      // A measured value at the end is filled in by an f-string; compare the fixed part.
      expect(checks, label).toContain(label.replace(/ \([^()]*\)$/, ''))
    }
  })

  it('names only experiments the lab has', () => {
    const experiments = read('lab/shop/experiments.py')
    const named = CHAPTERS.flatMap((chapter) =>
      [...chapter.body.matchAll(/shop try ([\w-]+)/g)].map((m) => m[1] ?? ''),
    )
    expect(new Set(named)).toEqual(new Set(['latency', 'stale-set', 'eviction', 'http']))
    for (const name of named) expect(experiments).toContain(`"${name}":`)
  })

  it('ends with the same checklist the home page shows', () => {
    const last = body('08-http-caching').replace(/`/g, '')
    for (const item of CHECKLIST) expect(last).toContain(item)
  })
})

describe('cases', () => {
  it('has one case per chapter, titled as the lab titles it', () => {
    const cli = read('lab/shop/__main__.py')
    expect(CASES.map((item) => item.number)).toEqual(CHAPTERS.map((chapter) => chapter.number))
    for (const item of CASES) {
      expect(cli).toContain(`"${item.title}"`)
    }
  })

  it('shows each symptom as it appears in its chapter', () => {
    for (const item of CASES) {
      const chapter = CHAPTERS.find((c) => c.number === item.number)
      expect(chapter?.body, item.number).toContain(item.symptom)
    }
  })

  it('shows the case 02 walkthrough as the lab prints and fixes it', () => {
    for (const line of CASE_TWO.run) expect(body('02-invalidation')).toContain(line)
    for (const line of CASE_TWO.check) expect(body('02-invalidation')).toContain(`  ${line}`)
    for (const line of CASE_TWO.fix) {
      expect(read('lab/tests/solutions/case02_invalidation.py')).toContain(line)
    }
  })

  it('links headings by a stable slug', () => {
    expect(slugify("Whose answer is it? Don't guess")).toBe('whose-answer-is-it-dont-guess')
    expect(
      headingsOf('## Goal\n```\n## not a heading\n```\n## Check it works').map((h) => h.id),
    ).toEqual(['goal', 'check-it-works'])
  })
})

describe('measured numbers', () => {
  it('quotes each latency exactly as chapter 01 prints it', () => {
    for (const row of MEASURED.latency) {
      expect(body('01-hits-and-misses')).toMatch(new RegExp(`${row.label}\\s+${row.shown}`))
    }
    expect(body('01-hits-and-misses')).toContain(MEASURED.machine)
  })

  it('quotes each eviction hit rate exactly as chapter 06 prints it', () => {
    const chapter = body('06-eviction')
    for (const table of MEASURED.eviction) {
      for (const row of table.rows) {
        const line = `  ${String(row.size).padEnd(12)}${row.rates.map((r) => r.padStart(9)).join('')}`
        expect(chapter, `${table.title} ${row.size}`).toContain(line)
      }
    }
  })
})

describe("Hazel's notes", () => {
  it('has notes for every chapter and none for chapters that do not exist', () => {
    expect([...NOTE_SLUGS].sort()).toEqual(CHAPTERS.map((chapter) => chapter.slug))
  })

  it('picks the notes for the page you are on', () => {
    expect(notesFor('/workshop/04-expiry').note).toContain('expires_at')
    expect(notesFor('/workshop').quiz.length).toBe(2)
    expect(notesFor('/')).toBe(notesFor('/no-such-page'))
  })

  it.each([
    ['/', '/'],
    ['/workshop', '/workshop'],
    ...NOTE_SLUGS.map((slug) => [slug, `/workshop/${slug}`]),
  ])('asks %s questions with exactly one right answer each', (_name, pathname) => {
    for (const item of notesFor(pathname).quiz) {
      expect(item.options.length).toBeGreaterThanOrEqual(3)
      expect(new Set(item.options).size).toBe(item.options.length)
      expect(item.options[item.answer], item.q).toBeDefined()
      expect(item.why.length).toBeGreaterThan(20)
    }
  })
})
