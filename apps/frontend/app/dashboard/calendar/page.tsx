'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useDashboard } from '../context'

type ViewMode = 'month' | 'week'

export default function CalendarPage() {
  const { authToken, setBoardId: setContextBoardId, setRefreshDataFn, setShowColumnField, showAddTask, setShowAddTask } = useDashboard()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [cards, setCards] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [boardId, setBoardId] = useState<string | null>(null)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Initialize workspace and fetch data
  useEffect(() => {
    const initializeWorkspace = async () => {
      if (!authToken) return

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }

        // Get workspace
        const workspacesResponse = await fetch('http://localhost:3001/api/workspaces', { headers })
        if (!workspacesResponse.ok) throw new Error('Failed to fetch workspaces')
        
        const workspaces = await workspacesResponse.json()
        let workspaceId = workspaces[0]?.id

        if (!workspaceId) {
          const createWorkspaceResponse = await fetch('http://localhost:3001/api/workspaces', {
            method: 'POST',
            headers,
            body: JSON.stringify({ name: 'My Workspace', description: 'Personal workspace' })
          })
          if (!createWorkspaceResponse.ok) throw new Error('Failed to create workspace')
          const workspace = await createWorkspaceResponse.json()
          workspaceId = workspace.id
        }

        // Get board
        const boardsResponse = await fetch(`http://localhost:3001/api/boards?workspace_id=${workspaceId}`, { headers })
        if (!boardsResponse.ok) throw new Error('Failed to fetch boards')
        
        const boards = await boardsResponse.json()
        let currentBoardId = boards[0]?.id

        if (!currentBoardId) {
          const createBoardResponse = await fetch('http://localhost:3001/api/boards', {
            method: 'POST',
            headers,
            body: JSON.stringify({ workspace_id: workspaceId, name: 'My Board', description: 'Personal board' })
          })
          if (!createBoardResponse.ok) throw new Error('Failed to create board')
          const board = await createBoardResponse.json()
          currentBoardId = board.id
        }

        setBoardId(currentBoardId)
        setContextBoardId(currentBoardId)

        // Fetch cards
        const cardsResponse = await fetch(`http://localhost:3001/api/cards?board_id=${currentBoardId}`, { headers })
        if (!cardsResponse.ok) throw new Error('Failed to fetch cards')
        
        const cardsData = await cardsResponse.json()
        setCards(cardsData)
      } catch (error) {
        console.error('Error initializing calendar:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeWorkspace()
  }, [authToken, setContextBoardId])

  // Create a refresh function that can be called by context/modals
  const refreshData = async () => {
    if (!authToken || !boardId) return
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }

      const cardsResponse = await fetch(`http://localhost:3001/api/cards?board_id=${boardId}`, { headers })
      if (!cardsResponse.ok) throw new Error('Failed to fetch cards')
      
      const cardsData = await cardsResponse.json()
      setCards(cardsData)
    } catch (error) {
      console.error('Error refreshing calendar:', error)
    }
  }

  // Set the refresh function in context when it changes
  useEffect(() => {
    setRefreshDataFn(refreshData)
  }, [boardId, authToken, setRefreshDataFn])

  // Disable column field for calendar page
  useEffect(() => {
    setShowColumnField(false)
  }, [setShowColumnField])

  // Calendar navigation
  const goToPrevious = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
    } else {
      const prevWeek = new Date(currentDate)
      prevWeek.setDate(prevWeek.getDate() - 7)
      setCurrentDate(prevWeek)
    }
  }

  const goToNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
    } else {
      const nextWeek = new Date(currentDate)
      nextWeek.setDate(nextWeek.getDate() + 7)
      setCurrentDate(nextWeek)
    }
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Calendar cell computations
  const calendarCells = useMemo(() => {
    if (viewMode === 'month') {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      const startDayOfWeek = startOfMonth.getDay()
      const daysInMonth = endOfMonth.getDate()

      const cells: (Date | null)[] = []
      for (let i = 0; i < startDayOfWeek; i++) {
        cells.push(null)
      }
      for (let d = 1; d <= daysInMonth; d++) {
        cells.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), d))
      }
      return cells
    } else {
      // Week View Mode: 7 days starting from Sunday of the current date's week
      const current = new Date(currentDate)
      const dayOfWeek = current.getDay()
      const sunday = new Date(current)
      sunday.setDate(current.getDate() - dayOfWeek)

      const cells: (Date | null)[] = []
      for (let i = 0; i < 7; i++) {
        const day = new Date(sunday)
        day.setDate(sunday.getDate() + i)
        cells.push(day)
      }
      return cells
    }
  }, [currentDate, viewMode])

  // Get tasks for a specific date (from creation date to due date)
  const getTasksForDate = (date: Date) => {
    if (!date) return []
    const dateStr = date.toDateString()
    return cards.filter(card => {
      if (!card.due_date) return false
      
      const dueDate = new Date(card.due_date)
      const dueDateStr = dueDate.toDateString()
      
      const creationDate = card.created_at ? new Date(card.created_at) : new Date()
      const creationDateStr = creationDate.toDateString()
      
      const targetDate = new Date(dateStr)
      const startDate = new Date(creationDateStr)
      const endDate = new Date(dueDateStr)
      
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(0, 0, 0, 0)
      targetDate.setHours(0, 0, 0, 0)
      
      return targetDate >= startDate && targetDate <= endDate
    })
  }

  // Get task position in date range (start, middle, end, or single day)
  const getTaskPosition = (card: any, date: Date) => {
    if (!card.due_date) return 'single'
    
    const dueDate = new Date(card.due_date)
    const creationDate = card.created_at ? new Date(card.created_at) : new Date()
    
    const startDate = new Date(creationDate.toDateString())
    const endDate = new Date(dueDate.toDateString())
    const targetDate = new Date(date.toDateString())
    
    if (startDate.getTime() === endDate.getTime()) {
      return 'single'
    } else if (targetDate.getTime() === startDate.getTime()) {
      return 'start'
    } else if (targetDate.getTime() === endDate.getTime()) {
      return 'end'
    } else {
      return 'middle'
    }
  }

  // Create a row mapping using interval scheduling — ensures overlapping tasks never share a row
  const taskRowMap = useMemo(() => {
    const map = new Map<string, number>()
    const tasksWithDates = cards.filter(c => c.due_date)

    const sorted = [...tasksWithDates].sort((a, b) => {
      const aStart = a.created_at ? new Date(a.created_at).getTime() : Date.now()
      const bStart = b.created_at ? new Date(b.created_at).getTime() : Date.now()
      if (aStart !== bStart) return aStart - bStart
      const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2, none: 3 }
      const ap = priorityOrder[a.priority] ?? 3
      const bp = priorityOrder[b.priority] ?? 3
      if (ap !== bp) return ap - bp
      return a.id.localeCompare(b.id)
    })

    sorted.forEach(task => {
      const taskStart = new Date(task.created_at ? new Date(task.created_at).toDateString() : new Date().toDateString())
      const taskEnd   = new Date(new Date(task.due_date).toDateString())
      taskStart.setHours(0, 0, 0, 0)
      taskEnd.setHours(0, 0, 0, 0)

      const usedRows = new Set<number>()
      sorted.forEach(other => {
        if (other.id === task.id || !map.has(other.id)) return
        const otherStart = new Date(other.created_at ? new Date(other.created_at).toDateString() : new Date().toDateString())
        const otherEnd   = new Date(new Date(other.due_date).toDateString())
        otherStart.setHours(0, 0, 0, 0)
        otherEnd.setHours(0, 0, 0, 0)
        if (taskStart <= otherEnd && taskEnd >= otherStart) {
          usedRows.add(map.get(other.id)!)
        }
      })

      let row = 1
      while (usedRows.has(row) && row <= 5) row++
      map.set(task.id, row)
    })

    return map
  }, [cards])

  const getTaskRow = (card: any) => {
    if (!card.due_date) return 1
    return taskRowMap.get(card.id) || 1
  }

  // Quick Statistics for Calendar Dashboard
  const stats = useMemo(() => {
    const totalScheduled = cards.filter(c => c.due_date).length
    const completed = cards.filter(c => c.due_date && c.column_status === 'done').length
    const highPriority = cards.filter(c => c.due_date && c.priority === 'high' && c.column_status !== 'done').length
    const pending = cards.filter(c => c.due_date && c.column_status !== 'done').length

    return { totalScheduled, completed, highPriority, pending }
  }, [cards])

  // Format due date label
  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null
    const date = new Date(dueDate)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
    
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  const toggleTask = async (id: string) => {
    const card = cards.find(c => c.id === id)
    if (!card) return

    const newStatus = card.column_status === 'done' ? 'todo' : 'done'

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      const response = await fetch(`http://localhost:3001/api/cards/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ column_status: newStatus })
      })

      if (!response.ok) {
        throw new Error('Failed to update card')
      }

      setCards(cards.map(c => 
        c.id === id ? { ...c, column_status: newStatus } : c
      ))
    } catch (error) {
      console.error('Error updating card:', error)
      alert('Failed to update card. Please try again.')
    }
  }

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case 'high': return 'priority-high'
      case 'medium': return 'priority-medium'
      case 'low': return 'priority-low'
      default: return 'priority-none'
    }
  }

  if (isLoading) {
    return (
      <div className="screen active calendar-page calendar-loading-screen">
        <div className="calendar-spinner-wrapper">
          <div className="calendar-spinner" />
          <span>Loading your schedule...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="screen active calendar-page">
      {/* Calendar Top Header */}
      <div className="calendar-header">
        <div className="calendar-header-title">
          <h2>Schedule & Calendar</h2>
          <p>Organize, track deadlines, and accomplish your daily milestones</p>
        </div>

        <div className="calendar-header-actions">
          {/* View Switcher: Month vs Week */}
          <div className="calendar-view-switcher">
            <button
              type="button"
              className={`view-tab ${viewMode === 'month' ? 'active' : ''}`}
              onClick={() => setViewMode('month')}
            >
              Month
            </button>
            <button
              type="button"
              className={`view-tab ${viewMode === 'week' ? 'active' : ''}`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
          </div>

          {/* Month / Week Navigation */}
          <div className="calendar-nav">
            <button 
              onClick={goToToday}
              className="btn btn-outline btn-today"
            >
              Today
            </button>
            <div className="calendar-nav-controls">
              <button 
                onClick={goToPrevious}
                className="btn btn-icon"
                title="Previous"
                aria-label="Previous Period"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <span className="calendar-nav-month">
                {viewMode === 'month' 
                  ? currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
                  : `Week of ${calendarCells[0]?.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                }
              </span>
              <button 
                onClick={goToNext}
                className="btn btn-icon"
                title="Next"
                aria-label="Next Period"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>

            <button 
              type="button"
              className="new-task-btn"
              onClick={() => setShowAddTask(!showAddTask)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              New Task
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview Bar */}
      <div className="calendar-stats-bar">
        <div className="stat-card">
          <div className="stat-icon scheduled">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.totalScheduled}</span>
            <span className="stat-label">Scheduled Tasks</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon pending">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon priority">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.highPriority}</span>
            <span className="stat-label">High Priority</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon completed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div className="stat-info">
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      </div>

      {/* Main Calendar Card */}
      <div className={`calendar-card mode-${viewMode}`}>
        {/* Weekday Headers */}
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid Cells */}
        <div className="calendar-grid">
          {calendarCells.map((cell, idx) => {
            if (!cell) return (
              <div key={`empty-${idx}`} className="calendar-cell empty" />
            )
            
            const cellDateStr = cell.toDateString()
            const dayTasks = getTasksForDate(cell)
            const isToday = cell.toDateString() === new Date().toDateString()

            return (
              <div
                key={cellDateStr}
                className={`calendar-cell ${isToday ? 'today' : ''}`}
                onClick={() => {
                  setSelectedDate(cell)
                  setIsPopupOpen(true)
                }}
              >
                <div className="calendar-cell-header">
                  <span className={`calendar-cell-date ${isToday ? 'is-today-badge' : ''}`}>
                    {cell.getDate()}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="calendar-cell-count" title={`${dayTasks.length} task(s)`}>
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                <div className="calendar-cell-tasks">
                  {Array.from({ length: 5 }).map((_, rowIndex) => {
                    const task = dayTasks.find(t => getTaskRow(t) === rowIndex + 1)
                    if (!task) return null
                    
                    const position = getTaskPosition(task, cell)
                    const isDone = task.column_status === 'done'
                    
                    const formatDueTime = (dueDate: string | null) => {
                      if (!dueDate) return ''
                      const date = new Date(dueDate)
                      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                    }

                    return (
                      <div
                        key={task.id}
                        className={`calendar-task ${isDone ? 'done' : ''} ${getPriorityClass(task.priority)} task-${position}`}
                        style={{ background: task.color || 'var(--primary-tint, #eff6ff)', gridRowStart: rowIndex + 1 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleTask(task.id)
                        }}
                        title={`${task.title} ${isDone ? '(Completed)' : ''}`}
                      >
                        {position === 'start' || position === 'single' ? (
                          <span className="task-pill-text">{task.title}</span>
                        ) : position === 'end' ? (
                          <span className="task-pill-time">{formatDueTime(task.due_date)}</span>
                        ) : null}
                      </div>
                    )
                  })}
                  {dayTasks.filter(t => getTaskRow(t) > 5).length > 0 && (
                    <div className="calendar-task-more">
                      +{dayTasks.filter(t => getTaskRow(t) > 5).length} more
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Upcoming Tasks Section */}
      <div className="upcoming-section">
        <div className="upcoming-section-header">
          <div>
            <h3>Upcoming Deadlines</h3>
            <p>Priority items scheduled in your queue</p>
          </div>
          <span className="upcoming-count-badge">
            {cards.filter(c => c.due_date && c.column_status !== 'done').length} Active
          </span>
        </div>

        <div className="upcoming-grid">
          {cards
            .filter(card => card.due_date && (card.column_status === 'todo' || card.column_status === 'review'))
            .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
            .slice(0, 6)
            .map(card => (
              <div
                key={card.id}
                className="kcard"
                style={{
                  background: card.color
                    ? `linear-gradient(to right, ${card.color}99 0%, var(--surface) 100%)`
                    : undefined,
                  borderLeft: card.color ? `4px solid ${card.color}` : undefined,
                  cursor: 'pointer'
                }}
                onClick={() => toggleTask(card.id)}
              >
                <div className="kcard-header">
                  {card.priority ? (
                    <div className={`kcard-importance ${card.priority}`}>
                      {card.priority.charAt(0).toUpperCase() + card.priority.slice(1)}
                    </div>
                  ) : <div />}
                  {card.labels && card.labels[0] && (
                    <span className="tag tag-work" style={{ fontSize: '10.5px', padding: '2px 7px' }}>
                      {card.labels[0].name}
                    </span>
                  )}
                </div>

                <div className="kcard-title">{card.title}</div>

                {card.description && (
                  <div className="kcard-description">{card.description}</div>
                )}

                <div className="kcard-footer">
                  {formatDueDate(card.due_date) ? (
                    <div className="kcard-due">
                      <svg viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                        <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.8"/>
                      </svg>
                      {formatDueDate(card.due_date)}
                    </div>
                  ) : <div />}

                  {card.assignees && card.assignees.length > 0 && card.assignees[0]?.initials ? (
                    <span className="avatar" style={{ background: 'var(--primary)' }}>{card.assignees[0].initials}</span>
                  ) : null}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Day Tasks Popup */}
      {isPopupOpen && selectedDate && (
        <div className="calendar-popup-overlay" onClick={() => setIsPopupOpen(false)}>
          <div className="calendar-popup" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-popup-header">
              <div>
                <h3>
                  {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </h3>
                <span className="calendar-popup-sub">
                  {getTasksForDate(selectedDate).length} task(s) scheduled
                </span>
              </div>
              <button 
                type="button"
                className="calendar-popup-close"
                onClick={() => setIsPopupOpen(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="calendar-popup-content">
              {getTasksForDate(selectedDate).length === 0 ? (
                <div className="calendar-popup-empty">
                  <div className="empty-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                  </div>
                  <p>No tasks scheduled for this date</p>
                  <button 
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => {
                      setIsPopupOpen(false)
                      setShowAddTask(true)
                    }}
                  >
                    + Add Task
                  </button>
                </div>
              ) : (
                <div className="calendar-popup-tasks">
                  {getTasksForDate(selectedDate).map(task => (
                    <div
                      key={task.id}
                      className={`kcard ${task.column_status === 'done' ? 'done' : ''}`}
                      style={{
                        background: task.color
                          ? `linear-gradient(to right, ${task.color}99 0%, var(--surface) 100%)`
                          : undefined,
                        borderLeft: task.color ? `4px solid ${task.color}` : undefined,
                        cursor: 'pointer',
                        opacity: task.column_status === 'done' ? 0.6 : 1,
                      }}
                      onClick={() => toggleTask(task.id)}
                    >
                      <div className="kcard-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div className="calendar-popup-checkbox" style={{ marginTop: 0 }}>
                            {task.column_status === 'done' ? (
                              <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18, color: 'var(--primary, #d97706)' }}>
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                              </svg>
                            ) : (
                              <div className="checkbox-ring" style={{ width: 16, height: 16 }} />
                            )}
                          </div>
                          {task.priority ? (
                            <div className={`kcard-importance ${task.priority}`}>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </div>
                          ) : null}
                        </div>
                        {task.labels && task.labels[0] && (
                          <span className="tag tag-work" style={{ fontSize: '10.5px', padding: '2px 7px' }}>
                            {task.labels[0].name}
                          </span>
                        )}
                      </div>

                      <div className="kcard-title" style={{ textDecoration: task.column_status === 'done' ? 'line-through' : 'none' }}>
                        {task.title}
                      </div>

                      {task.description && (
                        <div className="kcard-description">{task.description}</div>
                      )}

                      <div className="kcard-footer">
                        {formatDueDate(task.due_date) ? (
                          <div className="kcard-due">
                            <svg viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8"/>
                              <polyline points="12 6 12 12 16 14" stroke="currentColor" strokeWidth="1.8"/>
                            </svg>
                            {formatDueDate(task.due_date)}
                          </div>
                        ) : <div />}

                        {task.assignees && task.assignees.length > 0 && task.assignees[0]?.initials ? (
                          <span className="avatar" style={{ background: 'var(--primary)' }}>{task.assignees[0].initials}</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="calendar-popup-footer">
              <button 
                type="button" 
                className="btn btn-primary btn-sm"
                onClick={() => {
                  setIsPopupOpen(false)
                  setShowAddTask(true)
                }}
              >
                + New Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
