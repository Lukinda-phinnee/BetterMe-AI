'use client'

import React from 'react'

export interface StepInfo {
  id: number
  title: string
  subtitle: string
  estMinutes: number
}

export const STEPS: StepInfo[] = [
  { id: 1, title: 'Get Clear',       subtitle: 'Inbox & Friction Audit',   estMinutes: 1 },
  { id: 2, title: 'Get Current',     subtitle: 'Habits & Task Retro',      estMinutes: 2 },
  { id: 3, title: 'Goal Alignment',  subtitle: 'OKR Delta Check',          estMinutes: 1 },
  { id: 4, title: 'Get Creative',    subtitle: 'AI Coach & If-Then Plan',  estMinutes: 2 },
  { id: 5, title: 'Commitment Card', subtitle: 'Weekly Focus & Seal',      estMinutes: 1 }
]

interface WeeklyReviewStepperProps {
  currentStep: number
  setCurrentStep: (step: number) => void
  completedSteps: number[]
  lastSavedAt: Date | null
  isAutoSaving: boolean
  onOpenHistory: () => void
}

export function WeeklyReviewStepper({
  currentStep,
  setCurrentStep,
  completedSteps,
  lastSavedAt,
  isAutoSaving,
  onOpenHistory
}: WeeklyReviewStepperProps) {
  const progressPercent = Math.round((currentStep / STEPS.length) * 100)

  return (
    <div className="wr-stepper">
      {/* Top Row */}
      <div className="wr-stepper__top">
        <div>
          <div className="wr-stepper__meta">
            <span className="wr-stepper__badge">GTD + Atomic Habits Science</span>
            <span className="wr-stepper__time-hint">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              ~7 min review
            </span>
          </div>
          <h1 className="wr-stepper__title">Weekly Review & Strategic Alignment</h1>
        </div>

        <div className="wr-stepper__actions">
          {/* Auto-Save Status */}
          <div className="wr-stepper__save-status">
            {isAutoSaving ? (
              <>
                <svg className="wr-stepper__save-status-spinner" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="wr-stepper__save-status-saving">Saving...</span>
              </>
            ) : lastSavedAt ? (
              <>
                <span className="wr-stepper__save-status-dot" />
                <span>Saved {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </>
            ) : (
              <span>Drafting</span>
            )}
          </div>

          {/* History Button */}
          <button className="wr-stepper__history-btn" onClick={onOpenHistory}>
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Review History
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="wr-stepper__progress-bar">
        <div className="wr-stepper__progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Step Pills */}
      <div className="wr-stepper__steps">
        {STEPS.map((step) => {
          const isActive = currentStep === step.id
          const isDone   = completedSteps.includes(step.id)

          const pillClass = [
            'wr-stepper__step-pill',
            isActive ? 'wr-stepper__step-pill--active' : '',
            isDone   ? 'wr-stepper__step-pill--done'   : ''
          ].filter(Boolean).join(' ')

          return (
            <button key={step.id} className={pillClass} onClick={() => setCurrentStep(step.id)}>
              <div className="wr-stepper__step-top">
                <span className="wr-stepper__step-num">{isDone ? '✓' : step.id}</span>
                <span className="wr-stepper__step-time">{step.estMinutes}m</span>
              </div>
              <span className="wr-stepper__step-title">{step.title}</span>
              <span className="wr-stepper__step-subtitle">{step.subtitle}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
