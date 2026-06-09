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

export interface Category {
  id: string
  name: string
  color: string
  active: boolean
}

export interface PresetAmount {
  id: string
  amount: number
  label?: string
  active: boolean
}

export interface MemberProfile {
  id: string
  nickname: string
  active: boolean
}

export interface UserProfile {
  nickname: string
  active: boolean
}

