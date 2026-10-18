// Colour pairs the site puts text on. Each value mirrors a variable in globals.css, and a unit
// test checks both that they match and that every pair meets WCAG AA (4.5:1).

export const TOKENS = {
  canvas: '#f6f1e6',
  surface: '#fffcf5',
  surface2: '#efe8d9',
  ink: '#1c1a16',
  ink2: '#46413a',
  muted: '#6b6457',
  green: '#1b3a30',
  green2: '#24493d',
  onGreen: '#f6f1e6',
  onGreenMuted: '#b8c6bc',
  brass: '#8a5a12',
  brassFill: '#d9a441',
  hit: '#2c6a36',
  hitWash: '#e5efdf',
  miss: '#a1301f',
  missWash: '#f8e6df',
  codeBg: '#16211c',
  codeInk: '#ebe6d8',
  codeMuted: '#a3afa2',
} as const

export type Token = keyof typeof TOKENS

export const TEXT_PAIRS: readonly [Token, Token][] = [
  ['ink', 'canvas'],
  ['ink2', 'canvas'],
  ['muted', 'canvas'],
  ['muted', 'surface'],
  ['ink2', 'surface2'],
  ['muted', 'surface2'],
  ['brass', 'canvas'],
  ['brass', 'surface'],
  ['hit', 'hitWash'],
  ['hit', 'surface'],
  ['miss', 'missWash'],
  ['miss', 'surface'],
  ['onGreen', 'green'],
  ['onGreenMuted', 'green'],
  ['onGreen', 'green2'],
  ['brassFill', 'green'],
  ['green', 'brassFill'],
  ['surface', 'green'],
  ['codeInk', 'codeBg'],
  ['codeMuted', 'codeBg'],
]

function channel(hex: string, offset: number): number {
  const value = parseInt(hex.slice(offset, offset + 2), 16) / 255
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
}

function luminance(hex: string): number {
  return 0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5)
}

export function contrast(a: string, b: string): number {
  const [la, lb] = [luminance(a), luminance(b)]
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}
