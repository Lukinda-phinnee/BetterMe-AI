'use client'

import { useState } from 'react'

interface InboxItem {
  id: string
  text: string
  createdAt: string
  priority?: 'Q1' | 'Q2' | 'Q3' | 'Q4'
}

export default function InboxPage() {
  const [inboxItems, setInboxItems] = useState<InboxItem[]>([
    { id: '1', text: 'Prepare slides for Q3 planning session', createdAt: '2 hours ago', priority: 'Q2' },
    { id: '2', text: 'Buy gift for Sarah birthday', createdAt: '4 hours ago', priority: 'Q4' },
    { id: '3', text: 'Research new AI coaching prompts from BJ Fogg Fogg Behavior Model', createdAt: 'Yesterday', priority: 'Q2' },
    { id: '4', text: 'Review team performance reviews', createdAt: '2 days ago', priority: 'Q1' }
  ])
  const [newIdea, setNewIdea] = useState('')
  const [selectedPriority, setSelectedPriority] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q2')

  const handleCapture = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newIdea.trim()) return
    const item: InboxItem = {
      id: Date.now().toString(),
      text: newIdea,
      createdAt: 'Just now',
      priority: selectedPriority
    }
    setInboxItems([item, ...inboxItems])
    setNewIdea('')
  }

  const removeItem = (id: string) => {
    setInboxItems(inboxItems.filter(item => item.id !== id))
  }

  return (
    <div className="screen-content" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div className="card" style={{ padding: '24px', borderRadius: '24px', marginBottom: '24px', boxShadow: 'var(--shadow-sm)' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--ink)' }}>
          📥 GTD Capture Inbox
        </h2>
        <p style={{ fontSize: '13.5px', color: 'var(--muted)', marginBottom: '20px' }}>
          Capture thoughts, ideas, or obligations instantly. Clear your working memory immediately; organize and triage them later.
        </p>

        <form onSubmit={handleCapture} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Quick capture a thought (e.g., 'Draft proposal for redesign...')"
            value={newIdea}
            onChange={(e) => setNewIdea(e.target.value)}
            style={{
              flex: 1,
              minWidth: '280px',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1.5px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--ink)',
              outline: 'none',
              fontSize: '14px'
            }}
          />

          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>Priority:</span>
            {(['Q1', 'Q2', 'Q3', 'Q4'] as const).map(q => (
              <button
                key={q}
                type="button"
                onClick={() => setSelectedPriority(q)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: selectedPriority === q ? '1.5px solid var(--primary)' : '1.5px solid var(--border)',
                  background: selectedPriority === q ? 'var(--primary-tint)' : 'var(--surface)',
                  color: selectedPriority === q ? 'var(--primary)' : 'var(--ink-soft)',
                  transition: 'all 0.15s ease'
                }}
              >
                {q}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ padding: '12px 24px', width: 'auto', borderRadius: '12px', boxShadow: 'none' }}
          >
            Capture Idea
          </button>
        </form>
      </div>

      <div style={{ display: 'grid', gap: '12px' }}>
        {inboxItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--muted)' }}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>✨</div>
            <p style={{ fontSize: '14px' }}>Your inbox is perfectly clear. Everything is processed!</p>
          </div>
        ) : (
          inboxItems.map(item => (
            <div
              key={item.id}
              className="card"
              style={{
                padding: '16px 20px',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '6px',
                    background:
                      item.priority === 'Q1'
                        ? 'rgba(239, 68, 68, 0.1)'
                        : item.priority === 'Q2'
                        ? 'rgba(99, 102, 241, 0.1)'
                        : item.priority === 'Q3'
                        ? 'rgba(245, 158, 11, 0.1)'
                        : 'rgba(107, 114, 128, 0.1)',
                    color:
                      item.priority === 'Q1'
                        ? '#ef4444'
                        : item.priority === 'Q2'
                        ? 'var(--primary)'
                        : item.priority === 'Q3'
                        ? '#f59e0b'
                        : 'var(--muted)'
                  }}
                >
                  {item.priority}
                </span>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--ink)' }}>{item.text}</p>
                  <span style={{ fontSize: '11.5px', color: 'var(--muted)' }}>Captured {item.createdAt}</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Convert to Task
                </button>
                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '1px solid transparent',
                    background: 'none',
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  title="Archive/Dismiss"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: '16px', height: '16px' }}>
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
