import type { Metadata, Viewport } from 'next'
import { JetBrains_Mono, Newsreader, Schibsted_Grotesk } from 'next/font/google'

import { Shell } from '@/components/Shell'

import './globals.css'

const serif = Newsreader({
  variable: '--font-newsreader',
  subsets: ['latin'],
  axes: ['opsz'],
  style: ['normal', 'italic'],
})
const sans = Schibsted_Grotesk({ variable: '--font-schibsted', subsets: ['latin'] })
const mono = JetBrains_Mono({ variable: '--font-jetbrains', subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Caching, from first principles',
    template: '%s · Caching, from first principles',
  },
  description:
    'A hands-on caching workshop: eight real bugs in one small bookshop. Cache keys, invalidation, TTLs, stampedes, eviction, negative caching and HTTP caching with ETags.',
}

export const viewport: Viewport = { themeColor: '#1b3a30' }

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      className={`${serif.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#main"
          className="sr-only rounded bg-ink px-4 py-2 text-surface focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          Skip to content
        </a>
        <Shell>{children}</Shell>
      </body>
    </html>
  )
}
