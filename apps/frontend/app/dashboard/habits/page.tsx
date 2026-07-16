'use client'

import { useState } from 'react'

interface Habit {
  id: string
  title: string
  anchor: string // Atomic Habits stacking: "After I [anchor], I will [title]"
  streak: number
  history: boolean[] // Last 7 days checkoff
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([
    {
      id: '1',
      title: 'Review my 3 core priorities for the day',
      anchor: 'pour my morning coffee',
      streak: 12,
      history: [true, true, true, false, true, true, true]
    },
    {
      id: '2',
      title: 'Decompose any task that feels too complex',
      anchor: 'open my dashboard',
      streak: 7,
      history: [true, true, true, true, false, true, true]
    },
    {
      id: '3',
      title: 'Reflect for 2 minutes on my WOOP goal',
      anchor: 'shut down my computer',
      streak: 3,
      history: [false, false, true, true, true, false, true]
    }
  ])

  const toggleCheck = (habitId: string, dayIdx: number) => {
    setHabits(
      habits.map(habit => {
        if (habit.id === habitId) {
          const updatedHistory = [...habit.history]
          updatedHistory[dayIdx] = !updatedHistory[dayIdx]
          // Calculate mock streak changes
          let streak = habit.streak
          if (dayIdx === 6) {
            streak = updatedHistory[dayIdx] ? streak + 1 : Math.max(0, streak - 1)
          }
          return { ...habit, history: updatedHistory, streak }
        }
        return habit
      })
    )
  }

  const daysLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div className="screen-content" style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>🔥 Atomic Habits & Cues</h2>
        <p style={{ fontSize: '13.5px', color: 'var(--muted)' }}>
          Anchor routines to cues you already do daily. Make tasks tiny to sustain your behavior change journey.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {habits.map(habit => (
          <div
            key={habit.id}
            className="card"
            style={{
              padding: '24px',
              borderRadius: '24px',
              boxShadow: 'var(--shadow-sm)',
              border: '1px solid var(--border)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--primary)',
                    background: 'var(--primary-tint)',
                    padding: '4px 10px',
                    borderRadius: '999px',
                    display: 'inline-block',
                    marginBottom: '8px'
                  }}
                >
                  ⚡ HABIT STACK
                </span>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>
                  After I <span style={{ color: 'var(--primary)', textDecoration: 'underline' }}>{habit.anchor}</span>,
                </h3>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', marginTop: '4px' }}>
                  I will <span style={{ fontWeight: 800 }}>{habit.title}</span>.
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '24px' }}>🔥</span>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.1 }}>{habit.streak} days</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>CURRENT STREAK</div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 600 }}>LAST 7 DAYS</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {habit.history.map((checked, dayIdx) => (
                  <div
                    key={dayIdx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span style={{ fontSize: '10.5px', color: 'var(--muted)', fontWeight: 600 }}>{daysLabels[dayIdx]}</span>
                    <button
                      onClick={() => toggleCheck(habit.id, dayIdx)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        border: checked ? 'none' : '2px solid var(--border)',
                        background: checked ? 'var(--success, #10B981)' : 'transparent',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {checked && (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: '14px', height: '14px' }}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
