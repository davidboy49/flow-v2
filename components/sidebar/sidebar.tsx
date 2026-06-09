'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, BarChart2, Settings, ChevronRight, Sun, Moon } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useFlowsStore } from '@/store/flows-store'

const NAV = [
  { href: '/dashboard',    label: 'Dashboard',    Icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions',  Icon: ArrowLeftRight },
  { href: '/analytics',   label: 'Analytics',     Icon: BarChart2 },
  { href: '/settings',    label: 'Settings',      Icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(true)
  const { profile } = useFlowsStore()
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [settingsExpanded, setSettingsExpanded] = useState(false)

  useEffect(() => {
    const isLight = document.documentElement.classList.contains('light')
    setTheme(isLight ? 'light' : 'dark')
  }, [])

  useEffect(() => {
    if (pathname.startsWith('/settings')) {
      setSettingsExpanded(true)
    }
  }, [pathname])

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

  return (
    <aside
      className="flex flex-col flex-shrink-0 h-screen border-r transition-all duration-200"
      style={{
        width: expanded ? '14rem' : '3.5rem',
        background: 'var(--surface)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Logo row */}
      <div
        className="flex items-center h-14 px-3 border-b gap-2"
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: 'var(--accent)', color: '#fff' }}
        >
          F
        </div>
        {expanded && (
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-zinc-100 text-sm tracking-tight leading-none">Flows</span>
            {profile?.nickname && (
              <span className="text-[10px] text-zinc-400 font-medium truncate max-w-[100px] mt-0.5" title={profile.nickname}>
                {profile.nickname}
              </span>
            )}
          </div>
        )}
        <button
          id="btn-sidebar-toggle"
          onClick={() => setExpanded(e => !e)}
          className="ml-auto text-zinc-500 hover:text-zinc-300 transition-base"
          aria-label="Toggle sidebar"
        >
          <ChevronRight
            size={14}
            className="transition-transform duration-200"
            style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}
          />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 space-y-0.5 px-2 overflow-y-auto">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || (label === 'Settings' ? pathname.startsWith('/settings') : pathname.startsWith(href + '/'))
          return (
            <div key={href} className="space-y-0.5">
              <Link
                href={href}
                id={`nav-${label.toLowerCase()}`}
                className="flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-base group"
                style={{
                  color: active ? 'var(--body)' : 'var(--muted)',
                  background: active ? 'rgba(var(--hover-rgb), 0.6)' : 'transparent',
                  borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
                }}
                onClick={() => {
                  if (label === 'Settings') {
                    setSettingsExpanded(s => !s)
                  }
                }}
                onMouseEnter={e => {
                  if (!active) e.currentTarget.style.background = 'rgba(var(--hover-rgb), 0.4)'
                }}
                onMouseLeave={e => {
                  if (!active) e.currentTarget.style.background = 'transparent'
                }}
              >
                <Icon size={16} className="flex-shrink-0" />
                {expanded && <span className="truncate flex-1">{label}</span>}
                {expanded && label === 'Settings' && (
                  <ChevronRight
                    size={12}
                    className="transition-transform duration-200"
                    style={{ transform: settingsExpanded ? 'rotate(90deg)' : 'none' }}
                  />
                )}
              </Link>
              
              {label === 'Settings' && settingsExpanded && expanded && (
                <div className="pl-6 pr-2 py-1 space-y-1 animate-slide-down">
                  <Link
                    href="/settings/categories"
                    id="nav-settings-categories"
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-base"
                    style={{
                      color: pathname === '/settings/categories' ? 'var(--body)' : 'var(--muted)',
                      background: pathname === '/settings/categories' ? 'rgba(var(--hover-rgb), 0.3)' : 'transparent',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 flex-shrink-0" />
                    <span>Categories</span>
                  </Link>
                  <Link
                    href="/settings/presets"
                    id="nav-settings-presets"
                    className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs font-medium transition-base"
                    style={{
                      color: pathname === '/settings/presets' ? 'var(--body)' : 'var(--muted)',
                      background: pathname === '/settings/presets' ? 'rgba(var(--hover-rgb), 0.3)' : 'transparent',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 flex-shrink-0" />
                    <span>Presets</span>
                  </Link>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-3 py-3 border-t flex items-center justify-between gap-2"
        style={{ borderColor: 'var(--border)' }}
      >
        {expanded && <p className="text-section-label">v1.0.0</p>}
        <button
          onClick={toggleTheme}
          id="btn-sidebar-theme-toggle"
          className="p-1.5 rounded-md hover:bg-zinc-800/40 text-zinc-400 hover:text-zinc-200 transition-base flex"
          style={{ margin: expanded ? '0' : 'auto' }}
          title="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </aside>
  )
}
