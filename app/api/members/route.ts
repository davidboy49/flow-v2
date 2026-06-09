import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/middleware/auth'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  try {
    const uid = await verifyIdToken(req)
    const { nickname, active = true } = await req.json()

    if (!nickname || !nickname.trim()) {
      return NextResponse.json({ error: 'Nickname is required' }, { status: 400 })
    }

    const ref = await adminDb.collection(`users/${uid}/members`).add({
      nickname: nickname.trim(),
      active: active !== false,
      createdAt: FieldValue.serverTimestamp(),
    })
    return NextResponse.json({ id: ref.id }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Unauthorized' }, { status: 401 })
  }
}
