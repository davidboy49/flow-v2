import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/middleware/auth'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function GET(req: NextRequest) {
  try {
    const uid = await verifyIdToken(req)
    const snap = await adminDb
      .collection(`users/${uid}/goals`)
      .orderBy('createdAt', 'desc')
      .get()
    const goals = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ goals })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const uid = await verifyIdToken(req)
    const { name, target, iconName, color, monthlyBudget = 0, priority = 'medium' } = await req.json()

    if (!name || !target || !iconName || !color) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (name.length > 50) {
      return NextResponse.json({ error: 'Name exceeds 50 characters' }, { status: 400 })
    }

    const ref = await adminDb.collection(`users/${uid}/goals`).add({
      userId: uid, name, target, current: 0,
      iconName, color, monthlyBudget, priority,
      createdAt: FieldValue.serverTimestamp(),
    })
    return NextResponse.json({ id: ref.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
