'use client'

import { useState } from 'react'

export default function GoalsPage() {
  const [step, setStep] = useState(3)
  const [wish, setWish] = useState('Ship the redesign brief this week without it dragging into next.')
  const [outcome, setOutcome] = useState("I'd feel relieved and the team could start wireframes on schedule.")
  const [obstacle, setObstacle] = useState('I keep opening the doc, feeling overwhelmed, and closing it again.')
  const [plan, setPlan] = useState("If it's 3pm and I still haven't started, then I'll close Slack, set a 20-minute timer, and write just the opening paragraph — nothing else.")
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  return (
    <div className="screen active">
      <div className="topbar">
        <div>
          <h1>Goals</h1>
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

      <div className="woop-wrap">
        <div className="woop-progress">
          <span className={step >= 1 ? 'done' : ''}></span>
          <span className={step >= 2 ? 'done' : ''}></span>
          <span className={step >= 3 ? 'done' : ''}></span>
          <span className={step >= 4 ? 'done' : ''}></span>
        </div>
        <div className="card">
          <div className="woop-step-label">STEP 4 · PLAN</div>
          <div className="woop-question">If the obstacle comes up, what will you do?</div>
          <div className="woop-help">
            Finish this: "If it's 3pm and I still haven't opened the brief, then I will…" Concrete if-then plans hold up far better than good intentions alone.
          </div>
          <textarea 
            className="woop-textarea"
            value={plan}
            onChange={(e) => setPlan(e.target.value)}
          />

          <div className="woop-recap" style={{marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)'}}>
            <div className="recap-row">
              <div className="recap-tag">WISH</div>
              <div className="recap-text">{wish}</div>
            </div>
            <div className="recap-row">
              <div className="recap-tag">OUTCOME</div>
              <div className="recap-text">{outcome}</div>
            </div>
            <div className="recap-row">
              <div className="recap-tag">OBSTACLE</div>
              <div className="recap-text">{obstacle}</div>
            </div>
          </div>

          <div className="woop-nav">
            <button className="btn btn-outline" onClick={() => setStep(step - 1)}>← Back</button>
            <button className="btn btn-solid" style={{background: 'var(--primary)', color: '#fff'}}>Save goal plan</button>
          </div>
        </div>
      </div>
    </div>
  )
}
