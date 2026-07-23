'use client'

import React, { useState } from 'react'
import { ImplementationIntention } from './step4-get-creative'

interface Step5Props {
  topPriorities: string[]
  setTopPriorities: React.Dispatch<React.SetStateAction<string[]>>
  weeklyMotto: string
  setWeeklyMotto: (motto: string) => void
  intention: ImplementationIntention
  energyLevel: number
  isSaving: boolean
  onFinishReview: () => void
  onPrevStep: () => void
}

export function Step5CommitmentSummary({
  topPriorities,
  setTopPriorities,
  weeklyMotto,
  setWeeklyMotto,
  intention,
  energyLevel,
  isSaving,
  onFinishReview,
  onPrevStep
}: Step5Props) {
  const [priorityInput, setPriorityInput] = useState('')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!priorityInput.trim() || topPriorities.length >= 3) return
    setTopPriorities((prev) => [...prev, priorityInput.trim()])
    setPriorityInput('')
  }

  const handleRemove = (idx: number) => {
    setTopPriorities((prev) => prev.filter((_, i) => i !== idx))
  }

  const formattedWeek = `Week of ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`

  return (
    <div className="wr-step">
      {/* Evidence Banner */}
      <div className="wr-evidence wr-evidence--success">
        <div className="wr-evidence__icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <div className="wr-evidence__title">Evidence Rationale: Dopamine Reinforcement & Focus Narrowing</div>
          <p className="wr-evidence__body">
            Limiting weekly priorities to the <strong>Rule of 3</strong> prevents cognitive overload.
            Visualizing your commitment seal triggers positive dopamine reinforcement to start next week with momentum.
          </p>
        </div>
      </div>

      {/* Two-col layout */}
      <div className="wr-grid wr-grid--2col">
        {/* Left: Form */}
        <div className="wr-commitment__form-card">
          <div className="wr-card__header">
            <h2 className="wr-card__title">Top 3 Weekly Priorities</h2>
            <span className="wr-card__badge">{topPriorities.length}/3 Defined</span>
          </div>
          <p className="wr-card__subtitle wr-mb">
            What are the 3 non-negotiable achievements for next week?
          </p>

          {topPriorities.length < 3 && (
            <form className="wr-input-row wr-mb" onSubmit={handleAdd}>
              <input
                type="text"
                className="wr-input"
                value={priorityInput}
                onChange={(e) => setPriorityInput(e.target.value)}
                placeholder="Add a priority task..."
              />
              <button type="submit" className="wr-btn wr-btn--primary wr-btn--md" disabled={!priorityInput.trim()}>
                + Add
              </button>
            </form>
          )}

          <div className="wr-commitment__priority-list">
            {topPriorities.map((p, idx) => (
              <div key={idx} className="wr-commitment__priority-item">
                <div className="wr-commitment__priority-item-inner">
                  <span className="wr-commitment__priority-num">{idx + 1}</span>
                  <span className="wr-commitment__priority-text">{p}</span>
                </div>
                <button className="wr-commitment__priority-remove" onClick={() => handleRemove(idx)}>✕</button>
              </div>
            ))}
          </div>

          <div className="wr-commitment__motto-wrap">
            <div className="wr-commitment__section-label">Weekly Theme / Motto</div>
            <input
              type="text"
              className="wr-input"
              value={weeklyMotto}
              onChange={(e) => setWeeklyMotto(e.target.value)}
              placeholder="e.g. Focus on Execution over Perfection"
            />
          </div>
        </div>

        {/* Right: Visual Focus Card */}
        <div className="wr-commitment__visual-card">
          <div className="wr-commitment__card-header">
            <div className="wr-commitment__card-brand">
              <span className="wr-commitment__card-dot" />
              <span className="wr-commitment__card-brand-name">BetterMe Focus Card</span>
            </div>
            <span className="wr-commitment__card-week">{formattedWeek}</span>
          </div>

          {weeklyMotto && (
            <div className="wr-commitment__card-motto">&quot;{weeklyMotto}&quot;</div>
          )}

          <div className="wr-commitment__card-section-label">Next Week Priorities:</div>
          <div className="wr-commitment__card-priorities">
            {topPriorities.length === 0 ? (
              <span className="wr-commitment__card-empty">No priorities defined yet.</span>
            ) : (
              topPriorities.map((p, i) => (
                <div key={i} className="wr-commitment__card-priority-item">
                  <span className="wr-commitment__card-priority-num">{i + 1}</span>
                  <span>{p}</span>
                </div>
              ))
            )}
          </div>

          {intention.trigger && intention.action && (
            <div className="wr-commitment__card-intention">
              <span className="wr-commitment__card-intention-label">Core Habit Adjustment:</span>
              <p className="wr-commitment__card-intention-text">
                WHEN <strong>{intention.trigger}</strong> ➔ I WILL <strong>{intention.action}</strong>
              </p>
            </div>
          )}

          <div className="wr-commitment__card-footer">
            <span>Energy Rating: {energyLevel}/5</span>
            <span className="wr-commitment__card-cta">Ready for Next Week 🚀</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="wr-nav">
        <button className="wr-btn wr-btn--ghost wr-btn--md" onClick={onPrevStep}>← Back</button>
        <button
          className="wr-btn wr-btn--seal"
          onClick={onFinishReview}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <svg className="wr-spinner" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Sealing Weekly Review...
            </>
          ) : (
            <>
              Complete & Seal Weekly Review
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
