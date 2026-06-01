import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/middleware/auth'
import { adminDb } from '@/lib/firebase/admin'
import { calculateStreak } from '@/lib/algorithms/streak'
import { calculateProjections } from '@/lib/algorithms/projections'

export async function GET(req: NextRequest) {
  try {
    const uid = await verifyIdToken(req)

    const [goalsSnap, txSnap] = await Promise.all([
      adminDb.collection(`users/${uid}/goals`).get(),
      adminDb.collection(`users/${uid}/transactions`).get(),
    ])
    const goals = goalsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
    const transactions = txSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]

    const streak = calculateStreak(transactions)
    const projections = calculateProjections(goals, transactions)

    const totalDeposits = transactions.filter((t: any) => t.type === 'deposit').length
    const totalSaved = goals.reduce((sum: number, g: any) => sum + (g.current ?? 0), 0)
    const maxProgress = goals.length
      ? Math.max(...goals.map((g: any) => g.target > 0 ? (g.current / g.target) * 100 : 0))
      : 0

    const achievements = [
      {
        id: 'first-step', name: 'First Step',
        description: 'Log your first deposit',
        unlocked: totalDeposits >= 1,
        progress: Math.min(100, totalDeposits * 100),
      },
      {
        id: 'halfway-hero', name: 'Halfway Hero',
        description: 'Reach 50% on any goal',
        unlocked: maxProgress >= 50,
        progress: Math.min(100, Math.round(maxProgress)),
      },
      {
        id: 'goal-crusher', name: 'Goal Crusher',
        description: 'Complete a goal',
        unlocked: goals.some((g: any) => g.current >= g.target),
        progress: goals.some((g: any) => g.current >= g.target) ? 100 : 0,
      },
      {
        id: 'consistency-master', name: 'Consistency Master',
        description: 'Save for 3 consecutive months',
        unlocked: streak >= 3,
        progress: Math.min(100, Math.round((streak / 3) * 100)),
      },
      {
        id: 'super-saver', name: 'Super Saver',
        description: 'Save $1,000 across all goals',
        unlocked: totalSaved >= 1000,
        progress: Math.min(100, Math.round((totalSaved / 1000) * 100)),
      },
    ]

    // Monthly totals — last 6 months
    const monthlyMap = new Map<string, { deposits: number; withdrawals: number }>()
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyMap.set(key, { deposits: 0, withdrawals: 0 })
    }
    for (const tx of transactions) {
      const month = (tx.date as string)?.slice(0, 7)
      if (monthlyMap.has(month)) {
        const entry = monthlyMap.get(month)!
        if (tx.type === 'deposit') entry.deposits += tx.amount
        else entry.withdrawals += Math.abs(tx.amount)
      }
    }
    const monthlyTotals = [...monthlyMap.entries()].map(([month, v]) => ({ month, ...v }))

    return NextResponse.json({ streak, projections, achievements, monthlyTotals })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
