import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/middleware/auth'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  try {
    const uid = await verifyIdToken(req)
    const { name, color, active = true } = await req.json()

    if (!name || !color) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const ref = await adminDb.collection(`users/${uid}/categories`).add({
      name: name.trim(),
      color,
      active: active !== false,
      createdAt: FieldValue.serverTimestamp(),
    })
    return NextResponse.json({ id: ref.id }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Unauthorized' }, { status: 401 })
  }
}
