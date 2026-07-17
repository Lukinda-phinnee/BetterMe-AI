'use client'

import { useState, useEffect, useRef } from 'react'
import { useDashboard } from '../context'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function GoalsPage() {
  const { authToken } = useDashboard()
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Ready to analyze')
  const [selectedFocus, setSelectedFocus] = useState<'all' | 'web' | 'goals'>('all')
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [goals, setGoals] = useState<any[]>([])
  const [cards, setCards] = useState<any[]>([])
  const [isLoadingGoals, setIsLoadingGoals] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Initialize with empty messages
  useEffect(() => {
    setMessages([])
  }, [])

  // Fetch goals and cards when panel opens
  useEffect(() => {
    if (isPanelOpen && authToken) {
      fetchGoalsAndCards()
    }
  }, [isPanelOpen, authToken])

  const fetchGoalsAndCards = async () => {
    if (!authToken) return

    setIsLoadingGoals(true)
    try {
      // Fetch goals
      const goalsResponse = await fetch('http://localhost:3001/api/goals', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      })

      if (goalsResponse.ok) {
        const goalsData = await goalsResponse.json()
        setGoals(goalsData)
      }

      // Fetch cards (tasks)
      const cardsResponse = await fetch('http://localhost:3001/api/cards', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        }
      })

      if (cardsResponse.ok) {
        const cardsData = await cardsResponse.json()
        setCards(cardsData)
      }
    } catch (error) {
      console.error('Error fetching goals and cards:', error)
    } finally {
      setIsLoadingGoals(false)
    }
  }

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

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isTyping) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }])
    setIsTyping(true)
    setStatusMessage('Searching connected sources...')

    // Setup AbortController for the stop button
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      }

      // Simulate a status progression for aesthetics
      const statusInterval = setInterval(() => {
        if (controller.signal.aborted) {
          clearInterval(statusInterval)
          return
        }
        const statuses = [
          'Decomposing goal requirements...',
          'Applying WOOP methodology...',
          'Synthesizing actionable steps...',
          'Formulating AI guidance...'
        ]
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
        setStatusMessage(randomStatus)
      }, 2500)

      const response = await fetch('http://localhost:3001/api/ai/coaching', {
        method: 'POST',
        headers,
        signal: controller.signal,
        body: JSON.stringify({
          message: userMessage,
          conversationHistory: messages
        })
      })

      clearInterval(statusInterval)

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
        setStatusMessage('AI Answer generated')
      } else {
        // Fallback response if AI is not available
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "I understand you want to work on: " + userMessage + ". Let me help you break this down using the WOOP method. First, what does success look like for this goal?"
        }])
        setStatusMessage('Response loaded (fallback)')
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setStatusMessage('Generation stopped')
        setMessages(prev => [...prev, { role: 'assistant', content: "Generation stopped by user." }])
      } else {
        console.error('Error sending message:', error)
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "I understand you want to work on: " + userMessage + ". Let me help you break this down using the WOOP method. First, what does success look like for this goal?"
        }])
        setStatusMessage('Error fetching response')
      }
    } finally {
      setIsTyping(false)
      abortControllerRef.current = null
    }
  }

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const resetChat = () => {
    handleStop()
    setMessages([
      {
        role: 'assistant',
        content: "Hi! I'm your goal coach. I'll help you create meaningful goals using the WOOP method. What would you like to achieve today?"
      }
    ])
    setStatusMessage('Ready to analyze')
  }

  const isWelcomeState = messages.length <= 1

  return (
    <div className="goal-chat-page">
      {/* Top Header */}
      <div className={`goal-chat-header ${isWelcomeState ? 'welcome' : 'active'}`}>
        <div className="goal-chat-header-left">
          <div className="goal-chat-logo-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="goal-chat-title-group">
            <h2>Goal Coach</h2>
            <span>WOOP Methodology AI</span>
          </div>
        </div>

        <div className="goal-chat-header-right">
          {isWelcomeState && (
            <button onClick={() => {/* TODO: Open add goal modal */}} className="goal-chat-add-goal-btn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Goal
            </button>
          )}
          <button onClick={() => setIsPanelOpen(!isPanelOpen)} className="goal-chat-menu-btn">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="9" y1="3" x2="9" y2="21"></line>
            </svg>
          </button>
          {!isWelcomeState && (
            <button onClick={resetChat} className="goal-chat-reset-btn">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 5v14M5 12h14" />
              </svg>
              New Chat
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="goal-chat-history">
        <div className="goal-chat-messages-container">
          {messages.map((message, index) => (
            <div key={index} className="goal-chat-msg-row">
              <div className={`goal-chat-avatar ${message.role === 'user' ? 'user' : 'assistant'}`}>
                {message.role === 'user' ? 'U' : 'AI'}
              </div>
              <div className="goal-chat-msg-content">
                {message.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="goal-chat-msg-row">
              <div className="goal-chat-avatar assistant">AI</div>
              <div className="goal-chat-typing-container">
                <div className="ai-chat-typing">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Floating Centered Input Control Panel */}
      <div className={`goal-chat-input-outer-wrapper ${messages.length > 0 ? 'has-messages' : ''}`}>
        {/* Parent container has a dark background in light mode and white background in darkmode */}
        <div className="goal-chat-input-parent-container">
          {/* Inside it comes the input field with different buttons */}
          <div className="goal-chat-input-field-container">
            <textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="What funds are available from Fidelity and T. Rowe Price?"
              rows={1}
              className="goal-chat-textarea"
            />

            {/* Inner actions row */}
            <div className="goal-chat-actions-row">
              {/* Left Side Action Icons */}
              <div className="goal-chat-left-actions">
                <button type="button" title="Add resource" className="goal-chat-action-btn">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>

                <button
                  type="button"
                  title="Search Web"
                  onClick={() => setSelectedFocus(selectedFocus === 'web' ? 'all' : 'web')}
                  className={`goal-chat-action-btn ${selectedFocus === 'web' ? 'active' : ''}`}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                </button>

                <button
                  type="button"
                  title="Focus Goals"
                  onClick={() => setSelectedFocus(selectedFocus === 'goals' ? 'all' : 'goals')}
                  className={`goal-chat-action-btn ${selectedFocus === 'goals' ? 'active' : ''}`}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <circle cx="12" cy="12" r="6"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                  </svg>
                </button>

                <button type="button" title="Options / Preset" className="goal-chat-action-btn">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="21" x2="4" y2="14"></line>
                    <line x1="4" y1="10" x2="4" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12" y2="3"></line>
                    <line x1="20" y1="21" x2="20" y2="16"></line>
                    <line x1="20" y1="12" x2="20" y2="3"></line>
                    <line x1="2" y1="14" x2="6" y2="14"></line>
                    <line x1="10" y1="8" x2="14" y2="8"></line>
                    <line x1="18" y1="16" x2="22" y2="16"></line>
                  </svg>
                </button>
              </div>

              {/* Right Side Submit Button */}
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isTyping}
                className={`goal-chat-submit-btn ${inputMessage.trim() ? 'active' : ''}`}
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
              </button>
            </div>
          </div>

          {/* Below the input field comes another section */}
          <div className="goal-chat-tray-container">
            {/* Left side pills */}
            <div className="goal-chat-left-actions">
              {/* Stardog model pill */}
              <div className="goal-chat-pill bold">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                Stardog
              </div>

              {/* Sources pill */}
              <div className="goal-chat-pill">
                <span className="goal-chat-pill-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
                Sources
              </div>
            </div>

            {/* Status / searching message indicator */}
            <div className={`goal-chat-tray-status ${isTyping ? 'typing' : ''}`}>
              {statusMessage}
            </div>

            {/* Stop action button */}
            {isTyping && (
              <button onClick={handleStop} className="goal-chat-stop-btn">
                Stop
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right Side Panel */}
      {isPanelOpen && (
        <div className="goal-chat-side-panel">
          <div className="goal-chat-side-panel-header">
            <h3>Your Goals</h3>
            <button onClick={() => setIsPanelOpen(false)} className="goal-chat-close-panel-btn">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>
          <div className="goal-chat-side-panel-content">
            {isLoadingGoals ? (
              <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--muted)'}}>
                Loading...
              </div>
            ) : goals.length === 0 && cards.length === 0 ? (
              <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--muted)', textAlign: 'center', padding: 20}}>
                <div>
                  <p>No goals or tasks yet</p>
                  <p style={{fontSize: 12, marginTop: 8}}>Create your first goal or task to get started</p>
                </div>
              </div>
            ) : goals.length > 0 ? (
              <div className="goal-chat-goals-list">
                {goals.map((goal) => (
                  <div key={goal.id} className="goal-chat-goal-item">
                    <div className="goal-chat-goal-header">
                      <h4>{goal.wish || 'Untitled Goal'}</h4>
                      <span className="goal-chat-goal-status">{goal.status || 'Active'}</span>
                    </div>
                    <div className="goal-chat-tasks-list">
                      {cards
                        .filter(card => card.goal_id === goal.id)
                        .map((card) => (
                          <div key={card.id} className="goal-chat-task-item">
                            <span className="goal-chat-task-name">{card.title}</span>
                            <span 
                              className="goal-chat-task-status" 
                              data-status={card.column_status === 'done' ? 'done' : card.column_status === 'in-progress' ? 'in-progress' : 'todo'}
                            >
                              {card.column_status === 'done' ? 'Done' : card.column_status === 'in-progress' ? 'In Progress' : 'Todo'}
                            </span>
                          </div>
                        ))}
                      {cards.filter(card => card.goal_id === goal.id).length === 0 && (
                        <div style={{padding: '8px 12px', color: 'var(--muted)', fontSize: 12}}>
                          No tasks yet
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // Show tasks categorized by status when no goals exist
              <div className="goal-chat-goals-list">
                {['todo', 'in-progress', 'review', 'done'].map((status) => {
                  const statusCards = cards.filter(card => card.column_status === status)
                  if (statusCards.length === 0) return null
                  
                  const statusLabel = status === 'todo' ? 'To Do' : status === 'in-progress' ? 'In Progress' : status === 'review' ? 'Review' : 'Done'
                  const statusClass = status === 'todo' ? 'status-todo' : status === 'in-progress' ? 'status-in-progress' : status === 'review' ? 'status-review' : 'status-done'
                  
                  return (
                    <div key={status} className={`goal-chat-goal-item ${statusClass}`}>
                      <div className="goal-chat-goal-header">
                        <h4>{statusLabel}</h4>
                        <span className="goal-chat-goal-status">{statusCards.length} tasks</span>
                      </div>
                      <div className="goal-chat-tasks-list">
                        {statusCards.map((card) => (
                          <div key={card.id} className="goal-chat-task-item">
                            <span className="goal-chat-task-name">{card.title}</span>
                            {card.labels && card.labels.length > 0 && (
                              <span className="goal-chat-task-label">{card.labels[0].name}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}


