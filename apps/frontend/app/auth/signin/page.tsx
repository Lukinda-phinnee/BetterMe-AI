'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
)

const SunIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
)

export default function SignInPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    }
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to sign in')
      if (data.session) {
        localStorage.setItem('authToken', data.session.access_token)
        localStorage.setItem('session', JSON.stringify(data.session))
        localStorage.setItem('user', JSON.stringify(data.user))
      }
      router.push('/dashboard')
    } catch (error: any) {
      setError(error.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  return (
    <div className="auth-wrapper" data-theme={theme}>
      {/* LEFT BRAND PANEL */}
      <div className="brand-panel">
        <div className="brand-panel-deco" />

        <div className="brand-panel-top">
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 15c3-1 4-6 8-6s5 5 8 6" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="brand-name">BetterMe</span>
        </div>

        <div className="brand-panel-mid">
          <div className="brand-eyebrow">AI Productivity Platform</div>
          <div className="brand-headline">Your goals deserve a smarter system</div>
          <div className="brand-sub">Intelligent task management, habit tracking, and AI coaching — all in one place.</div>

          <div className="brand-features">
            <div className="brand-feature">
              <div className="brand-feature-icon">
                <svg viewBox="0 0 24 24"><path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              AI-powered daily coaching
            </div>
            <div className="brand-feature">
              <div className="brand-feature-icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              Smart task prioritisation
            </div>
            <div className="brand-feature">
              <div className="brand-feature-icon">
                <svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              Progress insights & habit streaks
            </div>
          </div>
        </div>

        <div className="brand-panel-bottom">
          Trusted by 10,000+ people who achieved their goals
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="form-panel">
        <div className="form-card">
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>

          <div className="tabs">
            <button className="active">Sign in</button>
            <button onClick={() => router.push('/auth/signup')}>Create account</button>
          </div>

          <div className="form-view active">
            <div className="form-head">
              <h1>Welcome back 👋</h1>
              <div className="sub">Sign in to continue to your workspace</div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSignIn}>
              <div className="field">
                <label>Email address</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    id="signin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="field">
                <label>Password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••"
                    autoComplete="current-password"
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide' : 'Show'}>
                    {showPassword ? (
                      <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="row-between">
                <label className="remember">
                  <input type="checkbox" id="remember-me" /> Keep me signed in
                </label>
                <button type="button" onClick={() => router.push('/auth/forgot-password')} className="link-sm">
                  Forgot password?
                </button>
              </div>

              <button type="submit" id="signin-submit" className="btn-primary" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign in →'}
              </button>
            </form>

            <div className="divider">or continue with</div>
            <div className="oauth-row">
              <button className="oauth-btn" id="google-signin">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#4285F4" d="M22.5 12.2c0-.8-.07-1.4-.2-2H12v3.8h5.9c-.25 1.3-1 2.4-2.15 3.15v2.6h3.5c2-1.85 3.25-4.6 3.25-7.55z"/>
                  <path fill="#34A853" d="M12 23c2.9 0 5.35-.95 7.15-2.6l-3.5-2.6c-.95.65-2.2 1.05-3.65 1.05-2.8 0-5.2-1.9-6.05-4.4H2.3v2.7C4.1 20.5 7.75 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.95 14.45c-.2-.65-.35-1.35-.35-2.05s.15-1.4.35-2.05V7.65H2.3A10.9 10.9 0 001 12.4c0 1.75.4 3.4 1.3 4.75l3.65-2.7z"/>
                  <path fill="#EA4335" d="M12 5.9c1.6 0 3 .55 4.15 1.6l3.1-3.1C17.35 2.6 14.9 1.7 12 1.7c-4.25 0-7.9 2.5-9.7 6.15l3.65 2.7C6.8 7.8 9.2 5.9 12 5.9z"/>
                </svg>
                Google
              </button>
              <button className="oauth-btn" id="apple-signin">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M17.05 12.04c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.62-1.7-3.18-1.72-1.36-.14-2.66.8-3.34.8-.7 0-1.75-.78-2.88-.76-1.48.02-2.85.87-3.6 2.2-1.55 2.7-.4 6.68 1.1 8.87.74 1.07 1.6 2.28 2.75 2.24 1.1-.04 1.52-.72 2.85-.72s1.7.72 2.87.7c1.18-.02 1.93-1.08 2.65-2.16.53-.78.75-1.18 1.17-2.07-3.08-1.18-3.24-4.4-3.27-4.87zM14.85 5.1c.6-.73 1-1.75.9-2.77-.86.03-1.9.58-2.52 1.3-.55.65-1.03 1.68-.9 2.66.96.07 1.94-.48 2.52-1.19z"/>
                </svg>
                Apple
              </button>
            </div>

            <div className="foot-note">
              New here? <button onClick={() => router.push('/auth/signup')} className="link-sm">Create a free account</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
