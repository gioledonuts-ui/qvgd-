import { useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { LETTERS } from '../hooks/useStudio'

/**
 * Overlay public du live — à ajouter comme source navigateur dans OBS :
 *   https://votre-app.vercel.app/?view=overlay
 * Écoute `game_state` en temps réel. Aucune action possible ici (lecture seule).
 */
export default function LiveOverlay() {
  const [gs, setGs] = useState({ status: 'idle' })
  const [question, setQuestion] = useState(null)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let channel
    ;(async () => {
      const { data } = await supabase.from('game_state').select('*').eq('id', 1).single()
      if (data) {
        setGs(data)
        if (data.current_question_id) {
          const { data: q } = await supabase
            .from('questions')
            .select('*')
            .eq('id', data.current_question_id)
            .single()
          setQuestion(q ?? null)
        }
      }
      channel = supabase
        .channel('game_state_overlay')
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'game_state', filter: 'id=eq.1' },
          async (payload) => {
            const next = payload.new
            setGs(next)
            if (next.current_question_id && next.current_question_id !== question?.id) {
              const { data: q } = await supabase
                .from('questions')
                .select('*')
                .eq('id', next.current_question_id)
                .single()
              setQuestion(q ?? null)
            }
            if (!next.current_question_id) setQuestion(null)
          },
        )
        .subscribe()
    })()
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const revealed = gs.status === 'answer_revealed'
  const hidden = gs.hidden_choices ?? []
  const showQuestion = (gs.status === 'question_live' || revealed) && question

  return (
    <div className="flex min-h-full flex-col bg-night-950 px-6 py-8">
      {/* Bandeau supérieur */}
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
        {!isSupabaseConfigured ? (
          <div className="text-center">
            <p className="font-display text-2xl font-bold text-white/70">Overlay en attente de configuration</p>
            <p className="mt-2 font-mono text-sm text-white/40">
              Renseignez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY
            </p>
          </div>
        ) : !showQuestion ? (
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
                        : 'border-white/12 bg-white/[0.06]'
                    } ${dim && !isRevealed ? 'opacity-30' : ''}`}
                  >
                    <span
                      className={`font-display flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-bold ${
                        isRevealed ? 'bg-emerald-400 text-night-950' : 'bg-white/12 text-white'
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
