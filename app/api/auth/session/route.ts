import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'

// POST /api/auth/session — Create HttpOnly session cookie after signInWithPopup
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json()
    if (!idToken) {
      return NextResponse.json({ error: 'Missing idToken' }, { status: 400 })
    }

    // Session cookie expires in 5 days
    const expiresIn = 60 * 60 * 24 * 5 * 1000
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })

    const response = NextResponse.json({ status: 'ok' })
    response.cookies.set('session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn / 1000,
      path: '/',
      sameSite: 'lax',
    })
    return response
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json({ error: 'Failed to create session' }, { status: 401 })
  }
}

// DELETE /api/auth/session — Revoke session cookie on sign out
export async function DELETE(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('session')?.value
    if (sessionCookie) {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie)
      await adminAuth.revokeRefreshTokens(decoded.sub)
    }
  } catch {
    // Ignore revocation errors — always clear the cookie
  }

  const response = NextResponse.json({ status: 'ok' })
  response.cookies.set('session', '', { maxAge: 0, path: '/' })
  return response
}
