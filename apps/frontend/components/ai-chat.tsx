'use client'

import { useState, useRef, useEffect } from 'react'
import { ChatHistorySidebar } from './chat-history-sidebar'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: Date
}

const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: "Hey! Good to see you. What's on your mind — a task you're stuck on, a goal you want to break down, or just a general check-in?",
  timestamp: new Date()
}

const SUGGESTIONS = [
  "What should I focus on today?",
  "Help me break down a big goal",
  "I'm struggling to start something",
  "Review my week with me",
]

export function AIChat() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [conversationTitle, setConversationTitle] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [userMessageCount, setUserMessageCount] = useState(0)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const resetToWelcome = () => {
    setMessages([{ ...WELCOME_MESSAGE, timestamp: new Date() }])
    setShowSuggestions(true)
    setError(null)
    setCurrentConversationId(null)
    setConversationTitle(null)
    setUserMessageCount(0)
  }

  const createNewConversation = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await fetch('http://localhost:3001/api/ai/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: 'New Chat' })
      })

      if (response.ok) {
        const conversation = await response.json()
        setCurrentConversationId(conversation.id)
        resetToWelcome()
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
      resetToWelcome()
    }
  }

  const loadConversation = async (conversationId: string) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await fetch(`http://localhost:3001/api/ai/conversations/${conversationId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        const loaded: Message[] = data.map((m: any) => ({
          role: m.role,
          content: m.content,
          timestamp: new Date(m.created_at)
        }))
        setMessages(loaded.length > 0 ? loaded : [{ ...WELCOME_MESSAGE, timestamp: new Date() }])
        setShowSuggestions(false)
        setCurrentConversationId(conversationId)
      }
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }

  // After 1st or 2nd user message, ask the backend to generate an AI title
  const tryGenerateTitle = async (convId: string, msgCount: number) => {
    // Only attempt on first two exchanges; stop once we have a real title
    if (msgCount > 2) return
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return
      const res = await fetch(`http://localhost:3001/api/ai/conversations/${convId}/generate-title`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        if (!data.skipped && data.title) {
          setConversationTitle(data.title)
        }
      }
    } catch (e) {
      // Non-critical — silently ignore
    }
  }
  const handleSend = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim()
    if (!text || loading) return

    const userMessage: Message = { role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError(null)
    setShowSuggestions(false)

    const newUserCount = userMessageCount + 1
    setUserMessageCount(newUserCount)

    // Auto-create a conversation on first real user message
    let conversationId = currentConversationId
    if (!conversationId) {
      try {
        const token = localStorage.getItem('authToken')
        if (token) {
          const res = await fetch('http://localhost:3001/api/ai/conversations', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: 'New Chat' })
          })
          if (res.ok) {
            const conv = await res.json()
            conversationId = conv.id
            setCurrentConversationId(conversationId)
          }
        }
      } catch (e) {
        console.error('Failed to create conversation:', e)
      }
    }

    try {
      // Send full conversation history so AI has full context
      const historyToSend = [...messages, userMessage]
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }))

      const response = await fetch('http://localhost:3001/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify({ messages: historyToSend, conversationId })
      })

      if (!response.ok) throw new Error('Failed to get response')

      const data = await response.json()
      const assistantMsg = { role: 'assistant' as const, content: data.response, timestamp: new Date() }
      setMessages(prev => [...prev, assistantMsg])

      // Fire-and-forget: generate an AI title after 1st or 2nd exchange
      if (conversationId && newUserCount <= 2) {
        tryGenerateTitle(conversationId, newUserCount)
      }
    } catch (err) {
      setError('Hmm, something went wrong on my end. Try again?')
      setMessages(prev => prev.filter((_, i) => i !== prev.length - 1))
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* History sidebar — rendered at root level so the panel fills the chat panel correctly */}
      <ChatHistorySidebar
        currentConversationId={currentConversationId}
        onSelectConversation={loadConversation}
        onNewChat={createNewConversation}
        onDeleteConversation={(id) => {
          if (id === currentConversationId) resetToWelcome()
        }}
        onRenameConversation={() => {}}
      />

      {/* Messages using original dashboard style classes */}
      <div className="ai-chat-messages" style={{ paddingTop: '50px' }}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`ai-chat-message ${message.role === 'user' ? 'user' : 'assistant'}`}
          >
            {message.role === 'assistant' && (
              <div className="ai-chat-message-avatar">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" fill="currentColor"/>
                </svg>
              </div>
            )}
            <div className="ai-chat-message-content">
              {message.content}
            </div>
          </div>
        ))}

        {/* Typing indicator matching dashboard mockup styles */}
        {loading && (
          <div className="ai-chat-message assistant">
            <div className="ai-chat-message-avatar">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" fill="currentColor"/>
              </svg>
            </div>
            <div className="ai-chat-message-content ai-chat-typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div style={{ color: '#ef4444', textAlign: 'center', fontSize: '12px', padding: '10px' }}>
            {error}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick suggestions using original styled suggestion classes */}
      {showSuggestions && !loading && (
        <div style={{ padding: '0 16px' }}>
          <div className="ai-chat-suggestions">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                className="ai-chat-suggestion"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area using original dashboard style classes */}
      <div className="ai-chat-input-wrapper">
        <textarea
          ref={inputRef}
          className="ai-chat-input"
          placeholder="Message your coach..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          rows={1}
        />
        <button
          className="ai-chat-send"
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
        >
          <svg viewBox="0 0 24 24" fill="none">
            <line x1="22" y1="2" x2="11" y2="13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
