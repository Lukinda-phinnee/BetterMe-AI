'use client'

import React, { useState } from 'react'

export interface InboxItem {
  id: string
  title: string
  status: 'pending' | 'scheduled' | 'habit' | 'archived'
}

const CHECKLIST_ITEMS = [
  { id: 'desk',     label: 'Clear physical desk & paper notes' },
  { id: 'desktop',  label: 'Clear desktop downloads & open browser tabs' },
  { id: 'calendar', label: 'Scan past 7 days calendar for missed items' },
  { id: 'notes',    label: 'Gather physical notebooks & phone voice notes' }
]

interface Step1Props {
  inboxItems: InboxItem[]
  setInboxItems: React.Dispatch<React.SetStateAction<InboxItem[]>>
  workspaceChecklist: Record<string, boolean>
  setWorkspaceChecklist: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  onNextStep: () => void
}

export function Step1GetClear({
  inboxItems,
  setInboxItems,
  workspaceChecklist,
  setWorkspaceChecklist,
  onNextStep
}: Step1Props) {
  const [newThought, setNewThought] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newThought.trim()) return
    setInboxItems((prev) => [{ id: Date.now().toString(), title: newThought.trim(), status: 'pending' }, ...prev])
    setNewThought('')
  }

  const handleAction = (id: string, action: 'scheduled' | 'habit' | 'archived') => {
    setInboxItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: action } : item)))
  }

  const toggleChecklist = (key: string) => {
    setWorkspaceChecklist((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const pendingCount = inboxItems.filter((i) => i.status === 'pending').length
  const checkCount  = Object.values(workspaceChecklist).filter(Boolean).length

  return (
    <div className="wr-step">
      {/* Evidence Banner */}
      <div className="wr-evidence">
        <div className="wr-evidence__icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <div className="wr-evidence__title">Evidence Rationale: Cognitive Load Reduction</div>
          <p className="wr-evidence__body">
            According to <strong>GTD (David Allen)</strong> &amp; Cognitive Science, uncaptured thoughts consume working memory.
            Clearing loose inbox items first frees mental capacity for deep reflection in Steps 2–4.
          </p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="wr-grid wr-grid--7-5">
        {/* Left: Inbox */}
        <div className="wr-card">
          <div className="wr-card__header">
            <h2 className="wr-card__title">Empty Mental Inbox ({pendingCount} Pending)</h2>
            <span className="wr-card__badge wr-card__badge--step">Step 1 of 5</span>
          </div>

          {/* Capture Input */}
          <form className="wr-input-row wr-mb" onSubmit={handleAdd}>
            <input
              type="text"
              className="wr-input"
              value={newThought}
              onChange={(e) => setNewThought(e.target.value)}
              placeholder="Dump any loose thought, task, or friction here..."
            />
            <button type="submit" className="wr-btn wr-btn--primary wr-btn--md" disabled={!newThought.trim()}>
              Capture
            </button>
          </form>

          {/* Inbox List */}
          <div className="wr-inbox-list">
            {inboxItems.length === 0 ? (
              <div className="wr-inbox-empty">Inbox is empty! Perfect state to move forward.</div>
            ) : (
              inboxItems.map((item) => (
                <div
                  key={item.id}
                  className={`wr-inbox-item ${item.status !== 'pending' ? 'wr-inbox-item--processed' : ''}`}
                >
                  <span className="wr-inbox-item__text">{item.title}</span>
                  {item.status === 'pending' ? (
                    <div className="wr-inbox-item__actions">
                      <button
                        className="wr-inbox-item__action-btn wr-inbox-item__action-btn--schedule"
                        onClick={() => handleAction(item.id, 'scheduled')}
                      >
                        Schedule Task
                      </button>
                      <button
                        className="wr-inbox-item__action-btn wr-inbox-item__action-btn--habit"
                        onClick={() => handleAction(item.id, 'habit')}
                      >
                        + Habit
                      </button>
                      <button
                        className="wr-inbox-item__action-btn wr-inbox-item__action-btn--archive"
                        onClick={() => handleAction(item.id, 'archived')}
                        title="Archive"
                      >
                        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <span className="wr-inbox-item__status-chip">{item.status}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right: Workspace Checklist */}
        <div className="wr-card">
          <div className="wr-card__header">
            <h2 className="wr-card__title">Environment Reset</h2>
            <span className="wr-card__badge">{checkCount}/4 Ready</span>
          </div>
          <p className="wr-card__subtitle wr-mb">
            Clear physical &amp; digital distractions before reviewing.
          </p>
          <div className="wr-checklist">
            {CHECKLIST_ITEMS.map((item) => {
              const isChecked = !!workspaceChecklist[item.id]
              return (
                <div
                  key={item.id}
                  className={`wr-checklist-item ${isChecked ? 'wr-checklist-item--checked' : ''}`}
                  onClick={() => toggleChecklist(item.id)}
                >
                  <div className="wr-checklist-item__box">
                    {isChecked && (
                      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="wr-checklist-item__label">{item.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="wr-nav">
        <span />
        <button className="wr-btn wr-btn--primary wr-btn--lg" onClick={onNextStep}>
          Continue to Step 2: Get Current
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  )
}
