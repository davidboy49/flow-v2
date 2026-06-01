'use client'
import { GoalProjection } from '@/lib/types'

const STATUS_STYLES: Record<GoalProjection['status'], { bg: string; color: string; label: string }> = {
  'on-track': { bg: '#052e16', color: '#34d399', label: 'On track' },
  'behind':   { bg: '#422006', color: '#facc15', label: 'Behind' },
  'no-data':  { bg: '#27272a', color: '#a1a1aa', label: 'No data' },
  'complete': { bg: '#052e16', color: '#10b981', label: 'Complete' },
}

interface ProjectionsTableProps {
  projections: GoalProjection[]
}

export function ProjectionsTable({ projections }: ProjectionsTableProps) {
  const incomplete = projections.filter(p => p.status !== 'complete')

  if (!incomplete.length) {
    return (
      <div className="card text-center py-8">
        <p className="text-sm text-zinc-500">No active goals to project</p>
      </div>
    )
  }

  return (
    <div id="projections-table" className="card p-0 overflow-hidden">
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <p className="text-section-label">Goal projections</p>
      </div>
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Goal', 'Remaining', 'Projected', 'Status'].map(col => (
              <th key={col} className="text-section-label px-4 py-3 text-left">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {incomplete.map(p => {
            const s = STATUS_STYLES[p.status]
            return (
              <tr
                key={p.goalId}
                id={`projection-row-${p.goalId}`}
                style={{ borderBottom: '1px solid var(--border)' }}
              >
                <td className="px-4 py-3 text-sm text-zinc-200">{p.goalName}</td>
                <td className="num px-4 py-3 text-zinc-400">${p.remaining.toFixed(2)}</td>
                <td className="num px-4 py-3 text-zinc-400">
                  {p.projectedDate ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {s.label}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
