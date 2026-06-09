import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/middleware/auth'
import { adminDb } from '@/lib/firebase/admin'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { catId: string } }
) {
  try {
    const uid = await verifyIdToken(req)
    const { catId } = params
    const body = await req.json()

    // Whitelist allowed fields
    const allowed = ['name', 'color', 'active']
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    if (updates.name !== undefined) {
      if (typeof updates.name !== 'string' || !updates.name.trim()) {
        return NextResponse.json({ error: 'Name is invalid' }, { status: 400 })
      }
      updates.name = updates.name.trim()
    }

    await adminDb.doc(`users/${uid}/categories/${catId}`).update(updates)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { catId: string } }
) {
  try {
    const uid = await verifyIdToken(req)
    const { catId } = params
    await adminDb.doc(`users/${uid}/categories/${catId}`).delete()
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Unauthorized' }, { status: 401 })
  }
}
