import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'

/**
 * Reads the NextAuth JWT session cookie and returns the stable Firestore UID.
 * Called by every API route that needs to identify the current user.
 * Format: "{provider}_{sub}" e.g. "keycloak_abc123", "google_108xxx"
 */
export async function verifyIdToken(req: NextRequest): Promise<string> {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.firestoreUid) {
    throw new Error('Unauthorized')
  }
  return token.firestoreUid
}
