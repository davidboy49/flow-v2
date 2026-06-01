'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ArrowLeftRight, BarChart2, Settings, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const NAV = [
  { href: '/dashboard',    label: 'Dashboard',    Icon: LayoutDashboard },
  { href: '/transactions', label: 'Transactions',  Icon: ArrowLeftRight },
  { href: '/analytics',   label: 'Analytics',     Icon: BarChart2 },
  { href: '/settings',    label: 'Settings',      Icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(true)

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
          <span className="font-semibold text-zinc-100 text-sm tracking-tight">Flows</span>
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
      <nav className="flex-1 py-3 space-y-0.5 px-2">
        {NAV.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              id={`nav-${label.toLowerCase()}`}
              className="flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-base group"
              style={{
                color: active ? 'var(--body)' : 'var(--muted)',
                background: active ? 'rgba(39,39,42,0.6)' : 'transparent',
                borderLeft: active ? '2px solid var(--accent)' : '2px solid transparent',
              }}
              onMouseEnter={e => {
                if (!active) e.currentTarget.style.background = 'rgba(39,39,42,0.4)'
              }}
              onMouseLeave={e => {
                if (!active) e.currentTarget.style.background = 'transparent'
              }}
            >
              <Icon size={16} className="flex-shrink-0" />
              {expanded && <span className="truncate">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {expanded && (
        <div
          className="px-4 py-3 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="text-section-label">v1.0.0</p>
        </div>
      )}
    </aside>
  )
}
