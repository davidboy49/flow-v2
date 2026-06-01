'use client'
import { useEffect } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'
import { db, auth } from '@/lib/firebase/client'
import { useFlowsStore } from '@/store/flows-store'
import { Sidebar } from '@/components/sidebar/sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { setGoals, setTransactions } = useFlowsStore()

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (!user) { window.location.href = '/login'; return }

      const unsubGoals = onSnapshot(
        query(collection(db, `users/${user.uid}/goals`), orderBy('createdAt', 'desc')),
        (snap) => setGoals(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)))
      )
      const unsubTx = onSnapshot(
        query(collection(db, `users/${user.uid}/transactions`), orderBy('createdAt', 'desc')),
        (snap) => setTransactions(snap.docs.map(d => ({ id: d.id, ...d.data() } as any)))
      )

      return () => { unsubGoals(); unsubTx() }
    })
    return () => unsubAuth()
  }, [setGoals, setTransactions])

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
        {children}
      </main>
    </div>
  )
}
