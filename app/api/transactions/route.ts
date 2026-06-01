import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/middleware/auth'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function GET(req: NextRequest) {
  try {
    const uid = await verifyIdToken(req)
    const snap = await adminDb
      .collection(`users/${uid}/transactions`)
      .orderBy('createdAt', 'desc')
      .get()
    const transactions = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ transactions })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const uid = await verifyIdToken(req)
    const { goalId = null, description, amount, date, type, category } = await req.json()

    if (!description || !amount || !date || !type || !category) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (description.length > 100) {
      return NextResponse.json({ error: 'Description exceeds 100 characters' }, { status: 400 })
    }
    if (!['deposit', 'withdrawal'].includes(type)) {
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    const ref = await adminDb.collection(`users/${uid}/transactions`).add({
      userId: uid, goalId, description, amount, date, type, category,
      createdAt: FieldValue.serverTimestamp(),
    })

    // If linked to a goal, update goal.current
    if (goalId) {
      const delta = type === 'deposit' ? amount : -Math.abs(amount)
      await adminDb.doc(`users/${uid}/goals/${goalId}`).update({
        current: FieldValue.increment(delta),
      })
    }

    return NextResponse.json({ id: ref.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
