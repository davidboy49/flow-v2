import { create } from 'zustand'
import { SavingsGoal, Transaction, GoalStats, Category, PresetAmount, MemberProfile, UserProfile } from '@/lib/types'

interface FlowsStore {
  goals: SavingsGoal[]
  transactions: Transaction[]
  stats: GoalStats | null
  loading: boolean
  categories: Category[]
  presets: PresetAmount[]
  members: MemberProfile[]
  profile: UserProfile | null
  setGoals: (goals: SavingsGoal[]) => void
  setTransactions: (transactions: Transaction[]) => void
  setStats: (stats: GoalStats) => void
  setLoading: (loading: boolean) => void
  setCategories: (categories: Category[]) => void
  setPresets: (presets: PresetAmount[]) => void
  setMembers: (members: MemberProfile[]) => void
  setProfile: (profile: UserProfile | null) => void
  /**
   * Returns headers to include in API fetch calls.
   * NextAuth JWT is sent automatically as an HttpOnly cookie — no Authorization
   * header is needed. This function returns {} but is kept for API compatibility.
   */
  getAuthHeader: () => Promise<Record<string, string>>
}

export const useFlowsStore = create<FlowsStore>((set) => ({
  goals: [],
  transactions: [],
  stats: null,
  loading: false,
  categories: [],
  presets: [],
  members: [],
  profile: null,
  setGoals: (goals) => set({ goals }),
  setTransactions: (transactions) => set({ transactions }),
  setStats: (stats) => set({ stats }),
  setLoading: (loading) => set({ loading }),
  setCategories: (categories) => set({ categories }),
  setPresets: (presets) => set({ presets }),
  setMembers: (members) => set({ members }),
  setProfile: (profile) => set({ profile }),
  getAuthHeader: async () => ({}),
}))
