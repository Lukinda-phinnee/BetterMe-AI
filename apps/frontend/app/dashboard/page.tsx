'use client'

import { useState, useEffect } from 'react'
import { useDashboard } from './context'
import { AIGoalDecomposer } from '../../components/ai-goal-decomposer'

export default function DashboardPage() {
  const { showReviewColumn, setShowReviewColumn, showAddTask, setShowAddTask, authToken, setBoardId: setContextBoardId, setRefreshDataFn } = useDashboard()
  const [cards, setCards] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [boardId, setBoardId] = useState<string | null>(null)
  const [coachMessage, setCoachMessage] = useState<string | null>(null)
  const [coachLoading, setCoachLoading] = useState(false)
  const [showGoalDecomposer, setShowGoalDecomposer] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null)

  // Fetch cards from backend
  useEffect(() => {
    const fetchCards = async () => {
      if (!authToken) return

      try {
        // First get the workspace
        const workspacesResponse = await fetch('http://localhost:3001/api/workspaces', {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        })

        if (!workspacesResponse.ok) {
          throw new Error('Failed to fetch workspaces')
        }

        const workspaces = await workspacesResponse.json()
        let workspaceId = workspaces[0]?.id

        if (!workspaceId) {
          // Create workspace if none exists
          const createWorkspaceResponse = await fetch('http://localhost:3001/api/workspaces', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ name: 'My Workspace', description: 'Personal workspace' })
          })

          if (!createWorkspaceResponse.ok) {
            throw new Error('Failed to create workspace')
          }

          const workspace = await createWorkspaceResponse.json()
          workspaceId = workspace.id
        }

        const boardsResponse = await fetch(`http://localhost:3001/api/boards?workspace_id=${workspaceId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        })

        let currentBoardId

        if (!boardsResponse.ok || boardsResponse.status === 404) {
          // Create board if none exists
          const createBoardResponse = await fetch('http://localhost:3001/api/boards', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify({ workspace_id: workspaceId, name: 'My Board', description: 'Personal board' })
          })

          if (!createBoardResponse.ok) {
            throw new Error('Failed to create board')
          }

          const board = await createBoardResponse.json()
          currentBoardId = board.id
        } else {
          const boards = await boardsResponse.json()
          currentBoardId = boards[0]?.id

          if (!currentBoardId) {
            // Create board if empty array
            const createBoardResponse = await fetch('http://localhost:3001/api/boards', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
              },
              body: JSON.stringify({ workspace_id: workspaceId, name: 'My Board', description: 'Personal board' })
            })

            if (!createBoardResponse.ok) {
              throw new Error('Failed to create board')
            }

            const board = await createBoardResponse.json()
            currentBoardId = board.id
          }
        }

        setBoardId(currentBoardId)
        setContextBoardId(currentBoardId)

        // Fetch cards for the board
        const cardsResponse = await fetch(`http://localhost:3001/api/cards?board_id=${currentBoardId}`, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        })

        if (!cardsResponse.ok) {
          throw new Error('Failed to fetch cards')
        }

        const cardsData = await cardsResponse.json()
        setCards(cardsData)
      } catch (error) {
        console.error('Error fetching cards:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCards()
  }, [authToken])

  // Create a refresh function that can be called by the modal
  const refreshData = async () => {
    if (!authToken || !boardId) return
    
    try {
      const cardsResponse = await fetch(`http://localhost:3001/api/cards?board_id=${boardId}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      })

      if (!cardsResponse.ok) {
        throw new Error('Failed to fetch cards')
      }

      const cardsData = await cardsResponse.json()
      setCards(cardsData)
    } catch (error) {
      console.error('Error refreshing cards:', error)
    }
  }

  // Set the refresh function in context when it changes
  useEffect(() => {
    setRefreshDataFn(refreshData)
  }, [boardId, authToken, setRefreshDataFn])

  // Calculate column counts from live data
  const columnData = [
    { id: 'todo', name: 'To do', count: cards.filter(c => c.column_status === 'todo').length, color: 'var(--primary)', icon: 'checklist' },
    { id: 'inProgress', name: 'In progress', count: cards.filter(c => c.column_status === 'in-progress').length, color: '#f59e0b', icon: 'spinner' },
    { id: 'review', name: 'Review', count: cards.filter(c => c.column_status === 'review').length, color: '#8b5cf6', icon: 'magnifier' },
    { id: 'done', name: 'Done', count: cards.filter(c => c.column_status === 'done').length, color: '#22c55e', icon: 'check' },
  ]

  // Calculate completion statistics for growth ring
  const totalCards = cards.length
  const completedCards = cards.filter(c => c.column_status === 'done').length
  const completionRate = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0
  const circumference = 2 * Math.PI * 26
  const strokeDashoffset = circumference - (completionRate / 100) * circumference

  // Convert cards to task format for nearest tasks (only todo and review)
  const tasks = cards
    .filter(card => card.column_status === 'todo' || card.column_status === 'review')
    .map(card => ({
      id: card.id,
      title: card.title,
      done: card.column_status === 'done',
      tag: card.labels?.[0]?.name || 'Work',
      tagType: 'work',
      due: card.due_date ? new Date(card.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : 'No due date',
      description: card.description || ''
    }))
  const [schedulePage, setSchedulePage] = useState(0)

  // Fetch AI coaching insights
  useEffect(() => {
    const fetchCoaching = async () => {
      if (!authToken || cards.length === 0) return

      setCoachLoading(true)
      try {
        const taskHistory = cards.map(card => ({
          title: card.title,
          completed: card.column_status === 'done',
          overdue: card.due_date && new Date(card.due_date) < new Date() && card.column_status !== 'done',
          category: card.labels?.[0]?.name,
          completionTime: card.column_status === 'done' ? 30 : undefined // Mock completion time
        }))

        const response = await fetch('http://localhost:3001/api/ai/coaching', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          },
          body: JSON.stringify({
            message: `Here's what's on my plate this week:\n${taskHistory
              .map(t => `- ${t.title}${t.completed ? ' (done)' : t.overdue ? ' (overdue)' : ''}`)
              .join('\n')}`,
          })
        })

        if (response.ok) {
          const data = await response.json()
          setCoachMessage(data.response || "You're making great progress! Keep up the momentum.")
        }
      } catch (error) {
        console.error('Error fetching coaching:', error)
        setCoachMessage("You're making progress on your tasks. Keep going!")
      } finally {
        setCoachLoading(false)
      }
    }

    fetchCoaching()
  }, [cards, authToken])

  // Get today's schedule from real data
  const getTodaySchedule = () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    // Filter cards due today
    const todayCards = cards.filter(card => {
      if (!card.due_date) return false
      const dueDate = new Date(card.due_date)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate.getTime() === today.getTime()
    })
    
    // Sort by due time
    const sortedCards = todayCards.sort((a, b) => {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
    })
    
    // Convert to schedule format
    const colors = ['#e0f2fe', '#fef3c7', '#d1fae5', '#ede9fe', '#fce7f3', '#e0f2fe']
    return sortedCards.map((card, index) => {
      const dueDate = new Date(card.due_date)
      const startTime = dueDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      
      // Estimate duration (could be enhanced with actual duration data)
      const endTime = new Date(dueDate.getTime() + 60 * 60 * 1000) // Add 1 hour default
      const endTimeStr = endTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      
      return {
        time: startTime,
        name: card.title,
        duration: `${startTime} to ${endTimeStr}`,
        color: colors[index % colors.length],
        cardId: card.id
      }
    })
  }
  
  const scheduleItems = getTodaySchedule()

  const itemsPerPage = 3
  const totalPages = Math.ceil(scheduleItems.length / itemsPerPage)
  const currentItems = scheduleItems.slice(schedulePage * itemsPerPage, (schedulePage + 1) * itemsPerPage)

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

  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.due) return 1
    if (!b.due) return -1
    return new Date(a.due).getTime() - new Date(b.due).getTime()
  })

  const getDueDateColor = (due: string) => {
    if (!due) return 'var(--muted)'
    
    const now = new Date()
    const dueDate = new Date(due)
    const diffHours = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (diffHours < 0) return '#ef4444' // Overdue - red
    if (diffHours < 2) return '#f59e0b' // Urgent - orange
    if (diffHours < 24) return '#8b5cf6' // Soon - purple
    return '#22c55e' // Later - green
  }

  const getTodayDate = () => {
    const date = new Date()
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' }
    return date.toLocaleDateString('en-US', options)
  }

  return (
    <div className="screen active">
      <div className="screen" style={{display: 'block', paddingTop: 0}}>
        <div className="dash-grid">
          <div>
            <div className="card coach-card">
              <div className="coach-eyebrow">Coach</div>
              {coachLoading ? (
                <div className="coach-msg">Analyzing your progress...</div>
              ) : coachMessage ? (
                <div className="coach-msg">{coachMessage}</div>
              ) : null}
              <div className="coach-actions">
                <button 
                  className="btn btn-solid"
                  onClick={() => {
                    const overdueTask = cards.find(c => c.due_date && new Date(c.due_date) < new Date() && c.column_status !== 'done')
                    if (overdueTask) {
                      setSelectedGoal(overdueTask.title)
                      setShowGoalDecomposer(true)
                    } else {
                      setSelectedGoal('Complete my tasks')
                      setShowGoalDecomposer(true)
                    }
                  }}
                >
                  Break it down
                </button>
                <button 
                  className="btn btn-light"
                  onClick={() => setCoachMessage(null)}
                >
                  Not today
                </button>
              </div>
            </div>

            {showGoalDecomposer && selectedGoal && (
              <div className="card" style={{marginTop: 8}}>
                <div className="coach-eyebrow">Goal Decomposition</div>
                <div style={{padding: 16}}>
                  <p style={{marginBottom: 12, fontSize: 14}}>Breaking down: <strong>{selectedGoal}</strong></p>
                  <AIGoalDecomposer goalText={selectedGoal} onClose={() => setShowGoalDecomposer(false)} />
                </div>
              </div>
            )}

            {/* Column Cards */}
            <div className={`myday-cols ${showReviewColumn ? 'show-review' : ''}`} style={{marginTop: 8}}>
              {columnData.map((col) => (
                <div 
                  key={col.id} 
                  className={`myday-col-card ${col.id === 'review' && !showReviewColumn ? 'hidden' : ''} ${col.id}`}
                  style={{borderColor: col.id === 'todo' ? 'transparent' : col.color}}
                >
                  <div className="myday-col-icon">
                    {col.icon === 'checklist' && (
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M9 11l3 3L22 4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {col.icon === 'spinner' && (
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {col.icon === 'magnifier' && (
                      <svg viewBox="0 0 24 24" fill="none">
                        <circle cx="11" cy="11" r="8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                    {col.icon === 'check' && (
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="22 4 12 14.01 9 11.01" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div className="myday-col-info">
                    <div className="myday-col-name">{col.name}</div>
                    <div className="myday-col-count">{col.count}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Nearest To-Do Section */}
            <div style={{marginTop: 8}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8}}>
                <h2 style={{fontSize: 16, fontWeight: 600, margin: 0}}>Your nearest to-do</h2>
                <button style={{background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, fontWeight: 500, cursor: 'pointer'}}>
                  See all to-do →
                </button>
              </div>
              <div className="nearest-tasks-row">
                {sortedTasks.slice(0, 3).map(task => (
                  <div key={task.id} className="nearest-task-card">
                    <div className="nearest-task-left">
                      <div 
                        className={`checkbox ${task.done ? 'done' : ''}`}
                        onClick={() => toggleTask(task.id)}
                      />
                      <div>
                        <div className={`nearest-task-title ${task.done ? 'done' : ''}`}>{task.title}</div>
                        {task.description && <div className="nearest-task-description">{task.description}</div>}
                      </div>
                    </div>
                    <div className="nearest-task-meta">
                      <span className={`tag tag-${task.tagType}`}>{task.tag}</span>
                      {task.due && (
                        <span className="nearest-task-due" style={{color: getDueDateColor(task.due)}}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 4, stroke: getDueDateColor(task.due)}}>
                            <circle cx="12" cy="12" r="10"/>
                            <polyline points="12 6 12 12 16 14"/>
                          </svg>
                          {task.due}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="quick-add" style={{marginTop: 8}}>
                <button 
                  type="button"
                  className="quick-add-trigger"
                  onClick={() => setShowAddTask(!showAddTask)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 5v14M5 12h14"/>
                  </svg>
                  <span>Add a task, or tell the coach what's on your mind…</span>
                </button>
              </div>
            </div>
          </div>

          <div className="side-stack">
            <div className="card">
              <div className="section-title">Task completion rate</div>
              <div className="streak-row">
                <div className="ring-wrap">
                  <svg viewBox="0 0 64 64">
                    <circle className="ring-track" cx="32" cy="32" r="26"/>
                    <circle className="ring-progress" cx="32" cy="32" r="26" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}/>
                  </svg>
                  <div className="ring-label">{completionRate}%</div>
                </div>
                <div>
                  <div style={{fontWeight: 600, fontSize: '14.5px'}}>{completedCards} of {totalCards} tasks completed</div>
                  <div style={{fontSize: '12.5px', color: 'var(--muted)'}}>Based on all your tasks</div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="section-title">This week's focus</div>
              <p style={{fontSize: 14, lineHeight: 1.5, color: 'var(--ink-soft)'}}>
                "Ship the redesign brief without letting it eat the whole week." — from your WOOP goal
              </p>
              <button className="btn btn-outline" style={{marginTop: 14, width: '100%'}}>
                View goal plan →
              </button>
            </div>

            <div className="card">
              <div className="section-title">Today's schedule</div>
              <div className="schedule-list">
                {currentItems.map((item, index) => (
                  <div key={index} className="schedule-item">
                    <div className="schedule-time">{item.time}</div>
                    <div className="schedule-activity-card" style={{backgroundColor: item.color}}>
                      <div className="schedule-activity-name">{item.name}</div>
                      <div className="schedule-activity-duration">{item.duration}</div>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="schedule-pagination">
                  <button 
                    className="pagination-btn"
                    onClick={() => setSchedulePage(Math.max(0, schedulePage - 1))}
                    disabled={schedulePage === 0}
                  >
                    ←
                  </button>
                  <span className="pagination-info">{schedulePage + 1} / {totalPages}</span>
                  <button 
                    className="pagination-btn"
                    onClick={() => setSchedulePage(Math.min(totalPages - 1, schedulePage + 1))}
                    disabled={schedulePage === totalPages - 1}
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
