import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/middleware/auth'
import { adminDb } from '@/lib/firebase/admin'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { presetId: string } }
) {
  try {
    const uid = await verifyIdToken(req)
    const { presetId } = params
    const body = await req.json()

    // Whitelist allowed fields
    const allowed = ['amount', 'label', 'active']
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    if (updates.amount !== undefined) {
      const amt = parseFloat(updates.amount as string)
      if (isNaN(amt) || amt <= 0) {
        return NextResponse.json({ error: 'Amount is invalid' }, { status: 400 })
      }
      updates.amount = amt
    }

    if (updates.label !== undefined && typeof updates.label === 'string') {
      updates.label = updates.label.trim() || null
    }

    await adminDb.doc(`users/${uid}/presets/${presetId}`).update(updates)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { presetId: string } }
) {
  try {
    const uid = await verifyIdToken(req)
    const { presetId } = params
    await adminDb.doc(`users/${uid}/presets/${presetId}`).delete()
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Unauthorized' }, { status: 401 })
  }
}
