import { Transaction } from '@/lib/types'

export function calculateStreak(transactions: Transaction[]): number {
  const deposits = transactions.filter(t => t.type === 'deposit')
  if (!deposits.length) return 0

  const depositMonths = [...new Set(deposits.map(t => t.date.slice(0, 7)))].sort()

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

  if (!depositMonths.includes(currentMonth) && !depositMonths.includes(lastMonth)) return 0

  let checkDate = new Date(
    depositMonths.includes(currentMonth) ? now.getFullYear() : prevDate.getFullYear(),
    depositMonths.includes(currentMonth) ? now.getMonth() : prevDate.getMonth(),
    1
  )

  let streak = 0
  while (true) {
    const key = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}`
    if (!depositMonths.includes(key)) break
    streak++
    checkDate = new Date(checkDate.getFullYear(), checkDate.getMonth() - 1, 1)
  }

  return streak
}
