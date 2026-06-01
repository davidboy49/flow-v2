'use client'
import { Achievement } from '@/lib/types'
import { CheckCircle2, Circle } from 'lucide-react'

interface AchievementsGridProps {
  achievements: Achievement[]
}

export function AchievementsGrid({ achievements }: AchievementsGridProps) {
  return (
    <div id="achievements-grid" className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
      {achievements.map(a => (
        <div
          key={a.id}
          id={`achievement-${a.id}`}
          className="card space-y-3 transition-base"
          style={{
            opacity: a.unlocked ? 1 : 0.5,
            borderColor: a.unlocked ? 'var(--accent)' : 'var(--border)',
          }}
        >
          <div className="flex items-start gap-3">
            {a.unlocked
              ? <CheckCircle2 size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 1 }} />
              : <Circle size={18} className="text-zinc-600 flex-shrink-0 mt-0.5" />
            }
            <div>
              <p className="text-sm font-medium text-zinc-100">{a.name}</p>
              <p className="text-xs text-zinc-500 mt-0.5">{a.description}</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-section-label">progress</span>
              <span className="num text-xs text-zinc-400">{a.progress}%</span>
            </div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${a.progress}%`,
                  background: a.unlocked ? 'var(--accent)' : '#3f3f46',
                }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
