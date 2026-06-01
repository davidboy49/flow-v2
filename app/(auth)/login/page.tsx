'use client'
import { useState } from 'react'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider, microsoftProvider } from '@/lib/firebase/client'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function signIn(provider: typeof googleProvider, name: string) {
    setLoading(name)
    setError(null)
    try {
      const result = await signInWithPopup(auth, provider)
      const idToken = await result.user.getIdToken()

      // Create HttpOnly session cookie
      const res = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      })
      if (!res.ok) throw new Error('Session creation failed')

      router.push('/dashboard')
    } catch (e: any) {
      setError(e.message ?? 'Sign-in failed. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="w-full max-w-sm animate-fade-in">
      <div className="card space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              F
            </div>
            <span className="font-semibold text-zinc-100 text-lg">Flows</span>
          </div>
          <h1 className="text-page-heading">Sign in</h1>
          <p className="text-body text-muted">Your personal savings tracker</p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="text-xs px-3 py-2 rounded-md"
            style={{ background: '#450a0a', color: 'var(--negative)', border: '1px solid #7f1d1d' }}
          >
            {error}
          </div>
        )}

        {/* SSO Buttons */}
        <div className="space-y-2">
          <button
            id="btn-google-signin"
            onClick={() => signIn(googleProvider, 'google')}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-200 transition-base disabled:opacity-50"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#27272a')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
          >
            {loading === 'google' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            Continue with Google
          </button>

          <button
            id="btn-microsoft-signin"
            onClick={() => signIn(microsoftProvider, 'microsoft')}
            disabled={!!loading}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-zinc-200 transition-base disabled:opacity-50"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#27272a')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
          >
            {loading === 'microsoft' ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
                <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
                <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
                <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
              </svg>
            )}
            Continue with Microsoft
          </button>
        </div>

        <p className="text-xs text-center" style={{ color: '#52525b' }}>
          By signing in you agree to our terms of service.
        </p>
      </div>
    </div>
  )
}
