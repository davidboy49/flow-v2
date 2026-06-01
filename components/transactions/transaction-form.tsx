'use client'
import { useState } from 'react'
import { SavingsGoal } from '@/lib/types'
import { useFlowsStore } from '@/store/flows-store'
import { Loader2, X } from 'lucide-react'

interface TransactionFormProps {
  goals: SavingsGoal[]
  onClose: () => void
  onCreated?: () => void
}

export function TransactionForm({ goals, onClose, onCreated }: TransactionFormProps) {
  const { getAuthHeader } = useFlowsStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    goalId: '',
    description: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    type: 'deposit' as 'deposit' | 'withdrawal',
    category: '', // always free-text — never a select
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description.trim() || !form.amount || !form.date || !form.category.trim()) return

    setLoading(true)
    setError(null)
    try {
      const headers = await getAuthHeader()
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId: form.goalId || null,
          description: form.description.trim(),
          amount: parseFloat(form.amount),
          date: form.date,
          type: form.type,
          category: form.category.trim(),
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to save transaction')
      }
      onCreated?.()
      onClose()
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-3 py-2 rounded-md text-sm text-zinc-100 outline-none focus:ring-1 transition-base"
  const inputStyle = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    '--tw-ring-color': 'var(--accent)',
  } as React.CSSProperties

  return (
    <form
      id="transaction-form"
      onSubmit={handleSubmit}
      className="card animate-slide-down space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">New Transaction</h3>
        <button type="button" onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-base">
          <X size={16} />
        </button>
      </div>

      {error && (
        <p className="text-xs px-3 py-2 rounded-md" style={{ background: '#450a0a', color: 'var(--negative)' }}>
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-section-label block mb-1">Description</label>
          <input
            id="input-tx-description"
            className={inputClass}
            style={inputStyle}
            placeholder="Paycheck deposit"
            maxLength={100}
            value={form.description}
            onChange={e => set('description', e.target.value)}
            required
          />
        </div>

        {/* Category — always free-text per spec */}
        <div className="col-span-2">
          <label className="text-section-label block mb-1">Category</label>
          <input
            id="input-tx-category"
            className={inputClass}
            style={inputStyle}
            placeholder="e.g. Salary, Rent, Food..."
            value={form.category}
            onChange={e => set('category', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-section-label block mb-1">Amount ($)</label>
          <input
            id="input-tx-amount"
            type="number" min="0.01" step="0.01"
            className={inputClass}
            style={inputStyle}
            placeholder="250.00"
            value={form.amount}
            onChange={e => set('amount', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-section-label block mb-1">Date</label>
          <input
            id="input-tx-date"
            type="date"
            className={inputClass}
            style={inputStyle}
            value={form.date}
            onChange={e => set('date', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-section-label block mb-1">Type</label>
          <select
            id="select-tx-type"
            className={inputClass}
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={form.type}
            onChange={e => set('type', e.target.value)}
          >
            <option value="deposit">Deposit</option>
            <option value="withdrawal">Withdrawal</option>
          </select>
        </div>

        <div>
          <label className="text-section-label block mb-1">Link to goal</label>
          <select
            id="select-tx-goal"
            className={inputClass}
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={form.goalId}
            onChange={e => set('goalId', e.target.value)}
          >
            <option value="">Unlinked</option>
            {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded-md text-sm text-zinc-400 hover:text-zinc-200 transition-base"
          style={{ border: '1px solid var(--border)' }}
        >
          Cancel
        </button>
        <button
          id="btn-create-tx-submit"
          type="submit"
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-zinc-950 transition-base disabled:opacity-50"
          style={{ background: 'var(--accent)' }}
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Save transaction
        </button>
      </div>
    </form>
  )
}
