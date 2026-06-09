import NextAuth from 'next-auth'
import { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      /** Stable Firestore UID — "{provider}_{sub}" e.g. "keycloak_abc123", "google_108xxx" */
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    /** Stable Firestore UID stamped on first sign-in */
    firestoreUid?: string
  }
}
