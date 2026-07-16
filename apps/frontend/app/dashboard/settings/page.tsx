'use client'

import { useState } from 'react'

export default function SettingsPage() {
  const [coachingTone, setCoachingTone] = useState<'cooperative' | 'direct' | 'minimal'>('cooperative')
  const [notifications, setNotifications] = useState(true)
  const [ssoEnabled, setSsoEnabled] = useState(false)

  return (
    <div className="screen-content" style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--ink)' }}>⚙️ Workspace Preferences</h2>
        <p style={{ fontSize: '13.5px', color: 'var(--muted)' }}>
          Configure your personal AI coach metrics, team security integration, and workspace features.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* AI Coaching Customization */}
        <div className="card" style={{ padding: '24px', borderRadius: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--ink)' }}>
            🤖 AI Coach Behavior Tone
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '16px' }}>
            Adjust the language style and coaching philosophy used by BetterMe growth prompts.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {[
              { id: 'cooperative', title: 'Supportive Coach', desc: 'Encouraging, choice-supportive, matches self-determination models' },
              { id: 'direct', title: 'Chief of Staff', desc: 'Direct, action-driven, focused on metrics, status and timelines' },
              { id: 'minimal', title: 'Quiet Prompts', desc: 'Minimal notifications, runs quietly in background' }
            ].map(tone => (
              <div
                key={tone.id}
                onClick={() => setCoachingTone(tone.id as any)}
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  border: coachingTone === tone.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                  background: coachingTone === tone.id ? 'var(--primary-tint)' : 'var(--surface)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--ink)', marginBottom: '4px' }}>
                  {tone.title}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--muted)', lineHeight: '1.4' }}>
                  {tone.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications & Quiet Hours */}
        <div className="card" style={{ padding: '24px', borderRadius: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--ink)' }}>
            🔔 Nudge Settings & Notifications
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)' }}>Enable Smart Reminders</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Receive cues stacked to your personal daily anchors</div>
            </div>
            <input
              type="checkbox"
              checked={notifications}
              onChange={() => setNotifications(!notifications)}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* Security & Organization */}
        <div className="card" style={{ padding: '24px', borderRadius: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '12px', color: 'var(--ink)' }}>
            🛡️ Security & SAML SSO
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '16px' }}>
            Set up Single Sign-On, identity provider credentials, and corporate-tier security features.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--ink)' }}>Enterprise SSO / SAML</div>
              <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Require authentication via corporate identity providers</div>
            </div>
            <button
              onClick={() => setSsoEnabled(!ssoEnabled)}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                fontSize: '12.5px',
                fontWeight: 600,
                border: '1px solid var(--border)',
                background: ssoEnabled ? 'var(--primary-tint)' : 'var(--surface)',
                color: ssoEnabled ? 'var(--primary)' : 'var(--ink-soft)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {ssoEnabled ? 'SSO Configured' : 'Configure SAML'}
            </button>
          </div>
        </div>

        {/* Export Data */}
        <div className="card" style={{ padding: '24px', borderRadius: '24px', boxShadow: 'var(--shadow-sm)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '8px', color: 'var(--ink)' }}>
            💾 Personal Data & GDPR
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--muted)', marginBottom: '16px' }}>
            Download or delete your task archives, habit metrics, and AI profile data instantly.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{ padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--ink-soft)', cursor: 'pointer' }}>
              Export JSON Archive
            </button>
            <button style={{ padding: '10px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, border: '1px solid #ef4444', background: 'rgba(239,68,68,0.06)', color: '#ef4444', cursor: 'pointer' }}>
              Request Account Deletion
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
