import Link from 'next/link'

import { REPO_URL } from '@/lib/site'

import { Companion } from './Companion'

// The shopfront header, the footer and Hazel, shared by every page.

export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="7" fill="#24493d" />
      <path d="M8.5 13.4c0-3.3 3.4-5.6 7.5-5.6s7.5 2.3 7.5 5.6z" fill="#8a5a12" />
      <path
        d="M15.4 8c0-1.6.6-2.8 1.9-3.4"
        stroke="#8a5a12"
        strokeWidth="1.7"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M10 13.4h12c0 5.8-2.6 10.2-6 11.4-3.4-1.2-6-5.6-6-11.4z" fill="#d9a441" />
    </svg>
  )
}

const NAV = [
  { href: '/workshop', label: 'Chapters', phone: true },
  { href: '/#shelf', label: 'The shelf', phone: false },
]

export function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="on-green bg-green text-on-green">
        <nav
          aria-label="Main"
          className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4"
        >
          <Link href="/" className="inline-flex items-center gap-2.5 rounded">
            <LogoMark />
            <span className="font-serif text-[22px] leading-none font-semibold tracking-[-0.01em]">
              Caching
            </span>
            <span className="hidden pt-1 text-[13px] text-on-green-muted sm:inline">
              from first principles
            </span>
          </Link>
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.href} className={item.phone ? '' : 'hidden sm:block'}>
                <Link
                  href={item.href}
                  className="inline-flex h-9 items-center rounded-full px-3.5 text-[14.5px] font-medium text-on-green hover:bg-green-2"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={REPO_URL}
                className="ml-1 inline-flex h-9 items-center rounded-full border border-brass-fill px-4 text-[14.5px] font-medium text-brass-fill hover:bg-brass-fill hover:text-green"
              >
                GitHub
              </a>
            </li>
          </ul>
        </nav>
      </header>
      <main id="main" className="flex-1">
        {children}
      </main>
      <footer className="on-green border-t border-green-line bg-green text-on-green-muted">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 pt-7 pb-24 text-[13.5px] sm:flex-row sm:justify-between">
          <span>Caching, from first principles · MIT licensed</span>
          <a href={REPO_URL} className="hover:text-on-green">
            Source on GitHub
          </a>
        </div>
      </footer>
      <Companion />
    </>
  )
}
