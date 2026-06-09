'use client'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { signInWithCustomToken } from 'firebase/auth'
import { collection, onSnapshot, doc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/client'
import { useFlowsStore } from '@/store/flows-store'
import { Sidebar } from '@/components/sidebar/sidebar'
import { Plus, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { useRouter } from 'next/navigation'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const {
    goals,
    setGoals,
    setTransactions,
    setCategories,
    setPresets,
    setMembers,
    setProfile,
  } = useFlowsStore()

  const [fabOpen, setFabOpen] = useState(false)
  const [txType, setTxType] = useState<'deposit' | 'withdrawal' | null>(null)
  const [firebaseReady, setFirebaseReady] = useState(false)

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Step 1 — Exchange NextAuth session for a Firebase custom token so that
  // Firestore security rules (request.auth.uid) continue to work.
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId) return

    setFirebaseReady(false)

    fetch('/api/auth/firebase-token')
      .then(r => r.json())
      .then(({ token: fbToken }) => signInWithCustomToken(auth, fbToken))
      .then(() => setFirebaseReady(true))
      .catch(err => {
        console.error('[AppLayout] Firebase custom token sign-in failed:', err)
        setFirebaseReady(true) // still allow the UI to render
      })
  }, [session?.user?.id])

  // Step 2 — Subscribe to Firestore collections once Firebase auth is ready
  useEffect(() => {
    const userId = session?.user?.id
    if (!userId || !firebaseReady) return

    let unsubGoals = () => {}
    let unsubTx = () => {}
    let unsubCategories = () => {}
    let unsubPresets = () => {}
    let unsubMembers = () => {}
    let unsubProfile = () => {}

    unsubGoals = onSnapshot(
      collection(db, `users/${userId}/goals`),
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any))
        list.sort((a, b) => {
          const timeA = a.createdAt?.seconds ?? new Date(a.createdAt || 0).getTime()
          const timeB = b.createdAt?.seconds ?? new Date(b.createdAt || 0).getTime()
          return timeB - timeA
        })
        setGoals(list)
      },
      (err) => console.error('Goals subscription error:', err)
    )

    unsubTx = onSnapshot(
      collection(db, `users/${userId}/transactions`),
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any))
        list.sort((a, b) => {
          const dateCompare = (b.date || '').localeCompare(a.date || '')
          if (dateCompare !== 0) return dateCompare
          const timeA = a.createdAt?.seconds ?? new Date(a.createdAt || 0).getTime()
          const timeB = b.createdAt?.seconds ?? new Date(b.createdAt || 0).getTime()
          return timeB - timeA
        })
        setTransactions(list)
      },
      (err) => console.error('Transactions subscription error:', err)
    )

    unsubCategories = onSnapshot(
      collection(db, `users/${userId}/categories`),
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any))
        list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        setCategories(list)
      },
      (err) => console.error('Categories subscription error:', err)
    )

    unsubPresets = onSnapshot(
      collection(db, `users/${userId}/presets`),
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any))
        list.sort((a, b) => (a.amount || 0) - (b.amount || 0))
        setPresets(list)
      },
      (err) => console.error('Presets subscription error:', err)
    )

    unsubMembers = onSnapshot(
      collection(db, `users/${userId}/members`),
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as any))
        list.sort((a, b) => (a.nickname || '').localeCompare(b.nickname || ''))
        setMembers(list)
      },
      (err) => console.error('Members subscription error:', err)
    )

    unsubProfile = onSnapshot(
      doc(db, `users/${userId}/profile/details`),
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as any)
        } else {
          setProfile(null)
        }
      },
      (err) => console.error('Profile subscription error:', err)
    )

    return () => {
      unsubGoals()
      unsubTx()
      unsubCategories()
      unsubPresets()
      unsubMembers()
      unsubProfile()
    }
  }, [session?.user?.id, firebaseReady, setGoals, setTransactions, setCategories, setPresets, setMembers, setProfile])

  // Show a minimal spinner while session is loading or user is being redirected
  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg)' }}
      >
        <div
          className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6 animate-fade-in relative">
        {children}
      </main>

      {/* Floating Action Button */}
      <div className="fab-container">
        <div className={`fab-sub-container ${fabOpen ? 'open' : ''}`}>
          <button
            onClick={() => { setTxType('deposit'); setFabOpen(false) }}
            className="fab-sub fab-sub-deposit"
          >
            <ArrowDownLeft size={16} />
            <span>Deposit</span>
          </button>
          <button
            onClick={() => { setTxType('withdrawal'); setFabOpen(false) }}
            className="fab-sub fab-sub-withdrawal"
          >
            <ArrowUpRight size={16} />
            <span>Withdrawal</span>
          </button>
        </div>
        <button
          id="btn-fab-main"
          onClick={() => setFabOpen(o => !o)}
          className="fab-main transition-transform duration-200"
          style={{ transform: fabOpen ? 'rotate(45deg)' : 'none' }}
          title="New Transaction"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Global Transaction Modal Overlay */}
      {txType && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md animate-fade-in">
            <TransactionForm
              goals={goals}
              onClose={() => setTxType(null)}
              prefilledType={txType}
            />
          </div>
        </div>
      )}
    </div>
  )
}
