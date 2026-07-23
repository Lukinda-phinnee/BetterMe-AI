'use client'

import React from 'react'

export interface GoalAlignmentItem {
  id: string
  title: string
  category: string
  targetDate: string
  currentProgress: number
  previousProgress: number
  linkedHabitsCount: number
  linkedTasksCount: number
  status: 'on_track' | 'needs_attention' | 'stalled'
}

interface Step3Props {
  goals: GoalAlignmentItem[]
  setGoals: React.Dispatch<React.SetStateAction<GoalAlignmentItem[]>>
  woopObstacle: string
  setWoopObstacle: (text: string) => void
  onNextStep: () => void
  onPrevStep: () => void
}

export function Step3GoalAlignment({
  goals,
  setGoals,
  woopObstacle,
  setWoopObstacle,
  onNextStep,
  onPrevStep
}: Step3Props) {
  const averageProgress =
    goals.length > 0
      ? Math.round(goals.reduce((acc, g) => acc + g.currentProgress, 0) / goals.length)
      : 0

  const handleProgressChange = (id: string, newProgress: number) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g
        const status = newProgress - g.previousProgress >= 0 ? 'on_track' : 'needs_attention'
        return { ...g, currentProgress: newProgress, status }
      })
    )
  }

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
          <div className="wr-evidence__title">Evidence Rationale: Goal Alignment & WOOP Method</div>
          <p className="wr-evidence__body">
            <strong>Locke &amp; Latham Goal Setting Theory</strong> shows goals without active habits become inactive wishes.
            Evaluating weekly progress deltas and identifying hidden obstacles (<strong>WOOP method</strong>) ensures daily effort matches long-term vision.
          </p>
        </div>
      </div>

      {/* Summary Bar */}
      <div className="wr-goal-summary">
        <div className="wr-goal-summary__left">
          <h2 className="wr-goal-summary__title">Active High-Level Goals ({goals.length})</h2>
          <p className="wr-goal-summary__sub">Overall Goal Progress Velocity</p>
        </div>
        <div className="wr-goal-summary__right">
          <div>
            <div className="wr-goal-summary__value">{averageProgress}%</div>
            <div className="wr-goal-summary__label">Average Completion</div>
          </div>
          <div className="wr-goal-summary__bar-wrap">
            <div className="wr-goal-summary__bar-fill" style={{ width: `${averageProgress}%` }} />
          </div>
        </div>
      </div>

      {/* Goal Cards */}
      <div className="wr-goal-list">
        {goals.map((goal) => {
          const delta         = goal.currentProgress - goal.previousProgress
          const hasDrivers    = goal.linkedHabitsCount > 0

          return (
            <div key={goal.id} className="wr-goal-item">
              <div className="wr-goal-item__header">
                <div>
                  <div className="wr-goal-item__name">
                    {goal.title}
                    <span className="wr-goal-item__category">{goal.category}</span>
                  </div>
                  <div className="wr-goal-item__meta">
                    <span>Target: {goal.targetDate}</span>
                    <span>•</span>
                    <span className={`wr-goal-item__habits-badge wr-goal-item__habits-badge--${hasDrivers ? 'ok' : 'warn'}`}>
                      {hasDrivers ? `✓ ${goal.linkedHabitsCount} Driving Habits` : '⚠ No active habits driving this goal'}
                    </span>
                  </div>
                </div>
                <div className="wr-goal-item__progress-info">
                  <span className="wr-goal-item__pct">{goal.currentProgress}%</span>
                  {delta !== 0 && (
                    <span className={`wr-goal-item__delta wr-goal-item__delta--${delta > 0 ? 'up' : 'down'}`}>
                      {delta > 0 ? `+${delta}%` : `${delta}%`} this week
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Slider */}
              <div className="wr-goal-item__slider">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={goal.currentProgress}
                  onChange={(e) => handleProgressChange(goal.id, Number(e.target.value))}
                  className="wr-goal-item__range"
                />
                <div className="wr-goal-item__slider-labels">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* WOOP Obstacle Section */}
      <div className="wr-woop">
        <div className="wr-woop__header">
          <h2 className="wr-woop__title">WOOP Friction & Obstacle Check-in</h2>
          <p className="wr-woop__desc">
            What is the primary mental or environmental obstacle holding back your progress on your key goals right now?
          </p>
        </div>
        <textarea
          className="wr-textarea wr-textarea--accent"
          value={woopObstacle}
          onChange={(e) => setWoopObstacle(e.target.value)}
          placeholder="E.g., Unexpected work emergencies mid-afternoon drain my energy before my evening workout..."
          rows={3}
        />
      </div>

      {/* Navigation */}
      <div className="wr-nav">
        <button className="wr-btn wr-btn--ghost wr-btn--md" onClick={onPrevStep}>← Back</button>
        <button className="wr-btn wr-btn--primary wr-btn--lg" onClick={onNextStep}>
          Continue to Step 4: Get Creative
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  )
}
