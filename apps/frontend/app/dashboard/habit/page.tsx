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

      // Build the month streak grid from real completion data.
      // The grid lays out 17 day-cells per row; we show the days of the
      // current month up to today, marking each based on whether the user
      // completed any habit that day (done / partial / skipped / today / open).
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth()
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const todayDate = now.getDate()

      const monthStart = new Date(year, month, 1)
      monthStart.setHours(0, 0, 0, 0)
      const monthEnd = new Date(year, month, daysInMonth)
      monthEnd.setHours(23, 59, 59, 999)

      const completionsResponse = await fetch(
        `http://localhost:3001/api/habits/completions?userId=${uid}&startDate=${monthStart.toISOString()}&endDate=${monthEnd.toISOString()}`
      )
      const completionsData = await completionsResponse.json()

      // For each day this month, pick the "best" status across all habits
      // (done > partial > skipped). Today is flagged separately.
      const rank: Record<string, number> = { done: 3, partial: 2, skipped: 1 }
      const dayStatus = new Map<number, string>()
      for (const c of Array.isArray(completionsData) ? completionsData : []) {
        const cDate = new Date(c.completed_at)
        if (cDate.getFullYear() !== year || cDate.getMonth() !== month) continue
        const d = cDate.getDate()
        const prev = dayStatus.get(d)
        if (!prev || (rank[c.status] || 0) > (rank[prev] || 0)) {
          dayStatus.set(d, c.status)
        }
      }

      const generatedStreakDays = []
      for (let d = 1; d <= daysInMonth; d++) {
        let status = ''
        if (d === todayDate) {
          status = 'today'
        } else if (d < todayDate) {
          const s = dayStatus.get(d)
          if (s === 'done') status = 'done'
          else if (s === 'partial') status = 'partial'
          else if (s === 'skipped') status = 'warn'
          else status = '' // open / no data
        }
        generatedStreakDays.push({ day: d, status })
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

  return (
    <div className="screen active">
      <div className="screen" style={{display: 'block', paddingTop: 0}}>
        <div className="habit-page">
          {/* Left Panel - Sidebar */}
          <div className="habit-left-panel">
            {/* Greeting and Mode Selector Row */}
            <div className="habit-greeting-row">
              <div className="habit-greeting">
                <div className="habit-greeting-label">Hi {userName},</div>
                <h1 className="habit-greeting-title">Let's build<br />momentum today</h1>
              </div>

              {/* Mode Selector */}
              <div className="habit-mode-select">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="7" width="18" height="13" rx="2"/>
                  <path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
                Work mode
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>
            </div>

            {/* Widgets */}
            <div className="habit-widgets">
              {/* Coach Widget */}
              <div className="habit-widget habit-widget--dark">
                <div className="habit-widget-label">Coach</div>
                <div className="habit-widget-msg">{habitStats?.coachInsight || 'Add a habit to start building momentum.'}</div>
              </div>

              {/* Goal Progress + This Week */}
              <div className="habit-widgets-row">
                <div className="habit-widget">
                  <div className="habit-widget-label">Habit goal</div>
                  <div className="habit-widget-big">{habitStats?.consistencyRate || 0}%</div>
                  <div className="habit-widget-sub">Consistency this month</div>
                </div>
                <div className="habit-widget">
                  <div className="habit-widget-label">This week</div>
                  <div className="habit-widget-big">{habitStats?.weeklyCheckIns || 0}<span style={{fontSize: '15px', color: 'var(--muted)'}}>/{habitStats?.expectedThisWeek || 0}</span></div>
                  <div className="habit-widget-sub">Habit check-ins</div>
                </div>
              </div>

              {/* Music Player */}
              <div className="habit-widget habit-widget--player">
                <div className="habit-player-disc">
                  <div className="habit-player-disc-inner"></div>
                </div>
                <div style={{flex: 1}}>
                  <div className="habit-widget-label" style={{marginBottom: '2px'}}>Deep work music</div>
                  <div className="habit-widget-sub" style={{marginTop: 0}}>Lo-fi focus mix</div>
                  <div className="habit-player-controls">
                    <svg viewBox="0 0 24 24" fill="currentColor" style={{width: '16px', height: '16px', color: 'var(--ink-soft)'}}>
                      <path d="M6 18V6h2v12H6zm3.5-6L18 6v12l-8.5-6z"/>
                    </svg>
                    <div className="habit-player-play">
                      <svg viewBox="0 0 24 24" fill="currentColor" style={{width: '11px', height: '11px', color: '#fff'}}>
                        <path d="M8 5v14l11-7z"/>
                      </svg>
                    </div>
                    <svg viewBox="0 0 24 24" fill="currentColor" style={{width: '16px', height: '16px', color: 'var(--ink-soft)', transform: 'scaleX(-1)'}}>
                      <path d="M6 18V6h2v12H6zm3.5-6L18 6v12l-8.5-6z"/>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Focus Session */}
              <div className="habit-widget habit-widget--dark habit-widget--focus">
                <div className="habit-widget-label">Focus session</div>
                <div className="habit-focus-time">00 : 20 : 00</div>
                <div className="habit-focus-actions">
                  <button className="habit-focus-btn habit-focus-btn--ghost">Cancel</button>
                  <button className="habit-focus-btn habit-focus-btn--solid">Start</button>
                </div>
              </div>

              {/* Streak Mini + Quote */}
              <div className="habit-widgets-row">
                <div className="habit-widget">
                  <div className="habit-widget-label">Streak</div>
                  <div className="habit-streak-mini">
                    <div className="habit-ring-wrap-sm">
                      <svg viewBox="0 0 44 44" style={{transform: 'rotate(-90deg)', width: '44px', height: '44px'}}>
                        <circle cx="22" cy="22" r="18" fill="none" stroke="var(--surface-2)" strokeWidth="5"/>
                        <circle cx="22" cy="22" r="18" fill="none" stroke="var(--accent)" strokeWidth="5" strokeLinecap="round" strokeDasharray="113" strokeDashoffset={113 - (113 * (habitStats?.currentStreak || 0) / 30)} style={{transition: 'stroke-dashoffset 0.5s ease'}}/>
                      </svg>
                      <div className="habit-ring-label-sm">{habitStats?.currentStreak || 0}</div>
                    </div>
                    <div className="habit-widget-sub" style={{marginTop: 0}}>days running</div>
                  </div>
                </div>
                <div className="habit-widget habit-widget--quote">
                  <div className="habit-widget-quote">"Small steps<br />still count."</div>
                </div>
              </div>
            </div>

            {/* Add Widget Button */}
            <button className="habit-add-widget-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: '15px', height: '15px'}}>
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add New Widget
            </button>
          </div>

          {/* Right Panel - Main Content */}
          <div className="habit-right-panel">
            {/* Row 1: Metrics */}
            <div className="habit-row3">
              <div className="habit-card">
                <div style={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between'}}>
                  <div>
                    <div className="habit-metric-title">This week's habits</div>
                    <div className="habit-metric-grid">
                      <div className="habit-metric-item">
                        <div className="habit-metric-ic">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width: '16px', height: '16px', color: 'var(--ink-soft)'}}>
                            <path d="M9 11l3 3L22 4"/>
                            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
                          </svg>
                        </div>
                        <div>
                          <div className="habit-metric-num">{habitStats?.totalCheckIns || 0} of {habitStats?.expectedCheckIns || 0}</div>
                          <div className="habit-metric-lbl">Habit check-ins done</div>
                        </div>
                      </div>
                      <div className="habit-metric-item">
                        <div className="habit-metric-ic">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width: '16px', height: '16px', color: 'var(--ink-soft)'}}>
                            <path d="M13 2L4 14h7l-1 8 9-12h-7z"/>
                          </svg>
                        </div>
                        <div>
                          <div className="habit-metric-num">{habitStats?.longestStreak || 0} days</div>
                          <div className="habit-metric-lbl">Longest active streak</div>
                        </div>
                      </div>
                      <div className="habit-metric-item">
                        <div className="habit-metric-ic">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width: '16px', height: '16px', color: 'var(--ink-soft)'}}>
                            <circle cx="12" cy="12" r="9"/>
                            <path d="M12 7v5l3 3"/>
                          </svg>
                        </div>
                        <div>
                          <div className="habit-metric-num">{habitStats?.consistencyRate || 0}%</div>
                          <div className="habit-metric-lbl">Consistency rate</div>
                        </div>
                      </div>
                      <div className="habit-metric-item">
                        <div className="habit-metric-ic">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width: '16px', height: '16px', color: 'var(--ink-soft)'}}>
                            <rect x="4" y="4" width="16" height="16" rx="3"/>
                            <path d="M8 4v3M16 4v3"/>
                          </svg>
                        </div>
                        <div>
                          <div className="habit-metric-num">{habitStats?.totalHabits || 0}</div>
                          <div className="habit-metric-lbl">Active habits</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="habit-cycle-ring-big">
                    <svg viewBox="0 0 110 110" style={{transform: 'rotate(-90deg)', width: '110px', height: '110px'}}>
                      <circle cx="55" cy="55" r="46" fill="none" stroke="var(--surface-2)" strokeWidth="9"/>
                      <circle cx="55" cy="55" r="46" fill="none" stroke="var(--primary)" strokeWidth="9" strokeLinecap="round" strokeDasharray="289" strokeDashoffset={289 - (289 * Math.min(habitStats?.consistencyRate || 0, 100) / 100)} style={{transition: 'stroke-dashoffset 0.6s ease'}}/>
                    </svg>
                  </div>
                </div>
              </div>

              <div className="habit-card habit-stat-card">
                <div className="habit-stat-head">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width: '15px', height: '15px'}}>
                    <path d="M13 2L4 14h7l-1 8 9-12h-7z"/>
                  </svg> Consistency score
                </div>
                <div className="habit-stat-num-row">
                  <span className="habit-stat-num">{habitStats?.consistencyRate || 0}</span>
                  <span className="habit-stat-unit">/100</span>
                </div>
                <div className="habit-mini-spark">
                  <div style={{height: '40%'}}></div>
                  <div style={{height: '55%'}}></div>
                  <div style={{height: '35%'}}></div>
                  <div style={{height: '70%'}}></div>
                  <div style={{height: '60%'}}></div>
                  <div style={{height: `${habitStats?.consistencyRate || 0}%`, background: 'var(--primary)'}}></div>
                  <div style={{height: `${Math.min(habitStats?.consistencyRate || 0, 82)}%`, background: 'var(--primary)'}}></div>
                </div>
                <span className="habit-stat-tag">Building momentum</span>
              </div>

              <div className="habit-card habit-stat-card">
                <div className="habit-stat-head">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{width: '15px', height: '15px'}}>
                    <path d="M12 9v4M12 17h.01"/>
                    <circle cx="12" cy="12" r="9"/>
                  </svg> Habits at risk
                </div>
                <div className="habit-stat-num-row">
                  <span className="habit-stat-num">{todayHabits.filter((h: any) => !h.done && !h.skipped).length}</span>
                  <span className="habit-stat-unit">remaining today</span>
                </div>
                <div className="habit-mini-spark">
                  {todayHabits.slice(0, 7).map((habit: any, i: number) => (
                    <div key={i} style={{
                      height: habit.done ? '80%' : (habit.skipped ? '20%' : '40%'),
                      background: habit.done ? 'var(--accent-tint)' : (habit.skipped ? 'var(--accent)' : 'var(--accent-tint)')
                    }}></div>
                  ))}
                </div>
                <span className="habit-stat-tag habit-stat-tag--warn">
                  {todayHabits.filter((h: any) => !h.done).length > 0 ? `${todayHabits.filter((h: any) => !h.done).length} habits incomplete` : 'All habits completed!'}
                </span>
              </div>
            </div>

            {/* Row 2: Today's Habits + Calendar */}
            <div className="habit-row-split">
              <div className="habit-card habit-today-card">
                <div className="habit-today-head">
                  <h2>Today's habits</h2>
                  <div style={{display: 'flex', gap: '8px'}}>
                    <button className="habit-btn-add" onClick={() => setShowAddHabitModal(true)}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 5v14M5 12h14"/>
                      </svg> Add habit
                    </button>
                    <button className="habit-btn-view" onClick={() => openViewAllModal()}>
                      View all habits
                    </button>
                  </div>
                </div>

                {todayHabits.map(habit => {
                  const completedTimeStr = habit.completedAt
                    ? new Date(habit.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : null

                  return (
                    <div
                      key={habit.id}
                      className={`habit-today-task ${habit.skipped ? 'habit-today-task--skipped' : ''} ${habit.done ? 'habit-today-task--done' : ''}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => openViewAllModal(habit.id)}
                    >
                      <button
                        type="button"
                        className={`habit-check-btn ${habit.done ? 'checked' : ''}`}
                        onClick={(e) => handleCheckHabit(habit.id, e)}
                        disabled={habit.done || checkingHabitId === habit.id}
                        title={habit.done ? `Completed at ${completedTimeStr}` : 'Mark habit as done'}
                      >
                        {habit.done ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        ) : (
                          <div className="habit-check-circle" />
                        )}
                      </button>
                      <div>
                        <div className="habit-tt-title">{habit.title}</div>
                        <div className="habit-tt-time">
                          {habit.time}
                          {completedTimeStr && (
                            <span style={{ marginLeft: 6, color: 'var(--primary)', fontWeight: 600 }}>
                              · Done at {completedTimeStr}
                            </span>
                          )}
                        </div>
                      </div>
                      {habit.done && (
                        <div className="habit-tt-done">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{width: '13px', height: '13px'}}>
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                          {completedTimeStr ? `Done (${completedTimeStr})` : 'Done'}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="habit-card">
                <div className="habit-today-head">
                  <h2 style={{fontSize: '16px'}}>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2>
                </div>
                <div className="habit-cal-strip">
                  <div className="habit-cal-nav">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: '12px', height: '12px'}}>
                      <path d="M15 6l-6 6 6 6"/>
                    </svg>
                  </div>
                  {(() => {
                    const days = []
                    const today = new Date()
                    for (let i = -2; i <= 2; i++) {
                      const date = new Date(today)
                      date.setDate(today.getDate() + i)
                      const isToday = i === 0
                      days.push(
                        <div key={i} className={`habit-cal-day ${isToday ? 'habit-cal-day--active' : ''}`}>
                          <div className="habit-cal-dname">{date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                          <div className="habit-cal-dnum">{date.getDate()}</div>
                        </div>
                      )
                    }
                    return days
                  })()}
                  <div className="habit-cal-nav" style={{marginLeft: 'auto'}}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{width: '12px', height: '12px'}}>
                      <path d="M9 6l6 6-6 6"/>
                    </svg>
                  </div>
                </div>
                <p style={{fontSize: '12.5px', color: 'var(--muted)', lineHeight: 1.6, margin: 0}}>
                  {todayHabits.filter((h: any) => h.done).length} of {todayHabits.length} habits checked in so far — {todayHabits.filter((h: any) => !h.done).length > 0 ? `${todayHabits.filter((h: any) => !h.done).length} habit${todayHabits.filter((h: any) => !h.done).length > 1 ? 's are' : ' is'} still open` : 'all habits completed!'}
                </p>
              </div>
            </div>

            {/* Row 3: Habit Streak */}
            <div className="habit-card habit-streak-card">
              <div className="habit-streak-head">
                <h2>Habit streak</h2>
                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                  <div className="habit-period-select">This month 
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </div>
                  <div className="habit-period-toggle">
                    <button className="habit-period-btn habit-period-btn--active">Monthly</button>
                    <button className="habit-period-btn">Yearly</button>
                  </div>
                </div>
              </div>
              <div className="habit-streak-grid">
                {streakDays.map((day, index) => (
                  <div key={index} className={`habit-sday habit-sday--${day.status}`}>
                    <div className="habit-sday-box">
                      {day.status === 'done' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{width: '13px', height: '13px'}}>
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      )}
                      {day.status === 'partial' && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{width: '13px', height: '13px'}}>
                          <circle cx="12" cy="12" r="8"/>
                        </svg>
                      )}
                      {day.status === 'warn' && <span>!</span>}
                      {day.status === 'today' && <span>●</span>}
                    </div>
                    <div className="habit-sday-dnum">{day.day}</div>
                  </div>
                ))}
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
              <div className="habit-form-progress">
                {steps.map((label, i) => (
                  <div key={label} className="habit-progress-item">
                    <div className={`habit-progress-dot ${i <= formStep ? 'habit-progress-dot-active' : ''}`}>
                      {i < formStep ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{width: '11px', height: '11px', color: '#fff'}}>
                          <path d="M20 6L9 17l-5-5"/>
                        </svg>
                      ) : i + 1}
                    </div>
                    {i < steps.length - 1 && <div className="habit-progress-line" />}
                  </div>
                ))}
              </div>

              {formStep === 0 && (
                <div className="form-group">
                  <label htmlFor="habit-ai-input">Describe the habit you want to build</label>
                  <input
                    id="habit-ai-input"
                    type="text"
                    className="form-input habit-ai-input"
                    placeholder="e.g. stop scrolling my phone at night"
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
                      How long do you want to commit? <span className="habit-duration-optional">(optional)</span>
                    </div>

                    <div className="habit-duration-chips">
                      {DURATION_PRESETS.map(p => {
                        const active = durationMode === 'preset' && durationDays === p.days
                        return (
                          <button
                            key={p.days}
                            type="button"
                            className={`habit-duration-chip ${active ? 'habit-duration-chip-active' : ''}`}
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
                            <span className="habit-duration-chip-num">{p.days}</span>
                            <span className="habit-duration-chip-unit">days</span>
                            {p.hint && <span className="habit-duration-chip-hint">{p.hint}</span>}
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
                    className={`btn btn-solid habit-parse-btn`}
                    disabled={!aiInput.trim() || isParsing}
                    onClick={handleAiParse}
                    style={{ marginTop: 10, opacity: (!aiInput.trim() || isParsing) ? 0.6 : 1, cursor: (!aiInput.trim() || isParsing) ? 'not-allowed' : 'pointer' }}
                  >
                    {isParsing ? (
                      <span className="habit-parse-spinner-wrap">
                        <span className="habit-parse-spinner" />
                        Parsing...
                      </span>
                    ) : 'Parse'}
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
                    {/* Trigger-type chip row — always visible so the user can switch
                        away from the AI suggestion. */}
                    <div className="habit-trigger-type-row">
                      {TRIGGER_TYPES.map(t => {
                        const active = cueType === t.id
                        return (
                          <button
                            key={t.id}
                            type="button"
                            className={`habit-trigger-type-chip ${active ? 'habit-trigger-type-chip-active' : ''}`}
                            onClick={() => { setCueType(t.id); if (isAiParsed) confirmField('cue') }}
                            title={t.hint}
                          >
                            {t.label}
                          </button>
                        )
                      })}
                    </div>

                    {/* Per-type inputs — only the active type's inputs render. */}
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
                          onChange={(e) => { setCueTime(e.target.value); if (isAiParsed) confirmField('cue') }}
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
                          onChange={(e) => { setCueTimeStart(e.target.value); if (isAiParsed) confirmField('cue') }}
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
                      Confirm
                    </button>
                  )}
                </div>
              )}

              {formStep === 2 && (
                <div className="form-group">
                  {durationEvalBanner}
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
                      Confirm
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
                      Confirm
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
                  <label>Implementation intention</label>
                  <div className="habit-sentence">{sentence}</div>
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
            <div className="habit-modal-head">
              <div className="habit-hd-header">
                <div className="habit-hd-ic-big" style={{ background: selectedHabitDetail?.color || 'var(--primary-tint)', color: 'var(--ink)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M4 15c3-1 4-6 8-6s5 5 8 6"/>
                  </svg>
                </div>
                <div>
                  <div className="habit-hd-name">{selectedHabitDetail?.name || 'All Habits'}</div>
                  <div className="habit-hd-meta">
                    {selectedHabitDetail ? (
                      `${selectedHabitDetail.frequency || 'Daily'} · ${selectedHabitDetail.anchor_routine ? `anchored: ${selectedHabitDetail.anchor_routine}` : 'No anchor routine'} · ${selectedHabitDetail.reminder_time || 'No reminder time'}`
                    ) : (
                      'Select a habit to view details'
                    )}
                  </div>
                </div>
              </div>
              <button className="habit-modal-close" onClick={() => setShowViewAllHabitsModal(false)}>✕</button>
            </div>

            <div className="habit-modal-body">
              <div className="habit-hd-split">
                {/* Left Pane - Habits List */}
                <div className="habit-hd-list">
                  {allHabits.length === 0 ? (
                    <div style={{ padding: '20px 10px', fontSize: '12px', color: 'var(--muted)', textAlign: 'center' }}>
                      No habits found.
                    </div>
                  ) : (
                    allHabits.map((h: any) => {
                      const isSelected = selectedHabitId === h.id
                      const todayStatus = todayHabits.find((t: any) => t.id === h.id)
                      const currentStreak = h.streak?.current_streak || 0
                      return (
                        <div
                          key={h.id}
                          className={`habit-hd-list-item ${isSelected ? 'active' : ''}`}
                          onClick={() => selectHabit(h.id)}
                        >
                          <div className="habit-hd-list-ic" style={{ background: h.color || 'var(--primary-tint)' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <path d="M4 15c3-1 4-6 8-6s5 5 8 6"/>
                            </svg>
                          </div>
                          <div className="habit-hd-list-info">
                            <div className="habit-hd-list-title">{h.name}</div>
                            <div className="habit-hd-list-sub">
                              {todayStatus?.done ? (
                                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>✓ Today</span>
                              ) : todayStatus?.skipped ? (
                                <span style={{ color: 'var(--muted)' }}>Skipped</span>
                              ) : (
                                <span>Pending today</span>
                              )}
                              {currentStreak > 0 && (
                                <span className="habit-hd-badge">🔥 {currentStreak}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Right Pane - Selected Habit Detail */}
                <div className="habit-hd-detail">
                  <div className="habit-hd-tabs">
                    <button className={selectedHabitTab === 'overview' ? 'active' : ''} onClick={() => setSelectedHabitTab('overview')}>Overview</button>
                    <button className={selectedHabitTab === 'edit' ? 'active' : ''} onClick={() => setSelectedHabitTab('edit')}>Edit settings</button>
                  </div>

                  {detailLoading ? (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted)' }}>Loading habit details...</div>
                  ) : !selectedHabitDetail ? (
                    <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--muted)' }}>Select a habit from the list</div>
                  ) : (
                    <>
                      {/* OVERVIEW TAB */}
                      {selectedHabitTab === 'overview' && (
                        <div className="habit-hd-view active">
                          <div className="habit-hd-stats">
                            <div className="habit-hd-stat">
                              <div className="n">{habitDetailVM.currentStreak}</div>
                              <div className="l">Current streak</div>
                            </div>
                            <div className="habit-hd-stat">
                              <div className="n">{habitDetailVM.longestStreak}</div>
                              <div className="l">Longest streak</div>
                            </div>
                            <div className="habit-hd-stat">
                              <div className="n">{habitDetailVM.consistency}%</div>
                              <div className="l">30-day consistency</div>
                            </div>
                            <div className="habit-hd-stat">
                              <div className="n">{habitDetailVM.totalCheckIns}</div>
                              <div className="l">Total check-ins</div>
                            </div>
                          </div>

                          <div className="habit-hd-ring-row">
                            <div className="habit-hd-ring-wrap">
                              <svg viewBox="0 0 78 78">
                                <circle className="habit-hd-ring-track" cx="39" cy="39" r="32"/>
                                <circle
                                  className="habit-hd-ring-progress"
                                  cx="39"
                                  cy="39"
                                  r="32"
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

                          {/* Full Habit Details Breakdown */}
                          <div className="habit-stack-box" style={{ marginBottom: 20 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--muted)', marginBottom: 6 }}>
                              Implementation Intention
                            </div>
                            <div className="habit-stack-sentence" style={{ fontWeight: 500, fontSize: '13.5px' }}>
                              When <span className="fill">{selectedHabitDetail.anchor_routine || 'it is time'}</span>, I will <span className="fill">{selectedHabitDetail.behavior || selectedHabitDetail.name}</span>.
                            </div>

                            {selectedHabitDetail.reward && (
                              <div style={{ marginTop: 12 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}>Reward</div>
                                <div style={{ fontSize: '13px', color: 'var(--ink)', marginTop: 2 }}>{selectedHabitDetail.reward}</div>
                              </div>
                            )}

                            {selectedHabitDetail.friction && (
                              <div style={{ marginTop: 10 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: 'var(--muted)' }}>Friction Removed</div>
                                <div style={{ fontSize: '13px', color: 'var(--ink)', marginTop: 2 }}>{selectedHabitDetail.friction}</div>
                              </div>
                            )}

                            {(selectedHabitDetail.location || selectedHabitDetail.target_days || selectedHabitDetail.start_date) && (
                              <div style={{ marginTop: 10, display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--muted)', borderTop: '1px dashed var(--border)', paddingTop: 8 }}>
                                {selectedHabitDetail.location && <span>Location: <strong style={{ color: 'var(--ink)' }}>{selectedHabitDetail.location}</strong></span>}
                                {selectedHabitDetail.target_days && <span>Commitment: <strong style={{ color: 'var(--ink)' }}>{selectedHabitDetail.target_days} days</strong></span>}
                                {selectedHabitDetail.start_date && <span>Start: <strong style={{ color: 'var(--ink)' }}>{selectedHabitDetail.start_date}</strong></span>}
                                {selectedHabitDetail.end_date && <span>End: <strong style={{ color: 'var(--ink)' }}>{selectedHabitDetail.end_date}</strong></span>}
                              </div>
                            )}
                          </div>

                          <div className="habit-hd-cal-title">Last 28 days</div>
                          <div className="habit-hd-cal-grid">
                            {selectedHabitCalendar.length === 0 ? (
                              <div style={{ gridColumn: '1 / -1', fontSize: '12px', color: 'var(--muted)' }}>No completion history yet</div>
                            ) : (
                              selectedHabitCalendar.map((item: any, idx: number) => (
                                <div
                                  key={idx}
                                  className={`habit-hd-day ${item.status || ''} ${idx === selectedHabitCalendar.length - 1 ? 'today' : ''}`}
                                  title={`${item.date}: ${item.status || 'no record'}`}
                                />
                              ))
                            )}
                          </div>

                          <div className="habit-coach-insight">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <path d="M12 3a7 7 0 00-7 7c0 2 1 3.5 2 4.5V17a2 2 0 002 2h6a2 2 0 002-2v-2.5c1-1 2-2.5 2-4.5a7 7 0 00-7-7z"/>
                            </svg>
                            <p>
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

                      {/* EDIT SETTINGS TAB */}
                      {selectedHabitTab === 'edit' && (
                        <div className="habit-hd-view active">
                          <div className="habit-field">
                            <label htmlFor="edit-habit-name">Habit Name *</label>
                            <input
                              id="edit-habit-name"
                              className="habit-input"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              placeholder="e.g. Read before bed"
                            />
                          </div>

                          <div className="habit-field">
                            <label htmlFor="edit-anchor-routine">Anchor Routine (Trigger)</label>
                            <input
                              id="edit-anchor-routine"
                              className="habit-input"
                              value={editAnchorRoutine}
                              onChange={(e) => setEditAnchorRoutine(e.target.value)}
                              placeholder="e.g. Right after I pour my morning coffee"
                            />
                          </div>

                          <div className="habit-field">
                            <label htmlFor="edit-behavior">Target Action / Behavior</label>
                            <textarea
                              id="edit-behavior"
                              className="habit-textarea"
                              rows={2}
                              value={editBehavior}
                              onChange={(e) => setEditBehavior(e.target.value)}
                              placeholder="e.g. read 10 pages"
                            />
                          </div>

                          <div className="habit-stack-box" style={{ marginBottom: 18 }}>
                            <div className="habit-stack-sentence">
                              When <span className="fill">{editAnchorRoutine || 'routine occurs'}</span>, I will <span className="fill">{editBehavior || editName || 'action'}</span>.
                            </div>
                          </div>

                          <div className="habit-row2">
                            <div className="habit-field">
                              <label htmlFor="edit-reward">Reward</label>
                              <input
                                id="edit-reward"
                                className="habit-input"
                                value={editReward}
                                onChange={(e) => setEditReward(e.target.value)}
                                placeholder="e.g. cross off tally"
                              />
                            </div>
                            <div className="habit-field">
                              <label htmlFor="edit-friction">Friction Removed</label>
                              <input
                                id="edit-friction"
                                className="habit-input"
                                value={editFriction}
                                onChange={(e) => setEditFriction(e.target.value)}
                                placeholder="e.g. leave book on pillow"
                              />
                            </div>
                          </div>

                          <div className="habit-row2">
                            <div className="habit-field">
                              <label htmlFor="edit-category">Category</label>
                              <select
                                id="edit-category"
                                className="habit-select"
                                value={editCategory}
                                onChange={(e) => setEditCategory(e.target.value)}
                              >
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
                              <input
                                id="edit-location"
                                className="habit-input"
                                value={editLocation}
                                onChange={(e) => setEditLocation(e.target.value)}
                                placeholder="e.g. Bedroom desk"
                              />
                            </div>
                          </div>

                          <div className="habit-row2">
                            <div className="habit-field">
                              <label htmlFor="edit-target-days">Commitment Target (days)</label>
                              <input
                                id="edit-target-days"
                                className="habit-input"
                                type="number"
                                value={editTargetDays}
                                onChange={(e) => setEditTargetDays(e.target.value)}
                                placeholder="e.g. 21, 66, 90"
                              />
                            </div>
                            <div className="habit-field">
                              <label htmlFor="edit-reminder-time">Reminder time</label>
                              <input
                                id="edit-reminder-time"
                                className="habit-input"
                                type="time"
                                value={editReminderTime}
                                onChange={(e) => setEditReminderTime(e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="habit-field">
                            <label htmlFor="edit-reminder-tone">Reminder tone</label>
                            <select
                              id="edit-reminder-tone"
                              className="habit-select"
                              value={editReminderTone}
                              onChange={(e) => setEditReminderTone(e.target.value)}
                            >
                              {TONE_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>

                          <div className="habit-field">
                            <label>Frequency (Scheduled days)</label>
                            <div className="habit-day-picker">
                              {[1, 2, 3, 4, 5, 6, 7].map((day, idx) => {
                                const active = editScheduledDays.includes(day)
                                return (
                                  <div
                                    key={day}
                                    className={`habit-day-opt ${active ? 'active' : ''}`}
                                    onClick={() => toggleEditDay(day)}
                                  >
                                    {DAY_LABELS[idx]}
                                  </div>
                                )
                              })}
                            </div>
                          </div>

                          <div className="habit-danger-zone">
                            <div className="habit-danger-row">
                              <div>
                                <div className="t">{selectedHabitDetail.is_active ? 'Pause this habit' : 'Resume this habit'}</div>
                                <div className="s">{selectedHabitDetail.is_active ? 'Stop tracking without losing your history' : 'Reactivate habit tracking'}</div>
                              </div>
                              <button
                                type="button"
                                className="habit-btn-danger-outline"
                                onClick={handlePauseHabit}
                                disabled={isPausing}
                              >
                                {isPausing ? 'Updating...' : (selectedHabitDetail.is_active ? 'Pause' : 'Resume')}
                              </button>
                            </div>

                            <div className="habit-danger-row" style={{ marginTop: '14px' }}>
                              <div>
                                <div className="t">Delete habit</div>
                                <div className="s">Removes this habit and its history permanently</div>
                              </div>
                              <button
                                type="button"
                                className="habit-btn habit-btn-danger"
                                onClick={confirmDeleteHabit}
                                disabled={isDeleting}
                              >
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
              <button type="button" className="habit-btn habit-btn-outline" onClick={() => setShowViewAllHabitsModal(false)}>Close</button>
              {selectedHabitTab === 'edit' && (
                <button
                  type="button"
                  className="habit-btn habit-btn-primary"
                  onClick={handleSaveHabit}
                  disabled={isSaving || !selectedHabitId}
                >
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
