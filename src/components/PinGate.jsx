import { useState } from 'react'
import { BRAND } from '../brand'
import { Wordmark, Ticker } from './Brand'

const PIN = import.meta.env.VITE_MODERATOR_PIN || '2026'

/**
 * Sas d'accès régie : code PIN côté client (appoint).
 * La vraie sécurité en production passe par Supabase Auth
 * + politiques RLS `authenticated` (voir schema.sql).
 */
export default function PinGate({ onUnlock }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (code.trim() === PIN) {
      sessionStorage.setItem('studio-pin-ok', '1')
      onUnlock()
    } else {
      setError(true)
      setCode('')
      window.setTimeout(() => setError(false), 1600)
    }
  }

  return (
    <div className="grain flex min-h-full flex-col">
      <Ticker
        items={[BRAND.name, 'Zone régie', 'Accès modérateur']}
        className="border-b border-paper/10 py-2.5 text-paper/50"
      />
      <div className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="flex justify-center">
            <Wordmark />
          </div>
          <h1 className="font-display mt-8 text-center text-6xl font-semibold uppercase leading-[0.95] tracking-tight text-paper">
            Ré<span className="text-signal-500">g</span>ie
          </h1>
          <p className="mt-4 text-center font-mono text-[11px] uppercase tracking-[0.3em] text-paper-dim">
            Saisissez le code d'accès
          </p>

          <form onSubmit={submit} className="mx-auto mt-8 max-w-xs">
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="••••"
              className={`w-full border bg-ink-900 px-4 py-4 text-center font-mono text-3xl font-bold tracking-[0.6em] text-paper placeholder:text-paper/15 outline-none transition ${
                error ? 'border-signal-500' : 'border-paper/20 focus:border-signal-500'
              }`}
            />
            {error && (
              <p className="rise-in mt-3 text-center font-mono text-xs uppercase tracking-[0.2em] text-signal-500">
                Code incorrect
              </p>
            )}
            <button
              type="submit"
              className="mt-4 w-full bg-paper px-4 py-4 font-display text-sm font-semibold uppercase tracking-[0.14em] text-ink-950 transition hover:bg-white active:scale-[0.99]"
            >
              Déverrouiller
            </button>
          </form>

          <p className="mt-8 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-paper/30">
            Overlay public sans code : /overlay
          </p>
        </div>
      </div>
    </div>
  )
}
