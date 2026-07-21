'use client'

/**
 * Global toast notification system.
 *
 * Provides temporary success/error messages for user actions.
 * Mounted once at the root layout; any client component can call
 * `const toast = useToast()` and `toast.success(...)` or `toast.error(...)`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

export interface ToastOptions {
  message: string
  duration?: number
}

type ToastFn = (options: ToastOptions) => void

interface ToastContextValue {
  success: ToastFn
  error: ToastFn
}

const ToastContext = createContext<ToastContextValue | null>(null)

interface Toast {
  id: string
  message: string
  type: 'success' | 'error'
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const addToast = useCallback((type: 'success' | 'error', options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9)
    const toast: Toast = {
      id,
      message: options.message,
      type,
    }
    setToasts((prev) => [...prev, toast])

    // Auto-remove after duration
    const duration = options.duration || 3000
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duration)
  }, [])

  const success = useCallback((options: ToastOptions) => {
    addToast('success', options)
  }, [addToast])

  const error = useCallback((options: ToastOptions) => {
    addToast('error', options)
  }, [addToast])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const value = useMemo(() => ({ success, error }), [success, error])

  return (
    <ToastContext.Provider value={value}>
      {children}
      {isMounted &&
        createPortal(
          <div className="toast-container">
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`toast toast-${toast.type}`}
                onClick={() => removeToast(toast.id)}
              >
                <div className="toast-icon">
                  {toast.type === 'success' ? (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  )}
                </div>
                <span className="toast-message">{toast.message}</span>
                <button
                  className="toast-close"
                  onClick={(e) => {
                    e.stopPropagation()
                    removeToast(toast.id)
                  }}
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  )
}

/** Access the global toast notifications. */
export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>')
  }
  return ctx
}
