'use client'
import { useState } from 'react'
import { useFlowsStore } from '@/store/flows-store'
import { Loader2, X } from 'lucide-react'

const ICON_OPTIONS = ['Target', 'Car', 'Home', 'Plane', 'ShoppingBag', 'Laptop', 'Heart', 'GraduationCap', 'Briefcase', 'Star']
const COLOR_OPTIONS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316']
const PRIORITY_OPTIONS = ['high', 'medium', 'low'] as const

interface GoalFormProps {
  onClose: () => void
  onCreated?: () => void
}

export function GoalForm({ onClose, onCreated }: GoalFormProps) {
  const { getAuthHeader } = useFlowsStore()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    target: '',
    iconName: 'Target',
    color: '#10b981',
    monthlyBudget: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.target) return

    setLoading(true)
    setError(null)
    try {
      const headers = await getAuthHeader()
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          target: parseFloat(form.target),
          iconName: form.iconName,
          color: form.color,
          monthlyBudget: form.monthlyBudget ? parseFloat(form.monthlyBudget) : 0,
          priority: form.priority,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to create goal')
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
  const inputStyle = { background: 'var(--bg)', border: '1px solid var(--border)', '--tw-ring-color': 'var(--accent)' } as React.CSSProperties

  return (
    <form
      id="goal-form"
      onSubmit={handleSubmit}
      className="card animate-slide-down space-y-4"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">New Goal</h3>
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
          <label className="text-section-label block mb-1">Goal name</label>
          <input
            id="input-goal-name"
            className={inputClass}
            style={inputStyle}
            placeholder="Emergency fund"
            maxLength={50}
            value={form.name}
            onChange={e => set('name', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-section-label block mb-1">Target ($)</label>
          <input
            id="input-goal-target"
            type="number" min="0.01" step="0.01"
            className={inputClass}
            style={inputStyle}
            placeholder="5000.00"
            value={form.target}
            onChange={e => set('target', e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-section-label block mb-1">Monthly budget ($)</label>
          <input
            id="input-goal-budget"
            type="number" min="0" step="0.01"
            className={inputClass}
            style={inputStyle}
            placeholder="500.00"
            value={form.monthlyBudget}
            onChange={e => set('monthlyBudget', e.target.value)}
          />
        </div>

        <div>
          <label className="text-section-label block mb-1">Priority</label>
          <select
            id="select-goal-priority"
            className={inputClass}
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={form.priority}
            onChange={e => set('priority', e.target.value)}
          >
            {PRIORITY_OPTIONS.map(p => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-section-label block mb-1">Icon</label>
          <select
            id="select-goal-icon"
            className={inputClass}
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={form.iconName}
            onChange={e => set('iconName', e.target.value)}
          >
            {ICON_OPTIONS.map(i => <option key={i} value={i}>{i}</option>)}
          </select>
        </div>

        <div className="col-span-2">
          <label className="text-section-label block mb-2">Color</label>
          <div className="flex gap-2 flex-wrap">
            {COLOR_OPTIONS.map(c => (
              <button
                key={c}
                type="button"
                id={`btn-color-${c.replace('#', '')}`}
                onClick={() => set('color', c)}
                className="w-7 h-7 rounded-full transition-base"
                style={{
                  background: c,
                  outline: form.color === c ? `2px solid ${c}` : 'none',
                  outlineOffset: '2px',
                  opacity: form.color === c ? 1 : 0.5,
                }}
              />
            ))}
          </div>
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
          id="btn-create-goal-submit"
          type="submit"
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-zinc-950 transition-base disabled:opacity-50"
          style={{ background: 'var(--accent)' }}
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Create goal
        </button>
      </div>
    </form>
  )
}
