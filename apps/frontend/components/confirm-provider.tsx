'use client'

/**
 * Global confirmation dialog.
 *
 * Replaces the native window.confirm() with a styled modal that matches
 * the BetterMe design system. Mounted once at the root layout; any client
 * component can call `const confirm = useConfirm()` and `await confirm({...})`.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'

export interface ConfirmOptions {
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  /** Renders the confirm action in the destructive (red) style. */
  danger?: boolean
}

type ConfirmFn = (options?: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmFn | null>(null)

interface PendingState extends Required<ConfirmOptions> {
  resolve: (value: boolean) => void
}

const DEFAULTS: Required<Omit<PendingState, 'resolve'>> = {
  title: 'Are you sure?',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  danger: false,
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingState | null>(null)
  const confirmBtnRef = useRef<HTMLButtonElement>(null)

  const confirm = useCallback<ConfirmFn>((options = {}) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...DEFAULTS, ...options, resolve })
    })
  }, [])

  const close = useCallback(
    (result: boolean) => {
      setPending((current) => {
        current?.resolve(result)
        return null
      })
    },
    []
  )

  // Keyboard: Esc cancels, Enter confirms. Only active while open.
  useEffect(() => {
    if (!pending) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        close(false)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        close(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [pending, close])

  // Focus the confirm button when the dialog appears.
  useEffect(() => {
    if (pending) confirmBtnRef.current?.focus()
  }, [pending])

  // Lock body scroll while open.
  useEffect(() => {
    if (!pending) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [pending])

  const value = useMemo(() => confirm, [confirm])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      {pending &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="confirm-dialog-overlay"
            role="presentation"
            onClick={() => close(false)}
          >
            <div
              className="confirm-dialog"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="confirm-dialog-title"
              aria-describedby="confirm-dialog-message"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="confirm-dialog-body">
                <h3 id="confirm-dialog-title" className="confirm-dialog-title">
                  {pending.title}
                </h3>
                {pending.message && (
                  <p id="confirm-dialog-message" className="confirm-dialog-message">
                    {pending.message}
                  </p>
                )}
              </div>
              <div className="confirm-dialog-actions">
                <button
                  type="button"
                  className="confirm-dialog-btn cancel"
                  onClick={() => close(false)}
                >
                  {pending.cancelText}
                </button>
                <button
                  type="button"
                  ref={confirmBtnRef}
                  className={`confirm-dialog-btn confirm ${pending.danger ? 'danger' : ''}`}
                  onClick={() => close(true)}
                >
                  {pending.confirmText}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </ConfirmContext.Provider>
  )
}

/** Access the global confirm dialog. Returns a promise that resolves to true/false. */
export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext)
  if (!ctx) {
    throw new Error('useConfirm must be used within a <ConfirmProvider>')
  }
  return ctx
}
