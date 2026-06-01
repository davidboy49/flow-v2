'use client'
import { MonthlyTotal } from '@/lib/types'

interface MonthlyChartProps {
  monthlyTotals: MonthlyTotal[]
}

export function MonthlyChart({ monthlyTotals }: MonthlyChartProps) {
  const maxVal = Math.max(...monthlyTotals.flatMap(m => [m.deposits, m.withdrawals]), 1)

  function shortMonth(ym: string) {
    const [y, m] = ym.split('-')
    const date = new Date(parseInt(y), parseInt(m) - 1, 1)
    return date.toLocaleString('default', { month: 'short' })
  }

  return (
    <div id="monthly-chart" className="card space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-section-label">Monthly activity — last 6 months</p>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="w-3 h-1.5 rounded-full inline-block" style={{ background: 'var(--positive)' }} />
            Deposits
          </span>
          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="w-3 h-1.5 rounded-full inline-block" style={{ background: 'var(--negative)' }} />
            Withdrawals
          </span>
        </div>
      </div>

      {/* Pure CSS bar chart — no chart library */}
      <div className="flex items-end gap-3 h-32">
        {monthlyTotals.map(m => (
          <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: '100px' }}>
              {/* Deposits bar */}
              <div
                id={`bar-deposit-${m.month}`}
                className="flex-1 rounded-t transition-all duration-700 min-h-[2px]"
                style={{
                  height: `${Math.max(2, (m.deposits / maxVal) * 100)}px`,
                  background: 'var(--positive)',
                  opacity: 0.85,
                }}
                title={`Deposits: $${m.deposits.toFixed(2)}`}
              />
              {/* Withdrawals bar */}
              <div
                id={`bar-withdrawal-${m.month}`}
                className="flex-1 rounded-t transition-all duration-700 min-h-[2px]"
                style={{
                  height: `${Math.max(2, (m.withdrawals / maxVal) * 100)}px`,
                  background: 'var(--negative)',
                  opacity: 0.75,
                }}
                title={`Withdrawals: $${m.withdrawals.toFixed(2)}`}
              />
            </div>
            <span className="text-section-label">{shortMonth(m.month)}</span>
          </div>
        ))}
      </div>

      {/* Totals row */}
      <div className="grid grid-cols-6 gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        {monthlyTotals.map(m => (
          <div key={m.month} className="space-y-0.5">
            <p className="num text-xs font-medium" style={{ color: 'var(--positive)' }}>
              ${m.deposits.toFixed(0)}
            </p>
            <p className="num text-xs" style={{ color: 'var(--negative)' }}>
              -${m.withdrawals.toFixed(0)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
