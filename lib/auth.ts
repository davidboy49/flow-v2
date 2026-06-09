import type { NextAuthOptions } from 'next-auth'
import KeycloakProvider from 'next-auth/providers/keycloak'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

/** Decode a JWT payload without verifying the signature (server-side use only) */
function parseJwt(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    return JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'))
  } catch {
    return null
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    // ── 1. Keycloak OIDC redirect (SSO button) ─────────────────────────────
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_ISSUER!,
    }),

    // ── 2. Keycloak Direct Access Grant (embedded username/password form) ──
    CredentialsProvider({
      id: 'keycloak-credentials',
      name: 'Keycloak Credentials',
      credentials: {
        username: { label: 'Username', type: 'text', placeholder: 'your.username' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        try {
          const tokenRes = await fetch(
            `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                grant_type: 'password',
                client_id: process.env.KEYCLOAK_CLIENT_ID!,
                client_secret: process.env.KEYCLOAK_CLIENT_SECRET!,
                username: credentials.username,
                password: credentials.password,
                scope: 'openid profile email',
              }),
            }
          )
          if (!tokenRes.ok) return null
          const tokens = await tokenRes.json()
          const payload = parseJwt(tokens.access_token)
          if (!payload?.sub) return null
          return {
            // Namespace the Firestore UID with "keycloak_" to avoid cross-provider collisions
            id: `keycloak_${payload.sub}`,
            name: payload.name ?? payload.preferred_username ?? credentials.username,
            email: payload.email ?? null,
            image: null,
          }
        } catch (err) {
          console.error('[NextAuth] Keycloak credentials error:', err)
          return null
        }
      },
    }),

    // ── 3. Google OAuth ─────────────────────────────────────────────────────
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  // Use JWT strategy — no database required for sessions
  session: { strategy: 'jwt' },

  callbacks: {
    /**
     * jwt() runs after sign-in and on every token refresh.
     * We stamp a stable `firestoreUid` on the very first sign-in.
     * Format: "{provider}_{providerAccountId}"
     */
    async jwt({ token, user, account }) {
      if (account && user) {
        // OAuth providers (keycloak SSO redirect, google)
        if (account.provider === 'google') {
          token.firestoreUid = `google_${account.providerAccountId}`
        } else if (account.provider === 'keycloak') {
          token.firestoreUid = `keycloak_${account.providerAccountId}`
        }
      } else if (user && !account) {
        // CredentialsProvider: user.id was already set to "keycloak_{sub}" in authorize()
        token.firestoreUid = user.id
      }
      return token
    },

    /** Expose session.user.id to client components */
    async session({ session, token }) {
      if (token.firestoreUid) {
        session.user.id = token.firestoreUid
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',   // redirect ?error= back to login page
  },
}
