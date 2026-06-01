import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/middleware/auth'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function DELETE(
  req: NextRequest,
  { params }: { params: { txId: string } }
) {
  try {
    const uid = await verifyIdToken(req)
    const { txId } = params

    const txRef = adminDb.doc(`users/${uid}/transactions/${txId}`)
    const txSnap = await txRef.get()
    if (!txSnap.exists) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const tx = txSnap.data()!
    const batch = adminDb.batch()
    batch.delete(txRef)

    // Reverse the effect on the linked goal
    if (tx.goalId) {
      const delta = tx.type === 'deposit' ? -tx.amount : Math.abs(tx.amount)
      const goalRef = adminDb.doc(`users/${uid}/goals/${tx.goalId}`)
      batch.update(goalRef, { current: FieldValue.increment(delta) })
    }

    await batch.commit()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
