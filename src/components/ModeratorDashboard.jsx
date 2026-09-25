import { useEffect, useState } from 'react'
import { useStudio, LETTERS } from '../hooks/useStudio'

const DIFFICULTIES = [
  { id: 'mixte', label: 'Mixte' },
  { id: 'facile', label: 'Facile' },
  { id: 'moyen', label: 'Moyen' },
  { id: 'difficile', label: 'Difficile' },
]

const DIFFICULTY_STYLE = {
  facile: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/25',
  moyen: 'bg-gold-400/10 text-gold-400 border-gold-400/30',
  difficile: 'bg-live-500/10 text-live-500 border-live-500/30',
}

const LOG_COLOR = {
  info: 'bg-white/30',
  live: 'bg-live-500',
  success: 'bg-emerald-400',
  warn: 'bg-gold-400',
  joker: 'bg-signal-400',
}

function Clock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="font-mono text-sm tabular-nums text-white/70">
      {time.toLocaleTimeString('fr-FR')}
    </span>
  )
}

function StatusBadge({ status }) {
  if (status === 'question_live')
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-live-500/40 bg-live-500/10 px-3 py-1 text-xs font-bold tracking-widest text-live-500">
        <span className="onair-dot h-2 w-2 rounded-full bg-live-500" /> ON AIR — QUESTION
      </span>
    )
  if (status === 'answer_revealed')
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-bold tracking-widest text-emerald-300">
        <span className="h-2 w-2 rounded-full bg-emerald-400" /> ON AIR — RÉPONSE RÉVÉLÉE
      </span>
    )
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-bold tracking-widest text-white/50">
      <span className="h-2 w-2 rounded-full bg-white/30" /> STANDBY
    </span>
  )
}

export default function ModeratorDashboard() {
  const studio = useStudio()
  const {
    status, question, revealedChoice, hiddenChoices,
    jokerUsed, remaining, loading, notice, log, isLive,
  } = studio

  const [difficulty, setDifficulty] = useState('mixte')

  // ----- Double validation : présélection locale, jamais envoyée telle quelle -----
  const [pendingChoice, setPendingChoice] = useState(null)
  const [confirmingJoker, setConfirmingJoker] = useState(false)

  // Toute nouvelle question annule les validations en cours
  useEffect(() => {
    setPendingChoice(null)
    setConfirmingJoker(false)
  }, [question?.id, status])

  const choiceText = (letter) =>
    question ? question[`choice_${letter.toLowerCase()}`] : ''

  const handlePick = (letter) => {
    if (status !== 'question_live' || hiddenChoices.includes(letter)) return
    setPendingChoice((prev) => (prev === letter ? null : letter))
  }

  const handleConfirm = async () => {
    if (!pendingChoice) return
    const ok = await studio.confirmAnswer(pendingChoice)
    if (ok) setPendingChoice(null)
  }

  const handleJokerConfirm = async () => {
    const ok = await studio.activateJoker()
    if (ok) setConfirmingJoker(false)
  }

  const questionLive = status === 'question_live'
  const revealed = status === 'answer_revealed'

  return (
    <div className="min-h-full">
      {/* ================= BARRE RÉGIE ================= */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-night-950/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 sm:px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="onair-dot inline-block h-3 w-3 rounded-full bg-live-500" />
            <div className="leading-tight">
              <p className="font-display text-sm font-bold tracking-[0.22em] text-white">
                STUDIO QUIZ
              </p>
              <p className="text-[10px] font-medium tracking-[0.28em] text-white/40">
                CONSOLE MODÉRATEUR
              </p>
            </div>
          </div>

          <div className="ml-4 hidden sm:block">
            <StatusBadge status={status} />
          </div>

          <div className="ml-auto flex items-center gap-3 sm:gap-4">
            <span
              className={`hidden md:inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-wider ${
                isLive
                  ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                  : 'border-gold-400/30 bg-gold-400/10 text-gold-400'
              }`}
              title={isLive ? 'Connecté à Supabase Realtime' : 'Supabase non configuré — mode démo local'}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-gold-400'}`} />
              {isLive ? 'SUPABASE LIVE' : 'MODE DÉMO'}
            </span>
            <Clock />
            <a
              href="?view=overlay"
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold tracking-wider text-white/80 transition hover:border-white/30 hover:text-white"
            >
              ↗ OVERLAY
            </a>
          </div>
        </div>
        <div className="sm:hidden px-4 pb-3">
          <StatusBadge status={status} />
        </div>
      </header>

      {/* ================= NOTICE ================= */}
      {notice && (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pt-4">
          <div
            className={`slide-up rounded-xl border px-4 py-3 text-sm font-medium ${
              notice.type === 'error'
                ? 'border-live-500/40 bg-live-500/10 text-red-200'
                : notice.type === 'warn'
                  ? 'border-gold-400/40 bg-gold-400/10 text-amber-100'
                  : 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100'
            }`}
          >
            {notice.message}
          </div>
        </div>
      )}

      <main className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 py-6 lg:grid-cols-[1fr_340px]">
        {/* ================= COLONNE PRINCIPALE ================= */}
        <div className="space-y-5">
          {/* ----- Génération ----- */}
          <section className="panel-texture rounded-2xl border border-white/10 bg-night-900/70 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <p className="text-[11px] font-bold tracking-[0.25em] text-white/40">
                  01 — DIFFICULTÉ
                </p>
                <div className="mt-2 flex rounded-xl border border-white/10 bg-night-950/70 p-1">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDifficulty(d.id)}
                      className={`rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold transition ${
                        difficulty === d.id
                          ? 'bg-white text-night-950 shadow'
                          : 'text-white/55 hover:text-white'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ml-auto flex items-center gap-3">
                <div className="text-right">
                  <p className="font-display text-2xl font-bold leading-none text-white">
                    {remaining ?? '—'}
                  </p>
                  <p className="mt-1 text-[10px] font-bold tracking-[0.2em] text-white/40">
                    EN STOCK
                  </p>
                </div>
                <button
                  onClick={() => studio.generate(difficulty)}
                  disabled={loading}
                  className="group relative overflow-hidden rounded-xl bg-live-500 px-5 sm:px-7 py-3.5 font-display text-sm font-bold tracking-widest text-white shadow-[0_12px_40px_-12px_rgba(255,59,92,0.7)] transition hover:bg-live-600 active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? 'TIRAGE…' : '⚡ GÉNÉRER UNE QUESTION'}
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/5 pt-4">
              <button
                onClick={studio.resetLive}
                className="rounded-lg px-3 py-1.5 text-xs font-bold tracking-wider text-white/45 transition hover:bg-white/5 hover:text-white/80"
              >
                ■ RÉINITIALISER LE LIVE
              </button>
              <button
                onClick={studio.resetStock}
                className="rounded-lg px-3 py-1.5 text-xs font-bold tracking-wider text-white/45 transition hover:bg-white/5 hover:text-white/80"
              >
                ↺ RÉINITIALISER LE STOCK
              </button>
            </div>
          </section>

          {/* ----- Question & réponses ----- */}
          <section className="rounded-2xl border border-white/10 bg-night-900/70 p-5 sm:p-7">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold tracking-[0.25em] text-white/40">
                02 — QUESTION À L'ANTENNE
              </p>
              {question && (
                <span
                  className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest ${DIFFICULTY_STYLE[question.difficulty_level]}`}
                >
                  {question.difficulty_level}
                </span>
              )}
            </div>

            {!question ? (
              <div className="mt-6 rounded-xl border border-dashed border-white/15 bg-night-950/50 px-6 py-14 text-center">
                <p className="font-display text-xl font-bold text-white/60">
                  Aucune question à l'antenne
                </p>
                <p className="mt-2 text-sm text-white/35">
                  Cliquez sur « Générer une question » pour lancer le quiz sur le live.
                </p>
              </div>
            ) : (
              <div key={question.id} className="ticker-in">
                <h2 className="font-display mt-4 text-2xl sm:text-[28px] font-bold leading-snug text-white">
                  {question.question_text}
                </h2>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {LETTERS.map((letter) => {
                    const isPending = pendingChoice === letter
                    const isRevealed = revealed && revealedChoice === letter
                    const isCorrect = question.correct_answer === letter
                    const isHidden = hiddenChoices.includes(letter)
                    const dimmed = (revealed && !isRevealed) || isHidden

                    return (
                      <button
                        key={letter}
                        onClick={() => handlePick(letter)}
                        disabled={!questionLive || isHidden}
                        className={`group relative rounded-xl border p-[1px] text-left transition-all duration-200 ${
                          isRevealed
                            ? 'border-emerald-400/60'
                            : isPending
                              ? 'border-gold-400 pending-glow'
                              : 'border-white/10 hover:border-white/25'
                        } ${dimmed && !isRevealed ? 'opacity-40' : ''} ${
                          !questionLive ? 'cursor-default' : 'cursor-pointer'
                        }`}
                      >
                        <div
                          className={`flex items-center gap-3 rounded-[11px] px-4 py-4 ${
                            isRevealed
                              ? 'bg-emerald-400/10'
                              : isPending
                                ? 'bg-gold-400/10'
                                : 'bg-night-950/60 group-hover:bg-night-950'
                          }`}
                        >
                          <span
                            className={`font-display flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base font-bold ${
                              isRevealed
                                ? 'bg-emerald-400 text-night-950'
                                : isPending
                                  ? 'bg-gold-400 text-night-950'
                                  : 'bg-white/10 text-white/80'
                            }`}
                          >
                            {letter}
                          </span>
                          <span
                            className={`text-[15px] font-medium leading-snug ${
                              isHidden ? 'line-through text-white/40' : 'text-white/90'
                            }`}
                          >
                            {choiceText(letter)}
                          </span>

                          {/* Indication modérateur uniquement — jamais diffusée telle quelle */}
                          {isCorrect && (
                            <span className="ml-auto hidden shrink-0 items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-300 xl:inline-flex">
                              ✓ RÉGIE
                            </span>
                          )}
                          {isHidden && (
                            <span className="ml-auto shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-white/50">
                              ÉLIMINÉE
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>

                {/* ----- DOUBLE VALIDATION : réponse ----- */}
                {questionLive && !pendingChoice && (
                  <p className="mt-5 text-center text-xs font-medium tracking-wider text-white/35">
                    ↑ Cliquez sur une réponse pour la présélectionner —{' '}
                    <span className="text-white/60">rien n'est envoyé au live sans confirmation.</span>
                  </p>
                )}

                {questionLive && pendingChoice && (
                  <div className="slide-up mt-5 rounded-xl border border-gold-400/40 bg-gold-400/[0.07] p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-3">
                        <span className="font-display flex h-11 w-11 items-center justify-center rounded-xl bg-gold-400 text-xl font-bold text-night-950">
                          {pendingChoice}
                        </span>
                        <div>
                          <p className="font-display text-sm font-bold tracking-wider text-gold-400">
                            RÉPONSE PRÉSÉLECTIONNÉE — EN ATTENTE
                          </p>
                          <p className="mt-0.5 text-sm text-white/60">
                            « {choiceText(pendingChoice)} » — confirmez pour l'envoyer au live.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:ml-auto">
                        <button
                          onClick={() => setPendingChoice(null)}
                          className="rounded-xl border border-white/20 bg-transparent px-5 py-2.5 text-sm font-bold text-white/70 transition hover:border-white/40 hover:text-white"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleConfirm}
                          className="rounded-xl bg-emerald-400 px-5 py-2.5 font-display text-sm font-bold tracking-wide text-night-950 shadow-[0_10px_30px_-10px_rgba(52,211,153,0.8)] transition hover:bg-emerald-300 active:scale-[0.98]"
                        >
                          ✓ Confirmer la réponse
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {revealed && (
                  <div className="slide-up mt-5 flex flex-col gap-3 rounded-xl border border-emerald-400/30 bg-emerald-400/[0.06] p-4 sm:flex-row sm:items-center">
                    <p className="text-sm text-emerald-100/90">
                      <span className="font-display font-bold text-emerald-300">
                        Réponse {revealedChoice} envoyée au live.
                      </span>{' '}
                      {revealedChoice === question.correct_answer
                        ? 'C’était la bonne réponse. 🎉'
                        : `La bonne réponse était la ${question.correct_answer}.`}
                    </p>
                    <button
                      onClick={() => studio.generate(difficulty)}
                      disabled={loading}
                      className="rounded-xl bg-white px-5 py-2.5 font-display text-sm font-bold text-night-950 transition hover:bg-white/90 sm:ml-auto disabled:opacity-50"
                    >
                      Question suivante →
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* ================= COLONNE LATÉRALE ================= */}
        <div className="space-y-5">
          {/* ----- Moniteur live ----- */}
          <section className="overflow-hidden rounded-2xl border border-white/10 bg-night-950/70">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <p className="text-[11px] font-bold tracking-[0.25em] text-white/40">
                MONITEUR — RETOUR LIVE
              </p>
              <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-live-500">
                <span className="onair-dot h-1.5 w-1.5 rounded-full bg-live-500" /> REC
              </span>
            </div>
            <div className="panel-texture p-4">
              {status === 'idle' || !question ? (
                <div className="rounded-lg bg-black/40 px-4 py-8 text-center">
                  <p className="font-display text-sm font-bold tracking-[0.2em] text-white/40">
                    LE QUIZ COMMENCE BIENTÔT
                  </p>
                  <div className="mx-auto mt-4 flex w-24 items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <span key={i} className="h-1 flex-1 rounded-full bg-white/15" />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="ticker-in rounded-lg bg-black/40 p-3">
                  <p className="line-clamp-2 font-display text-[13px] font-bold leading-snug text-white">
                    {question.question_text}
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-1.5">
                    {LETTERS.map((l) => {
                      const hidden = hiddenChoices.includes(l)
                      const shown = revealed && revealedChoice === l
                      return (
                        <div
                          key={l}
                          className={`truncate rounded-md px-2 py-1.5 text-[11px] font-bold ${
                            shown
                              ? 'bg-emerald-400 text-night-950'
                              : hidden
                                ? 'bg-white/5 text-white/25 line-through'
                                : 'bg-white/10 text-white/80'
                          }`}
                        >
                          {l} · {choiceText(l)}
                        </div>
                      )
                    })}
                  </div>
                  {revealed && (
                    <p className="mt-2 text-center text-[11px] font-bold tracking-widest text-emerald-300">
                      ✓ RÉPONSE {revealedChoice} RÉVÉLÉE
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ----- Joker 50/50 (avec confirmation) ----- */}
          <section className="rounded-2xl border border-signal-400/25 bg-gradient-to-b from-signal-500/15 to-night-900/70 p-5">
            <div className="flex items-center gap-3">
              <span className="font-display flex h-10 w-10 items-center justify-center rounded-xl bg-signal-400/20 text-lg font-bold text-signal-400">
                ½
              </span>
              <div>
                <h3 className="font-display text-base font-bold text-white">Joker 50/50</h3>
                <p className="text-xs text-white/50">Élimine 2 mauvaises réponses sur le live.</p>
              </div>
              {jokerUsed && (
                <span className="ml-auto rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-widest text-white/50">
                  UTILISÉ
                </span>
              )}
            </div>

            <div className="mt-4">
              {!confirmingJoker ? (
                <button
                  onClick={() => setConfirmingJoker(true)}
                  disabled={!questionLive || jokerUsed}
                  className="w-full rounded-xl border border-signal-400/40 bg-signal-500/20 px-4 py-3 font-display text-sm font-bold tracking-widest text-white transition hover:bg-signal-500/35 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-signal-500/20"
                >
                  ACTIVER LE JOKER
                </button>
              ) : (
                <div className="slide-up rounded-xl border border-gold-400/40 bg-night-950/70 p-3">
                  <p className="text-center text-sm font-bold text-gold-400">
                    Confirmer l'activation du joker ?
                  </p>
                  <p className="mt-1 text-center text-xs text-white/50">
                    2 mauvaises réponses seront retirées du live.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setConfirmingJoker(false)}
                      className="rounded-lg border border-white/20 px-3 py-2 text-sm font-bold text-white/70 transition hover:border-white/40 hover:text-white"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleJokerConfirm}
                      className="rounded-lg bg-signal-400 px-3 py-2 font-display text-sm font-bold text-white transition hover:bg-signal-500 active:scale-[0.98]"
                    >
                      Confirmer
                    </button>
                  </div>
                </div>
              )}
              {!questionLive && (
                <p className="mt-2 text-center text-[11px] text-white/35">
                  Disponible pendant une question à l'antenne.
                </p>
              )}
            </div>
          </section>

          {/* ----- Journal régie ----- */}
          <section className="rounded-2xl border border-white/10 bg-night-900/70 p-5">
            <p className="text-[11px] font-bold tracking-[0.25em] text-white/40">
              JOURNAL RÉGIE
            </p>
            <div className="mt-3 max-h-56 space-y-2.5 overflow-y-auto pr-1">
              {log.length === 0 && (
                <p className="text-sm text-white/35">
                  Les actions confirmées apparaîtront ici avec leur heure d'antenne.
                </p>
              )}
              {log.map((entry) => (
                <div key={entry.id} className="flex items-start gap-2.5 text-sm">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${LOG_COLOR[entry.kind]}`} />
                  <span className="shrink-0 font-mono text-xs text-white/35">{entry.time}</span>
                  <span className="text-white/75">{entry.message}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="mx-auto max-w-7xl px-4 sm:px-6 pb-8">
        <p className="border-t border-white/5 pt-4 text-center text-[11px] tracking-wide text-white/25">
          STUDIO QUIZ — Régie protégée par code PIN · Les présélections ne sont jamais diffusées sans confirmation · Overlay public :{' '}
          <span className="font-mono">?view=overlay</span>
        </p>
      </footer>
    </div>
  )
}
