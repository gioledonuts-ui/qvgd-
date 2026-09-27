import { useEffect, useState } from 'react'
import { BRAND } from '../brand'
import { useStudio, LETTERS } from '../hooks/useStudio'
import { Wordmark, SectionLabel, Ticker } from './Brand'

const DIFFICULTIES = [
  { id: 'mixte', label: 'Mixte' },
  { id: 'facile', label: 'Facile' },
  { id: 'moyen', label: 'Moyen' },
  { id: 'difficile', label: 'Difficile' },
]

const LOG_COLOR = {
  info: 'bg-paper/30',
  live: 'bg-signal-500',
  success: 'bg-emerald-400',
  warn: 'bg-amber-400',
  joker: 'bg-sky-400',
}

function Clock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])
  return (
    <span className="font-mono text-sm tabular-nums text-paper/80">
      {time.toLocaleTimeString('fr-FR')}
    </span>
  )
}

function StatusBlock({ status }) {
  if (status === 'question_live')
    return (
      <span className="inline-flex items-center gap-2 bg-signal-500 px-3 py-1.5 font-mono text-[11px] font-bold tracking-[0.2em] text-ink-950">
        <span className="onair-blink inline-block h-2 w-2 bg-ink-950" />
        ON AIR — QUESTION
      </span>
    )
  if (status === 'answer_revealed')
    return (
      <span className="inline-flex items-center gap-2 bg-emerald-400 px-3 py-1.5 font-mono text-[11px] font-bold tracking-[0.2em] text-ink-950">
        <span className="inline-block h-2 w-2 bg-ink-950" />
        ON AIR — RÉVÉLÉE
      </span>
    )
  return (
    <span className="inline-flex items-center gap-2 border border-paper/20 px-3 py-1.5 font-mono text-[11px] font-bold tracking-[0.2em] text-paper-dim">
      <span className="inline-block h-2 w-2 bg-paper/30" />
      STANDBY
    </span>
  )
}

function ObsOutput() {
  const [copied, setCopied] = useState(null)
  const origin = window.location.origin
  const urlFull = `${origin}/overlay`
  const urlLower = `${origin}/overlay?transparent=1&layout=lower`

  const copy = async (url, key) => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(key)
    window.setTimeout(() => setCopied(null), 1800)
  }

  return (
    <section className="border border-paper/10 bg-ink-900 p-5">
      <SectionLabel number="05">Sortie OBS</SectionLabel>
      <div className="mt-4 flex items-center gap-2 border border-paper/10 bg-ink-950 px-3 py-2.5">
        <span className="h-2 w-2 shrink-0 bg-emerald-400" />
        <code className="truncate font-mono text-xs text-paper/75">{urlFull}</code>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={() => copy(urlFull, 'full')}
          className="bg-paper px-3 py-3 font-display text-xs font-semibold uppercase tracking-[0.14em] text-ink-950 transition hover:bg-white active:scale-[0.98]"
        >
          {copied === 'full' ? '✓ Copié' : '⧉ Plein écran'}
        </button>
        <button
          onClick={() => copy(urlLower, 'lower')}
          className="border border-paper/25 px-3 py-3 font-display text-xs font-semibold uppercase tracking-[0.14em] text-paper transition hover:border-paper/60 active:scale-[0.98]"
        >
          {copied === 'lower' ? '✓ Copié' : '⧉ Lower third'}
        </button>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-paper-dim">
        À coller dans OBS : <span className="text-paper">Sources → + → Navigateur</span>.
        « Lower third » = bandeau bas transparent par-dessus votre jeu.
      </p>
    </section>
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
    <div className="grain min-h-full">
      {/* Bandeau antenne */}
      <Ticker
        items={[BRAND.name, 'En direct', BRAND.tagline, 'Régie modérateur']}
        className="border-b border-ink-950 bg-signal-500 py-1.5 text-ink-950"
      />

      {/* ================= BARRE RÉGIE ================= */}
      <header className="sticky top-0 z-30 border-b border-paper/10 bg-ink-950/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
          <Wordmark />
          <div className="ml-2 hidden sm:block">
            <StatusBlock status={status} />
          </div>
          <div className="ml-auto flex items-center gap-3 sm:gap-5">
            <span
              className={`hidden font-mono text-[10px] font-bold uppercase tracking-[0.2em] md:inline ${
                isLive ? 'text-emerald-400' : 'text-amber-400'
              }`}
              title={isLive ? 'Connecté à Supabase Realtime' : 'Supabase non configuré — mode démo local'}
            >
              {isLive ? '● Supabase live' : '● Mode démo'}
            </span>
            <Clock />
            <a
              href="/overlay"
              target="_blank"
              rel="noreferrer"
              className="border border-paper/25 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-paper transition hover:border-signal-500 hover:text-signal-500"
            >
              Overlay ↗
            </a>
          </div>
        </div>
        <div className="px-4 pb-3 sm:hidden">
          <StatusBlock status={status} />
        </div>
      </header>

      {notice && (
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6">
          <div
            className={`rise-in border-l-4 px-4 py-3 font-mono text-[13px] ${
              notice.type === 'error'
                ? 'border-signal-500 bg-signal-500/10 text-paper'
                : notice.type === 'warn'
                  ? 'border-amber-400 bg-amber-400/10 text-paper'
                  : 'border-emerald-400 bg-emerald-400/10 text-paper'
            }`}
          >
            {notice.message}
          </div>
        </div>
      )}

      <main className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_340px]">
        {/* ================= COLONNE PRINCIPALE ================= */}
        <div className="space-y-5">
          {/* ----- 01 Tirage ----- */}
          <section className="border border-paper/10 bg-ink-900 p-5 sm:p-6">
            <SectionLabel
              number="01"
              right={
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-paper-dim">
                  Stock : <span className="font-bold text-paper">{remaining ?? '—'}</span>
                </span>
              }
            >
              Tirage de la question
            </SectionLabel>

            <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-end">
              <div className="flex border border-paper/15">
                {DIFFICULTIES.map((d, i) => (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    className={`px-4 py-3 font-display text-sm font-semibold uppercase tracking-wide transition sm:px-6 ${
                      i > 0 ? 'border-l border-paper/15' : ''
                    } ${
                      difficulty === d.id
                        ? 'bg-paper text-ink-950'
                        : 'text-paper-dim hover:text-paper'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => studio.generate(difficulty)}
                disabled={loading}
                className="bg-signal-500 px-8 py-4 font-display text-base font-semibold uppercase tracking-wide text-ink-950 transition hover:bg-signal-400 active:scale-[0.99] disabled:opacity-50 xl:ml-auto"
              >
                {loading ? 'Tirage en cours…' : '→ Générer une question'}
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-paper/10 pt-4">
              <button
                onClick={studio.resetLive}
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper-dim transition hover:text-paper"
              >
                ■ Réinitialiser le live
              </button>
              <button
                onClick={studio.resetStock}
                className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper-dim transition hover:text-paper"
              >
                ↺ Réinitialiser le stock
              </button>
            </div>
          </section>

          {/* ----- 02 Antenne ----- */}
          <section className="border border-paper/10 bg-ink-900 p-5 sm:p-8">
            <SectionLabel
              number="02"
              right={
                question && (
                  <span className="bg-paper px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-ink-950">
                    {question.difficulty_level}
                  </span>
                )
              }
            >
              Question à l'antenne
            </SectionLabel>

            {!question ? (
              <div className="mt-8 border border-dashed border-paper/20 px-6 py-16 text-center">
                <p className="font-display text-3xl font-medium uppercase tracking-tight text-paper/50">
                  Antenne vide
                </p>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-paper-dim">
                  Lancez le tirage pour envoyer la première question sur le live.
                  Les viewers voient l'écran d'attente.
                </p>
              </div>
            ) : (
              <div key={question.id} className="ticker-in mt-6">
                <h2 className="font-display max-w-3xl text-3xl font-medium leading-[1.08] tracking-tight text-paper sm:text-[40px]">
                  {question.question_text}
                </h2>

                {/* Liste éditoriale des réponses */}
                <div className="mt-8 border-b border-paper/15">
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
                        className={`group relative flex w-full items-center gap-4 border-t border-paper/15 px-2 py-4 text-left transition-colors sm:gap-6 sm:px-4 sm:py-5 ${
                          isRevealed
                            ? 'bg-emerald-400/[0.07]'
                            : isPending
                              ? 'bg-signal-500/[0.08]'
                              : questionLive && !isHidden
                                ? 'hover:bg-paper/[0.04]'
                                : ''
                        } ${dimmed && !isRevealed ? 'opacity-35' : ''} ${
                          !questionLive ? 'cursor-default' : 'cursor-pointer'
                        }`}
                      >
                        {/* Barre de présélection */}
                        <span
                          className={`absolute left-0 top-0 h-full w-1 transition-all ${
                            isRevealed
                              ? 'bg-emerald-400'
                              : isPending
                                ? 'pending-bar bg-signal-500'
                                : 'bg-transparent group-hover:bg-paper/20'
                          }`}
                        />
                        <span
                          className={`font-display text-3xl font-semibold tracking-tight sm:text-4xl ${
                            isRevealed
                              ? 'text-emerald-400'
                              : isPending
                                ? 'text-signal-500'
                                : 'text-paper/35 group-hover:text-paper/70'
                          }`}
                        >
                          {letter}
                        </span>
                        <span
                          className={`text-base font-medium sm:text-lg ${
                            isHidden ? 'text-paper/30 line-through' : 'text-paper'
                          }`}
                        >
                          {choiceText(letter)}
                        </span>
                        {isCorrect && (
                          <span className="ml-auto hidden shrink-0 border border-emerald-400/40 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400 md:inline-block">
                            ✓ Régie
                          </span>
                        )}
                        {isHidden && (
                          <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-paper/30 line-through">
                            Éliminée
                          </span>
                        )}
                        {isRevealed && (
                          <span className="ml-auto shrink-0 bg-emerald-400 px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-ink-950">
                            À l'antenne
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* ----- DOUBLE VALIDATION ----- */}
                {questionLive && !pendingChoice && (
                  <p className="mt-6 border border-paper/15 px-4 py-3 text-center font-mono text-[11px] uppercase leading-relaxed tracking-[0.14em] text-paper-dim">
                    Cliquez sur une réponse pour la présélectionner —{' '}
                    <span className="text-paper">rien ne part à l'antenne sans confirmation</span>
                  </p>
                )}

                {questionLive && pendingChoice && (
                  <div className="rise-in mt-6 border border-signal-500/60 bg-signal-500/[0.06]">
                    <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-4">
                        <span className="font-display bg-signal-500 px-4 py-2 text-3xl font-semibold text-ink-950">
                          {pendingChoice}
                        </span>
                        <div>
                          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-signal-500">
                            Présélection — en attente
                          </p>
                          <p className="mt-1 text-sm text-paper/75">
                            « {choiceText(pendingChoice)} » — confirmez pour envoyer à l'antenne.
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 sm:ml-auto">
                        <button
                          onClick={() => setPendingChoice(null)}
                          className="border border-paper/25 px-5 py-3 font-display text-sm font-semibold uppercase tracking-wide text-paper/80 transition hover:border-paper/60 hover:text-paper"
                        >
                          Annuler
                        </button>
                        <button
                          onClick={handleConfirm}
                          className="bg-emerald-400 px-5 py-3 font-display text-sm font-semibold uppercase tracking-wide text-ink-950 transition hover:bg-emerald-300 active:scale-[0.98]"
                        >
                          ✓ Confirmer
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {revealed && (
                  <div className="rise-in mt-6 flex flex-col gap-4 border border-emerald-400/40 bg-emerald-400/[0.05] p-5 sm:flex-row sm:items-center">
                    <p className="text-sm leading-relaxed text-paper/85">
                      <span className="font-display text-base font-semibold uppercase tracking-wide text-emerald-400">
                        Réponse {revealedChoice} à l'antenne.
                      </span>{' '}
                      {revealedChoice === question.correct_answer
                        ? 'C’était la bonne réponse.'
                        : `La bonne réponse était la ${question.correct_answer}.`}
                    </p>
                    <button
                      onClick={() => studio.generate(difficulty)}
                      disabled={loading}
                      className="bg-paper px-6 py-3 font-display text-sm font-semibold uppercase tracking-wide text-ink-950 transition hover:bg-white sm:ml-auto disabled:opacity-50"
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
          <ObsOutput />

          {/* ----- 03 Retour live ----- */}
          <section className="border border-paper/10 bg-ink-950">
            <div className="flex items-center justify-between border-b border-paper/10 px-5 py-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-paper-dim">
                <span className="mr-3 font-bold text-signal-500">03</span>Retour live
              </p>
              <span className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-signal-500">
                <span className="onair-blink inline-block h-2 w-2 bg-signal-500" /> Rec
              </span>
            </div>
            <div className="p-5">
              {status === 'idle' || !question ? (
                <div className="border border-paper/15 px-4 py-10 text-center">
                  <p className="font-display text-lg font-medium uppercase tracking-tight text-paper/45">
                    Bientôt à l'antenne
                  </p>
                </div>
              ) : (
                <div className="ticker-in">
                  <p className="font-display line-clamp-3 text-base font-medium leading-snug text-paper">
                    {question.question_text}
                  </p>
                  <div className="mt-4 space-y-1.5">
                    {LETTERS.map((l) => {
                      const hidden = hiddenChoices.includes(l)
                      const shown = revealed && revealedChoice === l
                      return (
                        <div
                          key={l}
                          className={`flex items-center gap-2 px-2 py-1.5 font-mono text-[11px] ${
                            shown
                              ? 'bg-emerald-400 font-bold text-ink-950'
                              : hidden
                                ? 'text-paper/25 line-through'
                                : 'bg-paper/[0.06] text-paper/80'
                          }`}
                        >
                          <span className="font-bold">{l}</span>
                          <span className="truncate">{choiceText(l)}</span>
                        </div>
                      )
                    })}
                  </div>
                  {revealed && (
                    <p className="mt-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                      ✓ Réponse {revealedChoice} révélée
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ----- 04 Joker ----- */}
          <section className="border border-paper/10 bg-ink-900 p-5">
            <SectionLabel
              number="04"
              right={
                jokerUsed && (
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-paper/35">
                    Épuisé
                  </span>
                )
              }
            >
              Joker 50/50
            </SectionLabel>
            <div className="mt-4 flex items-end justify-between">
              <p className="font-display text-5xl font-semibold tracking-tight text-paper">
                50<span className="text-signal-500">/</span>50
              </p>
              <p className="max-w-[130px] text-right text-xs leading-snug text-paper-dim">
                Élimine 2 mauvaises réponses à l'antenne.
              </p>
            </div>

            <div className="mt-4">
              {!confirmingJoker ? (
                <button
                  onClick={() => setConfirmingJoker(true)}
                  disabled={!questionLive || jokerUsed}
                  className="w-full border border-signal-500/60 bg-signal-500/10 px-4 py-3.5 font-display text-sm font-semibold uppercase tracking-[0.14em] text-signal-500 transition hover:bg-signal-500 hover:text-ink-950 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-25 disabled:hover:bg-signal-500/10 disabled:hover:text-signal-500"
                >
                  Activer le joker
                </button>
              ) : (
                <div className="rise-in border border-signal-500 bg-ink-950 p-4">
                  <p className="text-center font-display text-sm font-semibold uppercase tracking-wide text-paper">
                    Confirmer l'activation ?
                  </p>
                  <p className="mt-1 text-center text-xs text-paper-dim">
                    2 mauvaises réponses seront retirées du live.
                  </p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setConfirmingJoker(false)}
                      className="border border-paper/25 px-3 py-2.5 font-display text-xs font-semibold uppercase tracking-wide text-paper/80 transition hover:border-paper/60 hover:text-paper"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleJokerConfirm}
                      className="bg-signal-500 px-3 py-2.5 font-display text-xs font-semibold uppercase tracking-wide text-ink-950 transition hover:bg-signal-400 active:scale-[0.98]"
                    >
                      Confirmer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ----- 06 Journal ----- */}
          <section className="border border-paper/10 bg-ink-900 p-5">
            <SectionLabel number="06">Journal régie</SectionLabel>
            <div className="mt-4 max-h-56 space-y-3 overflow-y-auto pr-1">
              {log.length === 0 && (
                <p className="text-sm leading-relaxed text-paper-dim">
                  Les actions confirmées apparaîtront ici avec leur heure d'antenne.
                </p>
              )}
              {log.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 text-[13px]">
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 ${LOG_COLOR[entry.kind]}`} />
                  <span className="shrink-0 font-mono text-[11px] text-paper-dim">{entry.time}</span>
                  <span className="text-paper/80">{entry.message}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="mx-auto max-w-7xl px-4 pb-8 sm:px-6">
        <p className="border-t border-paper/10 pt-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-paper/30">
          {BRAND.name} — Régie protégée · Overlay public : /overlay
        </p>
      </footer>
    </div>
  )
}
