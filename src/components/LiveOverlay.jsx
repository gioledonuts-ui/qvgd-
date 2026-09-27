import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { LETTERS } from '../hooks/useStudio'

/**
 * Overlay public du live — source navigateur OBS :
 *   https://votre-app.vercel.app/overlay
 *   https://votre-app.vercel.app/overlay?transparent=1&layout=lower
 *
 * Paramètres d'URL :
 * - transparent=1 → fond de page transparent (le panneau reste lisible)
 * - layout=lower  → bandeau bas compact (lower third) au lieu du plein écran
 *
 * Lecture seule : écoute `game_state` en temps réel.
 */
export default function LiveOverlay() {
  const params = new URLSearchParams(window.location.search)
  const transparent = params.get('transparent') === '1'
  const lowerThird = params.get('layout') === 'lower'

  const [gs, setGs] = useState({ status: 'idle' })
  const [question, setQuestion] = useState(null)

  // Fond de page transparent pour OBS (le <body> a un fond sombre par défaut)
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
      <div className={`flex min-h-full items-center justify-center ${transparent ? '' : 'bg-night-950'}`}>
        <div className="text-center">
          <p className="font-display text-2xl font-bold text-white/70">Overlay en attente de configuration</p>
          <p className="mt-2 font-mono text-sm text-white/40">
            Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY sur Vercel
          </p>
        </div>
      </div>
    )
  }

  // ================= MODE LOWER THIRD (bandeau bas OBS) =================
  if (lowerThird) {
    return (
      <div className={`flex min-h-full flex-col justify-end p-6 ${transparent ? '' : 'bg-night-950'}`}>
        {!showQuestion ? (
          <div className="ticker-in mx-auto flex items-center gap-3 rounded-full border border-white/15 bg-night-950/90 py-2.5 pl-4 pr-6 shadow-2xl">
            <span className="onair-dot h-2.5 w-2.5 rounded-full bg-live-500" />
            <span className="font-display text-sm font-bold tracking-[0.25em] text-white/85">
              LE QUIZ COMMENCE BIENTÔT
            </span>
          </div>
        ) : (
          <div
            key={question.id + gs.status}
            className="ticker-in mx-auto w-full max-w-5xl overflow-hidden rounded-2xl border border-white/15 bg-night-950/90 shadow-2xl backdrop-blur"
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-5 py-2">
              <span className="onair-dot h-2 w-2 rounded-full bg-live-500" />
              <span className="font-display text-[11px] font-bold tracking-[0.3em] text-white/70">
                STUDIO QUIZ
              </span>
              <span className="ml-auto rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white/60">
                {question.difficulty_level}
              </span>
            </div>
            <p className="font-display px-5 pt-3 text-xl font-bold leading-snug text-white">
              {question.question_text}
            </p>
            <div className="grid grid-cols-2 gap-2 p-4 lg:grid-cols-4">
              {LETTERS.map((letter) => {
                const isRevealed = revealed && gs.revealed_choice === letter
                const isHidden = hidden.includes(letter)
                const dim = (revealed && !isRevealed) || isHidden
                return (
                  <div
                    key={letter}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 transition-all duration-300 ${
                      isRevealed
                        ? 'border-emerald-400 bg-emerald-400/20'
                        : 'border-white/10 bg-white/[0.06]'
                    } ${dim && !isRevealed ? 'opacity-30' : ''}`}
                  >
                    <span
                      className={`font-display flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold ${
                        isRevealed ? 'bg-emerald-400 text-night-950' : 'bg-white/12 text-white'
                      }`}
                    >
                      {letter}
                    </span>
                    <span className={`truncate text-sm font-medium text-white/90 ${isHidden ? 'line-through' : ''}`}>
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
    <div className={`flex min-h-full flex-col px-6 py-8 ${transparent ? '' : 'bg-night-950'}`}>
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3">
        <span className="onair-dot h-3 w-3 rounded-full bg-live-500" />
        <span className="font-display text-sm font-bold tracking-[0.3em] text-white/90">
          STUDIO QUIZ — LIVE
        </span>
        {question && showQuestion && (
          <span className="ml-auto rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/60">
            {question.difficulty_level}
          </span>
        )}
      </div>

      <div className="flex flex-1 items-center justify-center">
        {!showQuestion ? (
          <div className="ticker-in text-center">
            <p className="font-display text-4xl sm:text-5xl font-bold tracking-wide text-white">
              LE QUIZ COMMENCE BIENTÔT
            </p>
            <p className="mt-4 text-sm font-medium tracking-[0.3em] text-white/40">
              RESTEZ CONNECTÉS
            </p>
          </div>
        ) : (
          <div key={question.id + gs.status} className="ticker-in w-full max-w-5xl">
            <h1 className="font-display text-center text-3xl sm:text-5xl font-bold leading-tight text-white">
              {question.question_text}
            </h1>
            <div className="mx-auto mt-8 grid max-w-4xl gap-3 sm:grid-cols-2">
              {LETTERS.map((letter) => {
                const isRevealed = revealed && gs.revealed_choice === letter
                const isHidden = hidden.includes(letter)
                const dim = (revealed && !isRevealed) || isHidden
                return (
                  <div
                    key={letter}
                    className={`flex items-center gap-3 rounded-2xl border px-5 py-4 transition-all duration-300 ${
                      isRevealed
                        ? 'border-emerald-400 bg-emerald-400/15 shadow-[0_0_50px_-10px_rgba(52,211,153,0.6)]'
                        : 'border-white/10 bg-white/[0.06]'
                    } ${dim && !isRevealed ? 'opacity-30' : ''}`}
                  >
                    <span
                      className={`font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                        isRevealed ? 'bg-emerald-400 text-night-950' : 'bg-white/10 text-white'
                      }`}
                    >
                      {letter}
                    </span>
                    <span
                      className={`text-lg font-medium ${isHidden ? 'line-through' : ''} ${
                        isRevealed ? 'text-white' : 'text-white/85'
                      }`}
                    >
                      {question[`choice_${letter.toLowerCase()}`]}
                    </span>
                  </div>
                )
              })}
            </div>
            {revealed && (
              <p className="ticker-in mt-6 text-center font-display text-xl font-bold tracking-[0.2em] text-emerald-300">
                ✓ BONNE RÉPONSE : {gs.revealed_choice}
              </p>
            )}
          </div>
        )}
      </div>

      <p className="text-center text-[11px] tracking-[0.25em] text-white/25">
        STUDIO QUIZ · OVERLAY TEMPS RÉEL
      </p>
    </div>
  )
}
