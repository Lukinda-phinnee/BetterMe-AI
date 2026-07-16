'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleCallback = async () => {
      const accessToken = searchParams.get('access_token')
      const refreshToken = searchParams.get('refresh_token')
      const error = searchParams.get('error')

      if (error) {
        setStatus('error')
        setMessage(error)
        return
      }

      if (accessToken && refreshToken) {
        // Store the session
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        
        setStatus('success')
        setMessage('Email verified successfully!')
        
        // Redirect to sign in page after a short delay
        setTimeout(() => {
          router.push('/auth/signin')
        }, 2000)
      } else {
        setStatus('error')
        setMessage('No access token found in URL')
      }
    }

    handleCallback()
  }, [searchParams, router])

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        {status === 'loading' && (
          <div>
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>Verifying your email...</div>
            <div style={{ color: '#666' }}>Please wait while we confirm your account.</div>
          </div>
        )}
        
        {status === 'success' && (
          <div>
            <div style={{ fontSize: '24px', marginBottom: '16px', color: '#10b981' }}>✓ {message}</div>
            <div style={{ color: '#666' }}>Redirecting to sign in...</div>
          </div>
        )}
        
        {status === 'error' && (
          <div>
            <div style={{ fontSize: '24px', marginBottom: '16px', color: '#ef4444' }}>✗ Verification Failed</div>
            <div style={{ color: '#666', marginBottom: '16px' }}>{message}</div>
            <button 
              onClick={() => router.push('/auth/signup')}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ fontSize: '24px' }}>Loading...</div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
