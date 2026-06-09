'use client'
import { useState } from 'react'
import { useFlowsStore } from '@/store/flows-store'
import { Trash2, Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function PresetsPage() {
  const { presets, getAuthHeader } = useFlowsStore()
  const [newPresetAmount, setNewPresetAmount] = useState('')
  const [newPresetLabel, setNewPresetLabel] = useState('')

  async function handleAddPreset(e: React.FormEvent) {
    e.preventDefault()
    if (!newPresetAmount) return
    const amt = parseFloat(newPresetAmount)
    if (isNaN(amt) || amt <= 0) return
    try {
      const headers = await getAuthHeader()
      const res = await fetch('/api/presets', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amt,
          label: newPresetLabel.trim() || null,
          active: true,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to add preset')
      }
      setNewPresetAmount('')
      setNewPresetLabel('')
    } catch (err) {
      console.error('Error adding preset:', err)
    }
  }

  async function togglePresetActive(presetId: string, currentActive: boolean) {
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`/api/presets/${presetId}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active: !currentActive,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to update preset')
      }
    } catch (err) {
      console.error('Error toggling preset status:', err)
    }
  }

  async function handleDeletePreset(presetId: string) {
    if (!confirm('Are you sure you want to delete this preset amount?')) return
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`/api/presets/${presetId}`, {
        method: 'DELETE',
        headers,
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to delete preset')
      }
    } catch (err) {
      console.error('Error deleting preset:', err)
    }
  }

  const inputStyle = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--body)',
    borderRadius: 'var(--radius)',
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Breadcrumb / Back button */}
      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-base font-medium"
        >
          <ArrowLeft size={14} /> Back to Settings
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-page-heading">Preset Custom Amounts</h1>
        <p className="text-body mt-0.5">Configure preset amounts to auto-fill description & amount inside transaction dialogs</p>
      </div>

      <div className="card grid md:grid-cols-2 gap-6">
        {/* List panel */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-200">Preset Amounts</h3>
          <p className="text-xs text-zinc-500">Enable or disable presets, or delete them</p>

          <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
            {presets.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-10">No preset amounts configured yet.</p>
            ) : (
              presets.map(pre => {
                const isActive = pre.active !== false
                return (
                  <div
                    key={pre.id}
                    className="flex items-center justify-between p-2.5 rounded border text-xs"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="font-semibold text-zinc-200 num">${pre.amount.toFixed(2)}</span>
                      {pre.label && <span className="text-[10px] text-zinc-500 mt-0.5">{pre.label}</span>}
                      <span
                        onClick={() => togglePresetActive(pre.id, isActive)}
                        className="text-[10px] mt-1.5 cursor-pointer hover:underline font-semibold select-none"
                        style={{ color: isActive ? 'var(--positive)' : 'var(--muted)' }}
                      >
                        {isActive ? 'Active' : 'Inactive'} (Click to toggle)
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeletePreset(pre.id)}
                      className="text-zinc-500 hover:text-red-400 p-1 rounded transition-base flex-shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Add panel */}
        <form onSubmit={handleAddPreset} className="space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-section-label block mb-1">Amount ($)</label>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="50.00"
                  value={newPresetAmount}
                  onChange={e => setNewPresetAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm outline-none focus:ring-1 transition-base"
                  style={inputStyle}
                  required
                />
              </div>
              <div>
                <label className="text-section-label block mb-1">Label (Optional)</label>
                <input
                  type="text"
                  placeholder="Lunch, Gas..."
                  value={newPresetLabel}
                  onChange={e => setNewPresetLabel(e.target.value)}
                  className="w-full px-3 py-2 text-sm outline-none focus:ring-1 transition-base"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-xs font-semibold text-zinc-950 transition-base"
            style={{ background: 'var(--accent)' }}
          >
            <Plus size={12} /> Create Preset Amount
          </button>
        </form>
      </div>
    </div>
  )
}
