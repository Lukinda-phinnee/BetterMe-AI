'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardContext } from './context'
import { AIChat } from '@/components/ai-chat'
import AddTaskModal from '@/components/add-task-modal'


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [activeScreen, setActiveScreen] = useState('dashboard')
  const [mode, setMode] = useState<'personal' | 'team'>('personal')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showReviewColumn, setShowReviewColumn] = useState(false)
  const [showAddTask, setShowAddTask] = useState(false)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [boardId, setBoardId] = useState<string | null>(null)
  const refreshDataFnRef = useRef<() => Promise<void>>(async () => {})
  const setRefreshDataFn = (fn: () => Promise<void>) => { refreshDataFnRef.current = fn }
  const [showColumnField, setShowColumnField] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const chatRef = useRef<HTMLDivElement>(null)

  // Load localStorage after mount to prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
    const savedShowReviewColumn = localStorage.getItem('showReviewColumn') === 'true'
    const savedAuthToken = localStorage.getItem('authToken')
    setShowReviewColumn(savedShowReviewColumn)
    if (savedAuthToken) setAuthToken(savedAuthToken)
  }, [])

  // Persist review column visibility
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('showReviewColumn', showReviewColumn.toString())
    }
  }, [showReviewColumn, isMounted])

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node) && !isClosing) {
        setIsClosing(true)
        setTimeout(() => {
          setChatOpen(false)
          setIsClosing(false)
        }, 300)
      }
    }

    if (chatOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [chatOpen, isClosing])

  const handleCloseChat = () => {
    setIsClosing(true)
    setTimeout(() => {
      setChatOpen(false)
      setIsClosing(false)
    }, 300)
  }

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const handleScreenChange = (screen: string) => {
    setActiveScreen(screen)
    if (screen === 'board') {
      router.push('/dashboard/board')
    } else if (screen === 'calendar') {
      router.push('/dashboard/calendar')
    } else if (screen === 'list') {
      router.push('/dashboard/list')
    } else if (screen === 'timeline') {
      router.push('/dashboard/timeline')
    } else if (screen === 'goals') {
      router.push('/dashboard/goals')
    } else if (screen === 'habits') {
      router.push('/dashboard/habit')
    } else if (screen === 'reflection') {
      router.push('/dashboard/reflection')
    } else if (screen === 'team') {
      router.push('/dashboard/team')
    } else if (screen === 'projects') {
      router.push('/dashboard/projects')
    } else {
      router.push('/dashboard')
    }
  }

  const getScreenTitle = () => {
    const titles: Record<string, string> = {
      dashboard: 'My Day',
      inbox: 'Inbox',
      board: 'My Tasks',
      calendar: 'Calendar',
      list: 'List',
      timeline: 'Timeline',
      goals: 'Goals',
      habits: 'Habit Tracker',
      reflection: 'Weekly Review',
      analytics: 'Analytics',
      team: 'Team Members',
      projects: 'Projects',
      settings: 'Settings',
    }
    return titles[activeScreen] || 'My Day'
  }

  const handleModeChange = (newMode: 'personal' | 'team') => {
    setMode(newMode)
    if (newMode === 'team') {
      handleScreenChange('team')
    } else {
      handleScreenChange('dashboard')
    }
  }

  const navLabelStyle: React.CSSProperties = {
    fontSize: '10px',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    color: 'var(--muted)',
    padding: '16px 16px 6px',
    display: 'block',
    userSelect: 'none',
  }

  const handleSignOut = () => {
    setIsSigningOut(true)
    setTimeout(() => {
      localStorage.removeItem('authToken')
      localStorage.removeItem('session')
      localStorage.removeItem('user')
      setAuthToken(null)
      router.push('/auth/signin')
    }, 800)
  }

  return (
    <DashboardContext.Provider value={{ showReviewColumn, setShowReviewColumn, showAddTask, setShowAddTask, authToken, setAuthToken, boardId, setBoardId, refreshData: refreshDataFnRef.current, setRefreshDataFn, showColumnField, setShowColumnField }}>
      <div className="app" data-theme={theme}>
      {/* Mobile sidebar overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* SIDEBAR */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 15c3-1 4-6 8-6s5 5 8 6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="brand-name">BetterMe</span>
        </div>

        <div className="nav-group">

          {/* ── Core ───────────────────────── */}
          <span style={navLabelStyle}>Core</span>

          <button
            className={`nav-item ${activeScreen === 'dashboard' ? 'active' : ''}`}
            onClick={() => handleScreenChange('dashboard')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="7" height="9" rx="1.5"/>
              <rect x="14" y="3" width="7" height="5" rx="1.5"/>
              <rect x="14" y="12" width="7" height="9" rx="1.5"/>
              <rect x="3" y="16" width="7" height="5" rx="1.5"/>
            </svg>
            My Day
          </button>

          <button
            className={`nav-item ${activeScreen === 'inbox' ? 'active' : ''}`}
            onClick={() => handleScreenChange('inbox')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
              <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
            </svg>
            Inbox
          </button>

          <button
            className={`nav-item ${activeScreen === 'board' ? 'active' : ''}`}
            onClick={() => handleScreenChange('board')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="4" width="18" height="16" rx="2"/>
              <path d="M9 4v16M15 4v16"/>
            </svg>
            My Tasks
          </button>

          <button
            className={`nav-item ${activeScreen === 'calendar' ? 'active' : ''}`}
            onClick={() => handleScreenChange('calendar')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Calendar
          </button>

          {/* ── Growth ─────────────────────── */}
          <span style={navLabelStyle}>Growth</span>

          <button
            className={`nav-item ${activeScreen === 'goals' ? 'active' : ''}`}
            onClick={() => handleScreenChange('goals')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="8"/>
              <circle cx="12" cy="12" r="3.5"/>
            </svg>
            Goals
          </button>

          <button
            className={`nav-item ${activeScreen === 'habits' ? 'active' : ''}`}
            onClick={() => handleScreenChange('habits')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
              <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
              <line x1="9" y1="9" x2="9.01" y2="9"/>
              <line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
            Habits
          </button>

          <button
            className={`nav-item ${activeScreen === 'reflection' ? 'active' : ''}`}
            onClick={() => handleScreenChange('reflection')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 19V5a2 2 0 012-2h9l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2z"/>
              <path d="M9 12h6M9 16h6"/>
            </svg>
            Weekly Review
          </button>

          <button
            className={`nav-item ${activeScreen === 'analytics' ? 'active' : ''}`}
            onClick={() => handleScreenChange('analytics')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
              <line x1="2" y1="20" x2="22" y2="20"/>
            </svg>
            Analytics
          </button>

          {/* ── Workspace ──────────────────── */}
          {mode === 'team' && (
            <>
              <span style={navLabelStyle}>Workspace</span>
              <button
                className={`nav-item ${activeScreen === 'team' ? 'active' : ''}`}
                onClick={() => handleScreenChange('team')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="9" cy="8" r="3"/>
                  <circle cx="17" cy="9" r="2.5"/>
                  <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M14.5 14.3c2.6.3 4.5 2.5 4.5 5.2"/>
                </svg>
                Team Members
              </button>
              
              <div style={{ marginTop: '16px' }}>
                <span style={navLabelStyle}>Projects</span>
                <button
                  className={`nav-item ${activeScreen === 'projects' ? 'active' : ''}`}
                  onClick={() => handleScreenChange('projects')}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  All Projects
                </button>
                <div style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                  <span style={{ fontSize: '13px', color: 'var(--muted)', cursor: 'pointer', padding: '6px 12px', display: 'block', borderRadius: '6px' }} className="project-item"># Marketing</span>
                  <span style={{ fontSize: '13px', color: 'var(--muted)', cursor: 'pointer', padding: '6px 12px', display: 'block', borderRadius: '6px' }} className="project-item"># Engineering</span>
                  <span style={{ fontSize: '13px', color: 'var(--muted)', cursor: 'pointer', padding: '6px 12px', display: 'block', borderRadius: '6px' }} className="project-item"># Product Design</span>
                </div>
              </div>
            </>
          )}

        </div>

        <div className="pro-upgrade-card">
          <div className="pro-upgrade-title">Upgrade to PRO</div>
          <div className="pro-upgrade-desc">for more features</div>
          <button className="pro-upgrade-btn">Upgrade</button>
        </div>

        <div className="sidebar-footer">
          <div className="switcher">
            <button
              className={mode === 'personal' ? 'active' : ''}
              onClick={() => handleModeChange('personal')}
            >
              Personal
            </button>
            <button
              className={mode === 'team' ? 'active' : ''}
              onClick={() => handleModeChange('team')}
            >
              Team
            </button>
          </div>

          <div className="sidebar-footer-actions">
            <button
              className={`nav-item ${activeScreen === 'settings' ? 'active' : ''}`}
              onClick={() => handleScreenChange('settings')}
              title="Settings"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
              </svg>
              Settings
            </button>

            <button
              className="nav-item"
              onClick={toggleTheme}
              title={theme === 'light' ? 'Dark mode' : 'Light mode'}
            >
              {theme === 'light' ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
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
              )}
              {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
            </button>

            <button
              className="nav-item nav-item--danger"
              onClick={handleSignOut}
              title="Sign out"
              disabled={isSigningOut}
              style={{ opacity: isSigningOut ? 0.6 : 1, cursor: isSigningOut ? 'not-allowed' : 'pointer' }}
            >
              {isSigningOut ? (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ animation: 'spin 1s linear infinite' }}>
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                  </svg>
                  Signing out...
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                  Sign Out
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="main">
        <div className="topbar">
          <div style={{display: 'flex', alignItems: 'center'}}>
            <button 
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
            <div>
              <h1>{getScreenTitle()}</h1>
            </div>
          </div>
          <div className="topbar-right" style={{ display: 'flex', alignItems: 'center' }}>
            {/* Search Input */}
            <div className="topbar-search" style={{ position: 'relative', marginRight: '12px' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: '16px', height: '16px', color: 'var(--muted)' }}>
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input type="text" placeholder="Search..." style={{ padding: '8px 12px 8px 34px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--surface)', fontSize: '14px', width: '200px', outline: 'none', color: 'var(--ink)' }} />
            </div>

            {/* Filter Button */}
            <button className="topbar-icon-btn" style={{ marginRight: '12px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)' }} title="Filters">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
            </button>

            {/* Notifications Bell */}
            <button className="topbar-icon-btn" style={{ position: 'relative', marginRight: '16px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)' }} title="Notifications">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span style={{ position: 'absolute', top: '-2px', right: '-2px', background: 'var(--primary)', width: '8px', height: '8px', borderRadius: '50%' }}></span>
            </button>

            <button 
              type="button"
              className="new-task-btn"
              onClick={() => setShowAddTask(!showAddTask)}
            >
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
                <div className="user-profile-menu-item" onClick={handleSignOut} style={{ opacity: isSigningOut ? 0.6 : 1, cursor: isSigningOut ? 'not-allowed' : 'pointer' }}>
                  {isSigningOut ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ animation: 'spin 1s linear infinite' }}>
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                      </svg>
                      Signing out...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" strokeWidth="1.5"/>
                        <polyline points="16 17 21 12 16 7" strokeWidth="1.5"/>
                        <line x1="21" y1="12" x2="9" y2="12" strokeWidth="1.5"/>
                      </svg>
                      Sign out
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {children}
        
        {/* Floating AI Button */}
        <button className="ai-fab" onClick={() => setChatOpen(!chatOpen)}>
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
            <circle cx="12" cy="12" r="2"/>
          </svg>
          Ask BetterMe AI
        </button>

        {/* AI Chat Panel */}
        {chatOpen && (
          <div className={`ai-chat-panel ${isClosing ? 'closing' : ''}`} ref={chatRef}>
            {/* Styled header — gradient purple, avatar, title, close */}
            <div className="ai-chat-header">
              <div className="ai-chat-header-left">
                <div className="ai-chat-avatar">
                  <svg viewBox="0 0 24 24" fill="none">
                    <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z"/>
                    <circle cx="12" cy="12" r="2"/>
                  </svg>
                </div>
                <div>
                  <div className="ai-chat-title">BetterMe AI</div>
                  <div className="ai-chat-subtitle">Your behavior-change coach</div>
                </div>
              </div>
              <button className="ai-chat-close" onClick={handleCloseChat}>
                <svg viewBox="0 0 24 24" fill="none">
                  <line x1="18" y1="6" x2="6" y2="18" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="6" y1="6" x2="18" y2="18" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            {/* AIChat component owns messages + history sidebar + input */}
            <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <AIChat />
            </div>
          </div>
        )}

        {/* Global Add Task Modal */}
        <AddTaskModal 
          isOpen={showAddTask}
          onClose={() => setShowAddTask(false)}
          onAddTask={refreshDataFnRef.current}
          boardId={boardId}
          authToken={authToken}
          showColumnField={showColumnField}
        />
      </div>

    </div>
    </DashboardContext.Provider>
  )
}

