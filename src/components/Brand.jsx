import { BRAND } from '../brand'

/** Monogramme + nom — le logo de l'émission. */
export function Wordmark({ compact = false }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center bg-signal-500 font-display text-[13px] font-bold tracking-tight text-ink-950">
        {BRAND.monogram}
      </div>
      {!compact && (
        <div className="leading-none">
          <p className="font-display text-[17px] font-semibold uppercase tracking-tight text-paper">
            {BRAND.name}
          </p>
          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.32em] text-paper-dim">
            {BRAND.tagline}
          </p>
        </div>
      )}
    </div>
  )
}

/** Étiquette de section numérotée, style grille suisse. */
export function SectionLabel({ number, children, right }) {
  return (
    <div className="flex items-baseline justify-between border-b border-paper/10 pb-3">
      <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-paper-dim">
        <span className="mr-3 font-bold text-signal-500">{number}</span>
        {children}
      </p>
      {right}
    </div>
  )
}

/** Bandeau défilant — signature animée de l'antenne. */
export function Ticker({ items, fast = false, className = '' }) {
  const seq = Array(6).fill(items).flat()
  const row = (key) => (
    <div key={key} className="flex shrink-0 items-center" aria-hidden={key === 'b'}>
      {seq.map((item, i) => (
        <span key={i} className="flex items-center whitespace-nowrap">
          <span className="px-5 font-display text-[13px] font-semibold uppercase tracking-[0.18em]">
            {item}
          </span>
          <span className="text-[10px]">●</span>
        </span>
      ))}
    </div>
  )
  return (
    <div className={`overflow-hidden ${className}`}>
      <div className={fast ? 'marquee-track-fast' : 'marquee-track'}>
        {row('a')}
        {row('b')}
      </div>
    </div>
  )
}
