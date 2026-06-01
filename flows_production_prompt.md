# Flows — Production Build Specification
### Next.js 14 · Firebase Auth SSO · Cloud Firestore · Vercel

---

## 1. Project Overview

**Flows** is a multi-tenant personal savings application. Each authenticated user manages their own savings goals and transactions in complete isolation. All business logic (auto-allocation, streaks, projections) runs server-side. The frontend is a fast SPA-style experience built on Next.js App Router.

**Design philosophy**: Clean, minimal, professional. Inspired by Linear and Notion. No emojis, no gradients. Monospaced typography for financial figures. Dark-first with light mode support via CSS variables.

---

## 2. Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | TypeScript throughout |
| UI | shadcn/ui + Tailwind CSS | Use shadcn CLI to install components |
| Icons | Lucide React | No other icon libraries |
| Auth | Firebase Auth | SSO via Google, Microsoft, GitHub, SAML/OIDC |
| Database | Cloud Firestore | Per-user subcollections |
| Admin SDK | firebase-admin (Node.js) | JWT verification + server-side Firestore writes |
| Client SDK | firebase (JS) | Auth state + real-time reads only |
| State | Zustand | Global client state; Firestore listeners update the store |
| Hosting | Vercel | vercel.json config included |

---

## 3. Repository Structure

```
flows/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx              # SSO login page
│   │   └── layout.tsx                # Unauthenticated shell
│   ├── (app)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── transactions/
│   │   │   └── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   └── layout.tsx                # Sidebar shell (auth-gated)
│   ├── api/
│   │   ├── goals/
│   │   │   ├── route.ts              # GET list, POST create
│   │   │   └── [goalId]/
│   │   │       └── route.ts          # PATCH update, DELETE
│   │   ├── transactions/
│   │   │   ├── route.ts              # GET list, POST create
│   │   │   └── [txId]/
│   │   │       └── route.ts          # DELETE
│   │   ├── allocate/
│   │   │   └── route.ts              # POST dry-run + confirm
│   │   └── stats/
│   │       └── route.ts              # GET streak, projections, achievements
│   ├── layout.tsx                    # Root layout, font + theme provider
│   └── globals.css
├── components/
│   ├── sidebar/
│   │   └── sidebar.tsx
│   ├── goals/
│   │   ├── goal-card.tsx
│   │   ├── goal-form.tsx
│   │   └── goal-grid.tsx
│   ├── transactions/
│   │   ├── transaction-table.tsx
│   │   └── transaction-form.tsx
│   ├── analytics/
│   │   ├── balance-card.tsx
│   │   ├── projections-table.tsx
│   │   ├── achievements-grid.tsx
│   │   └── monthly-chart.tsx
│   └── ui/                           # shadcn components live here
├── lib/
│   ├── firebase/
│   │   ├── client.ts                 # Firebase client SDK init
│   │   └── admin.ts                  # Firebase Admin SDK init
│   ├── algorithms/
│   │   ├── allocate.ts               # Weighted auto-allocation
│   │   ├── streak.ts                 # Consecutive month streak
│   │   └── projections.ts            # Goal completion projections
│   ├── middleware/
│   │   └── auth.ts                   # verifyIdToken() wrapper for API routes
│   └── types.ts                      # Shared TypeScript interfaces
├── store/
│   └── flows-store.ts                # Zustand store
├── middleware.ts                     # Next.js route middleware (auth guard)
├── .env.local.example
├── vercel.json
└── firestore.rules
```

---

## 4. Environment Variables

```bash
# .env.local.example

# Firebase client (public — safe to expose)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Firebase Admin (server-only — never expose to client)
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=        # Paste from service account JSON, include \n chars as-is
```

---

## 5. Firebase Setup

### 5.1 Client SDK (`lib/firebase/client.ts`)

```typescript
import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

export const auth = getAuth(app)
export const db = getFirestore(app)

// SSO providers
export const googleProvider = new GoogleAuthProvider()
export const microsoftProvider = new OAuthProvider('microsoft.com')
// For enterprise SAML/OIDC — configure the provider ID in Firebase Console first
export const samlProvider = new OAuthProvider('saml.your-provider-id')
```

### 5.2 Admin SDK (`lib/firebase/admin.ts`)

```typescript
import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

export const adminAuth = getAuth()
export const adminDb = getFirestore()
```

### 5.3 API Route Auth Middleware (`lib/middleware/auth.ts`)

```typescript
import { adminAuth } from '@/lib/firebase/admin'
import { NextRequest } from 'next/server'

export async function verifyIdToken(req: NextRequest): Promise<string> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Missing or invalid Authorization header')
  }
  const token = authHeader.split('Bearer ')[1]
  const decoded = await adminAuth.verifyIdToken(token)
  return decoded.uid
}
```

Every API route calls `verifyIdToken(req)` first and scopes all Firestore operations to the returned `uid`.

### 5.4 Login Page (`app/(auth)/login/page.tsx`)

```typescript
'use client'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider, microsoftProvider } from '@/lib/firebase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  async function signIn(provider: typeof googleProvider) {
    await signInWithPopup(auth, provider)
    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950">
      <div className="w-full max-w-sm space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-8">
        <h1 className="text-xl font-semibold text-zinc-100">Sign in to Flows</h1>
        <p className="text-sm text-zinc-400">Your personal savings tracker</p>
        <button
          onClick={() => signIn(googleProvider)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-700"
        >
          Continue with Google
        </button>
        <button
          onClick={() => signIn(microsoftProvider)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm text-zinc-200 hover:bg-zinc-700"
        >
          Continue with Microsoft
        </button>
      </div>
    </div>
  )
}
```

---

## 6. Firestore Data Model

All data lives under `users/{userId}` subcollections. No user can ever access another user's data.

```
users/
  {userId}/
    goals/
      {goalId}/
        name: string             # max 50 chars
        target: number           # positive
        current: number          # >= 0, default 0
        iconName: string         # Lucide icon name e.g. "Target", "Car", "Home"
        color: string            # hex color e.g. "#10b981"
        monthlyBudget: number    # 0 = not set
        priority: "high" | "medium" | "low"
        createdAt: Timestamp

    transactions/
      {txId}/
        goalId: string | null    # null = general / unlinked
        description: string      # max 100 chars
        amount: number           # positive = deposit, negative = withdrawal
        date: string             # YYYY-MM-DD
        type: "deposit" | "withdrawal"
        category: string         # free text, user-defined — never system-defined
        createdAt: Timestamp
```

### 6.1 Firestore Security Rules (`firestore.rules`)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 7. TypeScript Interfaces (`lib/types.ts`)

```typescript
export interface SavingsGoal {
  id: string
  userId: string
  name: string
  target: number
  current: number
  iconName: string
  color: string
  monthlyBudget: number
  priority: 'high' | 'medium' | 'low'
  createdAt: string
}

export interface Transaction {
  id: string
  userId: string
  goalId: string | null
  description: string
  amount: number
  date: string             // YYYY-MM-DD
  type: 'deposit' | 'withdrawal'
  category: string
  createdAt: string
}

export interface AllocationResult {
  goalId: string
  goalName: string
  iconName: string
  color: string
  allocatedAmount: number
  percentage: number
}

export interface GoalProjection {
  goalId: string
  goalName: string
  remaining: number
  projectedDate: string | null   // "YYYY-MM" or null
  status: 'on-track' | 'behind' | 'no-data' | 'complete'
}

export interface Achievement {
  id: string
  name: string
  description: string
  unlocked: boolean
  progress: number   // 0-100
}

export interface MonthlyTotal {
  month: string      // YYYY-MM
  deposits: number
  withdrawals: number
}

export interface GoalStats {
  streak: number
  projections: GoalProjection[]
  achievements: Achievement[]
  monthlyTotals: MonthlyTotal[]
}
```

---

## 8. Core Algorithms (Server-Side Only)

All three algorithms run exclusively in API routes. Never re-implement these on the client.

### 8.1 Weighted Auto-Allocation (`lib/algorithms/allocate.ts`)

```typescript
import { SavingsGoal, Transaction, AllocationResult } from '@/lib/types'

export function autoAllocate(
  goals: SavingsGoal[],
  transactions: Transaction[],
  totalAmount: number,
  currentMonthPrefix: string   // "YYYY-MM"
): AllocationResult[] {
  const activeGoals = goals.filter(g => g.target - g.current > 0)
  if (!activeGoals.length || totalAmount <= 0) return []

  const weights = activeGoals.map(goal => {
    const priorityMultiplier = { high: 3, medium: 2, low: 1 }[goal.priority]
    let urgencyFactor = 1.0
    if (goal.monthlyBudget > 0) {
      const monthlyDeposits = transactions
        .filter(t =>
          t.goalId === goal.id &&
          t.type === 'deposit' &&
          t.date.startsWith(currentMonthPrefix)
        )
        .reduce((sum, t) => sum + t.amount, 0)
      const remainingBudget = Math.max(0, goal.monthlyBudget - monthlyDeposits)
      urgencyFactor = 1.0 + (remainingBudget / goal.monthlyBudget)
    }
    return { goal, weight: priorityMultiplier * urgencyFactor }
  })

  const allocated = new Map(activeGoals.map(g => [g.id, 0]))
  let amountToDistribute = totalAmount

  for (let i = 0; i < 15 && amountToDistribute > 0.01; i++) {
    const eligible = weights.filter(({ goal }) => {
      const cap = goal.target - goal.current - (allocated.get(goal.id) ?? 0)
      return cap > 0
    })
    if (!eligible.length) break

    const totalWeight = eligible.reduce((sum, { weight }) => sum + weight, 0)

    for (const { goal, weight } of eligible) {
      const remaining = goal.target - goal.current - (allocated.get(goal.id) ?? 0)
      const share = totalWeight > 0
        ? (weight / totalWeight) * amountToDistribute
        : amountToDistribute / eligible.length
      const capped = Math.min(share, remaining)
      allocated.set(goal.id, (allocated.get(goal.id) ?? 0) + capped)
      amountToDistribute -= capped
    }
  }

  const totalAllocated = [...allocated.values()].reduce((a, b) => a + b, 0)

  return activeGoals
    .filter(g => (allocated.get(g.id) ?? 0) > 0.001)
    .map(g => ({
      goalId: g.id,
      goalName: g.name,
      iconName: g.iconName,
      color: g.color,
      allocatedAmount: Math.round((allocated.get(g.id) ?? 0) * 100) / 100,
      percentage: totalAllocated > 0
        ? Math.round(((allocated.get(g.id) ?? 0) / totalAllocated) * 100)
        : 0,
    }))
}
```

### 8.2 Savings Streak (`lib/algorithms/streak.ts`)

```typescript
import { Transaction } from '@/lib/types'

export function calculateStreak(transactions: Transaction[]): number {
  const deposits = transactions.filter(t => t.type === 'deposit')
  if (!deposits.length) return 0

  const depositMonths = [...new Set(deposits.map(t => t.date.slice(0, 7)))].sort()

  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

  if (!depositMonths.includes(currentMonth) && !depositMonths.includes(lastMonth)) return 0

  let checkDate = new Date(
    depositMonths.includes(currentMonth) ? now.getFullYear() : prevDate.getFullYear(),
    depositMonths.includes(currentMonth) ? now.getMonth() : prevDate.getMonth(),
    1
  )

  let streak = 0
  while (true) {
    const key = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}`
    if (!depositMonths.includes(key)) break
    streak++
    checkDate = new Date(checkDate.getFullYear(), checkDate.getMonth() - 1, 1)
  }

  return streak
}
```

### 8.3 Goal Projections (`lib/algorithms/projections.ts`)

```typescript
import { SavingsGoal, Transaction, GoalProjection } from '@/lib/types'

export function calculateProjections(
  goals: SavingsGoal[],
  transactions: Transaction[]
): GoalProjection[] {
  const deposits = transactions.filter(t => t.type === 'deposit')

  const monthlyMap = new Map<string, number>()
  for (const tx of deposits) {
    const month = tx.date.slice(0, 7)
    monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + tx.amount)
  }
  const monthlyRate = monthlyMap.size > 0
    ? [...monthlyMap.values()].reduce((a, b) => a + b, 0) / monthlyMap.size
    : 0

  return goals.map(goal => {
    const remaining = goal.target - goal.current

    if (remaining <= 0) {
      return { goalId: goal.id, goalName: goal.name, remaining: 0,
        projectedDate: null, status: 'complete' as const }
    }
    if (monthlyRate <= 0) {
      return { goalId: goal.id, goalName: goal.name, remaining,
        projectedDate: null, status: 'no-data' as const }
    }

    const monthsNeeded = Math.ceil(remaining / monthlyRate)
    const projected = new Date()
    projected.setMonth(projected.getMonth() + monthsNeeded)

    const currentMonth = new Date().toISOString().slice(0, 7)
    const thisMonthDeposits = deposits
      .filter(t => t.goalId === goal.id && t.date.startsWith(currentMonth))
      .reduce((sum, t) => sum + t.amount, 0)

    const status = goal.monthlyBudget > 0 && thisMonthDeposits < goal.monthlyBudget * 0.8
      ? 'behind' as const
      : 'on-track' as const

    return {
      goalId: goal.id,
      goalName: goal.name,
      remaining,
      projectedDate: projected.toISOString().slice(0, 7),
      status,
    }
  })
}
```

---

## 9. API Routes

### 9.1 Goals (`app/api/goals/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/middleware/auth'
import { adminDb } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function GET(req: NextRequest) {
  try {
    const uid = await verifyIdToken(req)
    const snap = await adminDb
      .collection(`users/${uid}/goals`)
      .orderBy('createdAt', 'desc')
      .get()
    const goals = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    return NextResponse.json({ goals })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const uid = await verifyIdToken(req)
    const { name, target, iconName, color, monthlyBudget = 0, priority = 'medium' } = await req.json()

    if (!name || !target || !iconName || !color) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (name.length > 50) {
      return NextResponse.json({ error: 'Name exceeds 50 characters' }, { status: 400 })
    }

    const ref = await adminDb.collection(`users/${uid}/goals`).add({
      userId: uid, name, target, current: 0,
      iconName, color, monthlyBudget, priority,
      createdAt: FieldValue.serverTimestamp(),
    })
    return NextResponse.json({ id: ref.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

### 9.2 Auto-Allocate (`app/api/allocate/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/middleware/auth'
import { adminDb } from '@/lib/firebase/admin'
import { autoAllocate } from '@/lib/algorithms/allocate'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  try {
    const uid = await verifyIdToken(req)
    const { totalAmount, confirm = false } = await req.json()

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const [goalsSnap, txSnap] = await Promise.all([
      adminDb.collection(`users/${uid}/goals`).get(),
      adminDb.collection(`users/${uid}/transactions`).get(),
    ])
    const goals = goalsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
    const transactions = txSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]

    const currentMonthPrefix = new Date().toISOString().slice(0, 7)
    const allocations = autoAllocate(goals, transactions, totalAmount, currentMonthPrefix)

    // Dry-run: return preview without writing to Firestore
    if (!confirm) {
      return NextResponse.json({ allocations })
    }

    // Confirmed: write transactions and update goal.current atomically
    const batch = adminDb.batch()
    const today = new Date().toISOString().slice(0, 10)

    for (const alloc of allocations) {
      const txRef = adminDb.collection(`users/${uid}/transactions`).doc()
      batch.set(txRef, {
        userId: uid,
        goalId: alloc.goalId,
        description: 'Auto-allocation',
        amount: alloc.allocatedAmount,
        date: today,
        type: 'deposit',
        category: 'Savings',
        createdAt: FieldValue.serverTimestamp(),
      })
      const goalRef = adminDb.doc(`users/${uid}/goals/${alloc.goalId}`)
      batch.update(goalRef, { current: FieldValue.increment(alloc.allocatedAmount) })
    }

    await batch.commit()
    return NextResponse.json({ allocations, committed: true })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

### 9.3 Stats (`app/api/stats/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifyIdToken } from '@/lib/middleware/auth'
import { adminDb } from '@/lib/firebase/admin'
import { calculateStreak } from '@/lib/algorithms/streak'
import { calculateProjections } from '@/lib/algorithms/projections'

export async function GET(req: NextRequest) {
  try {
    const uid = await verifyIdToken(req)

    const [goalsSnap, txSnap] = await Promise.all([
      adminDb.collection(`users/${uid}/goals`).get(),
      adminDb.collection(`users/${uid}/transactions`).get(),
    ])
    const goals = goalsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]
    const transactions = txSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[]

    const streak = calculateStreak(transactions)
    const projections = calculateProjections(goals, transactions)

    const totalDeposits = transactions.filter((t: any) => t.type === 'deposit').length
    const totalSaved = goals.reduce((sum: number, g: any) => sum + (g.current ?? 0), 0)
    const maxProgress = goals.length
      ? Math.max(...goals.map((g: any) => g.target > 0 ? (g.current / g.target) * 100 : 0))
      : 0

    const achievements = [
      {
        id: 'first-step', name: 'First Step',
        description: 'Log your first deposit',
        unlocked: totalDeposits >= 1,
        progress: Math.min(100, totalDeposits * 100),
      },
      {
        id: 'halfway-hero', name: 'Halfway Hero',
        description: 'Reach 50% on any goal',
        unlocked: maxProgress >= 50,
        progress: Math.min(100, Math.round(maxProgress)),
      },
      {
        id: 'goal-crusher', name: 'Goal Crusher',
        description: 'Complete a goal',
        unlocked: goals.some((g: any) => g.current >= g.target),
        progress: goals.some((g: any) => g.current >= g.target) ? 100 : 0,
      },
      {
        id: 'consistency-master', name: 'Consistency Master',
        description: 'Save for 3 consecutive months',
        unlocked: streak >= 3,
        progress: Math.min(100, Math.round((streak / 3) * 100)),
      },
      {
        id: 'super-saver', name: 'Super Saver',
        description: 'Save $1,000 across all goals',
        unlocked: totalSaved >= 1000,
        progress: Math.min(100, Math.round((totalSaved / 1000) * 100)),
      },
    ]

    // Monthly totals — last 6 months
    const monthlyMap = new Map<string, { deposits: number; withdrawals: number }>()
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      monthlyMap.set(key, { deposits: 0, withdrawals: 0 })
    }
    for (const tx of transactions) {
      const month = (tx.date as string)?.slice(0, 7)
      if (monthlyMap.has(month)) {
        const entry = monthlyMap.get(month)!
        if (tx.type === 'deposit') entry.deposits += tx.amount
        else entry.withdrawals += Math.abs(tx.amount)
      }
    }
    const monthlyTotals = [...monthlyMap.entries()].map(([month, v]) => ({ month, ...v }))

    return NextResponse.json({ streak, projections, achievements, monthlyTotals })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
}
```

---

## 10. Zustand Store (`store/flows-store.ts`)

```typescript
import { create } from 'zustand'
import { SavingsGoal, Transaction, GoalStats } from '@/lib/types'
import { auth } from '@/lib/firebase/client'

interface FlowsStore {
  goals: SavingsGoal[]
  transactions: Transaction[]
  stats: GoalStats | null
  loading: boolean
  setGoals: (goals: SavingsGoal[]) => void
  setTransactions: (transactions: Transaction[]) => void
  setStats: (stats: GoalStats) => void
  setLoading: (loading: boolean) => void
  getAuthHeader: () => Promise<{ Authorization: string }>
}

export const useFlowsStore = create<FlowsStore>((set) => ({
  goals: [],
  transactions: [],
  stats: null,
  loading: false,
  setGoals: (goals) => set({ goals }),
  setTransactions: (transactions) => set({ transactions }),
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ loading }),
  getAuthHeader: async () => {
    const token = await auth.currentUser?.getIdToken()
    return { Authorization: `Bearer ${token}` }
  },
}))
```

---

## 11. Real-Time Firestore Listeners (`app/(app)/layout.tsx`)

Reads go directly client → Firestore (real-time). Writes always go through API routes.

```typescript
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
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  )
}
```

---

## 12. Route Guard Middleware (`middleware.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const session = req.cookies.get('session')
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/login')) return NextResponse.next()

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
}
```

> For production: implement Firebase session cookies. On login call `adminAuth.createSessionCookie(idToken)`, set it as an HttpOnly cookie, and verify it in middleware with `adminAuth.verifySessionCookie()`.

---

## 13. Design System

### Color tokens
```
Background:     zinc-950   #09090b
Card surface:   zinc-900   #18181b
Border:         zinc-800   #27272a
Muted text:     zinc-400   #a1a1aa
Body text:      zinc-100   #f4f4f5
Accent:         emerald-500 #10b981
Positive:       emerald-400 #34d399
Negative:       red-400    #f87171
Warning:        yellow-400 #facc15
```

### Typography rules
- Financial figures: `font-mono text-sm tabular-nums`
- Page headings: `text-xl font-semibold text-zinc-100`
- Section labels: `text-xs font-medium uppercase tracking-wider text-zinc-500`
- Body copy: `text-sm text-zinc-300`
- No emojis anywhere — Lucide React icons only

### shadcn components to install
```bash
npx shadcn@latest init
npx shadcn@latest add button input label select badge progress card separator tooltip
```

### Sidebar
- Collapsed width: `w-14` | Expanded: `w-56`
- Active route indicator: `border-l-2 border-emerald-500 bg-zinc-800/60`
- Nav items: Dashboard · Transactions · Analytics · Settings

### Priority badge styles
```
high   → bg-red-950    text-red-400    border border-red-900
medium → bg-yellow-950 text-yellow-400 border border-yellow-900
low    → bg-zinc-800   text-zinc-400   border border-zinc-700
```

### Monthly budget sub-bar thresholds
```
< 80%   → bg-emerald-500  (neutral)
>= 80%  → bg-yellow-500   (warning)
>= 100% → bg-red-500      (exceeded)
```

---

## 14. Vercel Deployment (`vercel.json`)

```json
{
  "framework": "nextjs",
  "buildCommand": "next build",
  "devCommand": "next dev",
  "installCommand": "npm install"
}
```

Set all environment variables in the Vercel dashboard. Store `FIREBASE_ADMIN_PRIVATE_KEY` as an encrypted secret — never commit it to the repository.

---

## 15. UI Views Summary

### View 1 — Dashboard
- Stats row: Total Saved · Savings Streak (Flame icon) · Active Goals count
- Goal cards grid: progress bar, priority badge, monthly budget sub-bar with threshold colours
- Auto-allocate panel: amount input → `POST /api/allocate` dry-run for live preview → confirm button calls same endpoint with `confirm: true`
- Add goal inline form (slides open, no modal)

### View 2 — Transactions
- Filterable, searchable table
- Columns: Date · Description · Category · Type · Amount · Goal
- Filters: search by description · type dropdown · goal dropdown
- Add transaction inline form — category is always a free-text input, never a system dropdown
- Delete button per row calling `DELETE /api/transactions/:id`

### View 3 — Analytics
- Overall balance card: goal savings + general income − general expenses
- Projections table: remaining amount + projected month + status chip per incomplete goal
- Achievements grid: 5 milestones with progress bars, data from `GET /api/stats`
- Monthly bar chart: last 6 months deposits, pure CSS bars — no chart library required

### View 4 — Settings
- Goal list with inline edit (name, target, monthlyBudget, priority)
- Sign out button using `signOut(auth)` from Firebase client SDK
- App name, version, tagline

---

## 16. Architecture Rules (Non-Negotiable)

- All Firestore **writes** go through Next.js API routes — never from the client directly
- All Firestore **reads** for real-time data use the client SDK with `onSnapshot` listeners
- Every API route calls `verifyIdToken(req)` before any Firestore operation
- All business logic (allocation, streak, projections) lives in `/lib/algorithms/` and runs server-side only
- `category` on transactions is always a free-text `<input>` — never a `<select>` with predefined options
- Financial figures always render with `$` prefix, 2 decimal places, `font-mono tabular-nums`
- Withdrawals render in `text-red-400`, deposits in `text-emerald-400`
- No emojis in any component — use Lucide React icons exclusively
