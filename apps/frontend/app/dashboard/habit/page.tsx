'use client'

import { useState, useEffect } from 'react'

export default function HabitPage() {
  const [selectedMode, setSelectedMode] = useState('work')
  const [showAddHabitModal, setShowAddHabitModal] = useState(false)
  const [showViewAllHabitsModal, setShowViewAllHabitsModal] = useState(false)
  const [selectedHabitTab, setSelectedHabitTab] = useState('overview')
  
  // Live data states
  const [todayHabits, setTodayHabits] = useState<any[]>([])
  const [habitStats, setHabitStats] = useState<any>(null)
  const [streakDays, setStreakDays] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>('')

  // View-all modal state (list + detail picker, all live)
  const [allHabits, setAllHabits] = useState<any[]>([])
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null)
  const [selectedHabitDetail, setSelectedHabitDetail] = useState<any>(null)
  const [selectedHabitCalendar, setSelectedHabitCalendar] = useState<any[]>([])
  const [detailLoading, setDetailLoading] = useState(false)
  // Edit-tab form state, seeded from the selected habit
  const [editName, setEditName] = useState('')
  const [editAnchorRoutine, setEditAnchorRoutine] = useState('')
  const [editBehavior, setEditBehavior] = useState('')
  const [editReward, setEditReward] = useState('')
  const [editFriction, setEditFriction] = useState('')
  const [editLocation, setEditLocation] = useState('')
  const [editCategory, setEditCategory] = useState('health')
  const [editTargetDays, setEditTargetDays] = useState('')
  const [editReminderTime, setEditReminderTime] = useState('')
  const [editReminderTone, setEditReminderTone] = useState('gentle')
  const [editScheduledDays, setEditScheduledDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7])
  const [isSaving, setIsSaving] = useState(false)
  const [isPausing, setIsPausing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [checkingHabitId, setCheckingHabitId] = useState<string | null>(null)
  
  // Add habit form states
  const [habitName, setHabitName] = useState('')
  const [selectedIcon, setSelectedIcon] = useState('sparkles')
  const [selectedColor, setSelectedColor] = useState('var(--primary)')
  const [selectedCategory, setSelectedCategory] = useState('health')
  const [selectedFrequency, setSelectedFrequency] = useState('daily')
  const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5, 6, 7])
  const [reminderTime, setReminderTime] = useState('21:30')
  const [reminderTone, setReminderTone] = useState('gentle')
  const [anchorRoutine, setAnchorRoutine] = useState('')
  const [linkToGoal, setLinkToGoal] = useState(false)
  const [visibleToTeam, setVisibleToTeam] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  
  // New multi-step form states
  const [formStep, setFormStep] = useState(0)
  // Trigger (cue) — one of six types, each with its own input(s).
  const [cueType, setCueType] = useState<'routine'|'time'|'window'|'place'|'event'|'custom'>('routine')
  const [routinePreset, setRoutinePreset] = useState('')        // one of ROUTINE_PRESETS, or '' for custom
  const [customRoutine, setCustomRoutine] = useState('')         // free text under the routine type
  const [cueTime, setCueTime] = useState('')                    // single time (HH:MM) for the time type
  const [cueTimeStart, setCueTimeStart] = useState('')          // window start (HH:MM)
  const [cueTimeEnd, setCueTimeEnd] = useState('')              // window end (HH:MM)
  const [cuePlace, setCuePlace] = useState('')
  const [cueEvent, setCueEvent] = useState('')
  const [cueCustom, setCueCustom] = useState('')
  const [location, setLocation] = useState('')
  const [behavior, setBehavior] = useState('')
  const [reward, setReward] = useState('')
  const [friction, setFriction] = useState('')

  // AI parse states
  const [aiInput, setAiInput] = useState('')
  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState('')
  const [followUpQuestion, setFollowUpQuestion] = useState('')
  const [deferredNote, setDeferredNote] = useState('')
  const [confirmedFields, setConfirmedFields] = useState({ cue: false, reward: false, friction: false })
  const [isAiParsed, setIsAiParsed] = useState(false)

  // Commitment duration + AI evaluation
  const [durationMode, setDurationMode] = useState<'none' | 'preset' | 'custom'>('none')
  const [durationDays, setDurationDays] = useState<number | null>(null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [durationEval, setDurationEval] = useState<any>(null)
  const [dismissedEval, setDismissedEval] = useState(false)

  const DURATION_PRESETS = [
    { days: 7, hint: '' },
    { days: 21, hint: 'Classic' },
    { days: 30, hint: 'Month' },
    { days: 66, hint: 'Lally median' },
    { days: 90, hint: 'Quarter' },
    { days: 180, hint: '6 months' },
    { days: 365, hint: '1 year' },
  ]

  // Preset routines for the "routine" trigger type (the old CUE_PRESETS minus "Custom trigger").
  const ROUTINE_PRESETS = [
    "Right after I wake up",
    "Right after I brush my teeth",
    "Right before I sit down to eat",
    "Right when I get into bed",
  ]

  // The six trigger types the user can choose between on Step 2.
  const TRIGGER_TYPES = [
    { id: 'routine', label: 'After a routine', hint: 'an existing daily action' },
    { id: 'time',    label: 'At a time',       hint: 'a single clock time' },
    { id: 'window',  label: 'During a window', hint: 'from one time to another' },
    { id: 'place',   label: 'At a place',      hint: 'a specific location' },
    { id: 'event',   label: 'After an event',  hint: 'something that happens' },
    { id: 'custom',  label: 'Custom',          hint: 'describe it yourself' },
  ] as const
  
  const TEMPLATES = [
    { name: "Drink a glass of water", icon: "droplet", cue: "Right after I wake up", behavior: "drink one full glass of water", reward: "Cross off today's tally — first win of the day", friction: "Leave a filled glass on the nightstand the night before" },
    { name: "Read before bed", icon: "book", cue: "Right when I get into bed", behavior: "read 10 pages", reward: "Feel the day properly close", friction: "Put the book on the pillow, phone charges in the kitchen" },
    { name: "Stretch", icon: "dumbbell", cue: "Right after I brush my teeth", behavior: "do 5 minutes of stretching", reward: "Notice the tension leave your shoulders", friction: "Keep a mat unrolled next to the sink" },
    { name: "Wind down", icon: "moon", cue: "Right when I get into bed", behavior: "write down tomorrow's top 3 priorities", reward: "Fall asleep without the mental list running", friction: "Keep a notepad and pen on the nightstand, not the phone" },
  ]

  const modes = [
    { id: 'work', label: 'Work Mode' },
    { id: 'study', label: 'Study Mode' },
    { id: 'personal', label: 'Personal Mode' },
    { id: 'health', label: 'Health Mode' },
  ]

  // Fetch live data
  useEffect(() => {
    const user = localStorage.getItem('user')
    if (user) {
      const userData = JSON.parse(user)
      setUserId(userData.id)
      setUserName(userData.user_metadata?.full_name || userData.email?.split('@')[0] || 'User')
      fetchHabitData(userData.id)
    }
  }, [])

  const fetchHabitData = async (uid: string) => {
    try {
      setLoading(true)
      
      // Fetch today's habits
      const todayResponse = await fetch(`http://localhost:3001/api/habits/today?userId=${uid}`)
      const todayData = await todayResponse.json()
      
      // Transform today's habits to match the expected format
      const transformedHabits = Array.isArray(todayData) ? todayData.map((habit: any) => ({
        id: habit.id,
        title: habit.name,
        time: habit.reminder_time ? `${habit.reminder_time} · ${habit.frequency}` : `${habit.frequency}`,
        reminderTime: habit.reminder_time || null,
        done: habit.completedToday,
        skipped: habit.completionStatus === 'skipped',
        completedAt: habit.completedAt || null,
        color: habit.color || 'var(--primary-tint)',
        iconColor: habit.color || 'var(--primary-dark)'
      })) : []
      setTodayHabits(transformedHabits)

      // Fetch habit statistics
      const statsResponse = await fetch(`http://localhost:3001/api/habits/stats?userId=${uid}`)
      const statsData = await statsResponse.json()
      setHabitStats(statsData)

      // Build the month water-fill grid from real completion data.
      // Each day is a "container": its fill height (0–100%) equals the share
      // of habits scheduled for that weekday that were completed
      // (done = 1, partial = 0.5, skipped/missed = 0). The denominator comes
      // from the user's active habits and their scheduled_days, so the level
      // reflects true progress (1 of 3 done ≈ 33%) instead of fixed steps.
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const todayDate = now.getDate()

      const monthStart = new Date(year, month, 1)
      monthStart.setHours(0, 0, 0, 0)
      const monthEnd = new Date(year, month, daysInMonth)
      monthEnd.setHours(23, 59, 59, 999)

      const [habitsRes, completionsResponse] = await Promise.all([
        fetch(`http://localhost:3001/api/habits?userId=${uid}`),
        fetch(
          `http://localhost:3001/api/habits/completions?userId=${uid}&startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`
        ),
      ])
      const habitsData = await habitsRes.json()
      const activeHabits: any[] = Array.isArray(habitsData) ? habitsData : []
      const completionsData = await completionsResponse.json()

      // Best status per (day, habit): done > partial > skipped.
      const rank: Record<string, number> = { done: 3, partial: 2, skipped: 1 }
      const bestStatus = new Map<string, string>()
      for (const c of Array.isArray(completionsData) ? completionsData : []) {
        const cDate = new Date(c.completed_at)
        if (cDate.getFullYear() !== year || cDate.getMonth() !== month) continue
        const key = `${cDate.getDate()}__${c.habit_id}`
        const prev = bestStatus.get(key)
        if (!prev || (rank[c.status] || 0) > (rank[prev] || 0)) {
          bestStatus.set(key, c.status)
        }
      }

      const generatedStreakDays = []
      for (let d = 1; d <= daysInMonth; d++) {
        const cellDate = new Date(year, month, d)
        const jsDay = cellDate.getDay()            // 0=Sun..6=Sat
        const isoDay = jsDay === 0 ? 7 : jsDay      // 1=Mon..7=Sun (matches scheduled_days)
        // Which of the user's active habits are due on this weekday?
        const dueHabits = activeHabits.filter((h: any) => {
          const sd = Array.isArray(h.scheduled_days) ? h.scheduled_days : [1, 2, 3, 4, 5, 6, 7]
          return sd.includes(isoDay)
        })
        const scheduledCount = dueHabits.length
        let doneCount = 0
        let partialCount = 0
        for (const h of dueHabits) {
          const s = bestStatus.get(`${d}__${h.id}`)
          if (s === 'done') doneCount += 1
          else if (s === 'partial') partialCount += 1
        }
        const doneWeight = doneCount + partialCount * 0.5
        const percentage = scheduledCount > 0 ? Math.round((doneWeight / scheduledCount) * 100) : 0
        generatedStreakDays.push({
          day: d,
          percentage,
          scheduledCount,
          doneCount,
          partialCount,
          isRestDay: scheduledCount === 0,
          isToday: d === todayDate,
          isFuture: d > todayDate,
        })
      }
      setStreakDays(generatedStreakDays)

    } catch (error) {
      console.error('Error fetching habit data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckHabit = async (habitId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Don't open the detail modal
    if (!userId || checkingHabitId === habitId) return

    const habit = todayHabits.find((h: any) => h.id === habitId)
    if (!habit) return

    // If already done, do nothing (read-only for today's completions)
    if (habit.done) return

    const completedAt = new Date().toISOString()

    // Optimistic update — mark done immediately in UI with timestamp
    setTodayHabits((prev: any[]) =>
      prev.map((h: any) =>
        h.id === habitId ? { ...h, done: true, completedAt } : h
      )
    )
    setCheckingHabitId(habitId)

    try {
      const res = await fetch('http://localhost:3001/api/habits/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitId,
          userId,
          status: 'done',
          notes: null,
        }),
      })
      if (!res.ok) {
        // Revert optimistic update on failure
        setTodayHabits((prev: any[]) =>
          prev.map((h: any) =>
            h.id === habitId ? { ...h, done: false, completedAt: null } : h
          )
        )
        const err = await res.json().catch(() => ({}))
        alert(`Failed to log completion: ${err.error || 'Unknown error'}`)
      } else {
        // Refresh stats and streak grid silently in background
        fetchHabitData(userId)
      }
    } catch (error) {
      console.error('Error logging completion:', error)
      // Revert
      setTodayHabits((prev: any[]) =>
        prev.map((h: any) =>
          h.id === habitId ? { ...h, done: false, completedAt: null } : h
        )
      )
    } finally {
      setCheckingHabitId(null)
    }
  }

  const handleCreateHabit = async () => {
    if (!habitName.trim() || !userId) {
      alert('Please enter a habit name')
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('http://localhost:3001/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          name: habitName,
          category: selectedCategory,
          icon: selectedIcon,
          color: selectedColor,
          frequency: selectedFrequency,
          frequencyValue: selectedFrequency === 'x_per_week' ? 3 : 1,
          scheduledDays: selectedDays,
          reminderTime,
          reminderTone,
          anchorRoutine: effectiveCue,
          cueType,
          cueTimeStart: cueType === 'time' ? cueTime : cueType === 'window' ? cueTimeStart : null,
          cueTimeEnd: cueType === 'window' ? cueTimeEnd : null,
          behavior: behavior,
          reward: reward,
          friction: friction,
          location: location,
          targetDays: durationMode !== 'none' ? durationDays : null,
          startDate: durationMode === 'custom' ? startDate : null,
          endDate: durationMode === 'custom' ? endDate : null,
          visibleToTeam,
          linkedGoalId: linkToGoal ? 'temp-goal-id' : null
        })
      })

      if (response.ok) {
        // Reset form
        resetForm()
        
        // Close modal
        setShowAddHabitModal(false)
        
        // Refresh habit data
        await fetchHabitData(userId)
      } else {
        const error = await response.json()
        alert(`Failed to create habit: ${error.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error creating habit:', error)
      alert('Failed to create habit. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setHabitName('')
    setSelectedIcon('sparkles')
    setSelectedColor('var(--primary)')
    setSelectedCategory('health')
    setSelectedFrequency('daily')
    setSelectedDays([1, 2, 3, 4, 5, 6, 7])
    setReminderTime('21:30')
    setReminderTone('gentle')
    setAnchorRoutine('')
    setLinkToGoal(false)
    setVisibleToTeam(false)
    setFormStep(0)
    setCueType('routine')
    setRoutinePreset('')
    setCustomRoutine('')
    setCueTime('')
    setCueTimeStart('')
    setCueTimeEnd('')
    setCuePlace('')
    setCueEvent('')
    setCueCustom('')
    setLocation('')
    setBehavior('')
    // Reset AI parse state
    setAiInput('')
    setIsParsing(false)
    setParseError('')
    setFollowUpQuestion('')
    setDeferredNote('')
    setConfirmedFields({ cue: false, reward: false, friction: false })
    setIsAiParsed(false)
    // Reset duration state
    setDurationMode('none')
    setDurationDays(null)
    setStartDate('')
    setEndDate('')
    setDurationEval(null)
    setDismissedEval(false)
    setReward('')
    setFriction('')
  }

  // ---------------------------------------------------------------------------
  // View-all modal — list + detail picker
  // ---------------------------------------------------------------------------

  const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const TONE_OPTIONS: { value: string; label: string }[] = [
    { value: 'gentle', label: 'Gentle nudge' },
    { value: 'direct', label: 'Direct' },
    { value: 'silent', label: 'Silent (no reminder)' },
  ]

  // Open the modal, optionally anchored to a specific habit (from a today-row click).
  const openViewAllModal = async (habitId?: string) => {
    setShowViewAllHabitsModal(true)
    setSelectedHabitTab('overview')
    if (!userId) return

    try {
      const res = await fetch(`http://localhost:3001/api/habits?userId=${userId}`)
      const data = await res.json()
      const list = Array.isArray(data) ? data : []
      setAllHabits(list)

      // Prefer the explicitly-requested habit; otherwise the first in the list.
      const initialId = (habitId && list.some(h => h.id === habitId)) ? habitId : (list[0]?.id || null)
      if (initialId) {
        setSelectedHabitId(initialId)
        await fetchHabitDetail(initialId)
      } else {
        setSelectedHabitId(null)
        setSelectedHabitDetail(null)
        setSelectedHabitCalendar([])
      }
    } catch (error) {
      console.error('Error fetching all habits:', error)
    }
  }

  const fetchHabitDetail = async (habitId: string) => {
    setDetailLoading(true)
    try {
      const [detailRes, calRes] = await Promise.all([
        fetch(`http://localhost:3001/api/habits/${habitId}`),
        fetch(`http://localhost:3001/api/habits/${habitId}/calendar?days=28`),
      ])
      const detail = await detailRes.json()
      const calendar = await calRes.json()
      setSelectedHabitDetail(detail)
      setSelectedHabitCalendar(Array.isArray(calendar) ? calendar : [])

      // Seed the edit form from this habit.
      setEditName(detail?.name || '')
      setEditAnchorRoutine(detail?.anchor_routine || '')
      setEditBehavior(detail?.behavior || '')
      setEditReward(detail?.reward || '')
      setEditFriction(detail?.friction || '')
      setEditLocation(detail?.location || '')
      setEditCategory(detail?.category || 'health')
      setEditTargetDays(detail?.target_days ? String(detail.target_days) : '')
      setEditReminderTime(detail?.reminder_time || '')
      setEditReminderTone(detail?.reminder_tone || 'gentle')
      setEditScheduledDays(Array.isArray(detail?.scheduled_days) ? detail.scheduled_days : [1, 2, 3, 4, 5, 6, 7])
    } catch (error) {
      console.error('Error fetching habit detail:', error)
      setSelectedHabitDetail(null)
      setSelectedHabitCalendar([])
    } finally {
      setDetailLoading(false)
    }
  }

  const selectHabit = async (habitId: string) => {
    setSelectedHabitId(habitId)
    setSelectedHabitTab('overview')
    await fetchHabitDetail(habitId)
  }

  const toggleEditDay = (day: number) => {
    setEditScheduledDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort()
    )
  }

  const handleSaveHabit = async () => {
    if (!selectedHabitId || !userId) return
    setIsSaving(true)
    try {
      const res = await fetch(`http://localhost:3001/api/habits/${selectedHabitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName,
          anchorRoutine: editAnchorRoutine,
          behavior: editBehavior,
          reward: editReward,
          friction: editFriction,
          location: editLocation,
          category: editCategory,
          targetDays: editTargetDays ? parseInt(editTargetDays, 10) : null,
          reminderTime: editReminderTime || null,
          reminderTone: editReminderTone,
          scheduledDays: editScheduledDays,
          frequency: editScheduledDays.length === 7 ? 'daily' : 'specific_days',
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(`Failed to save: ${err.error || 'Unknown error'}`)
        return
      }
      // Refresh modal details, habit list, and page-level data.
      await Promise.all([
        fetchHabitDetail(selectedHabitId),
        openViewAllModal(selectedHabitId),
        fetchHabitData(userId)
      ])
      setSelectedHabitTab('overview')
    } catch (error) {
      console.error('Error saving habit:', error)
      alert('Failed to save habit. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePauseHabit = async () => {
    if (!selectedHabitId || !userId) return
    const habit = allHabits.find(h => h.id === selectedHabitId)
    const nextActive = habit ? !habit.is_active : false
    setIsPausing(true)
    try {
      const res = await fetch(`http://localhost:3001/api/habits/${selectedHabitId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(`Failed to update: ${err.error || 'Unknown error'}`)
        return
      }
      await Promise.all([openViewAllModal(selectedHabitId), fetchHabitData(userId)])
    } catch (error) {
      console.error('Error toggling habit pause:', error)
      alert('Failed to update habit. Please try again.')
    } finally {
      setIsPausing(false)
    }
  }

  const confirmDeleteHabit = () => {
    if (!selectedHabitId || !userId) return
    setShowDeleteConfirm(true)
  }

  const handleDeleteHabit = async () => {
    if (!selectedHabitId || !userId) return
    setShowDeleteConfirm(false)
    setIsDeleting(true)
    try {
      const res = await fetch(`http://localhost:3001/api/habits/${selectedHabitId}`, { method: 'DELETE' })
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({}))
        alert(`Failed to delete: ${err.error || 'Unknown error'}`)
        return
      }
      const remaining = allHabits.filter(h => h.id !== selectedHabitId)
      setAllHabits(remaining)
      if (remaining.length > 0) {
        setSelectedHabitId(remaining[0].id)
        await fetchHabitDetail(remaining[0].id)
      } else {
        setShowViewAllHabitsModal(false)
      }
      await fetchHabitData(userId)
    } catch (error) {
      console.error('Error deleting habit:', error)
      alert('Failed to delete habit. Please try again.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Computed view-model for the modal's overview tab — streak computed dynamically per individual habit.
  const habitDetailVM = (() => {
    const streak = selectedHabitDetail?.streak || {}
    const cal = selectedHabitCalendar || []
    const completedDays = cal.filter((c: any) => c.status === 'done').length
    const partialDays = cal.filter((c: any) => c.status === 'partial').length
    const totalCheckIns = completedDays + partialDays
    const consistency = cal.length > 0
      ? Math.round(((completedDays + partialDays * 0.5) / cal.length) * 100)
      : 0

    // Compute actual streak from calendar array (consecutive completed days)
    let streakCount = 0
    for (let i = cal.length - 1; i >= 0; i--) {
      const item = cal[i]
      if (item.status === 'done' || item.status === 'partial') {
        streakCount++
      } else {
        if (i === cal.length - 1 && !item.status) {
          continue
        }
        break
      }
    }

    // Longest streak calculation from calendar runs
    let maxRun = 0
    let currentRun = 0
    for (const item of cal) {
      if (item.status === 'done' || item.status === 'partial') {
        currentRun++
        if (currentRun > maxRun) maxRun = currentRun
      } else {
        currentRun = 0
      }
    }

    const currentStreak = Math.max(streak.current_streak || 0, streakCount)
    const longestStreak = Math.max(streak.longest_streak || 0, maxRun)

    return {
      currentStreak,
      longestStreak,
      consistency,
      totalCheckIns,
      calendar: cal,
      ringOffset: 201 - (201 * Math.min(consistency, 100) / 100),
    }
  })()

  // Build the readable cue phrase from the selected trigger type + its inputs.
  const effectiveCue = (() => {
    switch (cueType) {
      case 'time':    return cueTime ? `it's ${cueTime}` : ''
      case 'window':  return (cueTimeStart && cueTimeEnd) ? `it's between ${cueTimeStart} and ${cueTimeEnd}` : ''
      case 'routine': return (routinePreset || customRoutine).trim()
      case 'place':   return cuePlace.trim() ? `I'm at ${cuePlace.trim()}` : ''
      case 'event':   return cueEvent.trim() ? `I ${cueEvent.trim()}` : ''
      case 'custom':  return cueCustom.trim()
      default:        return ''
    }
  })()
  const sentence = `When ${(effectiveCue || "…").charAt(0).toLowerCase() + (effectiveCue || "…").slice(1)}, I will ${behavior || "…"}.`

  const applyTemplate = (tpl: any) => {
    setHabitName(tpl.name)
    setSelectedIcon(tpl.icon)
    setCueType('routine')
    // Templates all describe an existing routine, so try to match a preset.
    const presetMatch = ROUTINE_PRESETS.find(p => p.toLowerCase() === (tpl.cue || '').toLowerCase())
    if (presetMatch) {
      setRoutinePreset(presetMatch)
      setCustomRoutine('')
    } else {
      setRoutinePreset('')
      setCustomRoutine(tpl.cue || '')
    }
    setBehavior(tpl.behavior)
    setReward(tpl.reward)
    setFriction(tpl.friction)
    setFormStep(1)
  }

  // Heuristic fallback when the AI omits cue.type — maps a readable cue
  // string onto one of our six trigger types. Backward-compat for cached
  // or older AI responses that only returned cue.value.
  const inferCueType = (value: string): typeof cueType => {
    const v = (value || '').toLowerCase()
    if (!v) return 'routine'
    // Explicit clock times like "7am", "07:00", "by 9pm".
    if (/\b\d{1,2}(:\d{2})?\s*[ap]\.?m\.?\b/.test(v) || /\b\d{2}:\d{2}\b/.test(v)) return 'time'
    // Time ranges / parts of day → window.
    if (/\b(between|morning|afternoon|evening|night|noon|lunch|dinner|breakfast|after work|before bed)\b/.test(v)) return 'window'
    // Location cues.
    if (/\b(at|in|on|near)\s+(the\s+)?(desk|kitchen|bed|car|gym|office|bathroom|home|room)\b/.test(v)) return 'place'
    // Existing routine — anything starting with "after", "when", "before", "once".
    if (/^\s*(after|when|before|once|while|as soon as)\b/.test(v)) return 'routine'
    return 'custom'
  }

  const handleAiParse = async () => {
    if (!aiInput.trim()) return
    setIsParsing(true)
    setParseError('')
    setFollowUpQuestion('')

    try {
      // Resolve a day count if the user picked custom dates.
      let payloadDays = durationDays
      if (durationMode === 'custom' && startDate && endDate) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        const diff = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
        if (!isNaN(diff) && diff >= 0) payloadDays = diff + 1 // inclusive
      }

      const response = await fetch('http://localhost:3001/api/ai/parse-habit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: aiInput.trim(),
          durationDays: payloadDays,
          startDate: durationMode === 'custom' ? startDate : undefined,
          endDate: durationMode === 'custom' ? endDate : undefined,
        }),
      })
      const result = await response.json()

      if (!response.ok || result.error) {
        throw new Error(result.error || 'Parse failed')
      }

      if (result.status === 'too_vague') {
        setFollowUpQuestion(result.follow_up_question || 'Could you describe a more specific action?')
        return
      }

      // status === "parsed" — auto-fill form
      setIsAiParsed(true)
      if (result.name) setHabitName(result.name)
      if (result.behavior) setBehavior(result.behavior)

      // Cue handling — map the structured AI cue onto our trigger-type state.
      if (result.cue?.value || result.cue?.type) {
        const aiType = result.cue?.type as typeof cueType | undefined
        const aiValue: string = result.cue?.value || ''
        // If the model omitted a type, infer it from the value.
        const resolvedType = aiType || inferCueType(aiValue)
        setCueType(resolvedType)
        // Map AI times onto the right fields per type:
        //  - time   → cueTime (single)
        //  - window → cueTimeStart + cueTimeEnd
        if (resolvedType === 'time') {
          setCueTime(result.cue?.time_start || '')
        } else if (resolvedType === 'window') {
          setCueTimeStart(result.cue?.time_start || '')
          setCueTimeEnd(result.cue?.time_end || '')
        }
        if (resolvedType === 'routine') {
          const presetMatch = ROUTINE_PRESETS.find(p => p.toLowerCase() === aiValue.toLowerCase())
          if (presetMatch) {
            setRoutinePreset(presetMatch)
            setCustomRoutine('')
          } else {
            setRoutinePreset('')
            setCustomRoutine(aiValue)
          }
        }
        if (resolvedType === 'place')   setCuePlace(aiValue)
        if (resolvedType === 'event')   setCueEvent(aiValue)
        if (resolvedType === 'custom')  setCueCustom(aiValue)
      }
      if (result.location) setLocation(result.location)
      if (result.reward?.value) setReward(result.reward.value)
      if (result.friction?.value) setFriction(result.friction.value)

      // Set confirmation flags
      setConfirmedFields({
        cue: !(result.cue?.needs_confirmation),
        reward: !(result.reward?.needs_confirmation),
        friction: !(result.friction?.needs_confirmation),
      })

      // Duration evaluation
      if (result.duration_evaluation) {
        setDurationEval(result.duration_evaluation)
        setDismissedEval(false)
      }

      // Deferred note
      if (result.deferred_note) {
        setDeferredNote(result.deferred_note)
      }

      setFormStep(1)
    } catch (error) {
      console.error('AI parse error:', error)
      setParseError("Couldn't parse that — try rephrasing or fill the form manually")
    } finally {
      setIsParsing(false)
    }
  }

  const confirmField = (field: 'cue' | 'reward' | 'friction') => {
    setConfirmedFields(prev => ({ ...prev, [field]: true }))
  }

  const steps = ["Basics", "Trigger", "Reward & friction", "Confirm"]
  const needsManualFallback = !!parseError
  const allConfirmed = confirmedFields.cue && confirmedFields.reward && confirmedFields.friction
  const canAdvance = formStep === 0
    ? (isAiParsed || needsManualFallback) && habitName.trim() && behavior.trim()
    : formStep === 1
      ? !!effectiveCue && (isAiParsed ? confirmedFields.cue : true)
      : formStep === 2
        ? isAiParsed ? allConfirmed : true
        : true

  // Duration evaluation banner — rendered at the top of steps 1-3 once the
  // AI has evaluated the user's commitment period. Dismissible per session.
  const showDurationEval = durationEval && !dismissedEval
  const durationAssessment = durationEval?.assessment || 'appropriate'
  const durationEvalBanner = showDurationEval ? (
    <div className={`habit-duration-eval habit-duration-eval--${durationAssessment}`}>
      <div className="habit-duration-eval-icon">
        {durationAssessment === 'too_short' ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: '15px', height: '15px'}}>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        ) : durationAssessment === 'generous' ? (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: '15px', height: '15px'}}>
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: '15px', height: '15px'}}>
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        )}
      </div>
      <div className="habit-duration-eval-body">
        <div className="habit-duration-eval-headline">
          {durationAssessment === 'too_short' && durationEval.user_chosen
            ? `${durationEval.user_chosen} days is short for this habit. `
            : durationAssessment === 'appropriate' && durationEval.user_chosen
              ? `${durationEval.user_chosen} days is well-suited. `
              : durationAssessment === 'generous' && durationEval.user_chosen
                ? `${durationEval.user_chosen} days is generous. `
                : null}
          {durationEval.rationale}
          {durationEval.recommended_days && durationEval.recommended_days !== durationEval.user_chosen && (
            <> Recommended: <strong>{durationEval.recommended_days} days</strong>.</>
          )}
        </div>
        {durationEval.milestone_note && (
          <div className="habit-duration-eval-milestone">{durationEval.milestone_note}</div>
        )}
      </div>
      <button
        type="button"
        className="habit-duration-eval-dismiss"
        onClick={() => setDismissedEval(true)}
        aria-label="Dismiss"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: '14px', height: '14px'}}>
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  ) : null

  // Routine phase filtering & focal habit selection
  const [timeFilter, setTimeFilter] = useState<'all' | 'morning' | 'afternoon' | 'evening'>('all')

  const getFilteredTodayHabits = () => {
    if (timeFilter === 'all') return todayHabits
    return todayHabits.filter((h: any) => {
      const t = (h.time || '').toLowerCase()
      const title = (h.title || '').toLowerCase()
      if (timeFilter === 'morning') {
        return t.includes('am') || title.includes('morning') || title.includes('wake') || title.includes('coffee') || title.includes('breakfast')
      }
      if (timeFilter === 'afternoon') {
        return (t.includes('pm') && !t.includes('18:') && !t.includes('19:') && !t.includes('20:') && !t.includes('21:') && !t.includes('22:')) || title.includes('afternoon') || title.includes('lunch') || title.includes('work')
      }
      if (timeFilter === 'evening') {
        return t.includes('pm') || title.includes('night') || title.includes('evening') || title.includes('bed') || title.includes('dinner')
      }
      return true
    })
  }

  const focalHabit = (() => {
    if (todayHabits.length === 0) return null
    
    // Sort today's habits by reminder time chronologically (nulls last)
    const sorted = [...todayHabits].sort((a, b) => {
      if (!a.reminderTime) return 1
      if (!b.reminderTime) return -1
      return a.reminderTime.localeCompare(b.reminderTime)
    })

    const activeHabits = sorted.filter((h: any) => !h.done)
    if (activeHabits.length === 0) {
      // Fallback: if all done, just return the first habit
      return todayHabits[0] || null
    }

    const now = new Date()
    const currentStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

    // Find the next upcoming one (reminderTime >= current time)
    const upcoming = activeHabits.find((h: any) => {
      if (!h.reminderTime) return false
      return h.reminderTime >= currentStr
    })

    // If there is an upcoming one, return it. Otherwise return the first active one (earliest in past)
    return upcoming || activeHabits[0] || null
  })()

  return (
    <div className="screen active">
      <div className="screen" style={{ display: 'block', paddingTop: 0 }}>
        <div className="habit-page-redesign">
          {/* Header & Science Banner */}
          <div className="habit-header-banner">
            <div className="habit-hb-left">
              <div className="habit-hb-greeting">
                <span className="habit-hb-badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '13px', height: '13px' }}>
                    <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
                  </svg>
                  BEHAVIORAL MOMENTUM
                </span>
                <h1 className="habit-hb-title">Welcome back, {userName || 'Friend'}</h1>
                <p className="habit-hb-subtitle">
                  Behavior change happens by anchoring tiny actions to existing cues. Protect your chain today.
                </p>
              </div>
            </div>

            <div className="habit-hb-actions">
              <button className="habit-btn-primary-lg" onClick={() => setShowAddHabitModal(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span>New Habit Stack</span>
              </button>
              <button className="habit-btn-secondary-lg" onClick={() => openViewAllModal()}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="3" width="7" height="7" rx="1.5" />
                  <rect x="14" y="14" width="7" height="7" rx="1.5" />
                  <rect x="3" y="14" width="7" height="7" rx="1.5" />
                </svg>
                <span>Manage Habits</span>
              </button>
            </div>
          </div>

          {/* Behavioral Psychology Science Metrics Bar */}
          <div className="habit-metrics-bar">
            {/* Metric 1: Momentum Score */}
            <div className="habit-metric-card">
              <div className="habit-mc-header">
                <div className="habit-mc-icon habit-mc-icon--primary">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 3" />
                  </svg>
                </div>
                <span className="habit-mc-tag">30-Day Index</span>
              </div>
              <div className="habit-mc-val">{habitStats?.consistencyRate || 0}%</div>
              <div className="habit-mc-label">Momentum Score</div>
              <div className="habit-mc-progress">
                <div
                  className="habit-mc-bar"
                  style={{ width: `${Math.min(habitStats?.consistencyRate || 0, 100)}%` }}
                />
              </div>
            </div>

            {/* Metric 2: "Never Miss Twice" Safety Shield */}
            <div className="habit-metric-card habit-metric-card--shield">
              <div className="habit-mc-header">
                <div className="habit-mc-icon habit-mc-icon--accent">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <span className="habit-mc-tag habit-mc-tag--accent">Never Miss Twice</span>
              </div>
              <div className="habit-mc-val">
                {todayHabits.filter((h: any) => !h.done).length} <span className="habit-mc-unit">pending</span>
              </div>
              <div className="habit-mc-label">
                {todayHabits.filter((h: any) => !h.done).length === 0
                  ? 'All habits complete — loop protected!'
                  : 'Complete today to maintain neural strength'}
              </div>
              <div className="habit-mc-subtext">
                Missing 1 day has 0% effect on long-term habit formation.
              </div>
            </div>

            {/* Metric 3: Active Streak */}
            <div className="habit-metric-card">
              <div className="habit-mc-header">
                <div className="habit-mc-icon habit-mc-icon--amber">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M13 2L4 14h7l-1 8 9-12h-7z" />
                  </svg>
                </div>
                <span className="habit-mc-tag">Active Run</span>
              </div>
              <div className="habit-mc-val">{habitStats?.currentStreak || 0} <span className="habit-mc-unit">days</span></div>
              <div className="habit-mc-label">Current Streak</div>
              <div className="habit-mc-subtext">
                Longest record: <strong>{habitStats?.longestStreak || 0} days</strong>
              </div>
            </div>

            {/* Metric 4: Total Check-Ins */}
            <div className="habit-metric-card">
              <div className="habit-mc-header">
                <div className="habit-mc-icon habit-mc-icon--indigo">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <span className="habit-mc-tag">Repetitions</span>
              </div>
              <div className="habit-mc-val">{habitStats?.totalCheckIns || 0}</div>
              <div className="habit-mc-label">Total Repetitions</div>
              <div className="habit-mc-subtext">
                {habitStats?.totalCheckIns >= 66 ? 'Automaticity threshold unlocked' : 'Building automaticity pathway'}
              </div>
            </div>
          </div>

          {/* Focal Habit Hero Card */}
          {focalHabit && (
            <div className={`habit-focus-hero ${focalHabit.done ? 'habit-focus-hero--done' : ''}`}>
              <div className="habit-fh-content">
                <div className="habit-fh-badge-row">
                  <span className="habit-fh-kicker">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '12px', height: '12px' }}>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    {focalHabit.done ? 'COMPLETED TODAY' : 'PRIMARY FOCUS NOW'}
                  </span>
                  <span className="habit-fh-time">{focalHabit.time}</span>
                </div>

                <div className="habit-fh-formula">
                  <span className="habit-fh-if">WHEN CUE FIRES:</span>
                  <h2 className="habit-fh-statement">{focalHabit.title}</h2>
                </div>

                <div className="habit-fh-footer">
                  <div className="habit-fh-identity">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '15px', height: '15px' }}>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Identity: <strong>Consistent & Focused Builder</strong></span>
                  </div>

                  <div className="habit-fh-cta-wrap">
                    <button
                      type="button"
                      className={`habit-fh-check-btn ${focalHabit.done ? 'checked' : ''}`}
                      onClick={(e) => handleCheckHabit(focalHabit.id, e)}
                      disabled={focalHabit.done || checkingHabitId === focalHabit.id}
                    >
                      {focalHabit.done ? (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: '18px', height: '18px' }}>
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                          <span>Habit Checked Off!</span>
                        </>
                      ) : (
                        <>
                          <div className="habit-fh-btn-dot" />
                          <span>Check In Now</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Bento Section: Habits List (Left 65%) + Insights & Tools (Right 35%) */}
          <div className="habit-bento-grid">
            {/* Left Column: Routine Phase Filter + Today's Habits */}
            <div className="habit-bento-left">
              <div className="habit-card habit-bento-card">
                <div className="habit-bc-header">
                  <div>
                    <h2 className="habit-bc-title">Daily Habit Stacks</h2>
                    <p className="habit-bc-desc">
                      {todayHabits.filter((h: any) => h.done).length} of {todayHabits.length} habits completed today
                    </p>
                  </div>

                  {/* Routine Phase Filters */}
                  <div className="habit-routine-filters">
                    {(['all', 'morning', 'afternoon', 'evening'] as const).map((filterKey) => (
                      <button
                        key={filterKey}
                        type="button"
                        className={`habit-rf-btn ${timeFilter === filterKey ? 'active' : ''}`}
                        onClick={() => setTimeFilter(filterKey)}
                      >
                        {filterKey === 'all' && 'All Routine'}
                        {filterKey === 'morning' && 'Morning'}
                        {filterKey === 'afternoon' && 'Afternoon'}
                        {filterKey === 'evening' && 'Evening'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Habit Items List */}
                <div className="habit-stack-list">
                  {getFilteredTodayHabits().length === 0 ? (
                    <div className="habit-empty-state">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: '32px', height: '32px', color: 'var(--muted)' }}>
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <p>No habits scheduled for this routine phase.</p>
                      <button className="habit-btn-add-sm" onClick={() => setShowAddHabitModal(true)}>
                        + Add Habit Stack
                      </button>
                    </div>
                  ) : (
                    getFilteredTodayHabits().map((habit: any) => {
                      const completedTimeStr = habit.completedAt
                        ? new Date(habit.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : null

                      return (
                        <div
                          key={habit.id}
                          className={`habit-row-item ${habit.done ? 'habit-row-item--done' : ''} ${habit.skipped ? 'habit-row-item--skipped' : ''}`}
                          onClick={() => openViewAllModal(habit.id)}
                        >
                          <button
                            type="button"
                            className={`habit-row-check ${habit.done ? 'checked' : ''}`}
                            onClick={(e) => handleCheckHabit(habit.id, e)}
                            disabled={habit.done || checkingHabitId === habit.id}
                            title={habit.done ? `Completed at ${completedTimeStr}` : 'Complete habit'}
                          >
                            {habit.done ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: '14px', height: '14px' }}>
                                <path d="M20 6L9 17l-5-5" />
                              </svg>
                            ) : (
                              <span className="habit-row-check-inner" />
                            )}
                          </button>

                          <div className="habit-row-info">
                            <div className="habit-row-title-wrap">
                              <span className="habit-row-title">{habit.title}</span>
                              {habit.done && (
                                <span className="habit-row-done-tag">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: '12px', height: '12px' }}>
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                  {completedTimeStr ? `Logged at ${completedTimeStr}` : 'Done'}
                                </span>
                              )}
                            </div>
                            <div className="habit-row-meta">
                              <span className="habit-row-time">{habit.time}</span>
                              <span className="habit-row-dot">•</span>
                              <span className="habit-row-hint">Anchor routine cue linked</span>
                            </div>
                          </div>

                          <div className="habit-row-arrow">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '14px', height: '14px' }}>
                              <path d="M9 18l6-6-6-6" />
                            </svg>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* 28-Day Consistency Matrix — water-fill containers */}
              <div className="habit-card habit-bento-card" style={{ marginTop: '16px' }}>
                <div className="habit-bc-header">
                  <div>
                    <h2 className="habit-bc-title">28-Day Heatmap & Consistency</h2>
                    <p className="habit-bc-desc">Each day fills like a glass of water — height shows the share of scheduled habits you completed.</p>
                  </div>
                  <span className="habit-matrix-badge">Current Month</span>
                </div>

                <div className="habit-matrix-grid">
                  {streakDays.map((day, idx) => {
                    const hasWater = day.percentage > 0
                    return (
                      <div
                        key={idx}
                        className={[
                          'habit-water-cell',
                          day.isToday ? 'habit-water-cell--today' : '',
                          day.isFuture ? 'habit-water-cell--future' : '',
                          day.isRestDay ? 'habit-water-cell--rest' : '',
                          hasWater ? 'habit-water-cell--filled' : '',
                        ].join(' ').trim()}
                        title={
                          day.isFuture
                            ? `Day ${day.day} · upcoming`
                            : day.isRestDay
                              ? `Day ${day.day} · rest day (nothing scheduled)`
                              : `Day ${day.day} · ${day.doneCount}/${day.scheduledCount} done${day.partialCount ? ` · ${day.partialCount} partial` : ''} (${day.percentage}%)`
                        }
                      >
                        <div className="habit-water-cell-body">
                          {hasWater && (
                            <div
                              className="habit-water-cell-fill"
                              style={{ height: `${day.percentage}%`, animationDelay: `${idx * 45}ms` }}
                            >
                              <div className="habit-water-cell-wave" />
                              <div className="habit-water-cell-wave habit-water-cell-wave--back" />
                            </div>
                          )}
                          <span className="habit-water-cell-num">{day.day}</span>
                          {hasWater && (
                            <span className="habit-water-cell-pct">{day.percentage}%</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="habit-water-legend">
                  <span className="habit-water-legend-item">
                    <span className="habit-water-legend-vial" style={{ '--fill': '100%' } as React.CSSProperties} />
                    All done
                  </span>
                  <span className="habit-water-legend-item">
                    <span className="habit-water-legend-vial" style={{ '--fill': '40%' } as React.CSSProperties} />
                    Partial
                  </span>
                  <span className="habit-water-legend-item">
                    <span className="habit-water-legend-vial habit-water-legend-vial--empty" />
                    None
                  </span>
                  <span className="habit-water-legend-item">
                    <span className="habit-water-legend-vial habit-water-legend-vial--rest" />
                    Rest day
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: AI Coach Insight, Focus Timer, Evidence Notes */}
            <div className="habit-bento-right">
              {/* Coach Insight Widget */}
              <div className="habit-card habit-coach-card">
                <div className="habit-cc-header">
                  <div className="habit-cc-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
                      <circle cx="12" cy="12" r="2" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="habit-cc-title">Behavioral Coach</h3>
                    <span className="habit-cc-sub">Evidence-Based Nudge</span>
                  </div>
                </div>

                <p className="habit-cc-msg">
                  {habitStats?.coachInsight || 'Habits become automatic after a median of 66 days. Keep your tiny routines consistent to solidify neural pathways.'}
                </p>

                <div className="habit-cc-footer">
                  <button className="habit-cc-btn" onClick={() => setShowAddHabitModal(true)}>
                    <span>+ Add AI Staked Habit</span>
                  </button>
                </div>
              </div>

              {/* Micro Focus Timer Widget */}
              <div className="habit-card habit-timer-card">
                <div className="habit-tc-header">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Micro Focus Session</span>
                </div>
                <div className="habit-tc-digits">20 : 00</div>
                <div className="habit-tc-actions">
                  <button className="habit-tc-btn habit-tc-btn--ghost">Reset</button>
                  <button className="habit-tc-btn habit-tc-btn--solid">Start Focus</button>
                </div>
              </div>

              {/* Evidence-Based Rules Card */}
              <div className="habit-card habit-science-card">
                <div className="habit-sc-header">
                  <div className="habit-sc-icon-wrap">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '18px', height: '18px' }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <div className="habit-sc-title-group">
                    <span className="habit-sc-title">4 Laws of Behavior Change</span>
                    <span className="habit-sc-subtitle">Evidence-based habit formation</span>
                  </div>
                </div>
                <div className="habit-sc-grid">
                  <div className="habit-sc-item">
                    <div className="habit-sc-item-icon habit-sc-item-icon--obvious">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="16" />
                        <line x1="8" y1="12" x2="16" y2="12" />
                      </svg>
                    </div>
                    <div className="habit-sc-item-content">
                      <span className="habit-sc-item-label">Make it Obvious</span>
                      <span className="habit-sc-item-desc">Anchor habits to strong daily triggers</span>
                    </div>
                  </div>
                  <div className="habit-sc-item">
                    <div className="habit-sc-item-icon habit-sc-item-icon--attractive">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </div>
                    <div className="habit-sc-item-content">
                      <span className="habit-sc-item-label">Make it Attractive</span>
                      <span className="habit-sc-item-desc">Pair habits with positive rewards</span>
                    </div>
                  </div>
                  <div className="habit-sc-item">
                    <div className="habit-sc-item-icon habit-sc-item-icon--easy">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                      </svg>
                    </div>
                    <div className="habit-sc-item-content">
                      <span className="habit-sc-item-label">Make it Easy</span>
                      <span className="habit-sc-item-desc">Reduce friction down to 2 minutes</span>
                    </div>
                  </div>
                  <div className="habit-sc-item">
                    <div className="habit-sc-item-icon habit-sc-item-icon--satisfying">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                    </div>
                    <div className="habit-sc-item-content">
                      <span className="habit-sc-item-label">Make it Satisfying</span>
                      <span className="habit-sc-item-desc">Check off immediately for dopamine release</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Habit Modal */}
      {showAddHabitModal && (
        <div className="add-task-form-modal">
          <div 
            className="modal-overlay"
            onClick={() => setShowAddHabitModal(false)}
          />
          <div className="add-task-form">
            <div className="add-task-form-header">
              <h3>Add New Habit</h3>
              <button 
                type="button"
                className="add-task-close"
                onClick={() => setShowAddHabitModal(false)}
                aria-label="Close form"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
            
            <div className="add-task-form-body">
              {/* Redesigned Progress Stepper */}
              <div className="habit-form-progress-new">
                {steps.map((label, i) => {
                  const isActive = i === formStep
                  const isCompleted = i < formStep
                  return (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
                      <div className={`habit-progress-step ${isActive ? 'active' : isCompleted ? 'completed' : ''}`}>
                        <div className="step-num">
                          {isCompleted ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{width: '10px', height: '10px', color: 'currentColor'}}>
                              <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : i + 1}
                        </div>
                        <span className="step-label">{label}</span>
                      </div>
                      {i < steps.length - 1 && (
                        <div className={`step-connector ${isCompleted ? 'completed' : ''}`} />
                      )}
                    </div>
                  )
                })}
              </div>

              {formStep === 0 && (
                <div className="form-group">
                  <div className="habit-scientific-tip">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <span>
                      <strong>The 2-Minute Rule:</strong> Scale down your new habit so it takes less than 2 minutes to do (e.g. <i>"read 1 page"</i>). You must establish the habit before you can improve it.
                    </span>
                  </div>

                  <label htmlFor="habit-ai-input">Describe the habit you want to build</label>
                  <input
                    id="habit-ai-input"
                    type="text"
                    className="form-input habit-ai-input"
                    placeholder="e.g. read 10 pages before bed or stop scrolling my phone at night"
                    value={aiInput}
                    onChange={(e) => {
                      setAiInput(e.target.value)
                      setFollowUpQuestion('')
                      setParseError('')
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAiParse() }}
                  />

                  <div className="habit-duration-section">
                    <div className="habit-duration-label">
                      Commitment period <span className="habit-duration-optional">(optional)</span>
                    </div>

                    <div className="habit-duration-presets-grid">
                      {DURATION_PRESETS.map(p => {
                        const active = durationMode === 'preset' && durationDays === p.days
                        return (
                          <button
                            key={p.days}
                            type="button"
                            className={`habit-duration-preset-btn ${active ? 'active' : ''}`}
                            onClick={() => {
                              if (active) {
                                setDurationMode('none')
                                setDurationDays(null)
                              } else {
                                setDurationMode('preset')
                                setDurationDays(p.days)
                                setStartDate('')
                                setEndDate('')
                              }
                            }}
                            title={p.hint || undefined}
                          >
                            <span className="preset-num">{p.days}</span>
                            <span className="preset-unit">days</span>
                            {p.hint && <span className="preset-badge">{p.hint}</span>}
                          </button>
                        )
                      })}
                    </div>

                    <button
                      type="button"
                      className="habit-duration-mode-toggle"
                      onClick={() => {
                        setDurationMode(durationMode === 'custom' ? 'none' : 'custom')
                        setDurationDays(null)
                        setStartDate('')
                        setEndDate('')
                      }}
                    >
                      {durationMode === 'custom' ? '− Use presets instead' : '+ Use custom start/end dates'}
                    </button>

                    {durationMode === 'custom' && (
                      <div className="habit-duration-dates">
                        <div className="habit-duration-date-field">
                          <label htmlFor="habit-start-date">Start</label>
                          <input
                            id="habit-start-date"
                            type="date"
                            className="form-input"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                          />
                        </div>
                        <div className="habit-duration-date-field">
                          <label htmlFor="habit-end-date">End</label>
                          <input
                            id="habit-end-date"
                            type="date"
                            className="form-input"
                            value={endDate}
                            min={startDate || undefined}
                            onChange={(e) => setEndDate(e.target.value)}
                          />
                        </div>
                      </div>
                    )}

                    {durationMode === 'none' && (
                      <div className="habit-duration-helper">AI will recommend an evidence-based duration.</div>
                    )}
                  </div>

                  <button
                    type="button"
                    className="btn btn-solid habit-parse-btn"
                    disabled={!aiInput.trim() || isParsing}
                    onClick={handleAiParse}
                    style={{ marginTop: 16, opacity: (!aiInput.trim() || isParsing) ? 0.6 : 1, cursor: (!aiInput.trim() || isParsing) ? 'not-allowed' : 'pointer' }}
                  >
                    {isParsing ? (
                      <span className="habit-parse-spinner-wrap">
                        <span className="habit-parse-spinner" />
                        Analysing Habit...
                      </span>
                    ) : 'Generate Habit Strategy'}
                  </button>

                  {followUpQuestion && (
                    <div className="habit-followup">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width: '14px', height: '14px', flexShrink: 0, marginTop: '2px'}}>
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 16v-4M12 8h.01"/>
                      </svg>
                      <span>{followUpQuestion}</span>
                    </div>
                  )}

                  {parseError && (
                    <>
                      <div className="habit-parse-error">{parseError}</div>
                      <div style={{marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16}}>
                        <div className="habit-warn-box" style={{marginBottom: 12}}>Fill in manually instead:</div>
                        <label htmlFor="habit-name">Habit Name *</label>
                        <input
                          id="habit-name"
                          type="text"
                          placeholder="e.g. Read before bed"
                          value={habitName}
                          onChange={(e) => setHabitName(e.target.value)}
                          className="form-input"
                        />
                        <label htmlFor="habit-behavior" style={{marginTop: 16}}>The exact action</label>
                        <textarea
                          id="habit-behavior"
                          placeholder="e.g. read 10 pages"
                          value={behavior}
                          onChange={(e) => setBehavior(e.target.value)}
                          className="form-textarea"
                          rows={2}
                        />
                      </div>
                    </>
                  )}

                  {isAiParsed && (
                    <div style={{ marginTop: 14 }}>
                      <label htmlFor="habit-name-parsed">Habit Name *</label>
                      <input
                        id="habit-name-parsed"
                        type="text"
                        className="form-input"
                        value={habitName}
                        onChange={(e) => setHabitName(e.target.value)}
                        placeholder="e.g. Read before bed"
                      />
                    </div>
                  )}

                  {deferredNote && (
                    <div className="habit-deferred-note">
                      <span>Looks like you mentioned a second habit too — want to add <strong>"{deferredNote}"</strong> separately after this one?</span>
                      <button type="button" className="habit-deferred-dismiss" onClick={() => setDeferredNote('')}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: '14px', height: '14px'}}>
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {formStep === 1 && (
                <div className="form-group">
                  {durationEvalBanner}
                  
                  <div className="habit-scientific-tip">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <span>
                      <strong>Habit Anchoring:</strong> The most effective trigger (cue) is an existing action in your daily routine. Connect your new habit to an established anchor.
                    </span>
                  </div>

                  <label htmlFor="habit-cue">Trigger (when this happens)</label>
                  <div className="habit-card-hint">Pick how you want to be cued. The AI suggestion is pre-selected — switch to any type if it fits better.</div>
                  {isAiParsed && !confirmedFields.cue && (
                    <div className="habit-ai-confirm-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width: '13px', height: '13px'}}>
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                      AI suggested — confirm or edit
                    </div>
                  )}
                  
                  <div className={`habit-ai-confirm-field ${isAiParsed && confirmedFields.cue ? 'habit-ai-confirmed' : ''}`}>
                    {/* Redesigned trigger grid using inline SVGs */}
                    <div className="habit-trigger-grid">
                      {TRIGGER_TYPES.map(t => {
                        const active = cueType === t.id
                        let icon = null
                        if (t.id === 'routine') {
                          icon = (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                            </svg>
                          )
                        } else if (t.id === 'time') {
                          icon = (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                            </svg>
                          )
                        } else if (t.id === 'window') {
                          icon = (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M5 2h14v2H5zM5 22h14v-2H5zM19 4v4.3c0 .6-.3 1.2-.8 1.6L13 14l5.2 4.1c.5.4.8 1 .8 1.6V22M5 4v4.3c0 .6.3 1.2.8 1.6L11 14l-5.2 4.1c-.5.4-.8 1-.8 1.6V22"/>
                            </svg>
                          )
                        } else if (t.id === 'place') {
                          icon = (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                            </svg>
                          )
                        } else if (t.id === 'event') {
                          icon = (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                            </svg>
                          )
                        } else {
                          icon = (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                            </svg>
                          )
                        }

                        return (
                          <button
                            key={t.id}
                            type="button"
                            className={`habit-trigger-card ${active ? 'active' : ''}`}
                            onClick={() => { setCueType(t.id); if (isAiParsed) confirmField('cue') }}
                            title={t.hint}
                          >
                            {icon}
                            <span className="card-label">{t.label}</span>
                            <span className="card-hint">{t.hint}</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Per-type inputs */}
                    {cueType === 'routine' && (
                      <div style={{marginTop: 10}}>
                        {ROUTINE_PRESETS.map(p => {
                          const active = routinePreset === p
                          return (
                            <button
                              key={p}
                              type="button"
                              className={`habit-option-row ${active ? 'habit-option-row-active' : ''}`}
                              onClick={() => { setRoutinePreset(p); setCustomRoutine(''); if (isAiParsed) confirmField('cue') }}
                            >
                              <span style={{ color: active ? 'var(--ink)' : 'var(--ink-soft)', fontWeight: active ? 600 : 400 }}>{p}</span>
                            </button>
                          )
                        })}
                        <button
                          type="button"
                          className={`habit-option-row ${routinePreset === '' && customRoutine.trim() ? 'habit-option-row-active' : ''}`}
                          onClick={() => { setRoutinePreset(''); if (isAiParsed) confirmField('cue') }}
                        >
                          <span style={{ color: routinePreset === '' ? 'var(--ink)' : 'var(--ink-soft)', fontWeight: routinePreset === '' ? 600 : 400 }}>Another routine…</span>
                        </button>
                        {routinePreset === '' && (
                          <input
                            type="text"
                            placeholder="e.g. When I pour my morning coffee"
                            value={customRoutine}
                            onChange={(e) => { setCustomRoutine(e.target.value); if (isAiParsed) confirmField('cue') }}
                            className="form-input"
                            style={{marginTop: 8}}
                          />
                        )}
                      </div>
                    )}

                    {cueType === 'time' && (
                      <div className="habit-time-input-row" style={{marginTop: 10}}>
                        <input
                          type="time"
                          value={cueTime}
                          onChange={(e) => {
                            setCueTime(e.target.value);
                            setReminderTime(e.target.value);
                            if (isAiParsed) confirmField('cue');
                          }}
                          className="form-input"
                          style={{flex: '0 0 140px'}}
                        />
                        <span className="habit-time-input-hint">Do it at this time</span>
                      </div>
                    )}

                    {cueType === 'window' && (
                      <div className="habit-time-input-row" style={{marginTop: 10}}>
                        <input
                          type="time"
                          value={cueTimeStart}
                          onChange={(e) => {
                            setCueTimeStart(e.target.value);
                            setReminderTime(e.target.value);
                            if (isAiParsed) confirmField('cue');
                          }}
                          className="form-input"
                          style={{flex: '0 0 110px'}}
                        />
                        <span className="habit-time-input-sep">→</span>
                        <input
                          type="time"
                          value={cueTimeEnd}
                          onChange={(e) => { setCueTimeEnd(e.target.value); if (isAiParsed) confirmField('cue') }}
                          className="form-input"
                          style={{flex: '0 0 110px'}}
                        />
                      </div>
                    )}

                    {cueType === 'place' && (
                      <input
                        type="text"
                        placeholder="e.g. at my desk"
                        value={cuePlace}
                        onChange={(e) => { setCuePlace(e.target.value); if (isAiParsed) confirmField('cue') }}
                        className="form-input"
                        style={{marginTop: 10}}
                      />
                    )}

                    {cueType === 'event' && (
                      <input
                        type="text"
                        placeholder="e.g. finish work, or: when the kids are in bed"
                        value={cueEvent}
                        onChange={(e) => { setCueEvent(e.target.value); if (isAiParsed) confirmField('cue') }}
                        className="form-input"
                        style={{marginTop: 10}}
                      />
                    )}

                    {cueType === 'custom' && (
                      <input
                        type="text"
                        placeholder="Describe the trigger in your own words"
                        value={cueCustom}
                        onChange={(e) => { setCueCustom(e.target.value); if (isAiParsed) confirmField('cue') }}
                        className="form-input"
                        style={{marginTop: 10}}
                      />
                    )}
                  </div>
                  {isAiParsed && !confirmedFields.cue && (
                    <button type="button" className="habit-ai-confirm-check" onClick={() => confirmField('cue')}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: '13px', height: '13px'}}>
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      Confirm Trigger
                    </button>
                  )}
                </div>
              )}

              {formStep === 2 && (
                <div className="form-group">
                  {durationEvalBanner}

                  <div className="habit-scientific-tip">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                    </svg>
                    <span>
                      <strong>The Dopamine Loop:</strong> The brain cements a habit based on expected rewards. Choose a simple, immediate reward. Lower friction so compliance is effortless.
                    </span>
                  </div>

                  <label htmlFor="habit-reward">Reward</label>
                  <div className="habit-card-hint">The brain reinforces the cue when it expects something back right away. Name it.</div>
                  {isAiParsed && !confirmedFields.reward && (
                    <div className="habit-ai-confirm-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width: '13px', height: '13px'}}>
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                      AI suggested — confirm or edit
                    </div>
                  )}
                  <div className={`habit-ai-confirm-field ${isAiParsed && confirmedFields.reward ? 'habit-ai-confirmed' : ''}`}>
                    <textarea
                      id="habit-reward"
                      placeholder="e.g. cross off today's tally"
                      value={reward}
                      onChange={(e) => { setReward(e.target.value); if (isAiParsed) confirmField('reward') }}
                      className="form-textarea"
                      rows={2}
                    />
                  </div>
                  {isAiParsed && !confirmedFields.reward && (
                    <button type="button" className="habit-ai-confirm-check" onClick={() => confirmField('reward')}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: '13px', height: '13px'}}>
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      Confirm Reward
                    </button>
                  )}

                  <label htmlFor="habit-friction" style={{marginTop: 16}}>Friction removed</label>
                  {isAiParsed && !confirmedFields.friction && (
                    <div className="habit-ai-confirm-label">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width: '13px', height: '13px'}}>
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                      </svg>
                      AI suggested — confirm or edit
                    </div>
                  )}
                  <div className={`habit-ai-confirm-field ${isAiParsed && confirmedFields.friction ? 'habit-ai-confirmed' : ''}`}>
                    <textarea
                      id="habit-friction"
                      placeholder="e.g. leave the book on the pillow, phone in the kitchen"
                      value={friction}
                      onChange={(e) => { setFriction(e.target.value); if (isAiParsed) confirmField('friction') }}
                      className="form-textarea"
                      rows={2}
                    />
                  </div>
                  {isAiParsed && !confirmedFields.friction && (
                    <button type="button" className="habit-ai-confirm-check" onClick={() => confirmField('friction')}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: '13px', height: '13px'}}>
                        <path d="M20 6L9 17l-5-5"/>
                      </svg>
                      Confirm Friction Strategy
                    </button>
                  )}
                </div>
              )}

              {formStep === 3 && (
                <div className="form-group">
                  {durationEvalBanner}
                  <label htmlFor="habit-confirm-name">Habit Name *</label>
                  <input
                    id="habit-confirm-name"
                    type="text"
                    className="form-input"
                    value={habitName}
                    onChange={(e) => setHabitName(e.target.value)}
                    style={{ marginBottom: 16 }}
                  />
                  
                  {/* Premium Commitment Intention Formula Block */}
                  <div className="habit-sentence-formula">
                    <div className="formula-title">Implementation Intention</div>
                    <div className="formula-text">
                      When <span className="formula-variable var-cue">{effectiveCue || "…"}</span>, I will <span className="formula-variable var-behavior">{behavior || "…"}</span>.
                    </div>
                  </div>

                  {/* Daily Reminder Time Input */}
                  <div style={{ marginTop: 16 }}>
                    <label htmlFor="habit-reminder-time">Daily Reminder Time</label>
                    <div className="habit-time-input-row" style={{ marginTop: 8 }}>
                      <input
                        id="habit-reminder-time"
                        type="time"
                        className="form-input"
                        value={reminderTime}
                        onChange={(e) => setReminderTime(e.target.value)}
                        style={{ flex: '0 0 140px' }}
                      />
                      <span className="habit-time-input-hint">Set when you want to receive notifications</span>
                    </div>
                  </div>

                  {reward && <><label style={{marginTop: 16}}>Reward</label><div className="habit-plain-text">{reward}</div></>}
                  {friction && <><label style={{marginTop: 16}}>Friction removed</label><div className="habit-plain-text">{friction}</div></>}
                  {(durationDays || startDate) && (
                    <>
                      <label style={{marginTop: 16}}>Commitment period</label>
                      <div className="habit-plain-text">
                        {durationDays ? `${durationDays} day${durationDays === 1 ? '' : 's'}` : 'Custom dates'}
                        {startDate && endDate ? ` · ${startDate} → ${endDate}` : ''}
                      </div>
                    </>
                  )}
                  <div className="habit-evidence-note">Median time to automaticity: 66 days. Miss a day, don't miss the trigger.</div>
                </div>
              )}
            </div>
            
            <div className="add-task-form-footer">
              {formStep > 0 && <button type="button" className="btn btn-outline" onClick={() => setFormStep(formStep - 1)}>Back</button>}
              <button 
                type="button"
                className={`btn btn-solid ${!canAdvance ? 'habit-btn-disabled' : ''}`}
                disabled={!canAdvance}
                onClick={() => formStep === 3
                  ? handleCreateHabit()
                  : setFormStep(formStep + 1)
                }
                style={{opacity: canAdvance ? 1 : 0.6, cursor: canAdvance ? 'pointer' : 'not-allowed'}}
              >
                {formStep === 3 ? (isCreating ? 'Creating...' : 'Start this habit') : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View All Habits Modal */}
      {showViewAllHabitsModal && (
        <div className="habit-overlay open" onClick={() => setShowViewAllHabitsModal(false)}>
          <div className="habit-modal wide" onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div className="mng-header">
              <div className="mng-header-left">
                <div className="mng-header-icon" style={{ background: selectedHabitDetail?.color || 'var(--primary-tint)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                  </svg>
                </div>
                <div>
                  <div className="mng-header-title">{selectedHabitDetail?.name || 'Manage Habits'}</div>
                  <div className="mng-header-sub">
                    {selectedHabitDetail
                      ? `${selectedHabitDetail.frequency || 'Daily'} · Reminder: ${selectedHabitDetail.reminder_time || 'not set'}`
                      : `${allHabits.length} habit${allHabits.length !== 1 ? 's' : ''} tracked`}
                  </div>
                </div>
              </div>
              <button className="mng-close-btn" onClick={() => setShowViewAllHabitsModal(false)} aria-label="Close">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'18px',height:'18px'}}>
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="habit-modal-body">
              <div className="habit-hd-split">

                {/* Left Pane — Sorted Habits List */}
                <div className="habit-hd-list">
                  {allHabits.length === 0 ? (
                    <div className="mng-empty-state">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/>
                      </svg>
                      <span>No habits yet. Add your first one!</span>
                    </div>
                  ) : (
                    allHabits.map((h: any) => {
                      const isSelected = selectedHabitId === h.id
                      const todayStatus = todayHabits.find((t: any) => t.id === h.id)
                      const currentStreak = h.streak?.current_streak || 0
                      const isDone = todayStatus?.done
                      const isSkipped = todayStatus?.skipped
                      return (
                        <div
                          key={h.id}
                          className={`mng-habit-row ${isSelected ? 'mng-habit-row--active' : ''} ${isDone ? 'mng-habit-row--done' : ''}`}
                          onClick={() => selectHabit(h.id)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && selectHabit(h.id)}
                        >
                          <div className="mng-habit-color-bar" style={{ background: h.color || 'var(--primary)' }} />
                          <div className="mng-habit-ic" style={{ background: h.color ? `${h.color}22` : 'var(--primary-tint)' }}>
                            {isDone ? (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M20 6L9 17l-5-5"/>
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="9"/>
                              </svg>
                            )}
                          </div>
                          <div className="mng-habit-info">
                            <div className="mng-habit-name">{h.name}</div>
                            <div className="mng-habit-meta">
                              {h.reminder_time && (
                                <span className="mng-habit-time">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'10px',height:'10px'}}>
                                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                  </svg>
                                  {h.reminder_time}
                                </span>
                              )}
                              {isDone ? (
                                <span className="mng-status mng-status--done">Done</span>
                              ) : isSkipped ? (
                                <span className="mng-status mng-status--skipped">Skipped</span>
                              ) : (
                                <span className="mng-status mng-status--pending">Pending</span>
                              )}
                            </div>
                          </div>
                          {currentStreak > 0 && (
                            <div className="mng-streak-badge">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'11px',height:'11px'}}>
                                <path d="M13 2L4 14h7l-1 8 9-12h-7z"/>
                              </svg>
                              {currentStreak}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Right Pane — Detail + Edit */}
                <div className="habit-hd-detail">
                  <div className="habit-hd-tabs">
                    <button className={selectedHabitTab === 'overview' ? 'active' : ''} onClick={() => setSelectedHabitTab('overview')}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                      </svg>
                      Overview
                    </button>
                    <button className={selectedHabitTab === 'edit' ? 'active' : ''} onClick={() => setSelectedHabitTab('edit')}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Edit
                    </button>
                  </div>

                  {detailLoading ? (
                    <div className="mng-loading">
                      <div className="mng-loading-spinner" />
                      Loading details...
                    </div>
                  ) : !selectedHabitDetail ? (
                    <div className="mng-select-prompt">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="2"/>
                      </svg>
                      Select a habit from the list to view details
                    </div>
                  ) : (
                    <>
                      {/* ── OVERVIEW TAB ── */}
                      {selectedHabitTab === 'overview' && (
                        <div className="habit-hd-view active">

                          {/* Stat strip */}
                          <div className="mng-stat-strip">
                            <div className="mng-stat-cell">
                              <div className="mng-stat-val">{habitDetailVM.currentStreak}</div>
                              <div className="mng-stat-lbl">Current streak</div>
                            </div>
                            <div className="mng-stat-divider" />
                            <div className="mng-stat-cell">
                              <div className="mng-stat-val">{habitDetailVM.longestStreak}</div>
                              <div className="mng-stat-lbl">Longest streak</div>
                            </div>
                            <div className="mng-stat-divider" />
                            <div className="mng-stat-cell">
                              <div className="mng-stat-val">{habitDetailVM.consistency}%</div>
                              <div className="mng-stat-lbl">30-day rate</div>
                            </div>
                            <div className="mng-stat-divider" />
                            <div className="mng-stat-cell">
                              <div className="mng-stat-val">{habitDetailVM.totalCheckIns}</div>
                              <div className="mng-stat-lbl">Total reps</div>
                            </div>
                          </div>

                          {/* Consistency ring + label */}
                          <div className="habit-hd-ring-row">
                            <div className="habit-hd-ring-wrap">
                              <svg viewBox="0 0 78 78">
                                <circle className="habit-hd-ring-track" cx="39" cy="39" r="32"/>
                                <circle
                                  className="habit-hd-ring-progress"
                                  cx="39" cy="39" r="32"
                                  strokeDasharray="201"
                                  strokeDashoffset={habitDetailVM.ringOffset}
                                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                                />
                              </svg>
                              <div className="habit-hd-ring-label">{habitDetailVM.consistency}%</div>
                            </div>
                            <div className="habit-hd-ring-copy">
                              <div className="t">
                                {habitDetailVM.consistency >= 80 ? 'Strong momentum this month' : habitDetailVM.consistency >= 50 ? 'Building consistency' : 'Keep going for momentum'}
                              </div>
                              <div className="s">
                                Category: <strong>{selectedHabitDetail.category || 'health'}</strong> · Trigger: <strong>{selectedHabitDetail.cue_type || 'routine'}</strong>
                              </div>
                            </div>
                          </div>

                          {/* Implementation Intention card */}
                          <div className="mng-intention-card">
                            <div className="mng-intention-label">Implementation Intention</div>
                            <div className="mng-intention-text">
                              When{' '}
                              <span className="mng-fill mng-fill--cue">{selectedHabitDetail.anchor_routine || 'it is time'}</span>
                              , I will{' '}
                              <span className="mng-fill mng-fill--action">{selectedHabitDetail.behavior || selectedHabitDetail.name}</span>.
                            </div>

                            {selectedHabitDetail.reward && (
                              <div className="mng-detail-row">
                                <div className="mng-detail-row-icon">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                  </svg>
                                </div>
                                <div>
                                  <div className="mng-detail-row-label">Reward</div>
                                  <div className="mng-detail-row-value">{selectedHabitDetail.reward}</div>
                                </div>
                              </div>
                            )}

                            {selectedHabitDetail.friction && (
                              <div className="mng-detail-row">
                                <div className="mng-detail-row-icon">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 6L6 18M6 6l12 12"/>
                                  </svg>
                                </div>
                                <div>
                                  <div className="mng-detail-row-label">Friction Removed</div>
                                  <div className="mng-detail-row-value">{selectedHabitDetail.friction}</div>
                                </div>
                              </div>
                            )}

                            {(selectedHabitDetail.reminder_time || selectedHabitDetail.location || selectedHabitDetail.target_days || selectedHabitDetail.start_date) && (
                              <div className="mng-meta-chips">
                                {selectedHabitDetail.reminder_time && (
                                  <span className="mng-chip">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'11px',height:'11px'}}>
                                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                                    </svg>
                                    {selectedHabitDetail.reminder_time}
                                  </span>
                                )}
                                {selectedHabitDetail.location && (
                                  <span className="mng-chip">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'11px',height:'11px'}}>
                                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                                    </svg>
                                    {selectedHabitDetail.location}
                                  </span>
                                )}
                                {selectedHabitDetail.target_days && (
                                  <span className="mng-chip">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{width:'11px',height:'11px'}}>
                                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                                    </svg>
                                    {selectedHabitDetail.target_days} day commitment
                                  </span>
                                )}
                                {selectedHabitDetail.start_date && (
                                  <span className="mng-chip">Started {selectedHabitDetail.start_date}</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 28-Day Water Container Heatmap */}
                          <div className="mng-cal-section">
                            <div className="mng-cal-title">28-Day Consistency</div>
                            <div className="habit-hd-cal-grid">
                              {selectedHabitCalendar.length === 0 ? (
                                <div style={{ gridColumn: '1 / -1', fontSize: '12px', color: 'var(--muted)' }}>No completion history yet</div>
                              ) : (
                                selectedHabitCalendar.map((item: any, idx: number) => {
                                  const fillPercentage = item.status === 'done' ? 100 : item.status === 'partial' ? 50 : 0
                                  const isToday = idx === selectedHabitCalendar.length - 1
                                  return (
                                    <div
                                      key={idx}
                                      className={`habit-water-container ${isToday ? 'today' : ''}`}
                                      title={`${item.date}: ${item.status || 'no record'}`}
                                    >
                                      <div 
                                        className="habit-water-fill"
                                        style={{ 
                                          '--fill-height': `${fillPercentage}%`,
                                          animationDelay: `${idx * 50}ms`
                                        } as React.CSSProperties}
                                      >
                                        <div className="habit-water-wave" />
                                      </div>
                                      <div className="habit-water-label">{idx + 1}</div>
                                    </div>
                                  )
                                })
                              )}
                            </div>
                            <div className="mng-cal-legend">
                              <span className="mng-legend-item"><span className="mng-legend-dot mng-legend-dot--done" />100% Done</span>
                              <span className="mng-legend-item"><span className="mng-legend-dot mng-legend-dot--partial" />50% Partial</span>
                              <span className="mng-legend-item"><span className="mng-legend-dot mng-legend-dot--empty" />0% Empty</span>
                            </div>
                          </div>

                          {/* Coach Insight */}
                          <div className="mng-insight-card">
                            <div className="mng-insight-icon">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 3a7 7 0 00-7 7c0 2 1 3.5 2 4.5V17a2 2 0 002 2h6a2 2 0 002-2v-2.5c1-1 2-2.5 2-4.5a7 7 0 00-7-7z"/>
                              </svg>
                            </div>
                            <p className="mng-insight-text">
                              {selectedHabitDetail.is_active === false
                                ? 'This habit is currently paused. Resume anytime to start tracking progress again.'
                                : habitDetailVM.currentStreak >= 7
                                  ? `${habitDetailVM.currentStreak}-day streak active! Protect your momentum today.`
                                  : habitDetailVM.consistency >= 75
                                    ? `High consistency at ${habitDetailVM.consistency}%. Automaticity is taking root.`
                                    : 'Small steps count. Complete your check-in daily to strengthen the neural pathway.'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* ── EDIT SETTINGS TAB ── */}
                      {selectedHabitTab === 'edit' && (
                        <div className="habit-hd-view active">

                          {/* Identity */}
                          <div className="mng-edit-section">
                            <div className="mng-edit-section-title">Identity</div>
                            <div className="habit-field">
                              <label htmlFor="edit-habit-name">Habit Name *</label>
                              <input id="edit-habit-name" className="habit-input" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="e.g. Read before bed" />
                            </div>
                            <div className="habit-row2">
                              <div className="habit-field">
                                <label htmlFor="edit-category">Category</label>
                                <select id="edit-category" className="habit-select" value={editCategory} onChange={(e) => setEditCategory(e.target.value)}>
                                  <option value="health">Health & Wellness</option>
                                  <option value="work">Work & Focus</option>
                                  <option value="study">Study & Learning</option>
                                  <option value="personal">Personal Growth</option>
                                  <option value="fitness">Fitness</option>
                                  <option value="mindfulness">Mindfulness</option>
                                </select>
                              </div>
                              <div className="habit-field">
                                <label htmlFor="edit-location">Location</label>
                                <input id="edit-location" className="habit-input" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="e.g. Bedroom desk" />
                              </div>
                            </div>
                          </div>

                          {/* Implementation Intention */}
                          <div className="mng-edit-section">
                            <div className="mng-edit-section-title">Implementation Intention</div>
                            <div className="habit-field">
                              <label htmlFor="edit-anchor-routine">Anchor Routine (Trigger)</label>
                              <input id="edit-anchor-routine" className="habit-input" value={editAnchorRoutine} onChange={(e) => setEditAnchorRoutine(e.target.value)} placeholder="e.g. Right after I pour my morning coffee" />
                            </div>
                            <div className="habit-field">
                              <label htmlFor="edit-behavior">Target Action / Behaviour</label>
                              <textarea id="edit-behavior" className="habit-textarea" rows={2} value={editBehavior} onChange={(e) => setEditBehavior(e.target.value)} placeholder="e.g. read 10 pages" />
                            </div>
                            <div className="mng-intention-preview">
                              <span className="mng-intention-preview-label">Preview</span>
                              <span>When <strong>{editAnchorRoutine || 'routine occurs'}</strong>, I will <strong>{editBehavior || editName || 'action'}</strong>.</span>
                            </div>
                          </div>

                          {/* Motivation Loop */}
                          <div className="mng-edit-section">
                            <div className="mng-edit-section-title">Motivation Loop</div>
                            <div className="habit-row2">
                              <div className="habit-field">
                                <label htmlFor="edit-reward">Reward</label>
                                <input id="edit-reward" className="habit-input" value={editReward} onChange={(e) => setEditReward(e.target.value)} placeholder="e.g. cross off tally" />
                              </div>
                              <div className="habit-field">
                                <label htmlFor="edit-friction">Friction Removed</label>
                                <input id="edit-friction" className="habit-input" value={editFriction} onChange={(e) => setEditFriction(e.target.value)} placeholder="e.g. leave book on pillow" />
                              </div>
                            </div>
                          </div>

                          {/* Schedule & Reminders */}
                          <div className="mng-edit-section">
                            <div className="mng-edit-section-title">Schedule & Reminders</div>
                            <div className="habit-row2">
                              <div className="habit-field">
                                <label htmlFor="edit-reminder-time">Reminder time</label>
                                <input id="edit-reminder-time" className="habit-input" type="time" value={editReminderTime} onChange={(e) => setEditReminderTime(e.target.value)} />
                              </div>
                              <div className="habit-field">
                                <label htmlFor="edit-reminder-tone">Reminder tone</label>
                                <select id="edit-reminder-tone" className="habit-select" value={editReminderTone} onChange={(e) => setEditReminderTone(e.target.value)}>
                                  {TONE_OPTIONS.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                            <div className="habit-field">
                              <label>Frequency (Scheduled days)</label>
                              <div className="habit-day-picker">
                                {[1, 2, 3, 4, 5, 6, 7].map((day, idx) => {
                                  const active = editScheduledDays.includes(day)
                                  return (
                                    <div key={day} className={`habit-day-opt ${active ? 'active' : ''}`} onClick={() => toggleEditDay(day)}>
                                      {DAY_LABELS[idx]}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                            <div className="habit-field" style={{maxWidth: '180px'}}>
                              <label htmlFor="edit-target-days">Commitment target (days)</label>
                              <input id="edit-target-days" className="habit-input" type="number" value={editTargetDays} onChange={(e) => setEditTargetDays(e.target.value)} placeholder="e.g. 21, 66, 90" />
                            </div>
                          </div>

                          {/* Danger Zone */}
                          <div className="mng-danger-zone">
                            <div className="mng-danger-zone-title">Danger Zone</div>
                            <div className="mng-danger-row">
                              <div className="mng-danger-info">
                                <div className="mng-danger-name">{selectedHabitDetail.is_active ? 'Pause this habit' : 'Resume this habit'}</div>
                                <div className="mng-danger-sub">{selectedHabitDetail.is_active ? 'Stop tracking without losing your history' : 'Reactivate habit tracking'}</div>
                              </div>
                              <button type="button" className="mng-btn mng-btn--outline-warn" onClick={handlePauseHabit} disabled={isPausing}>
                                {isPausing ? 'Updating...' : (selectedHabitDetail.is_active ? 'Pause' : 'Resume')}
                              </button>
                            </div>
                            <div className="mng-danger-row">
                              <div className="mng-danger-info">
                                <div className="mng-danger-name">Delete habit</div>
                                <div className="mng-danger-sub">Removes this habit and its history permanently</div>
                              </div>
                              <button type="button" className="mng-btn mng-btn--danger" onClick={confirmDeleteHabit} disabled={isDeleting}>
                                {isDeleting ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="habit-modal-foot">
              <button type="button" className="habit-btn habit-btn-close" onClick={() => setShowViewAllHabitsModal(false)}>Close</button>
              {selectedHabitTab === 'edit' && (
                <button type="button" className="habit-btn habit-btn-primary" onClick={handleSaveHabit} disabled={isSaving || !selectedHabitId}>
                  {isSaving ? 'Saving...' : 'Save changes'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Styled delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className="habit-confirm-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="habit-confirm-box" onClick={e => e.stopPropagation()}>
            <div className="habit-confirm-icon">
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </div>
            <div className="habit-confirm-title">Delete this habit?</div>
            <div className="habit-confirm-body">
              <strong>{selectedHabitDetail?.name || 'This habit'}</strong> and all of its completion history will be permanently removed. This action cannot be undone.
            </div>
            <div className="habit-confirm-actions">
              <button
                type="button"
                className="habit-btn habit-btn-outline"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="habit-btn habit-btn-danger"
                onClick={handleDeleteHabit}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
