'use client'
import { useState } from 'react'
import { Transaction, SavingsGoal } from '@/lib/types'
import { Trash2, Search, ChevronUp, ChevronDown } from 'lucide-react'
import { useFlowsStore } from '@/store/flows-store'

interface TransactionTableProps {
  transactions: Transaction[]
  goals: SavingsGoal[]
  onDeleted?: () => void
}

export function TransactionTable({ transactions, goals, onDeleted }: TransactionTableProps) {
  const { getAuthHeader } = useFlowsStore()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'deposit' | 'withdrawal'>('all')
  const [goalFilter, setGoalFilter] = useState<string>('all')
  const [deleting, setDeleting] = useState<string | null>(null)

  const goalMap = new Map(goals.map(g => [g.id, g.name]))

  const filtered = transactions.filter(t => {
    const matchSearch = t.description.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === 'all' || t.type === typeFilter
    const matchGoal = goalFilter === 'all' || t.goalId === goalFilter
    return matchSearch && matchType && matchGoal
  })

  async function handleDelete(txId: string) {
    if (!confirm('Delete this transaction?')) return
    setDeleting(txId)
    try {
      const headers = await getAuthHeader()
      await fetch(`/api/transactions/${txId}`, { method: 'DELETE', headers })
      onDeleted?.()
    } finally {
      setDeleting(null)
    }
  }

  const inputStyle = {
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    color: 'var(--body)',
    borderRadius: 'var(--radius)',
  }

  return (
    <div className="space-y-3">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            id="input-tx-search"
            placeholder="Search transactions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm outline-none focus:ring-1 transition-base"
            style={{ ...inputStyle, '--tw-ring-color': 'var(--accent)' } as React.CSSProperties}
          />
        </div>
        <select
          id="select-tx-type"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value as any)}
          className="px-3 py-2 text-sm outline-none cursor-pointer"
          style={inputStyle}
        >
          <option value="all">All types</option>
          <option value="deposit">Deposits</option>
          <option value="withdrawal">Withdrawals</option>
        </select>
        <select
          id="select-tx-goal"
          value={goalFilter}
          onChange={e => setGoalFilter(e.target.value)}
          className="px-3 py-2 text-sm outline-none cursor-pointer"
          style={inputStyle}
        >
          <option value="all">All goals</option>
          <option value="unlinked">Unlinked</option>
          {goals.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Description', 'Category', 'Type', 'Amount', 'Goal', ''].map(col => (
                  <th
                    key={col}
                    className="text-section-label px-4 py-3 text-left"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-600">
                    No transactions found
                  </td>
                </tr>
              )}
              {filtered.map(tx => (
                <tr
                  key={tx.id}
                  id={`tx-row-${tx.id}`}
                  className="transition-base hover:bg-zinc-800/30"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <td className="num px-4 py-3 text-zinc-400 whitespace-nowrap">{tx.date}</td>
                  <td className="px-4 py-3 text-sm text-zinc-200 max-w-48 truncate">{tx.description}</td>
                  <td className="px-4 py-3 text-sm text-zinc-400">{tx.category}</td>
                  <td className="px-4 py-3">
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 w-fit"
                      style={{
                        background: tx.type === 'deposit' ? '#052e16' : '#450a0a',
                        color: tx.type === 'deposit' ? 'var(--positive)' : 'var(--negative)',
                      }}
                    >
                      {tx.type === 'deposit'
                        ? <ChevronUp size={10} />
                        : <ChevronDown size={10} />
                      }
                      {tx.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="num font-medium"
                      style={{ color: tx.type === 'deposit' ? 'var(--positive)' : 'var(--negative)' }}
                    >
                      {tx.type === 'deposit' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-zinc-500">
                    {tx.goalId ? goalMap.get(tx.goalId) ?? '—' : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      id={`btn-delete-tx-${tx.id}`}
                      onClick={() => handleDelete(tx.id)}
                      disabled={deleting === tx.id}
                      className="text-zinc-600 hover:text-red-400 transition-base disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-zinc-600 pl-1">
        {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        {filtered.length !== transactions.length && ` (of ${transactions.length})`}
      </p>
    </div>
  )
}
