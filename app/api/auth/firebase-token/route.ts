import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { adminAuth } from '@/lib/firebase/admin'

export const dynamic = 'force-dynamic'


/**
 * GET /api/auth/firebase-token
 *
 * Creates a Firebase custom token for the currently authenticated NextAuth user.
 * The client uses this token to sign into Firebase via signInWithCustomToken(),
 * so Firestore security rules (which check request.auth.uid) continue to work.
 *
 * The Firebase UID is set to session.user.id (the namespaced firestoreUid),
 * e.g. "keycloak_abc123-uuid" or "google_108xxxxx".
 */
export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token?.firestoreUid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const firebaseToken = await adminAuth.createCustomToken(token.firestoreUid)
    return NextResponse.json({ token: firebaseToken })
  } catch (err) {
    console.error('[firebase-token] Error creating custom token:', err)
    return NextResponse.json({ error: 'Failed to create token' }, { status: 500 })
  }
}
