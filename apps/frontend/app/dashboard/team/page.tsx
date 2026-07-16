'use client'

import { useState } from 'react'

export default function TeamPage() {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)

  return (
    <div className="screen active">
      <div className="topbar">
        <div>
          <h1>Team</h1>
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

      <div className="team-grid">
        <div>
          <div className="card">
            <div className="section-title">Today's digest</div>
            <div className="digest-line">
              <div className="digest-dot"></div>
              <div>3 cards moved to Done since yesterday. The redesign brief is still blocked on color sign-off — 2 days now.</div>
            </div>
            <div className="digest-line">
              <div className="digest-dot" style={{background: 'var(--danger)'}}></div>
              <div>"In progress" is over its WIP limit (4/3) — mostly on Alex's cards. Might be worth pausing new pickups.</div>
            </div>
            <div className="digest-line">
              <div className="digest-dot"></div>
              <div>Cycle time on research cards is trending down — nice, that's 2 days faster than last sprint on average.</div>
            </div>
          </div>
          <div className="card" style={{marginTop: 20}}>
            <div className="section-title">Bottleneck this week</div>
            <p style={{fontSize: 13.5, color: 'var(--ink-soft)', lineHeight: 1.6}}>
              Most cards are stalling in <strong>"Awaiting review"</strong> — average 2.4 days there vs. 0.6 days everywhere else. Might be worth a standing daily review slot.
            </p>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Workload balance</div>
          <div className="member-row">
            <div className="avatar" style={{background: 'var(--primary)', width: 32, height: 32, fontSize: 12}}>AL</div>
            <div className="member-info">
              <div className="member-name">Alex</div>
              <div className="member-load">5 active cards</div>
            </div>
            <div className="load-bar">
              <div className="load-fill" style={{width: '90%', background: 'var(--danger)'}}/>
            </div>
          </div>
          <div className="member-row">
            <div className="avatar" style={{background: '#7A8C86', width: 32, height: 32, fontSize: 12}}>JN</div>
            <div className="member-info">
              <div className="member-name">Jordan</div>
              <div className="member-load">2 active cards</div>
            </div>
            <div className="load-bar">
              <div className="load-fill" style={{width: '35%', background: '#4A7A3A'}}/>
            </div>
          </div>
          <div className="member-row">
            <div className="avatar" style={{background: '#B57A3D', width: 32, height: 32, fontSize: 12}}>RK</div>
            <div className="member-info">
              <div className="member-name">Riko</div>
              <div className="member-load">3 active cards</div>
            </div>
            <div className="load-bar">
              <div className="load-fill" style={{width: '55%', background: 'var(--accent)'}}/>
            </div>
          </div>
          <button className="btn btn-outline" style={{width: '100%', marginTop: 14, fontSize: 13}}>
            Suggest rebalance…
          </button>
        </div>
      </div>
    </div>
  )
}
