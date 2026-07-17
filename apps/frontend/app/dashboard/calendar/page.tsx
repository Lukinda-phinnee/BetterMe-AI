'use client'

import React, { useState, useEffect } from 'react'
import { useDashboard } from '../context'

export default function CalendarPage() {
  const { authToken, setBoardId: setContextBoardId, setRefreshDataFn, setShowColumnField, showAddTask, setShowAddTask } = useDashboard()
  const [currentDate, setCurrentDate] = useState(new Date())
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
  }, [authToken])

  // Create a refresh function that can be called by the modal
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
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Calendar calculations
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
  const startDayOfWeek = startOfMonth.getDay()
  const daysInMonth = endOfMonth.getDate()

  const calendarCells: (Date | null)[] = []
  for (let i = 0; i < startDayOfWeek; i++) {
    calendarCells.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), d))
  }

  // Get tasks for a specific date (from creation date to due date)
  const getTasksForDate = (date: Date) => {
    if (!date) return []
    const dateStr = date.toDateString()
    return cards.filter(card => {
      if (!card.due_date) return false
      
      const dueDate = new Date(card.due_date)
      const dueDateStr = dueDate.toDateString()
      
      // Get creation date (if available, otherwise assume today)
      const creationDate = card.created_at ? new Date(card.created_at) : new Date()
      const creationDateStr = creationDate.toDateString()
      
      // Check if current date is within the task's date range
      const currentDate = new Date(dateStr)
      const startDate = new Date(creationDateStr)
      const endDate = new Date(dueDateStr)
      
      // Reset time to compare dates only
      startDate.setHours(0, 0, 0, 0)
      endDate.setHours(0, 0, 0, 0)
      currentDate.setHours(0, 0, 0, 0)
      
      return currentDate >= startDate && currentDate <= endDate
    })
  }

  // Get task position in date range (start, middle, end, or single day)
  const getTaskPosition = (card: any, date: Date) => {
    if (!card.due_date) return 'single'
    
    const dueDate = new Date(card.due_date)
    const dueDateStr = dueDate.toDateString()
    
    const creationDate = card.created_at ? new Date(card.created_at) : new Date()
    const creationDateStr = creationDate.toDateString()
    
    const currentDateStr = date.toDateString()
    
    const startDate = new Date(creationDateStr)
    const endDate = new Date(dueDateStr)
    const currentDate = new Date(currentDateStr)
    
    // Reset time to compare dates only
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(0, 0, 0, 0)
    currentDate.setHours(0, 0, 0, 0)
    
    if (startDate.getTime() === endDate.getTime()) {
      return 'single'
    } else if (currentDate.getTime() === startDate.getTime()) {
      return 'start'
    } else if (currentDate.getTime() === endDate.getTime()) {
      return 'end'
    } else {
      return 'middle'
    }
  }

  // Create a row mapping using interval scheduling — ensures overlapping tasks never share a row
  const taskRowMap = React.useMemo(() => {
    const map = new Map<string, number>()
    const tasksWithDates = cards.filter(c => c.due_date)

    // Sort all tasks by start date, then priority, then id for stable ordering
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

    // For each task assign the lowest row (1,2,3) not taken by any date-overlapping task
    sorted.forEach(task => {
      const taskStart = new Date(task.created_at ? new Date(task.created_at).toDateString() : new Date().toDateString())
      const taskEnd   = new Date(new Date(task.due_date).toDateString())
      taskStart.setHours(0, 0, 0, 0)
      taskEnd.setHours(0, 0, 0, 0)

      // Collect rows used by already-assigned tasks whose date range overlaps this one
      const usedRows = new Set<number>()
      sorted.forEach(other => {
        if (other.id === task.id || !map.has(other.id)) return
        const otherStart = new Date(other.created_at ? new Date(other.created_at).toDateString() : new Date().toDateString())
        const otherEnd   = new Date(new Date(other.due_date).toDateString())
        otherStart.setHours(0, 0, 0, 0)
        otherEnd.setHours(0, 0, 0, 0)
        // Overlap: [taskStart, taskEnd] ∩ [otherStart, otherEnd] is non-empty
        if (taskStart <= otherEnd && taskEnd >= otherStart) {
          usedRows.add(map.get(other.id)!)
        }
      })

      // Pick the lowest available row among 1–5
      let row = 1
      while (usedRows.has(row) && row <= 5) row++
      map.set(task.id, row) // row may exceed 5 for >5 overlapping tasks; those will fall into "+N more"
    })

    return map
  }, [cards])

  // Assign row numbers to tasks for consistent positioning across days
  const getTaskRow = (card: any) => {
    if (!card.due_date) return 1
    return taskRowMap.get(card.id) || 1
  }

  // Format date for display
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
      <div className="screen active calendar-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--muted)' }}>Loading calendar...</div>
      </div>
    )
  }

  return (
    <div className="screen active calendar-page">
      {/* Header */}
      <div className="calendar-header">
        <div className="calendar-header-title">
          <h2>Calendar</h2>
          <p>View and manage your tasks by due date</p>
        </div>
        <div className="calendar-nav">
          <button 
            onClick={goToToday}
            className="btn btn-outline"
          >
            Today
          </button>
          <button 
            onClick={goToPreviousMonth}
            className="btn btn-light"
          >
            ←
          </button>
          <span className="calendar-nav-month">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </span>
          <button 
            onClick={goToNextMonth}
            className="btn btn-light"
          >
            →
          </button>
          <button 
            type="button"
            className="new-task-btn"
            onClick={() => setShowAddTask(!showAddTask)}
            style={{ marginLeft: '12px' }}
          >
            <svg viewBox="0 0 24 24" fill="none">
              <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round"/>
              <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            New Task
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-card">
        {/* Day Headers */}
        <div className="calendar-weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
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
                <div className="calendar-cell-date">
                  {cell.getDate()}
                </div>
                <div className="calendar-cell-tasks">
                  {Array.from({ length: 5 }).map((_, rowIndex) => {
                    const task = dayTasks.find(t => getTaskRow(t) === rowIndex + 1)
                    if (!task) return null
                    
                    const position = getTaskPosition(task, cell)
                    const isDueDate = position === 'end'
                    
                    // Format due time
                    const formatDueTime = (dueDate: string | null) => {
                      if (!dueDate) return ''
                      const date = new Date(dueDate)
                      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
                    }
                    
                    return (
                      <div
                        key={task.id}
                        className={`calendar-task ${task.column_status === 'done' ? 'done' : ''} ${getPriorityClass(task.priority)} task-${position}`}
                        style={{ background: task.color || '#93c5fd', gridRowStart: rowIndex + 1 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleTask(task.id)
                        }}
                        title={task.title}
                      >
                        {position === 'start' || position === 'single' ? task.title : position === 'end' ? formatDueTime(task.due_date) : ''}
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
        <h3>Upcoming Tasks</h3>
        <div className="upcoming-grid">
          {cards
            .filter(card => card.due_date && (card.column_status === 'todo' || card.column_status === 'review'))
            .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
            .slice(0, 6)
            .map(card => (
              <div
                key={card.id}
                className={`upcoming-card ${getPriorityClass(card.priority)}`}
                style={{ background: card.color || 'var(--surface)' }}
                onClick={() => toggleTask(card.id)}
              >
                <div className="upcoming-card-header">
                  <span className="upcoming-card-date">
                    {formatDueDate(card.due_date)}
                  </span>
                  {card.priority && (
                    <span className={`upcoming-card-priority ${getPriorityClass(card.priority)}`}>
                      {card.priority}
                    </span>
                  )}
                </div>
                <div className="upcoming-card-title">
                  {card.title}
                </div>
                {card.description && (
                  <div className="upcoming-card-description">
                    {card.description}
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Day Tasks Popup */}
      {isPopupOpen && selectedDate && (
        <div className="calendar-popup-overlay" onClick={() => setIsPopupOpen(false)}>
          <div className="calendar-popup" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-popup-header">
              <h3>
                {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              <button 
                className="calendar-popup-close"
                onClick={() => setIsPopupOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="calendar-popup-content">
              {getTasksForDate(selectedDate).length === 0 ? (
                <div className="calendar-popup-empty">
                  No tasks for this day
                </div>
              ) : (
                <div className="calendar-popup-tasks">
                  {getTasksForDate(selectedDate).map(task => (
                    <div
                      key={task.id}
                      className={`calendar-popup-task ${task.column_status === 'done' ? 'done' : ''} ${getPriorityClass(task.priority)}`}
                      style={{ background: task.color || '#93c5fd' }}
                      onClick={() => toggleTask(task.id)}
                    >
                      <div className="calendar-popup-task-header">
                        <span className="calendar-popup-task-title">{task.title}</span>
                        {task.priority && (
                          <span className={`calendar-popup-task-priority ${getPriorityClass(task.priority)}`}>
                            {task.priority}
                          </span>
                        )}
                      </div>
                      {task.description && (
                        <div className="calendar-popup-task-description">
                          {task.description}
                        </div>
                      )}
                      {task.due_date && (
                        <div className="calendar-popup-task-due">
                          Due: {formatDueDate(task.due_date)} at {new Date(task.due_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
