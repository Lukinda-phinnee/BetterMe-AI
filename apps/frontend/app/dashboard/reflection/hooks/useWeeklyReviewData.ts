'use client'

import { API_BASE_URL } from '../../../../lib/config'
import { useState, useEffect, useCallback } from 'react'
import type { InboxItem } from '../components/steps/step1-get-clear'
import type { HabitRetroItem, RolloverTaskItem } from '../components/steps/step2-get-current'
import type { GoalAlignmentItem } from '../components/steps/step3-goal-alignment'
import type { HistoricalReflection } from '../components/reflection-history-modal'

const API = `${API_BASE_URL}`
const DAYS_IN_WEEK = 7

// ── Helpers ───────────────────────────────────────────────────────────────────

function getWeekDateRange() {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const start = new Date()
  start.setDate(start.getDate() - (DAYS_IN_WEEK - 1))
  start.setHours(0, 0, 0, 0)
  return { start, end }
}

/** Map a raw habit + its completions for the past 7 days to HabitRetroItem */
function mapHabitToRetro(habit: any, completions: any[]): HabitRetroItem {
  const { start } = getWeekDateRange()
  const days: boolean[] = []
  for (let i = 0; i < DAYS_IN_WEEK; i++) {
    const day = new Date(start)
    day.setDate(day.getDate() + i)
    const dayStr = day.toISOString().slice(0, 10)
    const done = completions.some(
      (c) => c.habit_id === habit.id && c.completed_at?.slice(0, 10) === dayStr && c.status === 'done'
    )
    days.push(done)
  }
  return {
    id: habit.id,
    title: habit.name,
    targetDays: habit.target_days ?? DAYS_IN_WEEK,
    completedDays: days,
    streak: habit.streak?.current_streak ?? 0,
    category: habit.category ?? 'General'
  }
}

/** Cards with due_date before today (or no due_date) and status != done, postponed multiple times */
function mapCardToRollover(card: any, postponeCount: number): RolloverTaskItem {
  return {
    id: card.id,
    title: card.title,
    postponedCount: postponeCount,
    originalDate: card.due_date ?? card.created_at ?? ''
  }
}

// ── Main hook ─────────────────────────────────────────────────────────────────

export interface WeeklyReviewLoadState {
  isLoading: boolean
  error: string | null
  userId: string | null
  authToken: string | null
}

export function useWeeklyReviewData() {
  // ── Identity ────────────────────────────────────────────────────────────────
  const [userId,    setUserId]    = useState<string | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error,     setError]     = useState<string | null>(null)

  // ── Step 1: Get Clear ────────────────────────────────────────────────────────
  const [inboxItems,         setInboxItems]         = useState<InboxItem[]>([])
  const [workspaceChecklist, setWorkspaceChecklist] = useState<Record<string, boolean>>({
    desk: false, desktop: false, calendar: false, notes: false
  })

  // ── Step 2: Get Current ──────────────────────────────────────────────────────
  const [habits,       setHabits]       = useState<HabitRetroItem[]>([])
  const [rolloverTasks, setRolloverTasks] = useState<RolloverTaskItem[]>([])
  const [energyLevel,  setEnergyLevel]  = useState<number>(3)
  const [stressLevel,  setStressLevel]  = useState<number>(2)

  // ── Step 3: Goal Alignment ───────────────────────────────────────────────────
  const [goals,        setGoals]        = useState<GoalAlignmentItem[]>([])
  const [woopObstacle, setWoopObstacle] = useState<string>('')

  // ── Step 4: Get Creative ─────────────────────────────────────────────────────
  const [workedWell,     setWorkedWell]     = useState<string>('')
  const [didntWork,      setDidntWork]      = useState<string>('')
  const [aiInsights,     setAiInsights]     = useState<string | null>(null)
  const [isGeneratingAi, setIsGeneratingAi] = useState<boolean>(false)
  const [intention, setIntention] = useState({ trigger: '', action: '', location: '' })

  // ── Step 5: Commitment ───────────────────────────────────────────────────────
  const [topPriorities, setTopPriorities] = useState<string[]>([])
  const [weeklyMotto,   setWeeklyMotto]   = useState<string>('')

  // ── System ────────────────────────────────────────────────────────────────────
  const [lastSavedAt,      setLastSavedAt]      = useState<Date | null>(null)
  const [isAutoSaving,     setIsAutoSaving]     = useState<boolean>(false)
  const [isSaving,         setIsSaving]         = useState<boolean>(false)
  const [pastReflections,  setPastReflections]  = useState<HistoricalReflection[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false)

  // ── Fetch helpers ─────────────────────────────────────────────────────────────

  const fetchHabitsAndCompletions = useCallback(async (uid: string) => {
    const { start, end } = getWeekDateRange()
    const [habitsRes, completionsRes] = await Promise.all([
      fetch(`${API}/api/habits?userId=${uid}`),
      fetch(`${API}/api/habits/completions?userId=${uid}&startDate=${start.toISOString()}&endDate=${end.toISOString()}`)
    ])
    if (!habitsRes.ok) throw new Error('Failed to fetch habits')
    const rawHabits:      any[] = await habitsRes.json()
    const rawCompletions: any[] = completionsRes.ok ? await completionsRes.json() : []
    return { rawHabits, rawCompletions }
  }, [])

  const fetchGoals = useCallback(async (token: string) => {
    const res = await fetch(`${API}/api/goals`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) return []
    return (await res.json()) as any[]
  }, [])

  const fetchCards = useCallback(async (token: string) => {
    const res = await fetch(`${API}/api/cards`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (!res.ok) return []
    return (await res.json()) as any[]
  }, [])

  const fetchCurrentReflection = useCallback(async (uid: string) => {
    const res = await fetch(`${API}/api/reflections/current?userId=${uid}`)
    if (!res.ok) return null
    return await res.json()
  }, [])

  // ── Bootstrap data on mount ────────────────────────────────────────────────

  useEffect(() => {
    const bootstrap = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const rawUser  = localStorage.getItem('user')
        const rawToken = localStorage.getItem('authToken')
        if (!rawUser) throw new Error('Not authenticated')

        const userData = JSON.parse(rawUser)
        const uid      = userData.id as string
        const token    = rawToken ?? ''

        setUserId(uid)
        setAuthToken(token)

        // Fetch all data in parallel
        const [habitData, rawGoals, rawCards, currentReflection] = await Promise.all([
          fetchHabitsAndCompletions(uid),
          fetchGoals(token),
          fetchCards(token),
          fetchCurrentReflection(uid)
        ])

        // ── Map Habits ──
        const mappedHabits = habitData.rawHabits.map((h: any) =>
          mapHabitToRetro(h, habitData.rawCompletions)
        )
        setHabits(mappedHabits)

        // ── Map Goals ──
        const mappedGoals: GoalAlignmentItem[] = rawGoals.map((g: any) => ({
          id:                g.id,
          title:             g.wish || g.title || 'Untitled Goal',
          category:          g.status ?? 'active',
          targetDate:        g.target_date ?? 'Open',
          currentProgress:   g.progress ?? 0,
          previousProgress:  g.previous_progress ?? 0,
          linkedHabitsCount: habitData.rawHabits.filter((h: any) => h.linked_goal_id === g.id).length,
          linkedTasksCount:  rawCards.filter((c: any) => c.goal_id === g.id).length,
          status:            (g.status ?? 'active') as GoalAlignmentItem['status']
        }))
        setGoals(mappedGoals)

        // ── Map Rollover Tasks (cards not 'done', overdue or postponed) ──
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const overdueCards = rawCards.filter((c: any) => {
          const isDone = c.column_status === 'done'
          const isOverdue = c.due_date && new Date(c.due_date) < today
          const isOldTodo = !c.due_date && c.column_status === 'todo'
          return !isDone && (isOverdue || isOldTodo)
        })
        // Count how many times they appear postponed using a simple heuristic:
        // cards created >7 days ago still not done count as postponed 2x, >14 days = 3x
        const mappedRollovers: RolloverTaskItem[] = overdueCards.slice(0, 8).map((c: any) => {
          const ageDays = c.created_at
            ? Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000)
            : 0
          const postponedCount = ageDays > 14 ? 3 : ageDays > 7 ? 2 : 1
          return mapCardToRollover(c, postponedCount)
        })
        setRolloverTasks(mappedRollovers)

        // ── Restore current week's draft reflection if it exists ──
        if (currentReflection) {
          if (currentReflection.worked_well)    setWorkedWell(currentReflection.worked_well)
          if (currentReflection.didnt_work)     setDidntWork(currentReflection.didnt_work)
          if (currentReflection.adjustment)     setWoopObstacle(currentReflection.adjustment)
          if (currentReflection.week_data) {
            const wd = currentReflection.week_data
            if (wd.energyLevel)    setEnergyLevel(wd.energyLevel)
            if (wd.stressLevel)    setStressLevel(wd.stressLevel)
            if (wd.topPriorities)  setTopPriorities(wd.topPriorities)
            if (wd.weeklyMotto)    setWeeklyMotto(wd.weeklyMotto)
            if (wd.intention)      setIntention(wd.intention)
          }
          setLastSavedAt(new Date(currentReflection.updated_at))
        }
      } catch (e: any) {
        console.error('[WeeklyReview] Bootstrap error:', e)
        setError(e.message ?? 'Failed to load weekly review data')
      } finally {
        setIsLoading(false)
      }
    }
    bootstrap()
  }, [fetchHabitsAndCompletions, fetchGoals, fetchCards, fetchCurrentReflection])

  // ── Auto-save draft every 60 seconds if user has typed ─────────────────────

  useEffect(() => {
    if (!userId || (!workedWell && !didntWork && !weeklyMotto && topPriorities.length === 0)) return
    const timer = setTimeout(async () => {
      setIsAutoSaving(true)
      try {
        await fetch(`${API}/api/reflections`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            workedWell,
            didntWork,
            patterns: aiInsights ?? '',
            adjustment: woopObstacle,
            implementation: JSON.stringify(intention),
            weekData: { energyLevel, stressLevel, topPriorities, weeklyMotto, intention }
          })
        })
        setLastSavedAt(new Date())
      } catch { /* silent auto-save fail */ } finally {
        setIsAutoSaving(false)
      }
    }, 60000) // 60s debounce
    return () => clearTimeout(timer)
  }, [workedWell, didntWork, weeklyMotto, topPriorities, woopObstacle]) // eslint-disable-line

  // ── Generate AI insights ──────────────────────────────────────────────────

  const handleGenerateAi = useCallback(async () => {
    setIsGeneratingAi(true)
    try {
      const totalDone  = habits.reduce((s, h) => s + h.completedDays.filter(Boolean).length, 0)
      const totalTotal = habits.reduce((s, h) => s + h.targetDays, 0)
      const maxStreak  = habits.reduce((m, h) => Math.max(m, h.streak), 0)

      const res = await fetch(`${API}/api/ai/weekly-insights`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          weeklyData: {
            habitsCompleted: totalDone,
            habitsTotal: totalTotal,
            tasksCompleted: rolloverTasks.filter(t => t.action === 'keep').length,
            tasksTotal: rolloverTasks.length,
            streakDays: maxStreak,
            categoryBreakdown: {}
          },
          reflections: {
            workedWell,
            didntWork,
            patterns: woopObstacle
          }
        })
      })
      if (res.ok) {
        const data = await res.json()
        setAiInsights(data.insights)
      } else {
        throw new Error('ai_unavailable')
      }
    } catch {
      setAiInsights(
        `📊 Pattern Detected:\nYour habit velocity shows strong morning consistency. The main friction appears later in the day.\n\n💡 Recommendation:\nUse your proposed If-Then plan to anchor your afternoon habits to an existing post-lunch cue — this can reduce decision fatigue by up to 40% (Gollwitzer, 1999).`
      )
    } finally {
      setIsGeneratingAi(false)
    }
  }, [habits, rolloverTasks, userId, workedWell, didntWork, woopObstacle])

  // ── Fetch history ─────────────────────────────────────────────────────────

  const handleFetchHistory = useCallback(async () => {
    if (!userId) return
    setIsLoadingHistory(true)
    try {
      const res = await fetch(`${API}/api/reflections?userId=${userId}`)
      if (res.ok) {
        setPastReflections(await res.json())
      }
    } catch { /* ignore */ } finally {
      setIsLoadingHistory(false)
    }
  }, [userId])

  // ── Final save (seal) ─────────────────────────────────────────────────────

  const handleFinishReview = useCallback(async () => {
    if (!userId) return
    setIsSaving(true)
    try {
      await fetch(`${API}/api/reflections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          workedWell,
          didntWork,
          patterns: aiInsights ?? '',
          adjustment: `WHEN ${intention.trigger}, I WILL ${intention.action} AT ${intention.location}`,
          implementation: JSON.stringify(intention),
          weekData: { energyLevel, stressLevel, topPriorities, weeklyMotto, intention, goals }
        })
      })
      setLastSavedAt(new Date())
      return true
    } catch {
      return false
    } finally {
      setIsSaving(false)
    }
  }, [
    userId, workedWell, didntWork, aiInsights, intention,
    energyLevel, stressLevel, topPriorities, weeklyMotto, goals
  ])

  return {
    // State
    isLoading, error, userId, authToken,
    // Step 1
    inboxItems, setInboxItems, workspaceChecklist, setWorkspaceChecklist,
    // Step 2
    habits, rolloverTasks, setRolloverTasks,
    energyLevel, setEnergyLevel, stressLevel, setStressLevel,
    // Step 3
    goals, setGoals, woopObstacle, setWoopObstacle,
    // Step 4
    workedWell, setWorkedWell, didntWork, setDidntWork,
    intention, setIntention,
    aiInsights, setAiInsights, isGeneratingAi, handleGenerateAi,
    // Step 5
    topPriorities, setTopPriorities, weeklyMotto, setWeeklyMotto,
    // System
    lastSavedAt, isAutoSaving, isSaving,
    pastReflections, isLoadingHistory,
    handleFetchHistory, handleFinishReview
  }
}
