import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Flows — Personal Savings Tracker',
  description: 'Track your savings goals, allocate funds automatically, and stay on track with Flows.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body>{children}</body>
    </html>
  )
}
