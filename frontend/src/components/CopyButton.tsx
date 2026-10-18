'use client'

import { useState } from 'react'

export function CopyButton({ text, tone = 'dark' }: { text: string; tone?: 'dark' | 'light' }) {
  const [state, setState] = useState<'idle' | 'copied' | 'blocked'>('idle')
  const look =
    tone === 'dark'
      ? 'border-[#33453c] text-code-muted hover:border-[#53695e] hover:text-code-ink'
      : 'border-rule-strong bg-surface text-ink-2 hover:border-brass hover:text-ink'
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setState('copied')
        } catch {
          setState('blocked')
        }
        window.setTimeout(() => setState('idle'), 1600)
      }}
      className={`h-6 rounded-full border px-2.5 text-[11px] font-semibold tracking-[0.06em] uppercase ${look}`}
    >
      <span aria-live="polite">
        {state === 'copied' ? 'Copied' : state === 'blocked' ? 'Select to copy' : 'Copy'}
      </span>
    </button>
  )
}
