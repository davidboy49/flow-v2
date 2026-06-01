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
