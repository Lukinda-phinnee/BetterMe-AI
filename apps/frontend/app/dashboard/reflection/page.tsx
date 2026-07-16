'use client'

import { useState } from 'react'

export default function ReflectionPage() {
  const [workedWell, setWorkedWell] = useState('')
  const [adjustment, setAdjustment] = useState('')
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  const getWeekRange = () => {
    const now = new Date()
    const start = new Date(now)
    start.setDate(now.getDate() - 6)
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
    return `${start.toLocaleDateString('en-US', options)} – ${now.toLocaleDateString('en-US', options)}`
  }

  return (
    <div className="screen active">
      <div className="topbar">
        <div>
          <h1>Reflection</h1>
        </div>
        <div className="topbar-right">
          <button className="new-task-btn">
            <svg viewBox="0 0 24 24" fill="none">
              <line x1="12" y1="5" x2="12" y2="19" strokeWidth="2" strokeLinecap="round"/>
              <line x1="5" y1="12" x2="19" y2="12" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            New Task
          </button>
          <div className="user-profile">
            <button 
              className="user-profile-btn"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Alex" alt="User avatar" />
            </button>
            <div className={`user-profile-menu ${profileMenuOpen ? 'open' : ''}`}>
              <div className="user-profile-menu-item">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" strokeWidth="1.5"/>
                  <path d="M20 20c0-3.3-2.7-6-6-6h-4c-3.3 0-6 2.7-6 6" strokeWidth="1.5"/>
                </svg>
                Profile
              </div>
              <div className="user-profile-menu-item">
                <svg viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="3" strokeWidth="1.5"/>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" strokeWidth="1.5"/>
                </svg>
                Settings
              </div>
              <div className="user-profile-menu-divider"></div>
              <div className="user-profile-menu-item">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeWidth="1.5"/>
                  <polyline points="16 17 21 12 16 7" strokeWidth="1.5"/>
                  <line x1="21" y1="12" x2="9" y2="12" strokeWidth="1.5"/>
                </svg>
                Sign out
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="reflect-grid">
        <div className="card">
          <div className="section-title">How the week went</div>
          <div className="stat-row">
            <span className="stat-num">11</span>
            <span className="stat-of">of 15 planned tasks done</span>
          </div>
          <div className="bar-row">
            <div className="bar-label">Work</div>
            <div className="bar-track">
              <div className="bar-fill" style={{width: '80%'}}/>
            </div>
          </div>
          <div className="bar-row">
            <div className="bar-label">Health</div>
            <div className="bar-track">
              <div className="bar-fill" style={{width: '65%', background: '#4A7A3A'}}/>
            </div>
          </div>
          <div className="bar-row">
            <div className="bar-label">Home</div>
            <div className="bar-track">
              <div className="bar-fill" style={{width: '40%', background: 'var(--accent)'}}/>
            </div>
          </div>
          <p style={{marginTop: 16, fontSize: 13, color: 'var(--muted)', lineHeight: 1.5}}>
            No missed streaks this week — the morning routine held even on Wednesday when the schedule shifted.
          </p>
        </div>

        <div className="card">
          <div className="section-title">Your reflection</div>
          <div className="reflect-q">
            <label>What's one thing that worked well?</label>
            <textarea 
              placeholder="e.g. Breaking the brief into a 20-minute step actually got it moving."
              value={workedWell}
              onChange={(e) => setWorkedWell(e.target.value)}
            />
          </div>
          <div className="reflect-q" style={{marginTop: 16}}>
            <label>What's one small adjustment for next week?</label>
            <textarea 
              placeholder="e.g. Move the home tasks earlier so they don't get squeezed out."
              value={adjustment}
              onChange={(e) => setAdjustment(e.target.value)}
            />
          </div>
          <button className="btn btn-solid" style={{background: 'var(--primary)', color: '#fff', marginTop: 16, width: '100%'}}>
            Save reflection
          </button>
        </div>
      </div>
    </div>
  )
}
