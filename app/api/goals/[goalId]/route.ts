import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/middleware/auth'
import { adminDb } from '@/lib/firebase/admin'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { goalId: string } }
) {
  try {
    const uid = await verifyIdToken(req)
    const { goalId } = params
    const body = await req.json()

    // Whitelist updatable fields
    const allowed = ['name', 'target', 'monthlyBudget', 'priority', 'iconName', 'color']
    const updates: Record<string, unknown> = {}
    for (const key of allowed) {
      if (key in body) updates[key] = body[key]
    }

    if (updates.name && typeof updates.name === 'string' && updates.name.length > 50) {
      return NextResponse.json({ error: 'Name exceeds 50 characters' }, { status: 400 })
    }

    await adminDb.doc(`users/${uid}/goals/${goalId}`).update(updates)
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { goalId: string } }
) {
  try {
    const uid = await verifyIdToken(req)
    const { goalId } = params
    await adminDb.doc(`users/${uid}/goals/${goalId}`).delete()
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
