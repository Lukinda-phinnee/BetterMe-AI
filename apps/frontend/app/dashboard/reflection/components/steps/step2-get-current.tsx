'use client'

import React from 'react'

export interface HabitRetroItem {
  id: string
  title: string
  targetDays: number
  completedDays: boolean[]
  streak: number
  category: string
}

export interface RolloverTaskItem {
  id: string
  title: string
  postponedCount: number
  originalDate: string
  action?: 'keep' | 'breakdown' | 'reschedule' | 'drop'
}

const DAYS_SHORT = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

interface Step2Props {
  habits: HabitRetroItem[]
  rolloverTasks: RolloverTaskItem[]
  setRolloverTasks: React.Dispatch<React.SetStateAction<RolloverTaskItem[]>>
  energyLevel: number
  setEnergyLevel: (level: number) => void
  stressLevel: number
  setStressLevel: (level: number) => void
  onNextStep: () => void
  onPrevStep: () => void
}

export function Step2GetCurrent({
  habits,
  rolloverTasks,
  setRolloverTasks,
  energyLevel,
  setEnergyLevel,
  stressLevel,
  setStressLevel,
  onNextStep,
  onPrevStep
}: Step2Props) {
  const totalTarget  = habits.reduce((acc, h) => acc + h.targetDays, 0)
  const totalDone    = habits.reduce((acc, h) => acc + h.completedDays.filter(Boolean).length, 0)
  const velocityPct  = totalTarget > 0 ? Math.round((totalDone / totalTarget) * 100) : 0

  const handleRolloverAction = (id: string, action: 'keep' | 'breakdown' | 'reschedule' | 'drop') => {
    setRolloverTasks((prev) => prev.map((t) => (t.id === id ? { ...t, action } : t)))
  }

  return (
    <div className="wr-step">
      {/* Evidence Banner */}
      <div className="wr-evidence">
        <div className="wr-evidence__icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <div className="wr-evidence__title">Evidence Rationale: Non-Judgmental Self-Monitoring</div>
          <p className="wr-evidence__body">
            Behavioral research (<strong>Wendy Wood, BJ Fogg</strong>) shows that tracking weekly habit velocity without shame highlights environmental friction. Tasks postponed more than twice signal missing implementation intentions.
          </p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="wr-metrics-row">
        <div className="wr-metric-card">
          <div className="wr-metric-card__icon wr-metric-card__icon--success">{velocityPct}%</div>
          <div>
            <div className="wr-metric-card__label">Habit Velocity</div>
            <div className="wr-metric-card__value">{totalDone} of {totalTarget} Completed</div>
          </div>
        </div>
        <div className="wr-metric-card">
          <div className="wr-metric-card__icon wr-metric-card__icon--accent">{rolloverTasks.length}</div>
          <div>
            <div className="wr-metric-card__label">Rollover Tasks</div>
            <div className="wr-metric-card__value">Postponed &gt; 2 times</div>
          </div>
        </div>
        <div className="wr-metric-card">
          <div className="wr-metric-card__icon wr-metric-card__icon--primary">{energyLevel}/5</div>
          <div>
            <div className="wr-metric-card__label">Energy Level</div>
            <div className="wr-metric-card__value">
              {energyLevel >= 4 ? 'High Flow' : energyLevel === 3 ? 'Balanced' : 'Tired/Depleted'}
            </div>
          </div>
        </div>
      </div>

      {/* Habit Matrix */}
      <div className="wr-card">
        <div className="wr-card__header">
          <h2 className="wr-card__title wr-card__title--success">Weekly Habit Execution Breakdown</h2>
        </div>
        <div className="wr-habit-list">
          {habits.map((habit) => {
            const doneCount = habit.completedDays.filter(Boolean).length
            const pct       = Math.round((doneCount / habit.targetDays) * 100)
            return (
              <div key={habit.id} className="wr-habit-row">
                <div className="wr-habit-row__info">
                  <div className="wr-habit-row__name">
                    {habit.title}
                    <span className="wr-habit-row__streak">🔥 {habit.streak} day streak</span>
                  </div>
                  <div className="wr-habit-row__meta">
                    Target: {habit.targetDays} days/week · Achieved: {doneCount} days ({pct}%)
                  </div>
                </div>
                <div className="wr-habit-row__days">
                  {habit.completedDays.map((done, idx) => (
                    <div
                      key={idx}
                      className={`wr-habit-row__day ${done ? 'wr-habit-row__day--done' : ''}`}
                      title={`${DAYS_SHORT[idx]}: ${done ? 'Completed' : 'Missed'}`}
                    >
                      {DAYS_SHORT[idx]}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Rollover + Wellbeing */}
      <div className="wr-grid wr-grid--7-5">
        {/* Rollover tasks */}
        <div className="wr-card">
          <div className="wr-card__header">
            <h2 className="wr-card__title wr-card__title--accent">Rollover Task Audit</h2>
            <span className="wr-card__badge wr-card__badge--step">Triage repeated delays</span>
          </div>
          <div className="wr-rollover-list">
            {rolloverTasks.length === 0 ? (
              <div className="wr-inbox-empty">No delayed tasks! Great execution velocity this week.</div>
            ) : (
              rolloverTasks.map((task) => (
                <div key={task.id} className="wr-rollover-item">
                  <div className="wr-rollover-item__header">
                    <span className="wr-rollover-item__title">{task.title}</span>
                    <span className="wr-rollover-item__count">Postponed {task.postponedCount}x</span>
                  </div>
                  <div className="wr-rollover-item__actions">
                    <span className="wr-rollover-item__action-label">Action:</span>
                    {(['breakdown', 'reschedule', 'drop'] as const).map((act) => (
                      <button
                        key={act}
                        onClick={() => handleRolloverAction(task.id, act)}
                        className={[
                          'wr-rollover-item__action-btn',
                          act === 'drop' ? 'wr-rollover-item__action-btn--drop' : '',
                          task.action === act ? 'wr-rollover-item__action-btn--active' : ''
                        ].filter(Boolean).join(' ')}
                      >
                        {act === 'breakdown' ? 'Break Down' : act === 'reschedule' ? 'Reschedule' : 'Drop Task'}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Wellbeing */}
        <div className="wr-card">
          <div className="wr-card__header">
            <h2 className="wr-card__title">Subjective Wellbeing</h2>
          </div>
          <div className="wr-wellbeing-stack">
            {/* Energy */}
            <div className="wr-rating">
              <div className="wr-rating__header">
                <span className="wr-rating__label">Weekly Energy Level</span>
                <span className="wr-rating__value">{energyLevel} / 5</span>
              </div>
              <div className="wr-rating__buttons">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setEnergyLevel(lvl)}
                    className={`wr-rating__btn ${energyLevel === lvl ? 'wr-rating__btn--active' : ''}`}
                  >
                    {lvl === 1 ? '😴' : lvl === 3 ? '⚡' : lvl === 5 ? '🚀' : lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Stress */}
            <div className="wr-rating">
              <div className="wr-rating__header">
                <span className="wr-rating__label">Stress & Friction Level</span>
                <span className="wr-rating__value wr-rating__value--accent">{stressLevel} / 5</span>
              </div>
              <div className="wr-rating__buttons">
                {[1, 2, 3, 4, 5].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setStressLevel(lvl)}
                    className={`wr-rating__btn ${stressLevel === lvl ? 'wr-rating__btn--active-accent' : ''}`}
                  >
                    {lvl === 1 ? '🟢' : lvl === 3 ? '🟡' : lvl === 5 ? '🔴' : lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="wr-nav">
        <button className="wr-btn wr-btn--ghost wr-btn--md" onClick={onPrevStep}>← Back</button>
        <button className="wr-btn wr-btn--primary wr-btn--lg" onClick={onNextStep}>
          Continue to Step 3: Goal Alignment
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
    </div>
  )
}
