'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useDashboard } from '../context'
import { useConfirm } from '../../../components/confirm-provider'
import { useToast } from '../../../components/toast-provider'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Goal {
  id: string
  wish: string
  outcome: string
  obstacle: string
  plan: string
  status?: string
}

interface Card {
  id: string
  title: string
  description?: string
  column_status: string
  goal_id?: string
  labels?: { name: string }[]
}

interface Conversation {
  id: string
  title: string
  updated_at: string
  type?: string
}

// Structured guided question emitted by the AI when it decides to run a WOOP
// step instead of plain chat. Presence of this object opens the guided panel.
interface GuidedQuestion {
  step: 'wish' | 'outcome' | 'obstacle' | 'plan'
  question: string
  suggestions: Array<{ text: string; description: string }>
  placeholder?: string
}

// ─── Markdown renderer ─────────────────────────────────────────────────────────
function renderMessage(text: string) {
  if (!text || typeof text !== 'string') return null
  const lines = text.split('\n')
  const elements: JSX.Element[] = []
  let listItems: string[] = []

  const boldify = (str: string) =>
    str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  const flushList = (key: string) => {
    if (listItems.length > 0) {
      elements.push(
        <ol key={`list-${key}`} className="goal-chat-msg-list">
          {listItems.map((item, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: boldify(item) }} />
          ))}
        </ol>
      )
      listItems = []
    }
  }

  lines.forEach((line, idx) => {
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)/)
    const bulletMatch = line.match(/^[-*]\s+(.*)/)

    if (numberedMatch) {
      listItems.push(numberedMatch[2])
    } else if (bulletMatch) {
      listItems.push(bulletMatch[1])
    } else {
      flushList(String(idx))
      if (line.trim() === '') {
        if (elements.length > 0) elements.push(<div key={`br-${idx}`} className="goal-chat-msg-spacer" />)
      } else {
        elements.push(
          <p key={idx} dangerouslySetInnerHTML={{ __html: boldify(line) }} />
        )
      }
    }
  })
  flushList('end')
  return <div className="goal-chat-msg-body">{elements}</div>
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// Kanban column order + display labels for grouping standalone tasks.
const STATUS_ORDER = ['todo', 'in-progress', 'review', 'done'] as const
const STATUS_LABELS: Record<string, string> = {
  'todo': 'To do',
  'in-progress': 'In progress',
  'review': 'Review',
  'done': 'Done',
}
// Coerce unknown/null statuses into a known bucket so every card renders.
const normalizeStatus = (s: string) => (STATUS_LABELS[s] ? s : 'todo')

// ─── Component ─────────────────────────────────────────────────────────────────
export default function GoalsPage() {
  const { authToken, boardId } = useDashboard()
  const confirm = useConfirm()
  const toast = useToast()

  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Ready to analyze')
  const [selectedFocus, setSelectedFocus] = useState<'all' | 'web' | 'goals'>('all')
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [goals, setGoals] = useState<Goal[]>([])
  const [cards, setCards] = useState<Card[]>([])
  const [isLoadingGoals, setIsLoadingGoals] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [isLoadingConversations, setIsLoadingConversations] = useState(false)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [guidedQuestion, setGuidedQuestion] = useState<GuidedQuestion | null>(null)
  const [guidedDraft, setGuidedDraft] = useState('')
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null)
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null)
  const [editingGoalData, setEditingGoalData] = useState<Partial<Goal>>({})
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [editingTaskTitle, setEditingTaskTitle] = useState('')

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // ─── Fetch conversations (live data) ────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    if (!authToken) return
    setIsLoadingConversations(true)
    try {
      console.log('Fetching conversations with token:', authToken.substring(0, 20) + '...')
      const res = await fetch('http://localhost:3001/api/ai/conversations', {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      console.log('Conversations response status:', res.status)
      if (res.ok) {
        const data: Conversation[] = await res.json()
        console.log('Fetched conversations:', data.length, data)
        setConversations(data) // All conversations, live from DB
      } else {
        const errorText = await res.text()
        console.error('Failed to fetch conversations:', res.status, errorText)
      }
    } catch (e) {
      console.error('Error fetching conversations:', e)
    } finally {
      setIsLoadingConversations(false)
    }
  }, [authToken])

  // Load conversations on mount / auth change
  useEffect(() => {
    if (authToken) fetchConversations()
  }, [authToken, fetchConversations])

  // Fetch goals and cards on mount (panel is part of the page by default)
  useEffect(() => {
    if (authToken) fetchGoalsAndCards()
  }, [authToken])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`
    }
  }, [inputMessage])

  // ─── Load a past conversation ────────────────────────────────────────────────
  const loadConversation = async (conv: Conversation) => {
    if (!authToken) return
    setActiveConversationId(conv.id)
    setGuidedQuestion(null)
    setGuidedDraft('')
    setSelectedSuggestion(null)
    try {
      console.log('Loading conversation:', conv.id)
      const res = await fetch(`http://localhost:3001/api/ai/conversations/${conv.id}/messages`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (res.ok) {
        const msgs = await res.json()
        console.log('Fetched messages for conversation:', conv.id, msgs)
        if (Array.isArray(msgs)) {
          setMessages(
            msgs.map((m: any) => ({
              role: m.role || 'assistant',
              content: typeof m.content === 'string' ? m.content : String(m.content || ''),
            }))
          )
        } else {
          console.warn('Messages response is not an array:', msgs)
          setMessages([])
        }
      } else {
        const errText = await res.text()
        console.error('Failed to load messages:', res.status, errText)
        toast.error({ message: 'Failed to load chat history' })
      }
    } catch (e) {
      console.error('Error loading conversation:', e)
      toast.error({ message: 'Failed to load chat history' })
    }
  }

  // ─── Rename a conversation ───────────────────────────────────────────────────
  // PUTs the new title; the backend also locks the title so the AI auto-titler
  // won't overwrite a user-chosen name afterwards.
  const handleRenameConversation = async (conv: Conversation) => {
    if (!authToken) return
    const trimmed = editTitle.trim()
    if (!trimmed || trimmed === conv.title) {
      setEditingId(null)
      return
    }
    try {
      const res = await fetch(`http://localhost:3001/api/ai/conversations/${conv.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ title: trimmed }),
      })
      if (res.ok) {
        setConversations(prev =>
          prev.map(c => (c.id === conv.id ? { ...c, title: trimmed } : c))
        )
        toast.success({ message: 'Conversation renamed successfully' })
      } else {
        toast.error({ message: 'Failed to rename conversation' })
      }
    } catch (e) {
      console.error('Error renaming conversation:', e)
      toast.error({ message: 'Failed to rename conversation' })
    } finally {
      setEditingId(null)
    }
  }

  // ─── Delete a conversation ───────────────────────────────────────────────────
  const handleDeleteConversation = async (conv: Conversation) => {
    if (!authToken) return
    const confirmed = await confirm({
      title: 'Delete conversation?',
      message: 'This conversation and its messages will be permanently removed. This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true,
    })
    if (!confirmed) return
    try {
      const res = await fetch(`http://localhost:3001/api/ai/conversations/${conv.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== conv.id))
        if (activeConversationId === conv.id) {
          startNewChat()
        }
        toast.success({ message: 'Conversation deleted successfully' })
      } else {
        toast.error({ message: 'Failed to delete conversation' })
      }
    } catch (e) {
      console.error('Error deleting conversation:', e)
      toast.error({ message: 'Failed to delete conversation' })
    }
  }

  // ─── Edit a goal ───────────────────────────────────────────────────────────────
  const handleEditGoal = (goal: Goal) => {
    setEditingGoalId(goal.id)
    setEditingGoalData({
      wish: goal.wish,
      outcome: goal.outcome,
      obstacle: goal.obstacle,
      plan: goal.plan,
      status: goal.status
    })
  }

  const handleSaveGoal = async () => {
    if (!authToken || !editingGoalId) return
    try {
      const res = await fetch(`http://localhost:3001/api/goals/${editingGoalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(editingGoalData),
      })
      if (res.ok) {
        setGoals(prev => prev.map(g => g.id === editingGoalId ? { ...g, ...editingGoalData } : g))
        setEditingGoalId(null)
        setEditingGoalData({})
        toast.success({ message: 'Goal updated successfully' })
      } else {
        toast.error({ message: 'Failed to update goal' })
      }
    } catch (e) {
      console.error('Error updating goal:', e)
      toast.error({ message: 'Failed to update goal' })
    }
  }

  const handleCancelEditGoal = () => {
    setEditingGoalId(null)
    setEditingGoalData({})
  }

  // ─── Delete a goal ─────────────────────────────────────────────────────────────
  const handleDeleteGoal = async (goal: Goal) => {
    if (!authToken) return
    const confirmed = await confirm({
      title: 'Delete goal?',
      message: 'This goal and all its tasks will be permanently removed. This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true,
    })
    if (!confirmed) return
    try {
      const res = await fetch(`http://localhost:3001/api/goals/${goal.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (res.ok) {
        setGoals(prev => prev.filter(g => g.id !== goal.id))
        setCards(prev => prev.filter(c => c.goal_id !== goal.id))
        toast.success({ message: 'Goal deleted successfully' })
      } else {
        toast.error({ message: 'Failed to delete goal' })
      }
    } catch (e) {
      console.error('Error deleting goal:', e)
      toast.error({ message: 'Failed to delete goal' })
    }
  }

  // ─── Edit a task ───────────────────────────────────────────────────────────────
  const handleEditTask = (card: Card) => {
    setEditingTaskId(card.id)
    setEditingTaskTitle(card.title)
  }

  const handleSaveTask = async (card: Card) => {
    if (!authToken || !editingTaskId) return
    try {
      const res = await fetch(`http://localhost:3001/api/cards/${editingTaskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ title: editingTaskTitle }),
      })
      if (res.ok) {
        setCards(prev => prev.map(c => c.id === editingTaskId ? { ...c, title: editingTaskTitle } : c))
        setEditingTaskId(null)
        setEditingTaskTitle('')
        toast.success({ message: 'Task updated successfully' })
      } else {
        toast.error({ message: 'Failed to update task' })
      }
    } catch (e) {
      console.error('Error updating task:', e)
      toast.error({ message: 'Failed to update task' })
    }
  }

  const handleCancelEditTask = () => {
    setEditingTaskId(null)
    setEditingTaskTitle('')
  }

  // ─── Delete a task ─────────────────────────────────────────────────────────────
  const handleDeleteTask = async (card: Card) => {
    if (!authToken) return
    const confirmed = await confirm({
      title: 'Delete task?',
      message: 'This task will be permanently removed. This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true,
    })
    if (!confirmed) return
    try {
      const res = await fetch(`http://localhost:3001/api/cards/${card.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      })
      if (res.ok) {
        setCards(prev => prev.filter(c => c.id !== card.id))
        toast.success({ message: 'Task deleted successfully' })
      } else {
        toast.error({ message: 'Failed to delete task' })
      }
    } catch (e) {
      console.error('Error deleting task:', e)
      toast.error({ message: 'Failed to delete task' })
    }
  }

  // ─── Fetch goals & cards ─────────────────────────────────────────────────────
  const fetchGoalsAndCards = async () => {
    if (!authToken) return
    setIsLoadingGoals(true)
    try {
      const cardsUrl = boardId
        ? `http://localhost:3001/api/cards?board_id=${boardId}`
        : 'http://localhost:3001/api/cards'
      const [goalsRes, cardsRes] = await Promise.all([
        fetch('http://localhost:3001/api/goals', { headers: { Authorization: `Bearer ${authToken}` } }),
        fetch(cardsUrl, { headers: { Authorization: `Bearer ${authToken}` } }),
      ])
      if (goalsRes.ok) setGoals(await goalsRes.json())
      if (cardsRes.ok) setCards(await cardsRes.json())
    } catch (error) {
      console.error('Error fetching goals and cards:', error)
    } finally {
      setIsLoadingGoals(false)
    }
  }

  // ─── Send message ────────────────────────────────────────────────────────────
  // overrideText lets the guided panel reuse this whole flow: the confirmed
  // answer is sent as the user message (mirrored to chat) without touching the
  // main textarea's state.
  const handleSendMessage = async (overrideText?: string) => {
    const fromGuided = typeof overrideText === 'string'
    const userMessage = (fromGuided ? overrideText : inputMessage).trim()
    if (!userMessage || isTyping) return

    if (!fromGuided) {
      setInputMessage('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }

    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsTyping(true)
    setStatusMessage('Thinking...')

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const statusInterval = setInterval(() => {
        if (controller.signal.aborted) { clearInterval(statusInterval); return }
        const statuses = ['Applying WOOP methodology...', 'Thinking carefully...', 'Formulating a response...']
        setStatusMessage(statuses[Math.floor(Math.random() * statuses.length)])
      }, 2500)

      const response = await fetch('http://localhost:3001/api/ai/coaching', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
        signal: controller.signal,
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages,
          boardId,
          conversationId: activeConversationId,
        })
      })

      clearInterval(statusInterval)

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
        setStatusMessage('Done')

        // Store conversation ID from backend & always refresh the sidebar
        if (data.conversationId) {
          console.log('Received conversation ID from backend:', data.conversationId)
          if (!activeConversationId) {
            console.log('Setting active conversation ID:', data.conversationId)
            setActiveConversationId(data.conversationId)
          }
          // Force immediate refresh of conversations to show the new chat
          console.log('Refreshing conversations immediately...')
          await fetchConversations()
        } else {
          console.log('No conversation ID received from backend')
        }

        if (data.goalCreated) fetchGoalsAndCards()

        // Open the guided panel if the AI emitted a guided question; otherwise
        // make sure it's closed. Panel opens/closes purely on this signal.
        if (data.guidedQuestion) {
          setGuidedQuestion(data.guidedQuestion as GuidedQuestion)
          setGuidedDraft('')
          setSelectedSuggestion(null)
        } else {
          setGuidedQuestion(null)
        }
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "I couldn't process that right now. Please try again." }])
        setStatusMessage('Error')
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setStatusMessage('Stopped')
        setMessages(prev => [...prev, { role: 'assistant', content: "Stopped." }])
      } else {
        console.error('Error:', error)
        setMessages(prev => [...prev, { role: 'assistant', content: "Something went wrong. Try again." }])
        setStatusMessage('Error')
      }
    } finally {
      setIsTyping(false)
      abortControllerRef.current = null
    }
  }

  const handleStop = () => abortControllerRef.current?.abort()

  // ─── Guided panel confirm ────────────────────────────────────────────────────
  // Locks the current draft as the answer, collapses the panel, then sends the
  // answer through the normal message flow so it's mirrored to chat + persisted.
  const handleGuidedConfirm = () => {
    const answer = guidedDraft.trim()
    if (!answer || isTyping) return
    setGuidedQuestion(null)
    setSelectedSuggestion(null)
    setGuidedDraft('')
    handleSendMessage(answer)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() }
  }

  const startNewChat = async () => {
    handleStop()
    setMessages([])
    setActiveConversationId(null)
    setStatusMessage('Ready to analyze')
    setGuidedQuestion(null)
    setGuidedDraft('')
    setSelectedSuggestion(null)
    
    // Create a new conversation via API
    if (authToken) {
      try {
        console.log('Creating new conversation via API')
        const res = await fetch('http://localhost:3001/api/ai/conversations', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ title: 'New Chat' })
        })
        
        if (res.ok) {
          const newConv = await res.json()
          console.log('New conversation created:', newConv.id)
          setActiveConversationId(newConv.id)
          await fetchConversations()
        } else {
          console.error('Failed to create new conversation:', res.status)
        }
      } catch (e) {
        console.error('Error creating new conversation:', e)
      }
    }
  }

  const isWelcomeState = messages.length === 0

  // Cards not tied to any goal — grouped separately as standalone tasks.
  const goalIds = new Set(goals.map(g => g.id))
  const standaloneTasks = cards.filter(c => !c.goal_id || !goalIds.has(c.goal_id))

  return (
    <div className="goal-chat-page">

      {/* ── Left History Sidebar ───────────────────────────── */}
      <div className={`goal-history-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="goal-history-sidebar-header">
          {isSidebarOpen && <h3>Chats</h3>}
          <button
            className="goal-history-toggle-btn"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isSidebarOpen ? (
                <><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></>
              ) : (
                <><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></>
              )}
            </svg>
          </button>
        </div>

        {isSidebarOpen && (
          <>
            <button className="goal-history-new-btn" onClick={startNewChat}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Chat
            </button>

            <div className="goal-history-list">
              {isLoadingConversations ? (
                <div className="goal-history-loading">
                  <span></span><span></span><span></span>
                </div>
              ) : conversations.length === 0 ? (
                <div className="goal-history-empty">No conversations yet</div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.id}
                    className={`goal-history-item ${activeConversationId === conv.id ? 'active' : ''}`}
                    onClick={() => loadConversation(conv)}
                  >
                    {editingId === conv.id ? (
                      <div
                        className="goal-history-item-edit"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="text"
                          className="goal-history-item-edit-input"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameConversation(conv)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          autoFocus
                        />
                        <button
                          type="button"
                          className="goal-history-item-edit-confirm"
                          title="Save name"
                          onClick={() => handleRenameConversation(conv)}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="goal-history-item-icon">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                        <div className="goal-history-item-text">
                          <span className="goal-history-item-title">{conv.title}</span>
                          <span className="goal-history-item-time">{timeAgo(conv.updated_at)}</span>
                        </div>
                        <div className="goal-history-item-actions">
                          <button
                            type="button"
                            className="goal-history-item-rename"
                            title="Rename conversation"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingId(conv.id)
                              setEditTitle(conv.title)
                            }}
                          >
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            className="goal-history-item-delete"
                            title="Delete conversation"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteConversation(conv)
                            }}
                          >
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18M19 6l-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6m5 4v6m4-6v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Main Chat Area ─────────────────────────────────── */}
      <div className="goal-chat-main">

        {/* Header */}
        <div className={`goal-chat-header ${isWelcomeState ? 'welcome' : 'active'}`}>
          <div className="goal-chat-header-left">
            <div className="goal-chat-logo-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div className="goal-chat-title-group">
              <h2>Goal Coach</h2>
              <span>WOOP Methodology · Aria</span>
            </div>
          </div>
          <div className="goal-chat-header-right">
            {!isWelcomeState && (
              <button onClick={startNewChat} className="goal-chat-reset-btn">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                New Chat
              </button>
            )}
            <button onClick={() => setIsPanelOpen(!isPanelOpen)} className="goal-chat-menu-btn" title="Goals & Tasks">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="9" y1="3" x2="9" y2="21"></line>
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="goal-chat-history">
          <div className="goal-chat-messages-container">
            {isWelcomeState && (
              <div className="goal-chat-welcome">
                <div className="goal-chat-welcome-icon">
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3>Hi, I'm Aria 👋</h3>
                <p>I'm your WOOP goal coach. Tell me about something you want to achieve and I'll help you turn it into a clear, actionable plan.</p>
              </div>
            )}

            {messages.map((message, index) => (
              <div key={index} className={`goal-chat-msg-row ${message.role}`}>
                {message.role === 'assistant' && (
                  <div className="goal-chat-avatar assistant">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                  </div>
                )}
                <div className={`goal-chat-bubble ${message.role}`}>
                  {message.role === 'assistant'
                    ? renderMessage(message.content)
                    : <span>{message.content}</span>
                  }
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="goal-chat-msg-row assistant">
                <div className="goal-chat-avatar assistant">
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div className="goal-chat-bubble assistant typing">
                  <div className="ai-chat-typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className={`goal-chat-input-outer-wrapper ${messages.length > 0 ? 'has-messages' : ''}`}>
          <div className="goal-chat-input-stack">
          <div className="goal-chat-input-parent-container">
            <div className="goal-chat-input-field-container">
              <textarea
                ref={textareaRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Tell me about a goal you'd like to achieve..."
                rows={1}
                className="goal-chat-textarea"
              />
              <div className="goal-chat-actions-row">
                <div className="goal-chat-left-actions">
                  <button type="button" title="Attach" className="goal-chat-action-btn">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Web search"
                    onClick={() => setSelectedFocus(selectedFocus === 'web' ? 'all' : 'web')}
                    className={`goal-chat-action-btn ${selectedFocus === 'web' ? 'active' : ''}`}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Focus goals"
                    onClick={() => setSelectedFocus(selectedFocus === 'goals' ? 'all' : 'goals')}
                    className={`goal-chat-action-btn ${selectedFocus === 'goals' ? 'active' : ''}`}
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="6"></circle><circle cx="12" cy="12" r="2"></circle>
                    </svg>
                  </button>
                  <button type="button" title="Options" className="goal-chat-action-btn">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="21" x2="4" y2="14"></line><line x1="4" y1="10" x2="4" y2="3"></line>
                      <line x1="12" y1="21" x2="12" y2="12"></line><line x1="12" y1="8" x2="12" y2="3"></line>
                      <line x1="20" y1="21" x2="20" y2="16"></line><line x1="20" y1="12" x2="20" y2="3"></line>
                      <line x1="2" y1="14" x2="6" y2="14"></line><line x1="10" y1="8" x2="14" y2="8"></line>
                      <line x1="18" y1="16" x2="22" y2="16"></line>
                    </svg>
                  </button>
                </div>
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isTyping}
                  className={`goal-chat-submit-btn ${inputMessage.trim() ? 'active' : ''}`}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline>
                  </svg>
                </button>
              </div>
            </div>
            <div className="goal-chat-tray-container">
              <div className="goal-chat-left-actions">
                <div className="goal-chat-pill bold">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  BetterMe AI
                </div>
                <div className="goal-chat-pill">
                  <span className="goal-chat-pill-dots">
                    <span></span><span></span><span></span>
                  </span>
                  Sources
                </div>
              </div>
              <div className={`goal-chat-tray-status ${isTyping ? 'typing' : ''}`}>{statusMessage}</div>
              {isTyping && <button onClick={handleStop} className="goal-chat-stop-btn">Stop</button>}
            </div>
          </div>

          {/* ── Guided Q&A Panel ──────────────────────────────── */}
          {/* Appears below the input container when the AI emits a GUIDED_QUESTION.
              Pushes the input up via the flex column in goal-chat-input-stack.
              Same visual design as the input parent container. */}
          {guidedQuestion && (
            <div className="goal-chat-guided-panel">
              <div className="goal-chat-guided-panel-inner">
                {/* Step badge */}
                <div className="goal-chat-guided-step-badge" data-step={guidedQuestion.step}>
                  {guidedQuestion.step === 'wish' && 'Wish'}
                  {guidedQuestion.step === 'outcome' && 'Outcome'}
                  {guidedQuestion.step === 'obstacle' && 'Obstacle'}
                  {guidedQuestion.step === 'plan' && 'Plan'}
                </div>

                {/* Question */}
                <div className="goal-chat-guided-question">
                  {guidedQuestion.question}
                </div>

                {/* Numbered suggestion list with descriptions */}
                <div className="goal-chat-guided-suggestions">
                  {guidedQuestion.suggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className={`goal-chat-guided-suggestion-item ${selectedSuggestion === suggestion.text ? 'active' : ''}`}
                      onClick={() => {
                        setGuidedDraft(suggestion.text)
                        setSelectedSuggestion(suggestion.text)
                      }}
                    >
                      <div className="goal-chat-guided-suggestion-number">{idx + 1}</div>
                      <div className="goal-chat-guided-suggestion-content">
                        <div className="goal-chat-guided-suggestion-text">{suggestion.text}</div>
                        <div className="goal-chat-guided-suggestion-description">
                          {suggestion.description || (
                            <>
                              {guidedQuestion.step === 'wish' && 'A specific, time-bound goal you want to achieve'}
                              {guidedQuestion.step === 'outcome' && 'How achieving this goal will make you feel and what changes it will bring'}
                              {guidedQuestion.step === 'obstacle' && 'Internal barriers like procrastination, fear, or distraction that might hold you back'}
                              {guidedQuestion.step === 'plan' && 'A specific if-then plan to overcome your obstacle'}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Custom answer input */}
                <div className="goal-chat-guided-input-row">
                  <textarea
                    className="goal-chat-guided-input"
                    value={guidedDraft}
                    onChange={(e) => {
                      setGuidedDraft(e.target.value)
                      setSelectedSuggestion(null)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleGuidedConfirm()
                      }
                      if (e.key === 'Escape') {
                        setGuidedQuestion(null)
                        setGuidedDraft('')
                        setSelectedSuggestion(null)
                      }
                    }}
                    placeholder={guidedQuestion.placeholder || 'Type your answer...'}
                    rows={2}
                  />
                  <button
                    type="button"
                    className={`goal-chat-guided-confirm ${guidedDraft.trim() ? 'active' : ''}`}
                    disabled={!guidedDraft.trim() || isTyping}
                    onClick={handleGuidedConfirm}
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      {/* ── Right Goals Panel (inline column) ─────────────── */}
      <div className={`goal-chat-side-panel ${isPanelOpen ? 'open' : 'closed'}`}>
        {isPanelOpen ? (
          <>
            <div className="goal-chat-side-panel-header">
              <h3>Your Goals</h3>
              <button onClick={() => setIsPanelOpen(false)} className="goal-chat-close-panel-btn" title="Hide panel">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
                </svg>
              </button>
            </div>
            <div className="goal-chat-side-panel-content">
              {isLoadingGoals ? (
                <div className="goal-chat-panel-empty">Loading...</div>
              ) : goals.length === 0 && standaloneTasks.length === 0 ? (
                <div className="goal-chat-panel-empty">
                  <p>Nothing here yet</p>
                  <p>Create a task or complete a WOOP session to get started</p>
                </div>
              ) : (
                <>
                  {goals.length > 0 && (
                    <div className="goal-chat-goals-list">
                      {goals.map((goal) => (
                        <div key={goal.id} className="goal-chat-goal-item">
                          {editingGoalId === goal.id ? (
                            <div className="goal-chat-goal-edit">
                              <div className="goal-chat-goal-edit-field">
                                <label>Wish</label>
                                <input
                                  type="text"
                                  value={editingGoalData.wish || ''}
                                  onChange={(e) => setEditingGoalData({ ...editingGoalData, wish: e.target.value })}
                                />
                              </div>
                              <div className="goal-chat-goal-edit-field">
                                <label>Outcome</label>
                                <textarea
                                  value={editingGoalData.outcome || ''}
                                  onChange={(e) => setEditingGoalData({ ...editingGoalData, outcome: e.target.value })}
                                  rows={2}
                                />
                              </div>
                              <div className="goal-chat-goal-edit-field">
                                <label>Obstacle</label>
                                <textarea
                                  value={editingGoalData.obstacle || ''}
                                  onChange={(e) => setEditingGoalData({ ...editingGoalData, obstacle: e.target.value })}
                                  rows={2}
                                />
                              </div>
                              <div className="goal-chat-goal-edit-field">
                                <label>Plan</label>
                                <textarea
                                  value={editingGoalData.plan || ''}
                                  onChange={(e) => setEditingGoalData({ ...editingGoalData, plan: e.target.value })}
                                  rows={2}
                                />
                              </div>
                              <div className="goal-chat-goal-edit-actions">
                                <button onClick={handleSaveGoal} className="goal-chat-goal-edit-save">Save</button>
                                <button onClick={handleCancelEditGoal} className="goal-chat-goal-edit-cancel">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="goal-chat-goal-header">
                                <h4>{goal.wish || 'Untitled Goal'}</h4>
                                <div className="goal-chat-goal-actions">
                                  <button
                                    onClick={() => handleEditGoal(goal)}
                                    className="goal-chat-goal-edit-btn"
                                    title="Edit goal"
                                  >
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteGoal(goal)}
                                    className="goal-chat-goal-delete-btn"
                                    title="Delete goal"
                                  >
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M3 6h18M19 6l-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6m5 4v6m4-6v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                              <span className="goal-chat-goal-status">{goal.status || 'Active'}</span>
                              <div className="goal-chat-tasks-list">
                                {cards.filter(c => c.goal_id === goal.id).map((card) => (
                                  <div key={card.id} className="goal-chat-task-item">
                                    {editingTaskId === card.id ? (
                                      <div className="goal-chat-task-edit">
                                        <input
                                          type="text"
                                          value={editingTaskTitle}
                                          onChange={(e) => setEditingTaskTitle(e.target.value)}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleSaveTask(card)
                                            if (e.key === 'Escape') handleCancelEditTask()
                                          }}
                                          autoFocus
                                        />
                                        <button onClick={() => handleSaveTask(card)} className="goal-chat-task-edit-save">
                                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M5 13l4 4L19 7" />
                                          </svg>
                                        </button>
                                        <button onClick={handleCancelEditTask} className="goal-chat-task-edit-cancel">
                                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                          </svg>
                                        </button>
                                      </div>
                                    ) : (
                                      <>
                                        <span className="goal-chat-task-name">{card.title}</span>
                                        <div className="goal-chat-task-actions">
                                          <button
                                            onClick={() => handleEditTask(card)}
                                            className="goal-chat-task-edit-btn"
                                            title="Edit task"
                                          >
                                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                          </button>
                                          <button
                                            onClick={() => handleDeleteTask(card)}
                                            className="goal-chat-task-delete-btn"
                                            title="Delete task"
                                          >
                                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                              <path d="M3 6h18M19 6l-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6m5 4v6m4-6v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                            </svg>
                                          </button>
                                        </div>
                                        <span className="goal-chat-task-status" data-status={normalizeStatus(card.column_status)}>
                                          {STATUS_LABELS[normalizeStatus(card.column_status)]}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                ))}
                                {cards.filter(c => c.goal_id === goal.id).length === 0 && (
                                  <div className="goal-chat-task-empty">No tasks yet</div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {standaloneTasks.length > 0 && (
                    <div className={`goal-chat-standalone-section ${goals.length > 0 ? 'has-goals' : ''}`}>
                      {goals.length > 0 && <div className="goal-chat-section-divider">Standalone tasks</div>}
                      {STATUS_ORDER.map((status) => {
                        const tasksInStatus = standaloneTasks.filter(c => normalizeStatus(c.column_status) === status)
                        if (tasksInStatus.length === 0) return null
                        return (
                          <div key={status} className="goal-chat-status-group" data-status={status}>
                            <div className="goal-chat-status-header">
                              <span className="goal-chat-status-dot" data-status={status} />
                              {STATUS_LABELS[status]}
                              <span className="goal-chat-status-count">{tasksInStatus.length}</span>
                            </div>
                            <div className="goal-chat-tasks-list">
                              {tasksInStatus.map((card) => (
                                <div key={card.id} className="goal-chat-task-item">
                                  <span className="goal-chat-task-name">{card.title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        ) : (
          <button
            onClick={() => setIsPanelOpen(true)}
            className="goal-chat-side-panel-expand-btn"
            title="Show Your Goals"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
