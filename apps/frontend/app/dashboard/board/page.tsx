'use client'

import { API_BASE_URL } from '@/lib/config'
import { useState, useEffect } from 'react'
import { useDashboard } from '../context'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

export default function BoardPage() {
  const { showReviewColumn, setShowReviewColumn, showAddTask, setShowAddTask, authToken, setBoardId: setContextBoardId, setRefreshDataFn, setShowColumnField } = useDashboard()
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [activeView, setActiveView] = useState('board')
  const [columnMenus, setColumnMenus] = useState<{[key: string]: boolean}>({})
  const [boardId, setBoardId] = useState<string | null>(null)
  const [listIds, setListIds] = useState<{
    todo: string | null
    'in-progress': string | null
    review: string | null
    done: string | null
  }>({
    todo: null,
    'in-progress': null,
    review: null,
    done: null
  })
  const [cards, setCards] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCard, setSelectedCard] = useState<any | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editTaskTitle, setEditTaskTitle] = useState('')
  const [editTaskDescription, setEditTaskDescription] = useState('')
  const [editTaskPriority, setEditTaskPriority] = useState('medium')
  const [editTaskDue, setEditTaskDue] = useState('')
  const [editTaskColor, setEditTaskColor] = useState('#93c5fd')
  const [editTaskColumn, setEditTaskColumn] = useState('todo')
  const [currentDate, setCurrentDate] = useState(new Date())
  
  // Filter states
  const [filterMenuOpen, setFilterMenuOpen] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [dueDateFilter, setDueDateFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all')
  const [labelFilter, setLabelFilter] = useState<string>('all')

  const initializeWorkspace = async () => {
    if (!authToken) {
      console.log('No auth token available')
      return
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }

      console.log('Fetching workspaces...')
      const workspacesResponse = await fetch(`${API_BASE_URL}/api/workspaces`, { headers })
      console.log('Workspaces response status:', workspacesResponse.status)
      
      if (!workspacesResponse.ok) {
        const errorText = await workspacesResponse.text()
        console.error('Failed to fetch workspaces:', errorText)
        throw new Error(`Failed to fetch workspaces: ${workspacesResponse.status}`)
      }
      
      const workspaces = await workspacesResponse.json()
      console.log('Workspaces:', workspaces)
      
      let workspaceId = workspaces[0]?.id
      
      if (!workspaceId) {
        console.log('No workspace found, creating new one...')
        const createWorkspaceResponse = await fetch(`${API_BASE_URL}/api/workspaces`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ name: 'My Workspace', description: 'Personal workspace' })
        })
        console.log('Create workspace response status:', createWorkspaceResponse.status)
        
        if (!createWorkspaceResponse.ok) {
          const errorText = await createWorkspaceResponse.text()
          console.error('Failed to create workspace:', errorText)
          throw new Error(`Failed to create workspace: ${createWorkspaceResponse.status}`)
        }
        
        const workspace = await createWorkspaceResponse.json()
        console.log('Created workspace:', workspace)
        workspaceId = workspace.id
      }

      console.log('Fetching boards for workspace:', workspaceId)
      const boardsResponse = await fetch(`${API_BASE_URL}/api/boards?workspace_id=${workspaceId}`, { headers })
      console.log('Boards response status:', boardsResponse.status)
      
      if (!boardsResponse.ok) {
        const errorText = await boardsResponse.text()
        console.error('Failed to fetch boards:', errorText)
        throw new Error(`Failed to fetch boards: ${boardsResponse.status}`)
      }
      
      const boards = await boardsResponse.json()
      console.log('Boards:', boards)
      
      let currentBoardId = boards[0]?.id
      
      if (!currentBoardId) {
        console.log('No board found, creating new one...')
        const createBoardResponse = await fetch(`${API_BASE_URL}/api/boards`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ workspace_id: workspaceId, name: 'My Board', description: 'Personal board' })
        })
        console.log('Create board response status:', createBoardResponse.status)
        
        if (!createBoardResponse.ok) {
          const errorText = await createBoardResponse.text()
          console.error('Failed to create board:', errorText)
          throw new Error(`Failed to create board: ${createBoardResponse.status}`)
        }
        
        const board = await createBoardResponse.json()
        console.log('Created board:', board)
        currentBoardId = board.id
      }

      console.log('Setting board ID:', currentBoardId)
      setBoardId(currentBoardId)
      setContextBoardId(currentBoardId)
    } catch (error) {
      console.error('Error initializing workspace:', error)
      alert(`Failed to initialize workspace: ${error}`)
    }
  }

  const fetchCards = async () => {
    if (!boardId) {
      console.log('No board ID available')
      return
    }
    
    setIsLoading(true)
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      console.log('Fetching cards for board:', boardId)
      const response = await fetch(`${API_BASE_URL}/api/cards?board_id=${boardId}`, {
        headers,
      })

      console.log('Cards response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to fetch cards:', errorText)
        throw new Error(`Failed to fetch cards: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      console.log('Cards data:', data)
      setCards(data)
    } catch (error) {
      console.error('Error fetching cards:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    initializeWorkspace()
  }, [authToken])

  useEffect(() => {
    if (boardId) {
      fetchCards()
    }
  }, [boardId, authToken])

  // Create a refresh function that can be called by the modal
  const refreshData = async () => {
    if (!boardId) return
    
    await fetchCards()
  }

  // Set the refresh function in context when it changes
  useEffect(() => {
    setRefreshDataFn(refreshData)
  }, [boardId, setRefreshDataFn])

  // Enable column field for board page
  useEffect(() => {
    setShowColumnField(true)
  }, [setShowColumnField])

  // Filter logic
  const getFilteredCards = () => {
    let filtered = [...cards]
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(card => 
        card.title.toLowerCase().includes(query) ||
        (card.description && card.description.toLowerCase().includes(query))
      )
    }
    
    // Due date filter
    if (dueDateFilter !== 'all') {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const nextWeek = new Date(today)
      nextWeek.setDate(nextWeek.getDate() + 7)
      
      filtered = filtered.filter(card => {
        if (!card.due_date) return false
        const dueDate = new Date(card.due_date)
        const dueDateOnly = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
        
        switch (dueDateFilter) {
          case 'overdue':
            return dueDateOnly < today
          case 'today':
            return dueDateOnly.getTime() === today.getTime()
          case 'tomorrow':
            return dueDateOnly.getTime() === tomorrow.getTime()
          case 'week':
            return dueDateOnly >= today && dueDateOnly <= nextWeek
          case 'no_date':
            return !card.due_date
          default:
            return true
        }
      })
    }
    
    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(card => card.priority === priorityFilter)
    }
    
    // Assignee filter
    if (assigneeFilter !== 'all') {
      filtered = filtered.filter(card => {
        if (!card.assignees || card.assignees.length === 0) return assigneeFilter === 'unassigned'
        return card.assignees.some((assignee: any) => 
          assignee.initials === assigneeFilter || assignee.name === assigneeFilter
        )
      })
    }
    
    // Label filter
    if (labelFilter !== 'all') {
      filtered = filtered.filter(card => {
        if (!card.labels || card.labels.length === 0) return labelFilter === 'no_label'
        const labelNames = card.labels.map((label: any) => label.name || label)
        return labelNames.includes(labelFilter)
      })
    }
    
    return filtered
  }

  const getCardsByColumn = (columnStatus: string) => {
    const filteredCards = getFilteredCards()
    return filteredCards.filter(card => card.column_status === columnStatus)
  }

  // Get unique values for filter options
  const getUniqueAssignees = () => {
    const assignees = new Set<string>()
    cards.forEach(card => {
      if (card.assignees && card.assignees.length > 0) {
        card.assignees.forEach((assignee: any) => {
          assignees.add(assignee.initials || assignee.name)
        })
      }
    })
    return Array.from(assignees)
  }

  const getUniqueLabels = () => {
    const labels = new Set<string>()
    cards.forEach(card => {
      if (card.labels && card.labels.length > 0) {
        card.labels.forEach((label: any) => {
          labels.add(label.name || label)
        })
      }
    })
    return Array.from(labels)
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setDueDateFilter('all')
    setPriorityFilter('all')
    setAssigneeFilter('all')
    setLabelFilter('all')
    setFilterMenuOpen(null)
  }

  const hasActiveFilters = () => {
    return searchQuery.trim() !== '' || 
           dueDateFilter !== 'all' || 
           priorityFilter !== 'all' || 
           assigneeFilter !== 'all' || 
           labelFilter !== 'all'
  }

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result

    // If dropped outside any droppable area
    if (!destination) return

    // If dropped in the same position
    if (destination.droppableId === source.droppableId && destination.index === source.index) {
      return
    }

    // Find the card being dragged
    const card = cards.find(c => c.id === draggableId)
    if (!card) return

    // Update the card's column status if moved to a different column
    if (destination.droppableId !== source.droppableId) {
      const originalColumnStatus = card.column_status

      // Optimistic update - update local state immediately
      const updatedCards = cards.map(c => 
        c.id === draggableId 
          ? { ...c, column_status: destination.droppableId }
          : c
      )
      setCards(updatedCards)

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        }
        
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`
        }

        const response = await fetch(`${API_BASE_URL}/api/cards/${draggableId}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ column_status: destination.droppableId })
        })

        if (!response.ok) {
          throw new Error('Failed to update card')
        }
      } catch (error) {
        console.error('Error updating card:', error)
        // Revert to original state on error
        const revertedCards = cards.map(c => 
          c.id === draggableId 
            ? { ...c, column_status: originalColumnStatus }
            : c
        )
        setCards(revertedCards)
        alert('Failed to update card. Please try again.')
      }
    }
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

      const response = await fetch(`${API_BASE_URL}/api/cards/${id}`, {
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

  const getSubtaskCount = (checklist: any[] | null) => {
    if (!checklist || !Array.isArray(checklist)) return 0
    return checklist.length
  }

  const Card = ({ card }: { card: any }) => (
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
      onClick={() => {
        setSelectedCard(card)
        setIsEditMode(false)
        setEditTaskTitle(card.title || '')
        setEditTaskDescription(card.description || '')
        setEditTaskPriority(card.priority || 'medium')
        setEditTaskDue(card.due_date || '')
        setEditTaskColor(card.color || '#93c5fd')
        setEditTaskColumn(card.column_status || 'todo')
      }}
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

      {getSubtaskCount(card.checklist) > 0 && (
        <div className="kcard-progress">
          <div className="kcard-progress-label">
            <span>Progress</span>
            <span>{getSubtaskCount(card.checklist)} subtasks</span>
          </div>
          <div className="kcard-progress-bar">
            <div className="kcard-progress-fill" style={{ width: '60%' }} />
          </div>
        </div>
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
  )

  const columnColorRecommendations: Record<string, string> = {
    'todo': '#93c5fd',
    'in-progress': '#fcd34d',
    'review': '#f9a8d4',
    'done': '#86efac'
  }

  const lightColors = [
    '#93c5fd', // medium blue
    '#fcd34d', // medium yellow
    '#f9a8d4', // medium pink
    '#86efac', // medium green
    '#c4b5fd', // medium purple
    '#fca5a5', // medium red
    '#a5b4fc', // indigo
    '#6ee7b7', // emerald
    '#fdba74', // orange
    '#d8b4fe', // violet
  ]

  const handleUpdateTask = async () => {
    if (!selectedCard || !editTaskTitle.trim()) {
      console.log('Cannot update task: missing card or title')
      return
    }
    
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`
      }

      const response = await fetch(`${API_BASE_URL}/api/cards/${selectedCard.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          title: editTaskTitle,
          description: editTaskDescription,
          due_date: editTaskDue || null,
          priority: editTaskPriority,
          column_status: editTaskColumn,
          color: editTaskColor
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update card')
      }

      const updatedCard = await response.json()
      setCards(cards.map(card => card.id === selectedCard.id ? updatedCard : card))
      setSelectedCard(updatedCard)
      setIsEditMode(false)
    } catch (error) {
      console.error('Error updating card:', error)
      alert(`Failed to update card: ${error}`)
    }
  }

  // Calendar View Helpers
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

  return (
    <div className="screen active">
      <div className="view-tabs">
        <div className="view-tabs-left">
          <button 
            className={`view-tab ${activeView === 'board' ? 'active' : ''}`}
            onClick={() => setActiveView('board')}
          >
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="16" rx="2"/>
              <path d="M9 4v16M15 4v16"/>
            </svg>
            Board
          </button>
          <button 
            className={`view-tab ${activeView === 'list' ? 'active' : ''}`}
            onClick={() => setActiveView('list')}
          >
            <svg viewBox="0 0 24 24" fill="none">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            List
          </button>
          <button 
            className={`view-tab ${activeView === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveView('calendar')}
          >
            <svg viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Calendar
          </button>
          <button 
            className={`view-tab ${activeView === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveView('timeline')}
          >
            <svg viewBox="0 0 24 24" fill="none">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
              <circle cx="6" cy="6" r="2"/>
              <circle cx="12" cy="12" r="2"/>
              <circle cx="18" cy="18" r="2"/>
            </svg>
            Timeline
          </button>
        </div>
        <div className="view-tabs-right">
          {/* Search Input */}
          <div style={{position: 'relative', marginRight: '8px'}}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', width: '14px', height: '14px', color: 'var(--muted)'}}>
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ 
                padding: '6px 12px 6px 32px', 
                borderRadius: '6px', 
                border: '1px solid var(--border)', 
                background: 'var(--surface)', 
                fontSize: '13px', 
                width: '180px', 
                outline: 'none', 
                color: 'var(--ink)' 
              }} 
            />
          </div>

          {/* Due Date Filter */}
          <div style={{position: 'relative', marginRight: '4px'}}>
            <button 
              className={`filter-btn ${dueDateFilter !== 'all' ? 'active' : ''}`}
              onClick={() => setFilterMenuOpen(filterMenuOpen === 'dueDate' ? null : 'dueDate')}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Due Date
              {dueDateFilter !== 'all' && <span style={{marginLeft: '4px', fontSize: '10px', background: 'var(--primary)', color: '#fff', padding: '2px 6px', borderRadius: '10px'}}>•</span>}
            </button>
            {filterMenuOpen === 'dueDate' && (
              <div className="filter-dropdown">
                <div className="filter-dropdown-header">Due Date</div>
                <button 
                  className={`filter-dropdown-item ${dueDateFilter === 'all' ? 'active' : ''}`}
                  onClick={() => {setDueDateFilter('all'); setFilterMenuOpen(null)}}
                >
                  All dates
                </button>
                <button 
                  className={`filter-dropdown-item ${dueDateFilter === 'overdue' ? 'active' : ''}`}
                  onClick={() => {setDueDateFilter('overdue'); setFilterMenuOpen(null)}}
                >
                  Overdue
                </button>
                <button 
                  className={`filter-dropdown-item ${dueDateFilter === 'today' ? 'active' : ''}`}
                  onClick={() => {setDueDateFilter('today'); setFilterMenuOpen(null)}}
                >
                  Today
                </button>
                <button 
                  className={`filter-dropdown-item ${dueDateFilter === 'tomorrow' ? 'active' : ''}`}
                  onClick={() => {setDueDateFilter('tomorrow'); setFilterMenuOpen(null)}}
                >
                  Tomorrow
                </button>
                <button 
                  className={`filter-dropdown-item ${dueDateFilter === 'week' ? 'active' : ''}`}
                  onClick={() => {setDueDateFilter('week'); setFilterMenuOpen(null)}}
                >
                  Next 7 days
                </button>
                <button 
                  className={`filter-dropdown-item ${dueDateFilter === 'no_date' ? 'active' : ''}`}
                  onClick={() => {setDueDateFilter('no_date'); setFilterMenuOpen(null)}}
                >
                  No date
                </button>
              </div>
            )}
          </div>

          {/* Priority Filter */}
          <div style={{position: 'relative', marginRight: '4px'}}>
            <button 
              className={`filter-btn ${priorityFilter !== 'all' ? 'active' : ''}`}
              onClick={() => setFilterMenuOpen(filterMenuOpen === 'priority' ? null : 'priority')}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              Priority
              {priorityFilter !== 'all' && <span style={{marginLeft: '4px', fontSize: '10px', background: 'var(--primary)', color: '#fff', padding: '2px 6px', borderRadius: '10px'}}>•</span>}
            </button>
            {filterMenuOpen === 'priority' && (
              <div className="filter-dropdown">
                <div className="filter-dropdown-header">Priority</div>
                <button 
                  className={`filter-dropdown-item ${priorityFilter === 'all' ? 'active' : ''}`}
                  onClick={() => {setPriorityFilter('all'); setFilterMenuOpen(null)}}
                >
                  All priorities
                </button>
                <button 
                  className={`filter-dropdown-item ${priorityFilter === 'high' ? 'active' : ''}`}
                  onClick={() => {setPriorityFilter('high'); setFilterMenuOpen(null)}}
                >
                  High
                </button>
                <button 
                  className={`filter-dropdown-item ${priorityFilter === 'medium' ? 'active' : ''}`}
                  onClick={() => {setPriorityFilter('medium'); setFilterMenuOpen(null)}}
                >
                  Medium
                </button>
                <button 
                  className={`filter-dropdown-item ${priorityFilter === 'low' ? 'active' : ''}`}
                  onClick={() => {setPriorityFilter('low'); setFilterMenuOpen(null)}}
                >
                  Low
                </button>
              </div>
            )}
          </div>

          {/* Assignee Filter */}
          <div style={{position: 'relative', marginRight: '4px'}}>
            <button 
              className={`filter-btn ${assigneeFilter !== 'all' ? 'active' : ''}`}
              onClick={() => setFilterMenuOpen(filterMenuOpen === 'assignee' ? null : 'assignee')}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Assignee
              {assigneeFilter !== 'all' && <span style={{marginLeft: '4px', fontSize: '10px', background: 'var(--primary)', color: '#fff', padding: '2px 6px', borderRadius: '10px'}}>•</span>}
            </button>
            {filterMenuOpen === 'assignee' && (
              <div className="filter-dropdown">
                <div className="filter-dropdown-header">Assignee</div>
                <button 
                  className={`filter-dropdown-item ${assigneeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => {setAssigneeFilter('all'); setFilterMenuOpen(null)}}
                >
                  All assignees
                </button>
                {getUniqueAssignees().map((assignee) => (
                  <button 
                    key={assignee}
                    className={`filter-dropdown-item ${assigneeFilter === assignee ? 'active' : ''}`}
                    onClick={() => {setAssigneeFilter(assignee); setFilterMenuOpen(null)}}
                  >
                    {assignee}
                  </button>
                ))}
                <button 
                  className={`filter-dropdown-item ${assigneeFilter === 'unassigned' ? 'active' : ''}`}
                  onClick={() => {setAssigneeFilter('unassigned'); setFilterMenuOpen(null)}}
                >
                  Unassigned
                </button>
              </div>
            )}
          </div>

          {/* Label Filter */}
          <div style={{position: 'relative', marginRight: '4px'}}>
            <button 
              className={`filter-btn ${labelFilter !== 'all' ? 'active' : ''}`}
              onClick={() => setFilterMenuOpen(filterMenuOpen === 'label' ? null : 'label')}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
              Label
              {labelFilter !== 'all' && <span style={{marginLeft: '4px', fontSize: '10px', background: 'var(--primary)', color: '#fff', padding: '2px 6px', borderRadius: '10px'}}>•</span>}
            </button>
            {filterMenuOpen === 'label' && (
              <div className="filter-dropdown">
                <div className="filter-dropdown-header">Label</div>
                <button 
                  className={`filter-dropdown-item ${labelFilter === 'all' ? 'active' : ''}`}
                  onClick={() => {setLabelFilter('all'); setFilterMenuOpen(null)}}
                >
                  All labels
                </button>
                {getUniqueLabels().map((label) => (
                  <button 
                    key={label}
                    className={`filter-dropdown-item ${labelFilter === label ? 'active' : ''}`}
                    onClick={() => {setLabelFilter(label); setFilterMenuOpen(null)}}
                  >
                    {label}
                  </button>
                ))}
                <button 
                  className={`filter-dropdown-item ${labelFilter === 'no_label' ? 'active' : ''}`}
                  onClick={() => {setLabelFilter('no_label'); setFilterMenuOpen(null)}}
                >
                  No label
                </button>
              </div>
            )}
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters() && (
            <button 
              className="filter-btn"
              onClick={clearAllFilters}
              style={{color: 'var(--primary)', fontWeight: 500}}
            >
              Clear all
            </button>
          )}
          <div style={{position: 'relative'}}>
            <button 
              className="filter-btn"
              onClick={() => setColumnMenus({...columnMenus, columns: !columnMenus.columns})}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="12" cy="5" r="1"/>
                <circle cx="12" cy="19" r="1"/>
              </svg>
            </button>
            {columnMenus.columns && (
              <div className="col-menu-dropdown">
                <button 
                  className="col-menu-dropdown-item"
                  onClick={() => {
                    setShowReviewColumn(!showReviewColumn)
                    setColumnMenus({...columnMenus, columns: false})
                  }}
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    {showReviewColumn ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2" strokeLinecap="round"/>
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </>
                    )}
                  </svg>
                  {showReviewColumn ? 'Hide Review' : 'Show Review'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {activeView === 'board' && (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className={`board-cols ${showReviewColumn ? 'show-review' : ''}`}>
            <Droppable droppableId="todo">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  <div className="col-head todo">
                    <div className="col-head-left">
                      <span className="col-title">To do</span>
                      <span className="wip">{getCardsByColumn('todo').length}</span>
                    </div>
                    <div className="col-head-right">
                      <button 
                        className="col-menu-btn"
                        onClick={() => setColumnMenus({...columnMenus, todo: !columnMenus.todo})}
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <circle cx="5" cy="12" r="1"/>
                          <circle cx="12" cy="12" r="1"/>
                          <circle cx="19" cy="12" r="1"/>
                        </svg>
                      </button>
                      <button className="col-add-icon-btn">
                        <svg viewBox="0 0 24 24" fill="none">
                          <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                      {columnMenus.todo && (
                        <div className="col-menu-dropdown">
                          <button className="col-menu-dropdown-item">
                            <svg viewBox="0 0 24 24" fill="none">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit column
                          </button>
                          <button className="col-menu-dropdown-item">
                            <svg viewBox="0 0 24 24" fill="none">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                            Delete column
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-body">
                    {getCardsByColumn('todo').map((card, index) => (
                      <Draggable key={card.id} draggableId={card.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <Card card={card} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {isLoading && <div className="kcard">Loading...</div>}
                  </div>
                  <div className="col-add-task">
                    <button 
                      type="button"
                      className="col-add-task-btn"
                      onClick={() => setShowAddTask(!showAddTask)}
                    >
                      <svg viewBox="0 0 24 24" fill="none">
                        <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Add task
                    </button>
                  </div>
                </div>
              )}
            </Droppable>
            <Droppable droppableId="in-progress">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  <div className="col-head in-progress">
                    <div className="col-head-left">
                      <span className="col-title">In progress</span>
                      <span className="wip">{getCardsByColumn('in-progress').length}</span>
                    </div>
                    <div className="col-head-right">
                      <button 
                        className="col-menu-btn"
                        onClick={() => setColumnMenus({...columnMenus, inProgress: !columnMenus.inProgress})}
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <circle cx="5" cy="12" r="1"/>
                          <circle cx="12" cy="12" r="1"/>
                          <circle cx="19" cy="12" r="1"/>
                        </svg>
                      </button>
                      <button className="col-add-icon-btn">
                        <svg viewBox="0 0 24 24" fill="none">
                          <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                      {columnMenus.inProgress && (
                        <div className="col-menu-dropdown">
                          <button className="col-menu-dropdown-item">
                            <svg viewBox="0 0 24 24" fill="none">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit column
                          </button>
                          <button className="col-menu-dropdown-item">
                            <svg viewBox="0 0 24 24" fill="none">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                            Delete column
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-body">
                    {getCardsByColumn('in-progress').map((card, index) => (
                      <Draggable key={card.id} draggableId={card.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <Card card={card} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {isLoading && <div className="kcard">Loading...</div>}
                  </div>
                  <div className="col-add-task">
                    <button 
                      type="button"
                      className="col-add-task-btn"
                      onClick={() => setShowAddTask(!showAddTask)}
                    >
                      <svg viewBox="0 0 24 24" fill="none">
                        <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Add task
                    </button>
                  </div>
                </div>
              )}
            </Droppable>
            {showReviewColumn && (
              <Droppable droppableId="review">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef}>
                    <div className="col-head review">
                      <div className="col-head-left">
                        <span className="col-title">Review</span>
                        <span className="wip">{getCardsByColumn('review').length}</span>
                      </div>
                      <div className="col-head-right">
                        <button 
                          className="col-menu-btn"
                          onClick={() => setColumnMenus({...columnMenus, review: !columnMenus.review})}
                        >
                          <svg viewBox="0 0 24 24" fill="none">
                            <circle cx="5" cy="12" r="1"/>
                            <circle cx="12" cy="12" r="1"/>
                            <circle cx="19" cy="12" r="1"/>
                          </svg>
                        </button>
                        <button className="col-add-icon-btn">
                          <svg viewBox="0 0 24 24" fill="none">
                            <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round"/>
                            <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/>
                          </svg>
                        </button>
                        {columnMenus.review && (
                          <div className="col-menu-dropdown">
                            <button className="col-menu-dropdown-item">
                              <svg viewBox="0 0 24 24" fill="none">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                              </svg>
                              Edit column
                            </button>
                            <button 
                              className="col-menu-dropdown-item"
                              onClick={() => {
                                setShowReviewColumn(false)
                                setColumnMenus({...columnMenus, review: false})
                              }}
                            >
                              <svg viewBox="0 0 24 24" fill="none">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2" strokeLinecap="round"/>
                              </svg>
                              Hide column
                            </button>
                            <button className="col-menu-dropdown-item">
                              <svg viewBox="0 0 24 24" fill="none">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              </svg>
                              Delete column
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-body">
                      {getCardsByColumn('review').map((card, index) => (
                        <Draggable key={card.id} draggableId={card.id} index={index}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                            >
                              <Card card={card} />
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {isLoading && <div className="kcard">Loading...</div>}
                    </div>
                    <div className="col-add-task">
                      <button 
                        type="button"
                        className="col-add-task-btn"
                        onClick={() => setShowAddTask(!showAddTask)}
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                        Add task
                      </button>
                    </div>
                  </div>
                )}
              </Droppable>
            )}
            <Droppable droppableId="done">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  <div className="col-head done">
                    <div className="col-head-left">
                      <span className="col-title">Done</span>
                      <span className="wip">{getCardsByColumn('done').length}</span>
                    </div>
                    <div className="col-head-right">
                      <button 
                        className="col-menu-btn"
                        onClick={() => setColumnMenus({...columnMenus, done: !columnMenus.done})}
                      >
                        <svg viewBox="0 0 24 24" fill="none">
                          <circle cx="5" cy="12" r="1"/>
                          <circle cx="12" cy="12" r="1"/>
                          <circle cx="19" cy="12" r="1"/>
                        </svg>
                      </button>
                      <button className="col-add-icon-btn">
                        <svg viewBox="0 0 24 24" fill="none">
                          <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                      {columnMenus.done && (
                        <div className="col-menu-dropdown">
                          <button className="col-menu-dropdown-item">
                            <svg viewBox="0 0 24 24" fill="none">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                            </svg>
                            Edit column
                          </button>
                          <button className="col-menu-dropdown-item">
                            <svg viewBox="0 0 24 24" fill="none">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                            Delete column
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="col-body">
                    {getCardsByColumn('done').map((card, index) => (
                      <Draggable key={card.id} draggableId={card.id} index={index}>
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <Card card={card} />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {isLoading && <div className="kcard">Loading...</div>}
                  </div>
                  <div className="col-add-task">
                    <button 
                      type="button"
                      className="col-add-task-btn"
                      onClick={() => setShowAddTask(!showAddTask)}
                    >
                      <svg viewBox="0 0 24 24" fill="none">
                        <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round"/>
                        <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      Add task
                    </button>
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        </DragDropContext>
      )}

      {activeView === 'list' && (
        <div className="list-view-container" style={{ padding: '16px' }}>
          {['todo', 'in-progress', 'review', 'done'].map((status) => {
            const filteredCards = getFilteredCards();
            const colCards = filteredCards.filter(c => c.column_status === status);
            if (status === 'review' && !showReviewColumn) return null;
            return (
              <div key={status} className="list-group" style={{ marginBottom: '24px' }}>
                <div className="list-group-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontSize: '15px', fontWeight: 600, color: 'var(--ink)' }}>
                  <span className={`status-dot ${status}`} style={{ width: '8px', height: '8px', borderRadius: '50%', background: columnColorRecommendations[status] || '#ccc' }}></span>
                  <span style={{ textTransform: 'capitalize' }}>{status.replace('-', ' ')}</span>
                  <span className="count" style={{ padding: '2px 6px', background: 'var(--surface-2)', borderRadius: '12px', fontSize: '11px', color: 'var(--muted)' }}>{colCards.length}</span>
                </div>
                <div className="list-items" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {colCards.length === 0 ? (
                    <div style={{ padding: '16px', border: '1px dashed var(--border)', borderRadius: '12px', color: 'var(--muted)', fontSize: '13px', textAlign: 'center' }}>No tasks in this stage</div>
                  ) : (
                    colCards.map((card) => (
                      <div
                        key={card.id}
                        className="list-item-row"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 16px',
                          background: 'var(--surface)',
                          border: '1px solid var(--border)',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onClick={() => setSelectedCard(card)}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div 
                            className={`checkbox ${card.column_status === 'done' ? 'done' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTask(card.id);
                            }}
                            style={{ width: '18px', height: '18px', borderRadius: '4px', border: '2px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: card.column_status === 'done' ? 'var(--primary)' : 'transparent' }}
                          >
                            {card.column_status === 'done' && (
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          <span className={`task-title-text ${card.column_status === 'done' ? 'done' : ''}`} style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink)', textDecoration: card.column_status === 'done' ? 'line-through' : 'none', opacity: card.column_status === 'done' ? 0.6 : 1 }}>{card.title}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          {card.priority && <span className={`tag priority-tag ${card.priority}`} style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: 'var(--surface-2)', fontWeight: 600 }}>{card.priority}</span>}
                          {card.due_date && <span style={{ fontSize: '12px', color: 'var(--muted)' }}>{formatDueDate(card.due_date)}</span>}
                          {card.assignees && card.assignees[0] && (
                            <span className="avatar" style={{ width: '24px', height: '24px', fontSize: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: '#7A8C86', color: '#fff' }}>{card.assignees[0].initials}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeView === 'calendar' && (
        <div className="calendar-view" style={{ padding: '16px' }}>
          <div className="calendar-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>
              {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="btn btn-light" style={{ padding: '6px 12px' }}>Previous</button>
              <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="btn btn-light" style={{ padding: '6px 12px' }}>Next</button>
            </div>
          </div>
          <div className="calendar-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} style={{ textAlign: 'center', fontWeight: 600, fontSize: '12px', padding: '8px 0', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{day}</div>
            ))}
            {calendarCells.map((cell, idx) => {
              if (!cell) return <div key={`empty-${idx}`} style={{ minHeight: '100px', background: 'transparent', border: '1px solid transparent' }} />;
              
              const cellDateStr = cell.toDateString();
              const filteredCards = getFilteredCards();
              const dayTasks = filteredCards.filter(c => c.due_date && new Date(c.due_date).toDateString() === cellDateStr);
              const isToday = cell.toDateString() === new Date().toDateString();

              return (
                <div
                  key={cellDateStr}
                  style={{
                    minHeight: '100px',
                    background: isToday ? 'var(--primary-tint)' : 'var(--surface)',
                    border: isToday ? '1px solid var(--primary)' : '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: isToday ? 'var(--primary)' : 'var(--ink-soft)', alignSelf: 'flex-start' }}>{cell.getDate()}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', flex: 1 }}>
                    {dayTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => setSelectedCard(task)}
                        style={{
                          fontSize: '10px',
                          fontWeight: 500,
                          padding: '2px 4px',
                          borderRadius: '4px',
                          background: task.color || '#e0f2fe',
                          color: '#0f172a',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          cursor: 'pointer',
                        }}
                        title={task.title}
                      >
                        {task.title}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeView === 'timeline' && (
        <div className="timeline-view" style={{ padding: '16px' }}>
          <div style={{ position: 'relative', borderLeft: '2px solid var(--border)', paddingLeft: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {(() => {
              const filteredCards = getFilteredCards();
              const sortedCards = filteredCards.filter(c => c.due_date).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
              return sortedCards.length === 0 ? (
                <div style={{ padding: '16px', border: '1px dashed var(--border)', borderRadius: '12px', color: 'var(--muted)', fontSize: '13px', textAlign: 'center' }}>No scheduled tasks to display in Timeline view</div>
              ) : (
                sortedCards.map((card) => {
                const isDone = card.column_status === 'done';
                return (
                  <div key={card.id} style={{ position: 'relative' }}>
                    {/* Timeline Dot */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '-31px',
                        top: '4px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: isDone ? '#22c55e' : 'var(--primary)',
                        border: '2.5px solid var(--surface)',
                        boxShadow: '0 0 0 2px var(--border)'
                      }}
                    />
                    <div
                      onClick={() => setSelectedCard(card)}
                      style={{
                        padding: '16px',
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--muted)' }}>{formatDueDate(card.due_date)}</span>
                        {card.priority && (
                          <span className={`tag priority-tag ${card.priority}`} style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '4px', background: 'var(--surface-2)', fontWeight: 600 }}>{card.priority}</span>
                        )}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--ink)', textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.6 : 1 }}>{card.title}</div>
                      {card.description && <div style={{ fontSize: '12.5px', color: 'var(--muted)', marginTop: '4px', lineHeight: 1.4 }}>{card.description}</div>}
                    </div>
                  </div>
                );
              })
              );
            })()}
          </div>
        </div>
      )}

      {selectedCard && (
        <div className="task-detail-modal">
          <div 
            className="modal-overlay"
            onClick={() => setSelectedCard(null)}
          />
          <div className="task-detail-content">
            <div className="task-detail-header">
              <div className="task-detail-title-row">
                {selectedCard.priority && (
                  <div className={`task-detail-priority ${selectedCard.priority}`}>
                    <svg viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.2"/>
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    {selectedCard.priority.charAt(0).toUpperCase() + selectedCard.priority.slice(1)}
                  </div>
                )}
                <h2>{selectedCard.title}</h2>
              </div>
              <div className="task-detail-header-actions">
                <button 
                  className="btn btn-outline"
                  onClick={() => setIsEditMode(!isEditMode)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  {isEditMode ? 'Cancel' : 'Edit Task'}
                </button>
                <button 
                  className="task-detail-close"
                  onClick={() => setSelectedCard(null)}
                  aria-label="Close task details"
                >
                  <svg viewBox="0 0 24 24" fill="none">
                    <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            </div>

            <div className="task-detail-body">
              {isEditMode ? (
                <div className="task-detail-edit-form">
                  <div className="task-detail-section">
                    <h3>
                      <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                      Title
                    </h3>
                    <input
                      type="text"
                      value={editTaskTitle}
                      onChange={(e) => setEditTaskTitle(e.target.value)}
                      className="task-detail-input"
                      placeholder="Task title"
                    />
                  </div>

                  <div className="task-detail-section">
                    <h3>
                      <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                      </svg>
                      Description
                    </h3>
                    <textarea
                      value={editTaskDescription}
                      onChange={(e) => setEditTaskDescription(e.target.value)}
                      className="task-detail-textarea"
                      placeholder="Task description"
                      rows={4}
                    />
                  </div>

                  <div className="task-detail-section">
                    <h3>
                      <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      Status
                    </h3>
                    <select
                      value={editTaskColumn}
                      onChange={(e) => setEditTaskColumn(e.target.value)}
                      className="task-detail-select"
                    >
                      <option value="todo">To do</option>
                      <option value="in-progress">In progress</option>
                      <option value="review">Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>

                  <div className="task-detail-section">
                    <h3>
                      <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                      </svg>
                      Priority
                    </h3>
                    <select
                      value={editTaskPriority}
                      onChange={(e) => setEditTaskPriority(e.target.value)}
                      className="task-detail-select"
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                      <option value="none">None</option>
                    </select>
                  </div>

                  <div className="task-detail-section">
                    <h3>
                      <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Due Date
                    </h3>
                    <input
                      type="datetime-local"
                      value={editTaskDue}
                      onChange={(e) => setEditTaskDue(e.target.value)}
                      className="task-detail-input"
                    />
                  </div>

                  <div className="task-detail-section">
                    <h3>
                      <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                      </svg>
                      Color Preset Accent
                    </h3>
                    <div className="color-presets">
                      {lightColors.map((color) => (
                        <div
                          key={color}
                          className={`color-preset ${editTaskColor === color ? 'active' : ''}`}
                          style={{ backgroundColor: color }}
                          onClick={() => setEditTaskColor(color)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {selectedCard.description && (
                    <div className="task-detail-section">
                      <h3>
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        Description
                      </h3>
                      <p>{selectedCard.description}</p>
                    </div>
                  )}

                  <div className="task-detail-section">
                    <h3>
                      <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      Status
                    </h3>
                    <div className="task-detail-status">
                      <span className={`status-badge ${selectedCard.column_status}`}>
                        {selectedCard.column_status === 'todo' ? 'To do' : 
                         selectedCard.column_status === 'in-progress' ? 'In progress' :
                         selectedCard.column_status === 'review' ? 'Review' : 'Done'}
                      </span>
                    </div>
                  </div>

                  {selectedCard.due_date && (
                    <div className="task-detail-section">
                      <h3>
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        Due Date
                      </h3>
                      <p>{formatDueDate(selectedCard.due_date)}</p>
                    </div>
                  )}

                  {selectedCard.labels && selectedCard.labels.length > 0 && (
                    <div className="task-detail-section">
                      <h3>
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2">
                          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                          <line x1="7" y1="7" x2="7.01" y2="7"/>
                        </svg>
                        Labels
                      </h3>
                      <div className="task-detail-labels">
                        {selectedCard.labels.map((label: any, index: number) => (
                          <span key={index} className="label-tag">{label.name || label}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCard.assignees && selectedCard.assignees.length > 0 && (
                    <div className="task-detail-section">
                      <h3>
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        Assignees
                      </h3>
                      <div className="task-detail-assignees">
                        {selectedCard.assignees.map((assignee: any, index: number) => (
                          <span 
                            key={index} 
                            className="avatar" 
                            title={assignee.name || assignee.initials}
                            style={{
                              background: assignee.color || 'var(--primary)',
                            }}
                          >
                            {assignee.initials}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedCard.checklist && selectedCard.checklist.length > 0 && (
                    <div className="task-detail-section">
                      <h3>
                        <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2">
                          <polyline points="9 11 12 14 22 4"/>
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                        </svg>
                        Subtasks
                      </h3>
                      <div className="task-detail-checklist">
                        {selectedCard.checklist.map((item: any, index: number) => (
                          <div key={index} className="checklist-item">
                            <input 
                              type="checkbox" 
                              checked={item.completed}
                              readOnly
                              aria-label={`Subtask: ${item.text}`}
                            />
                            <span>{item.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="task-detail-section">
                    <h3>
                      <svg viewBox="0 0 24 24" fill="none" width="14" height="14" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <circle cx="12" cy="12" r="4"/>
                      </svg>
                      Card Color Accent
                    </h3>
                    <div className="task-detail-color">
                      <div 
                        className="color-preview" 
                        style={{ backgroundColor: selectedCard.color || 'var(--primary)' }}
                        aria-label={`Color: ${selectedCard.color || 'default'}`}
                      />
                      <span>{selectedCard.color || 'Default theme'}</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="task-detail-footer">
              {isEditMode ? (
                <>
                  <button 
                    className="btn btn-outline"
                    onClick={() => setIsEditMode(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="btn btn-solid"
                    onClick={handleUpdateTask}
                    disabled={!editTaskTitle.trim()}
                  >
                    Save Changes
                  </button>
                </>
              ) : (
                <>
                  <button 
                    className="btn btn-solid"
                    onClick={() => setIsEditMode(true)}
                  >
                    Edit Task
                  </button>
                  <button 
                    className="btn btn-outline"
                    onClick={() => setSelectedCard(null)}
                  >
                    Close
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
