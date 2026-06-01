'use client'
import { useState } from 'react'
import { useFlowsStore } from '@/store/flows-store'
import { TransactionTable } from '@/components/transactions/transaction-table'
import { TransactionForm } from '@/components/transactions/transaction-form'
import { Plus } from 'lucide-react'

export default function TransactionsPage() {
  const { goals, transactions } = useFlowsStore()
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-page-heading">Transactions</h1>
          <p className="text-body mt-0.5">{transactions.length} total</p>
        </div>
        <button
          id="btn-new-transaction"
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-zinc-950 transition-base"
          style={{ background: 'var(--accent)' }}
        >
          <Plus size={15} />
          New transaction
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <TransactionForm
          goals={goals}
          onClose={() => setShowForm(false)}
        />
      )}

      {/* Table */}
      <TransactionTable
        transactions={transactions}
        goals={goals}
      />
    </div>
  )
}
