'use client'
import { useEffect, useState } from 'react'
import { useFlowsStore } from '@/store/flows-store'
import { BalanceCard } from '@/components/analytics/balance-card'
import { MonthlyChart } from '@/components/analytics/monthly-chart'
import { ProjectionsTable } from '@/components/analytics/projections-table'
import { AchievementsGrid } from '@/components/analytics/achievements-grid'
import { Loader2, RefreshCw } from 'lucide-react'

export default function AnalyticsPage() {
  const { goals, transactions, stats, setStats, getAuthHeader, categories } = useFlowsStore()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function fetchStats() {
      try {
        setLoading(true)
        setError(null)
        const headers = await getAuthHeader()
        const res = await fetch('/api/stats', { headers })
        if (!res.ok) throw new Error('Failed to load analytics data')
        const data = await res.json()
        if (active) {
          setStats(data)
        }
      } catch (e: any) {
        if (active) {
          setError(e.message ?? 'An error occurred')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    fetchStats()

    return () => {
      active = false
    }
  }, [getAuthHeader, setStats])

  // Category spending breakdown calculations
  const categoryWithdrawals = transactions
    .filter(t => t.type === 'withdrawal')
    .reduce((acc, t) => {
      const cat = t.category || 'Uncategorized'
      acc[cat] = (acc[cat] || 0) + Math.abs(t.amount)
      return acc
    }, {} as Record<string, number>)

  const sortedCategories = Object.entries(categoryWithdrawals)
    .sort((a, b) => b[1] - a[1])

  const totalSpending = Object.values(categoryWithdrawals).reduce((sum, val) => sum + val, 0)

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-page-heading">Analytics</h1>
        <p className="text-body mt-0.5">Insights and performance of your savings</p>
      </div>

      {loading && !stats ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-zinc-500" size={32} />
          <p className="text-sm text-zinc-500">Calculating your financial stats...</p>
        </div>
      ) : error ? (
        <div className="card space-y-4 text-center py-10">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-base bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-zinc-200"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top layout: Balance overview and Monthly chart side by side or stacked */}
          <div className="grid md:grid-cols-2 gap-6">
            <BalanceCard goals={goals} transactions={transactions} />
            {stats?.monthlyTotals && (
              <MonthlyChart monthlyTotals={stats.monthlyTotals} />
            )}
          </div>

          {/* Category spending breakdown */}
          <div className="card space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Spending by Category</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Total withdrawal expenses broken down by category</p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4 pt-2">
              {sortedCategories.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6 sm:col-span-2">No withdrawal transactions logged yet.</p>
              ) : (
                sortedCategories.map(([category, amount]) => {
                  const percentage = totalSpending > 0 ? (amount / totalSpending) * 100 : 0
                  const catColor = categories.find(c => c.name.toLowerCase() === category.toLowerCase())?.color ?? 'var(--border)'

                  return (
                    <div key={category} className="space-y-1 p-3 rounded-lg border border-zinc-850 bg-zinc-900/10" style={{ borderColor: 'var(--border)' }}>
                      <div className="flex items-center justify-between text-xs font-medium">
                        <span className="text-zinc-300 flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: catColor }} />
                          {category}
                        </span>
                        <span className="num text-zinc-400">
                          ${amount.toFixed(2)} ({percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden" style={{ background: 'rgba(var(--hover-rgb), 0.3)' }}>
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            background: catColor,
                            width: `${percentage}%`,
                          }}
                        />
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Goal projections section */}
          {stats?.projections && (
            <section className="space-y-3">
              <h2 className="text-section-label">Projections</h2>
              <ProjectionsTable projections={stats.projections} />
            </section>
          )}

          {/* Achievements section */}
          {stats?.achievements && (
            <section className="space-y-3">
              <h2 className="text-section-label">Achievements</h2>
              <AchievementsGrid achievements={stats.achievements} />
            </section>
          )}
        </div>
      )}
    </div>
  )
}
