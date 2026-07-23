'use client'

import React from 'react'

export interface HistoricalReflection {
  id: string
  week_start: string
  week_end: string
  worked_well?: string
  didnt_work?: string
  patterns?: string
  adjustment?: string
  implementation?: string
  created_at: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  reflections: HistoricalReflection[]
  isLoading: boolean
}

export function ReflectionHistoryModal({ isOpen, onClose, reflections, isLoading }: Props) {
  if (!isOpen) return null

  return (
    <div className="wr-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="wr-modal">
        {/* Header */}
        <div className="wr-modal__header">
          <div>
            <h2 className="wr-modal__title">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Weekly Review History
            </h2>
            <p className="wr-modal__subtitle">Past weekly reflections, growth patterns, and focus cards</p>
          </div>
          <button className="wr-modal__close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="wr-modal__body">
          {isLoading ? (
            <div className="wr-modal__loading">Loading reflection history...</div>
          ) : reflections.length === 0 ? (
            <div className="wr-modal__empty">
              <p>No past weekly reflections recorded yet.</p>
              <p>Complete your first review above!</p>
            </div>
          ) : (
            reflections.map((item) => {
              const start = new Date(item.week_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              const end   = new Date(item.week_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              return (
                <div key={item.id} className="wr-history-item">
                  <div className="wr-history-item__header">
                    <span className="wr-history-item__week">Week of {start} – {end}</span>
                    <span className="wr-history-item__saved">
                      Saved {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="wr-history-item__pair">
                    {item.worked_well && (
                      <div className="wr-history-item__block">
                        <span className="wr-history-item__block-label wr-history-item__block-label--success">🎉 Worked Well</span>
                        <p className="wr-history-item__block-text">{item.worked_well}</p>
                      </div>
                    )}
                    {item.didnt_work && (
                      <div className="wr-history-item__block">
                        <span className="wr-history-item__block-label wr-history-item__block-label--accent">⚡ Friction Points</span>
                        <p className="wr-history-item__block-text">{item.didnt_work}</p>
                      </div>
                    )}
                  </div>

                  {item.adjustment && (
                    <div className="wr-history-item__adjustment">
                      <span className="wr-history-item__adjustment-label">Focus Adjustment:</span>
                      <p className="wr-history-item__adjustment-text">{item.adjustment}</p>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
