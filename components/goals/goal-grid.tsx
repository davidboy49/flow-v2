'use client'
import { SavingsGoal } from '@/lib/types'
import { GoalCard } from './goal-card'

interface GoalGridProps {
  goals: SavingsGoal[]
  onEdit?: (goal: SavingsGoal) => void
}

export function GoalGrid({ goals, onEdit }: GoalGridProps) {
  if (!goals.length) {
    return (
      <div
        id="goal-grid-empty"
        className="flex flex-col items-center justify-center py-16 text-center"
        style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}
      >
        <p className="text-sm text-zinc-500">No goals yet</p>
        <p className="text-xs text-zinc-600 mt-1">Add your first savings goal to get started</p>
      </div>
    )
  }

  return (
    <div
      id="goal-grid"
      className="grid gap-4"
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}
    >
      {goals.map(goal => (
        <GoalCard key={goal.id} goal={goal} onEdit={onEdit} />
      ))}
    </div>
  )
}
