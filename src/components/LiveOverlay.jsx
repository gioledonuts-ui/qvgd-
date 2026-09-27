import { useEffect, useState } from 'react'
import { BRAND } from '../brand'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { LETTERS } from '../hooks/useStudio'
import { Wordmark, Ticker } from './Brand'

/**
 * Overlay public du live — source navigateur OBS :
 *   https://votre-app.vercel.app/overlay
 *   https://votre-app.vercel.app/overlay?transparent=1&layout=lower
 *
 * - transparent=1 → fond de page transparent (les panneaux restent lisibles)
 * - layout=lower  → bandeau bas compact (lower third) au lieu du plein écran
 * Lecture seule : écoute `game_state` en temps réel.
 */
export default function LiveOverlay() {
  const params = new URLSearchParams(window.location.search)
  const transparent = params.get('transparent') === '1'
  const lowerThird = params.get('layout') === 'lower'

  const [gs, setGs] = useState({ status: 'idle' })
  const [question, setQuestion] = useState(null)

  useEffect(() => {
    if (!transparent) return
    const prev = document.body.style.background
    document.body.style.background = 'transparent'
    return () => {
      document.body.style.background = prev
    }
  }, [transparent])

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let channel
    const fetchQuestion = async (id) => {
      if (!id) {
        setQuestion(null)
        return
      }
      const { data } = await supabase.from('questions').select('*').eq('id', id).single()
      setQuestion(data ?? null)
    }
    ;(async () => {
      const { data } = await supabase.from('game_state').select('*').eq('id', 1).single()
      if (data) {
        setGs(data)
        fetchQuestion(data.current_question_id)
      }
      channel = supabase
        .channel('game_state_overlay')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'game_state', filter: 'id=eq.1' },
          (payload) => {
            const next = payload.new
            setGs((prev) => {
              if (next.current_question_id !== prev.current_question_id) {
                fetchQuestion(next.current_question_id)
              }
              return next
            })
          },
        )
        .subscribe()
    })()
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [])

  const revealed = gs.status === 'answer_revealed'
  const hidden = gs.hidden_choices ?? []
  const showQuestion = (gs.status === 'question_live' || revealed) && question

  if (!isSupabaseConfigured) {
    return (
      <div className={`flex min-h-full items-center justify-center ${transparent ? '' : 'bg-ink-950'}`}>
        <div className="text-center">
          <p className="font-display text-2xl font-medium uppercase text-paper/70">Overlay en attente de configuration</p>
          <p className="mt-2 font-mono text-sm text-paper-dim">
            Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sur Vercel
          </p>
        </div>
      </div>
    )
  }

  // ================= MODE LOWER THIRD =================
  if (lowerThird) {
    return (
      <div className={`flex min-h-full flex-col justify-end p-6 ${transparent ? '' : 'bg-ink-950'}`}>
        {!showQuestion ? (
          <div className="ticker-in mx-auto flex items-center gap-3 bg-ink-950 py-3 pl-4 pr-7">
            <span className="bg-signal-500 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-950">
              Bientôt
            </span>
            <span className="font-display text-base font-semibold uppercase tracking-tight text-paper">
              {BRAND.name} — {BRAND.tagline}
            </span>
          </div>
        ) : (
          <div
            key={question.id + gs.status}
            className="ticker-in mx-auto w-full max-w-5xl border border-paper/15 bg-ink-950/95 backdrop-blur"
          >
            <div className="flex items-center gap-3 border-b border-paper/10 px-5 py-2.5">
              <span className="h-2 w-2 bg-signal-500" />
              <span className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-paper">
                {BRAND.name}
              </span>
              <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.2em] text-paper-dim">
                {question.difficulty_level}
              </span>
            </div>
            <p className="font-display px-5 pt-3 text-xl font-medium leading-snug tracking-tight text-paper">
              {question.question_text}
            </p>
            <div className="grid grid-cols-2 gap-px bg-paper/10 p-px lg:grid-cols-4">
              {LETTERS.map((letter) => {
                const isRevealed = revealed && gs.revealed_choice === letter
                const isHidden = hidden.includes(letter)
                const dim = (revealed && !isRevealed) || isHidden
                return (
                  <div
                    key={letter}
                    className={`flex items-center gap-2.5 px-3 py-3 transition-all duration-300 ${
                      isRevealed ? 'bg-emerald-400' : 'bg-ink-950'
                    } ${dim && !isRevealed ? 'opacity-30' : ''}`}
                  >
                    <span
                      className={`font-display text-lg font-semibold ${
                        isRevealed ? 'text-ink-950' : 'text-paper/40'
                      }`}
                    >
                      {letter}
                    </span>
                    <span
                      className={`truncate text-sm font-medium ${
                        isRevealed ? 'text-ink-950' : 'text-paper/90'
                      } ${isHidden ? 'line-through' : ''}`}
                    >
                      {question[`choice_${letter.toLowerCase()}`]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ================= MODE PLEIN ÉCRAN =================
  return (
    <div className={`grain flex min-h-full flex-col ${transparent ? '' : 'bg-ink-950'}`}>
      <div className="mx-auto flex w-full max-w-6xl items-center gap-4 border-b border-paper/10 px-6 py-4">
        <Wordmark />
        <span className="ml-auto inline-flex items-center gap-2 bg-signal-500 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-ink-950">
          <span className="onair-blink inline-block h-2 w-2 bg-ink-950" />
          En direct
        </span>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-10">
        {!showQuestion ? (
          <div className="ticker-in max-w-4xl text-center">
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-signal-500">
              {BRAND.tagline}
            </p>
            <p className="font-display mt-4 text-6xl font-semibold uppercase leading-[0.95] tracking-tight text-paper sm:text-8xl">
              Bientôt<br />
              <span className="text-outline">à l'antenne</span>
            </p>
          </div>
        ) : (
          <div key={question.id + gs.status} className="ticker-in w-full max-w-5xl">
            <p className="text-center font-mono text-xs uppercase tracking-[0.35em] text-signal-500">
              Question — {question.difficulty_level}
            </p>
            <h1 className="font-display mx-auto mt-5 max-w-4xl text-center text-4xl font-medium leading-[1.05] tracking-tight text-paper sm:text-6xl">
              {question.question_text}
            </h1>
            <div className="mx-auto mt-10 grid max-w-4xl gap-px border border-paper/15 bg-paper/15 sm:grid-cols-2">
              {LETTERS.map((letter) => {
                const isRevealed = revealed && gs.revealed_choice === letter
                const isHidden = hidden.includes(letter)
                const dim = (revealed && !isRevealed) || isHidden
                return (
                  <div
                    key={letter}
                    className={`flex items-center gap-4 px-6 py-5 transition-all duration-300 ${
                      isRevealed ? 'bg-emerald-400' : transparent ? 'bg-ink-950/85' : 'bg-ink-950'
                    } ${dim && !isRevealed ? 'opacity-30' : ''}`}
                  >
                    <span
                      className={`font-display text-4xl font-semibold tracking-tight ${
                        isRevealed ? 'text-ink-950' : 'text-paper/35'
                      }`}
                    >
                      {letter}
                    </span>
                    <span
                      className={`text-xl font-medium ${
                        isRevealed ? 'text-ink-950' : 'text-paper/90'
                      } ${isHidden ? 'line-through' : ''}`}
                    >
                      {question[`choice_${letter.toLowerCase()}`]}
                    </span>
                  </div>
                )
              })}
            </div>
            {revealed && (
              <p className="ticker-in mt-8 text-center font-display text-2xl font-semibold uppercase tracking-tight text-emerald-400">
                ✓ Bonne réponse : {gs.revealed_choice}
              </p>
            )}
          </div>
        )}
      </div>

      <Ticker
        items={[BRAND.name, 'En direct', BRAND.tagline]}
        fast
        className="border-t border-paper/10 py-2.5 text-paper/60"
      />
    </div>
  )
}
