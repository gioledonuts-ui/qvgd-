import { useState } from 'react'

const PIN = import.meta.env.VITE_MODERATOR_PIN || '2026'

/**
 * Sas d'accès modérateur : un code PIN simple côté client.
 * ⚠️ Protection d'appoint pour l'UI. La vraie sécurité en production
 * passe par Supabase Auth + politiques RLS `authenticated` (voir schema.sql).
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
    <div className="min-h-full flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <span className="onair-dot inline-block h-3.5 w-3.5 rounded-full bg-live-500" />
          <span className="font-display text-sm font-bold tracking-[0.3em] text-white/90">
            STUDIO&nbsp;QUIZ
          </span>
        </div>

        <div className="panel-texture rounded-2xl border border-white/10 bg-night-900/80 p-8 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.8)]">
          <p className="text-[11px] font-bold tracking-[0.25em] text-white/40">ZONE RÉGIE</p>
          <h1 className="font-display mt-2 text-2xl font-bold text-white">
            Console modérateur
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Saisissez le code d'accès pour piloter le live.
          </p>

          <form onSubmit={submit} className="mt-6">
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="••••"
              className={`w-full rounded-xl border bg-night-950/80 px-4 py-3.5 text-center text-2xl font-bold tracking-[0.5em] text-white placeholder:text-white/20 outline-none transition ${
                error
                  ? 'border-live-500'
                  : 'border-white/10 focus:border-signal-400/70'
              }`}
            />
            {error && (
              <p className="slide-up mt-3 text-center text-sm font-medium text-live-500">
                Code incorrect — réessayez.
              </p>
            )}
            <button
              type="submit"
              className="mt-5 w-full rounded-xl bg-white px-4 py-3 font-display text-sm font-bold tracking-wide text-night-950 transition hover:bg-white/90 active:scale-[0.99]"
            >
              DÉVERROUILLER LA RÉGIE
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-white/30">
          L'overlay public du live est accessible sans code via{' '}
          <span className="font-mono text-white/50">?view=overlay</span>
        </p>
      </div>
    </div>
  )
}
