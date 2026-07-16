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

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)

function getPasswordStrength(pw: string): number {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

export default function SignUpPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const passwordStrength = getPasswordStrength(password)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    }
  }, [])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, fullName }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to create account')
      setSuccess(true)
    } catch (error: any) {
      setError(error.message || 'Failed to create account')
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

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength] || ''
  const strengthColor = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981'][passwordStrength] || ''

  if (success) {
    return (
      <div className="auth-wrapper" data-theme={theme}>
        <div className="form-panel" style={{ width: '100%' }}>
          <div className="form-card" style={{ textAlign: 'center' }}>
            <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
              {theme === 'light' ? <MoonIcon /> : <SunIcon />}
            </button>
            <div style={{ fontSize: 56, marginBottom: 16 }}>📬</div>
            <div className="form-head">
              <h1>Check your email</h1>
              <div className="sub">
                We sent a confirmation link to <strong>{email}</strong>. Click it to activate your account.
              </div>
            </div>
            <div className="success-message">Account created successfully! Please verify your email.</div>
            <button onClick={() => router.push('/auth/signin')} className="btn-primary">
              Back to sign in →
            </button>
          </div>
        </div>
      </div>
    )
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
          <div className="brand-eyebrow">Join 10,000+ achievers</div>
          <div className="brand-headline">Start your journey to a better you</div>
          <div className="brand-sub">Set meaningful goals, build lasting habits, and get AI guidance every step of the way.</div>

          <div className="brand-features">
            <div className="brand-feature">
              <div className="brand-feature-icon">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
              </div>
              Personal AI coach that learns from you
            </div>
            <div className="brand-feature">
              <div className="brand-feature-icon">
                <svg viewBox="0 0 24 24"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
              </div>
              Visual progress tracking & analytics
            </div>
            <div className="brand-feature">
              <div className="brand-feature-icon">
                <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              Team collaboration & shared goals
            </div>
          </div>
        </div>

        <div className="brand-panel-bottom">
          Free to start. No credit card required.
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="form-panel">
        <div className="form-card">
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </button>

          <div className="tabs">
            <button onClick={() => router.push('/auth/signin')}>Sign in</button>
            <button className="active">Create account</button>
          </div>

          <div className="form-view active">
            <div className="form-head">
              <h1>Create your account ✨</h1>
              <div className="sub">Free forever. Upgrade when you're ready.</div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSignUp}>
              <div className="field">
                <label>Full name</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <input
                    id="signup-name"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Alex Rivera"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="field">
                <label>Email address</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  <input
                    id="signup-email"
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
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    autoComplete="new-password"
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide' : 'Show'}>
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {/* Password strength indicator */}
                {password.length > 0 && (
                  <>
                    <div className="password-strength">
                      {[1, 2, 3, 4].map(i => (
                        <div
                          key={i}
                          className={`strength-bar ${i <= passwordStrength ? (passwordStrength <= 1 ? 'weak' : passwordStrength <= 2 ? 'medium' : 'strong') : ''}`}
                        />
                      ))}
                    </div>
                    <div className="field-hint" style={{ color: strengthColor }}>{strengthLabel} password</div>
                  </>
                )}
              </div>

              <div className="field">
                <label>Confirm password</label>
                <div className="input-wrapper">
                  <svg className="input-icon" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="Repeat your password"
                    autoComplete="new-password"
                  />
                  <button type="button" className="password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)} aria-label={showConfirmPassword ? 'Hide' : 'Show'}>
                    {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <div className="field-hint" style={{ color: '#EF4444' }}>Passwords don't match</div>
                )}
                {confirmPassword.length > 0 && password === confirmPassword && (
                  <div className="field-hint" style={{ color: '#10B981' }}>✓ Passwords match</div>
                )}
              </div>

              <button type="submit" id="signup-submit" className="btn-primary" disabled={loading}>
                {loading ? 'Creating account…' : 'Create account →'}
              </button>
            </form>

            <div className="divider">or continue with</div>
            <div className="oauth-row">
              <button className="oauth-btn" id="google-signup">
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#4285F4" d="M22.5 12.2c0-.8-.07-1.4-.2-2H12v3.8h5.9c-.25 1.3-1 2.4-2.15 3.15v2.6h3.5c2-1.85 3.25-4.6 3.25-7.55z"/>
                  <path fill="#34A853" d="M12 23c2.9 0 5.35-.95 7.15-2.6l-3.5-2.6c-.95.65-2.2 1.05-3.65 1.05-2.8 0-5.2-1.9-6.05-4.4H2.3v2.7C4.1 20.5 7.75 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.95 14.45c-.2-.65-.35-1.35-.35-2.05s.15-1.4.35-2.05V7.65H2.3A10.9 10.9 0 001 12.4c0 1.75.4 3.4 1.3 4.75l3.65-2.7z"/>
                  <path fill="#EA4335" d="M12 5.9c1.6 0 3 .55 4.15 1.6l3.1-3.1C17.35 2.6 14.9 1.7 12 1.7c-4.25 0-7.9 2.5-9.7 6.15l3.65 2.7C6.8 7.8 9.2 5.9 12 5.9z"/>
                </svg>
                Google
              </button>
              <button className="oauth-btn" id="apple-signup">
                <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                  <path d="M17.05 12.04c-.02-2.2 1.8-3.26 1.88-3.31-1.02-1.5-2.62-1.7-3.18-1.72-1.36-.14-2.66.8-3.34.8-.7 0-1.75-.78-2.88-.76-1.48.02-2.85.87-3.6 2.2-1.55 2.7-.4 6.68 1.1 8.87.74 1.07 1.6 2.28 2.75 2.24 1.1-.04 1.52-.72 2.85-.72s1.7.72 2.87.7c1.18-.02 1.93-1.08 2.65-2.16.53-.78.75-1.18 1.17-2.07-3.08-1.18-3.24-4.4-3.27-4.87zM14.85 5.1c.6-.73 1-1.75.9-2.77-.86.03-1.9.58-2.52 1.3-.55.65-1.03 1.68-.9 2.66.96.07 1.94-.48 2.52-1.19z"/>
                </svg>
                Apple
              </button>
            </div>

            <div className="legal-note">
              By continuing, you agree to our{' '}
              <button onClick={() => router.push('/terms')} className="link-sm">Terms</button>{' '}
              and{' '}
              <button onClick={() => router.push('/privacy')} className="link-sm">Privacy Policy</button>.
            </div>

            <div className="foot-note">
              Already have an account?{' '}
              <button onClick={() => router.push('/auth/signin')} className="link-sm">Sign in</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
