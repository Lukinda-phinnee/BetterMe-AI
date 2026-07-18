'use client'

import { useState, useEffect } from 'react'
import { useConfirm } from './confirm-provider'

interface Conversation {
  id: string
  title: string
  created_at: string
  updated_at: string
}

interface ChatHistorySidebarProps {
  currentConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewChat: () => void
  onDeleteConversation: (id: string) => void
  onRenameConversation: (id: string, newTitle: string) => void
}

export function ChatHistorySidebar({
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation
}: ChatHistorySidebarProps) {
  const confirm = useConfirm()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await fetch('http://localhost:3001/api/ai/conversations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setConversations(data)
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRename = async (id: string) => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await fetch(`http://localhost:3001/api/ai/conversations/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: editTitle })
      })

      if (response.ok) {
        onRenameConversation(id, editTitle)
        setConversations(prev => 
          prev.map(conv => 
            conv.id === id ? { ...conv, title: editTitle } : conv
          )
        )
        setEditingId(null)
      }
    } catch (error) {
      console.error('Failed to rename conversation:', error)
    }
  }

  const handleDelete = async (id: string) => {
    const confirmed = await confirm({
      title: 'Delete conversation?',
      message: 'This conversation and its messages will be permanently removed. This cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      danger: true,
    })
    if (!confirmed) return

    try {
      const token = localStorage.getItem('authToken')
      if (!token) return

      const response = await fetch(`http://localhost:3001/api/ai/conversations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        onDeleteConversation(id)
        setConversations(prev => prev.filter(conv => conv.id !== id))
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <>
      {/* Premium styled toggling button using class definition */}
      {/* Toggle button — absolutely positioned at top-left of the chat panel */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="ai-history-btn"
        title="Chat History"
        style={{ position: 'absolute', top: '10px', left: '16px', zIndex: 20 }}
      >
        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Premium Chat History Sidebar — slides in within the chat panel */}
          <div className="ai-history-sidebar" style={{ top: 0, bottom: 0, left: 0, right: 0 }}>
            <div className="ai-history-header">
              <span>Chat History</span>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 rounded-md transition-colors border-0 bg-transparent cursor-pointer flex items-center justify-center"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* New Conversation Button */}
            <button
              onClick={() => {
                onNewChat()
                setIsOpen(false)
              }}
              className="ai-history-new-btn"
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span>New Conversation</span>
            </button>

            {/* Conversation list */}
            <div className="ai-history-list">
              {loading ? (
                <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', padding: '24px 0' }}>
                  Loading history...
                </div>
              ) : conversations.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--muted)', fontSize: '13px', padding: '24px 0' }}>
                  No history found
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`ai-history-item group ${currentConversationId === conversation.id ? 'active' : ''}`}
                    onClick={() => {
                      onSelectConversation(conversation.id)
                      setIsOpen(false)
                    }}
                  >
                    {editingId === conversation.id ? (
                      <div style={{ display: 'flex', gap: '8px', width: '100%' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRename(conversation.id)
                            if (e.key === 'Escape') setEditingId(null)
                          }}
                          style={{
                            flex: 1,
                            padding: '4px 8px',
                            fontSize: '13px',
                            border: '1.5px solid var(--primary)',
                            borderRadius: '6px',
                            outline: 'none',
                            background: 'var(--surface)',
                            color: 'var(--ink)'
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleRename(conversation.id)}
                          style={{
                            padding: '4px',
                            border: 'none',
                            background: 'var(--primary-tint)',
                            color: 'var(--primary)',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="ai-history-item-title">{conversation.title}</div>
                        <div className="ai-history-item-date">
                          {formatDate(conversation.updated_at)}
                        </div>

                        {/* Inline options on hover */}
                        <div
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            display: 'flex',
                            gap: '4px',
                            opacity: 0,
                            transition: 'opacity 0.2s ease',
                          }}
                          className="group-hover:opacity-100"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setEditingId(conversation.id)
                              setEditTitle(conversation.title)
                            }}
                            style={{
                              background: 'var(--surface-2)',
                              border: 'none',
                              color: 'var(--ink-soft)',
                              padding: '5px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Rename"
                          >
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(conversation.id)}
                            style={{
                              background: 'rgba(239, 68, 68, 0.08)',
                              border: 'none',
                              color: '#ef4444',
                              padding: '5px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Delete"
                          >
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
