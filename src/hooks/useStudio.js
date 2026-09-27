import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { DEMO_QUESTIONS } from '../data/demoQuestions'

const GAME_STATE_ID = 1
const LETTERS = ['A', 'B', 'C', 'D']

const now = () =>
  new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

/**
 * Pilote l'état du studio : question en cours, réponse révélée, joker.
 * - Avec Supabase configuré : persiste dans `game_state` + `questions`
 *   et se synchronise en temps réel avec l'overlay du live.
 * - Sans Supabase : mode démo 100 % local.
 */
export function useStudio() {
  const [status, setStatus] = useState('idle') // idle | question_live | answer_revealed
  const [question, setQuestion] = useState(null)
  const [revealedChoice, setRevealedChoice] = useState(null)
  const [hiddenChoices, setHiddenChoices] = useState([])
  const [jokerUsed, setJokerUsed] = useState(false)
  const [remaining, setRemaining] = useState(null)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState(null) // { type, message }
  const [log, setLog] = useState([])

  // Mode démo : questions déjà utilisées (ids)
  const demoUsedRef = useRef(new Set())

  const pushLog = useCallback((message, kind = 'info') => {
    setLog((prev) => [{ id: crypto.randomUUID(), time: now(), message, kind }, ...prev].slice(0, 30))
  }, [])

  const flashNotice = useCallback((type, message) => {
    setNotice({ type, message })
    window.clearTimeout(flashNotice._t)
    flashNotice._t = window.setTimeout(() => setNotice(null), 4500)
  }, [])

  // ---------- Lecture de l'état distant ----------
  const applyGameState = useCallback(
    async (gs) => {
      if (!gs) return
      setStatus(gs.status)
      setRevealedChoice(gs.revealed_choice)
      setHiddenChoices(gs.hidden_choices ?? [])
      setJokerUsed(gs.joker_used)
      if (gs.current_question_id) {
        const { data } = await supabase
          .from('questions')
          .select('*')
          .eq('id', gs.current_question_id)
          .single()
        setQuestion(data ?? null)
      } else {
        setQuestion(null)
      }
    },
    [],
  )

  const refreshRemaining = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setRemaining(DEMO_QUESTIONS.length - demoUsedRef.current.size)
      return
    }
    const { count } = await supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('is_used', false)
    setRemaining(count ?? 0)
  }, [])

  useEffect(() => {
    let channel
    ;(async () => {
      if (isSupabaseConfigured) {
        const { data } = await supabase.from('game_state').select('*').eq('id', GAME_STATE_ID).single()
        await applyGameState(data)
        channel = supabase
          .channel('game_state_moderator')
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'game_state', filter: `id=eq.${GAME_STATE_ID}` },
            (payload) => applyGameState(payload.new),
          )
          .subscribe()
      } else {
        setRemaining(DEMO_QUESTIONS.length)
      }
      refreshRemaining()
    })()
    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [applyGameState, refreshRemaining])

  // ---------- Actions ----------
  const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)]

  /** Pioche une question non utilisée et l'envoie au live. */
  const generate = useCallback(
    async (difficulty = 'mixte') => {
      setLoading(true)
      try {
        if (isSupabaseConfigured) {
          let query = supabase.from('questions').select('*').eq('is_used', false)
          if (difficulty !== 'mixte') query = query.eq('difficulty_level', difficulty)
          const { data, error } = await query
          if (error) throw error
          if (!data || data.length === 0) {
            flashNotice('warn', 'Stock épuisé pour cette difficulté. Réinitialisez le stock ou changez de niveau.')
            return null
          }
          const picked = pickRandom(data)
          await supabase.from('questions').update({ is_used: true }).eq('id', picked.id)
          const { error: gsError } = await supabase
            .from('game_state')
            .update({
              status: 'question_live',
              current_question_id: picked.id,
              revealed_choice: null,
              hidden_choices: [],
              joker_used: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', GAME_STATE_ID)
          if (gsError) throw gsError
          setQuestion(picked)
          setStatus('question_live')
          setRevealedChoice(null)
          setHiddenChoices([])
          setJokerUsed(false)
          pushLog(`Question envoyée au live (${picked.difficulty_level})`, 'live')
          refreshRemaining()
          return picked
        }

        // ----- Mode démo -----
        const pool = DEMO_QUESTIONS.filter(
          (q) =>
            !demoUsedRef.current.has(q.id) &&
            (difficulty === 'mixte' || q.difficulty_level === difficulty),
        )
        if (pool.length === 0) {
          flashNotice('warn', 'Stock démo épuisé pour cette difficulté. Réinitialisez le stock.')
          return null
        }
        const picked = pickRandom(pool)
        demoUsedRef.current.add(picked.id)
        setQuestion(picked)
        setStatus('question_live')
        setRevealedChoice(null)
        setHiddenChoices([])
        setJokerUsed(false)
        pushLog(`Question envoyée au live (${picked.difficulty_level})`, 'live')
        setRemaining(DEMO_QUESTIONS.length - demoUsedRef.current.size)
        return picked
      } catch (e) {
        console.error(e)
        flashNotice('error', 'Erreur lors de la génération de la question.')
        return null
      } finally {
        setLoading(false)
      }
    },
    [flashNotice, pushLog, refreshRemaining],
  )

  /** Envoie la réponse présélectionnée au live (après double validation). */
  const confirmAnswer = useCallback(
    async (letter) => {
      if (!question || status !== 'question_live') return false
      try {
        if (isSupabaseConfigured) {
          const { error } = await supabase
            .from('game_state')
            .update({
              status: 'answer_revealed',
              revealed_choice: letter,
              updated_at: new Date().toISOString(),
            })
            .eq('id', GAME_STATE_ID)
          if (error) throw error
        }
        setRevealedChoice(letter)
        setStatus('answer_revealed')
        const isCorrect = letter === question.correct_answer
        pushLog(
          isCorrect
            ? `Bonne réponse révélée : ${letter}`
            : `Réponse ${letter} révélée (la bonne était ${question.correct_answer})`,
          isCorrect ? 'success' : 'warn',
        )
        return true
      } catch (e) {
        console.error(e)
        flashNotice('error', "Erreur lors de l'envoi de la réponse.")
        return false
      }
    },
    [question, status, flashNotice, pushLog],
  )

  /** Active le joker 50/50 : masque 2 mauvaises réponses sur le live. */
  const activateJoker = useCallback(async () => {
    if (!question || status !== 'question_live' || jokerUsed) return false
    const wrong = LETTERS.filter((l) => l !== question.correct_answer)
    const toHide = [...wrong].sort(() => Math.random() - 0.5).slice(0, 2)
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('game_state')
          .update({
            hidden_choices: toHide,
            joker_used: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', GAME_STATE_ID)
        if (error) throw error
      }
      setHiddenChoices(toHide)
      setJokerUsed(true)
      pushLog(`Joker 50/50 activé — ${toHide.join(' et ')} éliminées`, 'joker')
      return true
    } catch (e) {
      console.error(e)
      flashNotice('error', "Erreur lors de l'activation du joker.")
      return false
    }
  }, [question, status, jokerUsed, flashNotice, pushLog])

  /** Coupe le live : retour à l'écran d'attente. */
  const resetLive = useCallback(async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase
          .from('game_state')
          .update({
            status: 'idle',
            current_question_id: null,
            revealed_choice: null,
            hidden_choices: [],
            joker_used: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', GAME_STATE_ID)
      }
      setStatus('idle')
      setQuestion(null)
      setRevealedChoice(null)
      setHiddenChoices([])
      setJokerUsed(false)
      pushLog('Live réinitialisé — écran d’attente', 'info')
    } catch (e) {
      console.error(e)
      flashNotice('error', 'Erreur lors de la réinitialisation.')
    }
  }, [flashNotice, pushLog])

  /** Remet toutes les questions en stock (is_used = false). */
  const resetStock = useCallback(async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.from('questions').update({ is_used: false }).eq('is_used', true)
      } else {
        demoUsedRef.current.clear()
      }
      pushLog('Stock de questions réinitialisé', 'info')
      refreshRemaining()
      flashNotice('success', 'Stock de questions réinitialisé.')
    } catch (e) {
      console.error(e)
      flashNotice('error', 'Erreur lors de la réinitialisation du stock.')
    }
  }, [flashNotice, pushLog, refreshRemaining])

  return {
    // état
    status,
    question,
    revealedChoice,
    hiddenChoices,
    jokerUsed,
    remaining,
    loading,
    notice,
    log,
    isLive: isSupabaseConfigured,
    // actions
    generate,
    confirmAnswer,
    activateJoker,
    resetLive,
    resetStock,
  }
}

export { LETTERS }
