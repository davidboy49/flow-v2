'use client'
import { SavingsGoal, Transaction } from '@/lib/types'

interface BalanceCardProps {
  goals: SavingsGoal[]
  transactions: Transaction[]
}

export function BalanceCard({ goals, transactions }: BalanceCardProps) {
  const goalSavings = goals.reduce((sum, g) => sum + g.current, 0)

  const generalIncome = transactions
    .filter(t => t.type === 'deposit' && !t.goalId)
    .reduce((sum, t) => sum + t.amount, 0)

  const generalExpenses = transactions
    .filter(t => t.type === 'withdrawal' && !t.goalId)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const netBalance = goalSavings + generalIncome - generalExpenses

  return (
    <div id="balance-card" className="card space-y-4">
      <p className="text-section-label">Overall balance</p>
      <div className="flex items-baseline gap-2">
        <span
          className="num text-3xl font-semibold"
          style={{ color: netBalance >= 0 ? 'var(--positive)' : 'var(--negative)' }}
        >
          {netBalance >= 0 ? '' : '-'}${Math.abs(netBalance).toFixed(2)}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
        <div>
          <p className="text-section-label mb-1">Goal savings</p>
          <p className="num text-sm font-medium" style={{ color: 'var(--positive)' }}>
            +${goalSavings.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-section-label mb-1">General income</p>
          <p className="num text-sm font-medium" style={{ color: 'var(--positive)' }}>
            +${generalIncome.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-section-label mb-1">General expenses</p>
          <p className="num text-sm font-medium" style={{ color: 'var(--negative)' }}>
            -${generalExpenses.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  )
}
