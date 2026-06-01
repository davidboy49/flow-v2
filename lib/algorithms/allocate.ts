import { SavingsGoal, Transaction, AllocationResult } from '@/lib/types'

export function autoAllocate(
  goals: SavingsGoal[],
  transactions: Transaction[],
  totalAmount: number,
  currentMonthPrefix: string   // "YYYY-MM"
): AllocationResult[] {
  const activeGoals = goals.filter(g => g.target - g.current > 0)
  if (!activeGoals.length || totalAmount <= 0) return []

  const weights = activeGoals.map(goal => {
    const priorityMultiplier = { high: 3, medium: 2, low: 1 }[goal.priority]
    let urgencyFactor = 1.0
    if (goal.monthlyBudget > 0) {
      const monthlyDeposits = transactions
        .filter(t =>
          t.goalId === goal.id &&
          t.type === 'deposit' &&
          t.date.startsWith(currentMonthPrefix)
        )
        .reduce((sum, t) => sum + t.amount, 0)
      const remainingBudget = Math.max(0, goal.monthlyBudget - monthlyDeposits)
      urgencyFactor = 1.0 + (remainingBudget / goal.monthlyBudget)
    }
    return { goal, weight: priorityMultiplier * urgencyFactor }
  })

  const allocated = new Map(activeGoals.map(g => [g.id, 0]))
  let amountToDistribute = totalAmount

  for (let i = 0; i < 15 && amountToDistribute > 0.01; i++) {
    const eligible = weights.filter(({ goal }) => {
      const cap = goal.target - goal.current - (allocated.get(goal.id) ?? 0)
      return cap > 0
    })
    if (!eligible.length) break

    const totalWeight = eligible.reduce((sum, { weight }) => sum + weight, 0)

    for (const { goal, weight } of eligible) {
      const remaining = goal.target - goal.current - (allocated.get(goal.id) ?? 0)
      const share = totalWeight > 0
        ? (weight / totalWeight) * amountToDistribute
        : amountToDistribute / eligible.length
      const capped = Math.min(share, remaining)
      allocated.set(goal.id, (allocated.get(goal.id) ?? 0) + capped)
      amountToDistribute -= capped
    }
  }

  const totalAllocated = [...allocated.values()].reduce((a, b) => a + b, 0)

  return activeGoals
    .filter(g => (allocated.get(g.id) ?? 0) > 0.001)
    .map(g => ({
      goalId: g.id,
      goalName: g.name,
      iconName: g.iconName,
      color: g.color,
      allocatedAmount: Math.round((allocated.get(g.id) ?? 0) * 100) / 100,
      percentage: totalAllocated > 0
        ? Math.round(((allocated.get(g.id) ?? 0) / totalAllocated) * 100)
        : 0,
    }))
}
