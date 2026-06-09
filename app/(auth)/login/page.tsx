'use client'
import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Loader2, Sun, Moon, Eye, EyeOff, Lock, User, ShieldCheck } from 'lucide-react'

function LoginContent() {
  const searchParams = useSearchParams()
  const errorParam = searchParams.get('error')

  const [loading, setLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  // Keycloak credentials form
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<'credentials' | 'sso'>('credentials')

  useEffect(() => {
    const isLight = document.documentElement.classList.contains('light')
    setTheme(isLight ? 'light' : 'dark')
  }, [])

  useEffect(() => {
    const sso = searchParams.get('sso')
    const hasError = searchParams.get('error')
    
    // Check if referrer is VPortal
    const referrer = typeof document !== 'undefined' ? document.referrer : ''
    const isFromVPortal = referrer && (
      referrer.includes('vportal') || 
      referrer.includes('3000') || 
      referrer.includes('fearlessonline.shop')
    )

    if (!hasError && (sso === 'true' || sso === 'keycloak' || isFromVPortal)) {
      setLoading('keycloak-sso')
      signIn('keycloak', { callbackUrl: '/dashboard' })
    }
  }, [searchParams])

  useEffect(() => {
    if (errorParam) {
      const messages: Record<string, string> = {
        CredentialsSignin: 'Invalid username or password. Please try again.',
        OAuthSignin: 'Could not start the sign-in flow. Please try again.',
        OAuthCallback: 'Sign-in was cancelled or failed. Please try again.',
        Default: 'Sign-in failed. Please try again.',
      }
      setError(messages[errorParam] ?? messages.Default)
    }
  }, [errorParam])

  function toggleTheme() {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    if (newTheme === 'light') {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    } else {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
      localStorage.setItem('theme', 'dark')
    }
  }

  async function handleCredentialsSignIn(e: React.FormEvent) {
    e.preventDefault()
    if (!username.trim() || !password) return
    setLoading('credentials')
    setError(null)
    const res = await signIn('keycloak-credentials', {
      username: username.trim(),
      password,
      redirect: false,
      callbackUrl: '/dashboard',
    })
    if (res?.error) {
      setError('Invalid username or password. Please try again.')
      setLoading(null)
    } else if (res?.url) {
      window.location.href = res.url
    }
  }

  async function handleOAuth(provider: string, name: string) {
    setLoading(name)
    setError(null)
    await signIn(provider, { callbackUrl: '/dashboard' })
  }

  const inputStyle = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--body)',
    borderRadius: 'var(--radius)',
  }

  const tabBase = 'flex-1 py-2 text-xs font-semibold transition-base rounded-md'
  const tabActive = 'text-zinc-950'
  const tabInactive = 'text-zinc-500 hover:text-zinc-300'

  return (
    <>
      {/* Theme Toggle */}
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 p-2 rounded-lg border text-zinc-400 hover:text-zinc-200 transition-base"
        style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        title="Toggle Theme"
      >
        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="w-full max-w-sm animate-fade-in">
        <div className="card space-y-5">

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
            <p className="text-body" style={{ color: 'var(--muted)' }}>Your personal savings tracker</p>
          </div>

          {/* Error Banner */}
          {error && (
            <div
              className="text-xs px-3 py-2.5 rounded-md"
              style={{ background: '#450a0a', color: 'var(--negative)', border: '1px solid #7f1d1d' }}
            >
              {error}
            </div>
          )}

          {/* Tab switcher */}
          <div
            className="flex gap-1 p-1 rounded-lg"
            style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('credentials')}
              className={`${tabBase} ${activeTab === 'credentials' ? tabActive : tabInactive}`}
              style={activeTab === 'credentials' ? { background: 'var(--accent)' } : {}}
            >
              <User size={12} className="inline mr-1.5" />
              Username
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sso')}
              className={`${tabBase} ${activeTab === 'sso' ? tabActive : tabInactive}`}
              style={activeTab === 'sso' ? { background: 'var(--accent)' } : {}}
            >
              <ShieldCheck size={12} className="inline mr-1.5" />
              SSO
            </button>
          </div>

          {/* ── Tab: Keycloak Credentials ── */}
          {activeTab === 'credentials' && (
            <form onSubmit={handleCredentialsSignIn} className="space-y-3">
              <div>
                <label className="text-section-label block mb-1">Username</label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="input-username"
                    type="text"
                    autoComplete="username"
                    placeholder="your.username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-1 transition-base"
                    style={{ ...inputStyle, '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-section-label block mb-1">Password</label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    id="input-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 text-sm outline-none focus:ring-1 transition-base"
                    style={{ ...inputStyle, '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-base"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <button
                id="btn-keycloak-signin"
                type="submit"
                disabled={!!loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-zinc-950 transition-base disabled:opacity-50"
                style={{ background: 'var(--accent)' }}
              >
                {loading === 'credentials'
                  ? <Loader2 size={16} className="animate-spin" />
                  : <Lock size={16} />
                }
                Sign in with Keycloak
              </button>

              <p className="text-[10px] text-center" style={{ color: 'var(--muted)' }}>
                Signing in to realm <strong>VISION</strong> · {process.env.NEXT_PUBLIC_KEYCLOAK_URL ?? 'sso.fearlessonline.shop'}
              </p>
            </form>
          )}

          {/* ── Tab: SSO / OAuth ── */}
          {activeTab === 'sso' && (
            <div className="space-y-2">
              {/* Keycloak SSO redirect */}
              <button
                id="btn-keycloak-sso"
                onClick={() => handleOAuth('keycloak', 'keycloak-sso')}
                disabled={!!loading}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-base disabled:opacity-50"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--body)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
              >
                {loading === 'keycloak-sso'
                  ? <Loader2 size={16} className="animate-spin" />
                  : <ShieldCheck size={16} style={{ color: 'var(--accent)' }} />
                }
                Continue with Keycloak SSO
              </button>

              {/* Google */}
              <button
                id="btn-google-signin"
                onClick={() => handleOAuth('google', 'google')}
                disabled={!!loading}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-base disabled:opacity-50"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--body)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--surface)')}
              >
                {loading === 'google'
                  ? <Loader2 size={16} className="animate-spin" />
                  : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )
                }
                Continue with Google
              </button>
            </div>
          )}

          <p className="text-xs text-center" style={{ color: 'var(--muted)' }}>
            By signing in you agree to our terms of service.
          </p>
        </div>
      </div>
    </>
  )
}

// Wrap in Suspense because useSearchParams() requires it in Next.js App Router
export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
