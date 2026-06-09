'use client'
import { SessionProvider } from 'next-auth/react'

/**
 * Client-side providers wrapper.
 * SessionProvider must be a Client Component so it can't live in the root
 * Server Component layout — this wrapper is the standard pattern.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
