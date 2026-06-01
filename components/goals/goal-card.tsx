'use client'
import { SavingsGoal } from '@/lib/types'
import * as LucideIcons from 'lucide-react'
import { LucideProps } from 'lucide-react'

function DynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = (LucideIcons as any)[name] as React.ComponentType<LucideProps> | undefined
  if (!Icon) return <LucideIcons.Circle {...props} />
  return <Icon {...props} />
}

function priorityBadge(priority: SavingsGoal['priority']) {
  const cls = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' }[priority]
  return (
    <span className={`${cls} text-xs px-2 py-0.5 rounded-full font-medium`}>
      {priority}
    </span>
  )
}

function budgetBarClass(pct: number) {
  if (pct >= 100) return 'budget-bar-exceeded'
  if (pct >= 80) return 'budget-bar-warning'
  return 'budget-bar-neutral'
}

interface GoalCardProps {
  goal: SavingsGoal
  onEdit?: (goal: SavingsGoal) => void
}

export function GoalCard({ goal, onEdit }: GoalCardProps) {
  const progressPct = goal.target > 0 ? Math.min(100, (goal.current / goal.target) * 100) : 0
  const budgetPct = goal.monthlyBudget > 0
    ? Math.min(120, (goal.current / goal.monthlyBudget) * 100)
    : 0

  return (
    <div
      id={`goal-card-${goal.id}`}
      className="card space-y-4 hover:border-zinc-700 transition-base cursor-default"
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: goal.color + '22', color: goal.color }}
          >
            <DynamicIcon name={goal.iconName} size={18} />
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-100 leading-tight">{goal.name}</p>
            <p className="text-xs text-zinc-500 mt-0.5">{priorityBadge(goal.priority)}</p>
          </div>
        </div>
        {onEdit && (
          <button
            id={`btn-edit-goal-${goal.id}`}
            onClick={() => onEdit(goal)}
            className="text-zinc-600 hover:text-zinc-300 transition-base"
          >
            <LucideIcons.Pencil size={13} />
          </button>
        )}
      </div>

      {/* Financial figures */}
      <div className="flex items-baseline justify-between">
        <div>
          <span className="num text-lg font-semibold text-zinc-100">
            ${goal.current.toFixed(2)}
          </span>
          <span className="num text-xs text-zinc-500 ml-1">/ ${goal.target.toFixed(2)}</span>
        </div>
        <span className="num text-sm" style={{ color: 'var(--accent)' }}>
          {progressPct.toFixed(0)}%
        </span>
      </div>

      {/* Goal progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%`, background: goal.color }}
        />
      </div>

      {/* Monthly budget sub-bar */}
      {goal.monthlyBudget > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-section-label">monthly budget</span>
            <span className="num text-xs text-zinc-400">
              ${goal.monthlyBudget.toFixed(2)}
            </span>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${budgetBarClass(budgetPct)}`}
              style={{ width: `${Math.min(100, budgetPct)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
