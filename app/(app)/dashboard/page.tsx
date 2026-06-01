'use client'
import { useState, useEffect } from 'react'
import { useFlowsStore } from '@/store/flows-store'
import { GoalGrid } from '@/components/goals/goal-grid'
import { GoalForm } from '@/components/goals/goal-form'
import { SavingsGoal, AllocationResult } from '@/lib/types'
import { Plus, Flame, Target, Zap, Loader2 } from 'lucide-react'

export default function DashboardPage() {
  const { goals, getAuthHeader } = useFlowsStore()
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [editGoal, setEditGoal] = useState<SavingsGoal | null>(null)
  const [streak, setStreak] = useState(0)
  const [allocAmount, setAllocAmount] = useState('')
  const [allocPreview, setAllocPreview] = useState<AllocationResult[] | null>(null)
  const [allocLoading, setAllocLoading] = useState(false)
  const [allocConfirming, setAllocConfirming] = useState(false)
  const [allocError, setAllocError] = useState<string | null>(null)

  // Load streak on mount
  useEffect(() => {
    getAuthHeader().then(h =>
      fetch('/api/stats', { headers: h })
        .then(r => r.json())
        .then(d => setStreak(d.streak ?? 0))
        .catch(() => {})
    )
  }, [getAuthHeader])

  const totalSaved = goals.reduce((sum, g) => sum + g.current, 0)
  const activeGoals = goals.filter(g => g.current < g.target).length

  async function handleAllocPreview() {
    if (!allocAmount || parseFloat(allocAmount) <= 0) return
    setAllocLoading(true)
    setAllocError(null)
    setAllocPreview(null)
    try {
      const headers = await getAuthHeader()
      const res = await fetch('/api/allocate', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalAmount: parseFloat(allocAmount), confirm: false }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setAllocPreview(data.allocations)
    } catch (e: any) {
      setAllocError(e.message)
    } finally {
      setAllocLoading(false)
    }
  }

  async function handleAllocConfirm() {
    if (!allocAmount || parseFloat(allocAmount) <= 0) return
    setAllocConfirming(true)
    setAllocError(null)
    try {
      const headers = await getAuthHeader()
      const res = await fetch('/api/allocate', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ totalAmount: parseFloat(allocAmount), confirm: true }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed')
      setAllocPreview(null)
      setAllocAmount('')
    } catch (e: any) {
      setAllocError(e.message)
    } finally {
      setAllocConfirming(false)
    }
  }

  const inputStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--body)',
    borderRadius: 'var(--radius)',
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-heading">Dashboard</h1>
          <p className="text-body mt-0.5">Your savings overview</p>
        </div>
        <button
          id="btn-new-goal"
          onClick={() => setShowGoalForm(s => !s)}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-zinc-950 transition-base"
          style={{ background: 'var(--accent)' }}
        >
          <Plus size={15} />
          New goal
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Saved', value: `$${totalSaved.toFixed(2)}`, Icon: Target, color: 'var(--positive)' },
          { label: 'Savings Streak', value: `${streak} mo`, Icon: Flame, color: '#fb923c' },
          { label: 'Active Goals', value: String(activeGoals), Icon: Zap, color: 'var(--accent)' },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} id={`stat-${label.replace(/\s/g, '-').toLowerCase()}`} className="card flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: color + '22', color }}>
              <Icon size={20} />
            </div>
            <div>
              <p className="text-section-label">{label}</p>
              <p className="num text-xl font-semibold text-zinc-100 mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Inline goal form */}
      {showGoalForm && (
        <GoalForm onClose={() => setShowGoalForm(false)} />
      )}

      {/* Goals grid */}
      <section className="space-y-3">
        <h2 className="text-section-label">Goals</h2>
        <GoalGrid goals={goals} onEdit={setEditGoal} />
      </section>

      {/* Auto-allocate panel */}
      <section id="allocate-panel" className="card space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100">Auto-Allocate</h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Distribute funds across active goals weighted by priority and urgency
          </p>
        </div>

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-section-label block mb-1">Amount to distribute ($)</label>
            <input
              id="input-alloc-amount"
              type="number" min="0.01" step="0.01"
              placeholder="1000.00"
              value={allocAmount}
              onChange={e => { setAllocAmount(e.target.value); setAllocPreview(null) }}
              className="w-full px-3 py-2 rounded-md text-sm text-zinc-100 outline-none focus:ring-1 transition-base"
              style={{ ...inputStyle, '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
            />
          </div>
          <button
            id="btn-alloc-preview"
            onClick={handleAllocPreview}
            disabled={allocLoading || !allocAmount}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-base disabled:opacity-50"
            style={{ background: 'var(--border)', color: 'var(--body)' }}
          >
            {allocLoading ? <Loader2 size={14} className="animate-spin" /> : null}
            Preview
          </button>
        </div>

        {allocError && (
          <p className="text-xs px-3 py-2 rounded-md" style={{ background: '#450a0a', color: 'var(--negative)' }}>
            {allocError}
          </p>
        )}

        {/* Preview results */}
        {allocPreview && (
          <div className="space-y-3 animate-slide-down">
            <p className="text-section-label">Allocation preview</p>
            <div className="space-y-2">
              {allocPreview.map(a => (
                <div
                  key={a.goalId}
                  id={`alloc-preview-${a.goalId}`}
                  className="flex items-center justify-between py-2 px-3 rounded-md"
                  style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: a.color }} />
                    <span className="text-sm text-zinc-200">{a.goalName}</span>
                    <span className="text-xs text-zinc-500">{a.percentage}%</span>
                  </div>
                  <span className="num text-sm font-medium" style={{ color: 'var(--positive)' }}>
                    +${a.allocatedAmount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <button
              id="btn-alloc-confirm"
              onClick={handleAllocConfirm}
              disabled={allocConfirming}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium text-zinc-950 transition-base disabled:opacity-50"
              style={{ background: 'var(--accent)' }}
            >
              {allocConfirming && <Loader2 size={14} className="animate-spin" />}
              Confirm allocation
            </button>
          </div>
        )}
      </section>
    </div>
  )
}
