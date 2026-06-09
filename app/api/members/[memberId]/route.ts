import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/middleware/auth'
import { adminDb } from '@/lib/firebase/admin'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const uid = await verifyIdToken(req)
    const { memberId } = params
    const body = await req.json()

    // Whitelist allowed fields
    const allowed = ['nickname', 'active']
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    if (updates.nickname !== undefined) {
      if (typeof updates.nickname !== 'string' || !updates.nickname.trim()) {
        return NextResponse.json({ error: 'Nickname is invalid' }, { status: 400 })
      }
      updates.nickname = updates.nickname.trim()
    }

    await adminDb.doc(`users/${uid}/members/${memberId}`).update(updates)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { memberId: string } }
) {
  try {
    const uid = await verifyIdToken(req)
    const { memberId } = params
    await adminDb.doc(`users/${uid}/members/${memberId}`).delete()
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Unauthorized' }, { status: 401 })
  }
}
