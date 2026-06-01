import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/middleware/auth'
import { adminDb } from '@/lib/firebase/admin'
import { autoAllocate } from '@/lib/algorithms/allocate'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  try {
    const uid = await verifyIdToken(req)
    const { totalAmount, confirm = false } = await req.json()

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const [goalsSnap, txSnap] = await Promise.all([
      adminDb.collection(`users/${uid}/goals`).get(),
      adminDb.collection(`users/${uid}/transactions`).get(),
    ])
    const goals = goalsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
    const transactions = txSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]

    const currentMonthPrefix = new Date().toISOString().slice(0, 7)
    const allocations = autoAllocate(goals, transactions, totalAmount, currentMonthPrefix)

    // Dry-run: return preview without writing to Firestore
    if (!confirm) {
      return NextResponse.json({ allocations })
    }

    // Confirmed: write transactions and update goal.current atomically
    const batch = adminDb.batch()
    const today = new Date().toISOString().slice(0, 10)

    for (const alloc of allocations) {
      const txRef = adminDb.collection(`users/${uid}/transactions`).doc()
      batch.set(txRef, {
        userId: uid,
        goalId: alloc.goalId,
        description: 'Auto-allocation',
        amount: alloc.allocatedAmount,
        date: today,
        type: 'deposit',
        category: 'Savings',
        createdAt: FieldValue.serverTimestamp(),
      })
      const goalRef = adminDb.doc(`users/${uid}/goals/${alloc.goalId}`)
      batch.update(goalRef, { current: FieldValue.increment(alloc.allocatedAmount) })
    }

    await batch.commit()
    return NextResponse.json({ allocations, committed: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
