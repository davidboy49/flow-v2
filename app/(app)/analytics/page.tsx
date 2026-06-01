'use client'
import { useEffect, useState } from 'react'
import { useFlowsStore } from '@/store/flows-store'
import { BalanceCard } from '@/components/analytics/balance-card'
import { MonthlyChart } from '@/components/analytics/monthly-chart'
import { ProjectionsTable } from '@/components/analytics/projections-table'
import { AchievementsGrid } from '@/components/analytics/achievements-grid'
import { Loader2, RefreshCw } from 'lucide-react'

export default function AnalyticsPage() {
  const { goals, transactions, stats, setStats, getAuthHeader } = useFlowsStore()
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
