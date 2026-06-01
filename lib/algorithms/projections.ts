import { SavingsGoal, Transaction, GoalProjection } from '@/lib/types'

export function calculateProjections(
  goals: SavingsGoal[],
  transactions: Transaction[]
): GoalProjection[] {
  const deposits = transactions.filter(t => t.type === 'deposit')

  const monthlyMap = new Map<string, number>()
  for (const tx of deposits) {
    const month = tx.date.slice(0, 7)
    monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + tx.amount)
  }
  const monthlyRate = monthlyMap.size > 0
    ? [...monthlyMap.values()].reduce((a, b) => a + b, 0) / monthlyMap.size
    : 0

  return goals.map(goal => {
    const remaining = goal.target - goal.current

    if (remaining <= 0) {
      return { goalId: goal.id, goalName: goal.name, remaining: 0,
        projectedDate: null, status: 'complete' as const }
    }
    if (monthlyRate <= 0) {
      return { goalId: goal.id, goalName: goal.name, remaining,
        projectedDate: null, status: 'no-data' as const }
    }

    const monthsNeeded = Math.ceil(remaining / monthlyRate)
    const projected = new Date()
    projected.setMonth(projected.getMonth() + monthsNeeded)

    const currentMonth = new Date().toISOString().slice(0, 7)
    const thisMonthDeposits = deposits
      .filter(t => t.goalId === goal.id && t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + t.amount, 0)

    const status = goal.monthlyBudget > 0 && thisMonthDeposits < goal.monthlyBudget * 0.8
      ? 'behind' as const
      : 'on-track' as const

    return {
      goalId: goal.id,
      goalName: goal.name,
      remaining,
      projectedDate: projected.toISOString().slice(0, 7),
      status,
    }
  })
}
