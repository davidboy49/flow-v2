import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/middleware/auth'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  try {
    const uid = await verifyIdToken(req)
    const { amount, label = null, active = true } = await req.json()

    if (amount === undefined || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return NextResponse.json({ error: 'Amount must be a positive number' }, { status: 400 })
    }

    const ref = await adminDb.collection(`users/${uid}/presets`).add({
      amount: parseFloat(amount),
      label: label ? label.trim() : null,
      active: active !== false,
      createdAt: FieldValue.serverTimestamp(),
    })
    return NextResponse.json({ id: ref.id }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Unauthorized' }, { status: 401 })
  }
}
