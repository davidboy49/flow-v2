'use client'
import { useState } from 'react'
import { useFlowsStore } from '@/store/flows-store'
import { Trash2, Plus, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const CATEGORY_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#71717a']

export default function CategoriesPage() {
  const { categories, getAuthHeader } = useFlowsStore()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryColor, setNewCategoryColor] = useState('#10b981')

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    try {
      const headers = await getAuthHeader()
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          color: newCategoryColor,
          active: true,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to add category')
      }
      setNewCategoryName('')
    } catch (err) {
      console.error('Error adding category:', err)
    }
  }

  async function toggleCategoryActive(catId: string, currentActive: boolean) {
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`/api/categories/${catId}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active: !currentActive,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to update category')
      }
    } catch (err) {
      console.error('Error toggling category status:', err)
    }
  }

  async function handleDeleteCategory(catId: string) {
    if (!confirm('Are you sure you want to delete this category?')) return
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`/api/categories/${catId}`, {
        method: 'DELETE',
        headers,
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to delete category')
      }
    } catch (err) {
      console.error('Error deleting category:', err)
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
        <h1 className="text-page-heading">Category Manager</h1>
        <p className="text-body mt-0.5">Create and maintain custom categories to classify your transactions</p>
      </div>

      <div className="card grid md:grid-cols-2 gap-6">
        {/* List panel */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-zinc-200">Custom Categories</h3>
          <p className="text-xs text-zinc-500">Enable or disable categories, or delete them</p>

          <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1">
            {categories.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-10">No custom categories. Use the form to add some!</p>
            ) : (
              categories.map(cat => {
                const isActive = cat.active !== false
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-2.5 rounded border text-xs"
                    style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                        <span className="font-semibold text-zinc-200 truncate">{cat.name}</span>
                      </div>
                      <span
                        onClick={() => toggleCategoryActive(cat.id, isActive)}
                        className="text-[10px] mt-1.5 cursor-pointer hover:underline font-semibold select-none"
                        style={{ color: isActive ? 'var(--positive)' : 'var(--muted)' }}
                      >
                        {isActive ? 'Active' : 'Inactive'} (Click to toggle)
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
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
        <form onSubmit={handleAddCategory} className="space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <label className="text-section-label block mb-1">Category Name</label>
              <input
                type="text"
                placeholder="Entertainment, Transport..."
                value={newCategoryName}
                onChange={e => setNewCategoryName(e.target.value)}
                className="w-full px-3 py-2 text-sm outline-none focus:ring-1 transition-base"
                style={inputStyle}
                required
              />
            </div>

            <div>
              <label className="text-section-label block mb-1.5">Category Color</label>
              <div className="flex gap-2 flex-wrap">
                {CATEGORY_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewCategoryColor(c)}
                    className="w-6 h-6 rounded-full transition-base"
                    style={{
                      background: c,
                      outline: newCategoryColor === c ? `2px solid ${c}` : 'none',
                      outlineOffset: '2px',
                      opacity: newCategoryColor === c ? 1 : 0.6,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-md text-xs font-semibold text-zinc-950 transition-base"
            style={{ background: 'var(--accent)' }}
          >
            <Plus size={12} /> Create Category
          </button>
        </form>
      </div>
    </div>
  )
}
