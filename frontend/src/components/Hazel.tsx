// Hazel, the squirrel who keeps the shop's stash: green apron, an acorn held close. Drawn by
// hand in SVG. `face` crops to the head, for the companion button.

export function Hazel({ face = false, className }: { face?: boolean; className?: string }) {
  return (
    <svg
      viewBox={face ? '38 14 64 76' : '18 10 140 146'}
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {face ? null : (
        <g className="hazel-tail">
          <path
            d="M92 140c44 0 58-36 50-64-6-24-30-36-42-22-8 10 4 24 14 16"
            fill="none"
            stroke="#a85d28"
            strokeWidth="25"
            strokeLinecap="round"
          />
          <path
            d="M92 140c44 0 58-36 50-64-6-24-30-36-42-22-8 10 4 24 14 16"
            fill="none"
            stroke="#c98144"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.7"
          />
        </g>
      )}
      {face ? null : (
        <g>
          <ellipse cx="56" cy="146" rx="11" ry="5" fill="#8e4d20" />
          <ellipse cx="84" cy="146" rx="11" ry="5" fill="#8e4d20" />
          <ellipse cx="70" cy="116" rx="30" ry="31" fill="#9c5626" />
          <path d="M47 104h46v18c0 15-10 24-23 24s-23-9-23-24z" fill="#1b3a30" />
          <path d="M51 104l-6-14M89 104l6-14" stroke="#1b3a30" strokeWidth="3.5" />
          <path d="M60 128h20" stroke="#33594b" strokeWidth="1.5" strokeLinecap="round" />
          <ellipse cx="70" cy="103" rx="7.5" ry="9" fill="#d9a441" />
          <path d="M61.5 99c0-5 3.8-8.5 8.5-8.5s8.5 3.5 8.5 8.5z" fill="#8a5a12" />
          <path d="M70 90.5c0-2 .8-3.5 2.4-4.3" stroke="#8a5a12" strokeWidth="1.8" fill="none" />
          <ellipse cx="60" cy="105" rx="5" ry="6.5" fill="#a85d28" />
          <ellipse cx="80" cy="105" rx="5" ry="6.5" fill="#a85d28" />
        </g>
      )}
      <path d="M49 47l-5-25 18 15z" fill="#a85d28" />
      <path d="M91 47l5-25-18 15z" fill="#a85d28" />
      <path d="M50 42l-2.5-13 9.5 8z" fill="#e8b98c" />
      <path d="M90 42l2.5-13-9.5 8z" fill="#e8b98c" />
      <path
        d="M44 22l-3-6M44 22l2-7M96 22l3-6M96 22l-2-7"
        stroke="#7a4019"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="70" cy="64" r="27" fill="#a85d28" />
      <ellipse cx="70" cy="77" rx="15.5" ry="11" fill="#f1dcc0" />
      <g className="hazel-blink">
        <circle cx="58" cy="62" r="4.3" fill="#1d130c" />
        <circle cx="82" cy="62" r="4.3" fill="#1d130c" />
        <circle cx="59.5" cy="60.5" r="1.4" fill="#fffcf5" />
        <circle cx="83.5" cy="60.5" r="1.4" fill="#fffcf5" />
      </g>
      <path d="M66.5 71c3.5-2.6 7-2.6 7 0-1.2 3-2.3 3.2-3.5 3.2s-2.3-.2-3.5-3.2z" fill="#2a1a12" />
      <path
        d="M70 74.2v2.6m0 0c-1.6 2.6-4.2 2.6-5.6.8m5.6-.8c1.6 2.6 4.2 2.6 5.6.8"
        stroke="#2a1a12"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}
