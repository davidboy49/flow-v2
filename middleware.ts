import { NextRequest, NextResponse } from 'next/server'

function parseJwt(token: string) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  } catch {
    return null
  }
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Public routes — always allow
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  const sessionCookie = req.cookies.get('session')?.value

  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const payload = parseJwt(sessionCookie)
  if (!payload || !payload.exp || payload.exp * 1000 < Date.now()) {
    const response = NextResponse.redirect(new URL('/login', req.url))
    response.cookies.set('session', '', { maxAge: 0, path: '/' })
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/(?!auth)).*)'],
}

