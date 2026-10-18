import { MEASURED } from '@/lib/site'

// Fig. 1: one read from five places, measured with `shop try latency`. The scale is
// logarithmic, from 10 ns to 1 ms, so each gridline is ten times the one before.

const FLOOR = -8 // 10 ns
const DECADES = 5 // up to 1 ms
const TICKS = ['10 ns', '100 ns', '1 µs', '10 µs', '100 µs', '1 ms']

function position(seconds: number): number {
  return ((Math.log10(seconds) - FLOOR) / DECADES) * 100
}

export function Ladder() {
  return (
    <figure className="index-card flex flex-col gap-4 p-4 text-ink sm:p-5">
      <div className="card-head flex items-baseline justify-between gap-3 pb-2.5">
        <span className="text-[13px] font-semibold tracking-[0.06em] text-brass uppercase">
          Fig. 1 · One read, measured
        </span>
        <span className="hidden text-[12px] text-muted sm:inline">log scale</span>
      </div>
      <ol className="flex flex-col gap-3.5">
        {MEASURED.latency.map((row, index) => (
          <li key={row.label} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
              <span className="text-ink">{row.label}</span>
              <span className="font-mono text-[12.5px] text-ink-2">{row.shown}</span>
            </div>
            <div className="relative h-2.5 rounded-full bg-surface-2">
              <div
                className={`bar-grow absolute inset-y-0 left-0 rounded-full ${
                  row.inProcess ? 'bg-green' : 'bg-brass-fill'
                }`}
                style={
                  {
                    width: `${position(row.seconds)}%`,
                    '--at': `${index * 90}ms`,
                  } as React.CSSProperties
                }
              />
            </div>
          </li>
        ))}
      </ol>
      <div aria-hidden="true" className="flex justify-between font-mono text-[10.5px] text-muted">
        {TICKS.map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </div>
      <figcaption className="flex flex-col gap-2 border-t border-rule pt-3 text-[13px] leading-relaxed text-ink-2">
        <span className="flex flex-wrap gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-green" /> inside your process
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-brass-fill" /> outside it
          </span>
        </span>
        <span>
          A hit in memory takes nanoseconds. Leaving the process costs thousands of times more.{' '}
          <span className="text-muted">{MEASURED.machine}.</span>
        </span>
      </figcaption>
    </figure>
  )
}
