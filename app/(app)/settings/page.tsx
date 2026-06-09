'use client'
import { useState, useEffect } from 'react'
import { useFlowsStore } from '@/store/flows-store'
import { signOut } from 'next-auth/react'
import {
  Loader2,
  LogOut,
  Pencil,
  Check,
  X,
  Trash2,
  Plus
} from 'lucide-react'
import { SavingsGoal } from '@/lib/types'

export default function SettingsPage() {
  const { goals, getAuthHeader, members, profile } = useFlowsStore()
  const [signingOut, setSigningOut] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    name: '',
    target: '',
    monthlyBudget: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
  })
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Profile Form States
  const [myNickname, setMyNickname] = useState('')
  const [myActive, setMyActive] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)

  // Sub-member States
  const [newMemberNickname, setNewMemberNickname] = useState('')

  useEffect(() => {
    if (profile) {
      setMyNickname(profile.nickname ?? '')
      setMyActive(profile.active !== false)
    }
  }, [profile])

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut({ callbackUrl: '/login' })
    } catch (e) {
      console.error(e)
      setSigningOut(false)
    }
  }

  function startEdit(goal: SavingsGoal) {
    setEditingId(goal.id)
    setEditForm({
      name: goal.name,
      target: String(goal.target),
      monthlyBudget: String(goal.monthlyBudget || ''),
      priority: goal.priority,
    })
    setSaveError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setSaveError(null)
  }

  async function saveEdit(goalId: string) {
    if (!editForm.name.trim() || !editForm.target) return
    const targetVal = parseFloat(editForm.target)
    if (isNaN(targetVal) || targetVal <= 0) {
      setSaveError('Target must be a positive number')
      return
    }

    setSaveLoading(true)
    setSaveError(null)
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name.trim(),
          target: targetVal,
          monthlyBudget: editForm.monthlyBudget ? parseFloat(editForm.monthlyBudget) : 0,
          priority: editForm.priority,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to update goal')
      }

      setEditingId(null)
    } catch (e: any) {
      setSaveError(e.message ?? 'An error occurred')
    } finally {
      setSaveLoading(false)
    }
  }

  // Profile Save
  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const headers = await getAuthHeader()
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: myNickname.trim(),
          active: myActive,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to update profile')
      }
    } catch (err) {
      console.error('Error saving profile:', err)
    } finally {
      setSavingProfile(false)
    }
  }

  // Add sub-member
  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault()
    if (!newMemberNickname.trim()) return
    try {
      const headers = await getAuthHeader()
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: newMemberNickname.trim(),
          active: true,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to add member')
      }
      setNewMemberNickname('')
    } catch (err) {
      console.error('Error adding member:', err)
    }
  }

  // Toggle member active status
  async function toggleMemberActive(memberId: string, currentActive: boolean) {
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`/api/members/${memberId}`, {
        method: 'PATCH',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          active: !currentActive,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to update member')
      }
    } catch (err) {
      console.error('Error toggling member status:', err)
    }
  }

  // Delete member
  async function handleDeleteMember(memberId: string) {
    if (!confirm('Are you sure you want to delete this member?')) return
    try {
      const headers = await getAuthHeader()
      const res = await fetch(`/api/members/${memberId}`, {
        method: 'DELETE',
        headers,
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error ?? 'Failed to delete member')
      }
    } catch (err) {
      console.error('Error deleting member:', err)
    }
  }

  const inputStyle = {
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    color: 'var(--body)',
    borderRadius: 'var(--radius)',
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-page-heading">Settings</h1>
        <p className="text-body mt-0.5">Manage your preferences, goals, and account settings</p>
      </div>

      {/* User Management Section */}
      <section className="space-y-4">
        <h2 className="text-section-label">User Management</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Profile form */}
          <div className="card space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-zinc-200">Your Profile</h3>
              <p className="text-xs text-zinc-500">Configure your personal nickname and status</p>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="text-section-label block mb-1">Nickname</label>
                <input
                  type="text"
                  placeholder="My nickname"
                  value={myNickname}
                  onChange={e => setMyNickname(e.target.value)}
                  className="w-full px-3 py-2 text-sm outline-none focus:ring-1 transition-base"
                  style={inputStyle}
                  required
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="profile-active-chk"
                  checked={myActive}
                  onChange={e => setMyActive(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-zinc-900 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="profile-active-chk" className="text-sm text-zinc-300 select-none cursor-pointer">
                  Mark Profile as Active
                </label>
              </div>
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-semibold text-zinc-950 transition-base disabled:opacity-50"
                style={{ background: 'var(--accent)' }}
              >
                {savingProfile && <Loader2 size={12} className="animate-spin" />}
                Save Profile
              </button>
            </form>
          </div>

          {/* Sub-members section */}
          <div className="card space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-200">Family Members / Sub-Users</h3>
                <p className="text-xs text-zinc-500">Manage profiles you want to track transactions for</p>
              </div>

              {/* Members List */}
              <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                {members.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-4">No other members configured.</p>
                ) : (
                  members.map(m => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-2 rounded-md border text-xs"
                      style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-zinc-200 truncate">{m.nickname}</span>
                        <span
                          onClick={() => toggleMemberActive(m.id, m.active)}
                          className="text-[10px] mt-0.5 cursor-pointer hover:underline font-semibold"
                          style={{ color: m.active ? 'var(--positive)' : 'var(--muted)' }}
                        >
                          {m.active ? 'Active' : 'Inactive'} (Click to toggle)
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteMember(m.id)}
                        className="text-zinc-500 hover:text-red-400 p-1 rounded transition-base"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            <form onSubmit={handleAddMember} className="flex gap-2 pt-2 border-t border-zinc-800">
              <input
                type="text"
                placeholder="Spouse / Child"
                value={newMemberNickname}
                onChange={e => setNewMemberNickname(e.target.value)}
                className="flex-1 px-2.5 py-1.5 text-xs outline-none focus:ring-1 transition-base"
                style={inputStyle}
                required
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-md text-xs font-semibold text-zinc-950 flex items-center gap-1 transition-base"
                style={{ background: 'var(--accent)' }}
              >
                <Plus size={12} /> Add
              </button>
            </form>
          </div>
        </div>
      </section>


      {/* Goal configuration */}
      <section className="space-y-4">
        <h2 className="text-section-label">Goal settings</h2>
        <div className="card p-0 overflow-hidden divide-y divide-zinc-800" style={{ borderColor: 'var(--border)' }}>
          {goals.length === 0 ? (
            <div className="p-6 text-center text-sm text-zinc-500">
              No goals configured. Add some goals in the dashboard first.
            </div>
          ) : (
            goals.map(goal => {
              const isEditing = editingId === goal.id

              return (
                <div key={goal.id} className="p-4 space-y-3" style={{ background: isEditing ? 'rgba(24,24,27,0.4)' : 'transparent' }}>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <div className="col-span-2 md:col-span-1">
                          <label className="text-section-label block mb-1">Name</label>
                          <input
                            type="text"
                            maxLength={50}
                            value={editForm.name}
                            onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                            className="w-full px-2.5 py-1.5 text-sm outline-none focus:ring-1 transition-base"
                            style={inputStyle}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-section-label block mb-1">Target ($)</label>
                          <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={editForm.target}
                            onChange={e => setEditForm(f => ({ ...f, target: e.target.value }))}
                            className="w-full px-2.5 py-1.5 text-sm outline-none focus:ring-1 transition-base"
                            style={inputStyle}
                            required
                          />
                        </div>
                        <div>
                          <label className="text-section-label block mb-1">Monthly budget ($)</label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editForm.monthlyBudget}
                            onChange={e => setEditForm(f => ({ ...f, monthlyBudget: e.target.value }))}
                            className="w-full px-2.5 py-1.5 text-sm outline-none focus:ring-1 transition-base"
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label className="text-section-label block mb-1">Priority</label>
                          <select
                            value={editForm.priority}
                            onChange={e => setEditForm(f => ({ ...f, priority: e.target.value as any }))}
                            className="w-full px-2.5 py-1.5 text-sm outline-none focus:ring-1 transition-base cursor-pointer"
                            style={inputStyle}
                          >
                            <option value="high">High</option>
                            <option value="medium">Medium</option>
                            <option value="low">Low</option>
                          </select>
                        </div>
                      </div>

                      {saveError && (
                        <p className="text-xs text-red-400">{saveError}</p>
                      )}

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={cancelEdit}
                          disabled={saveLoading}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition-base"
                        >
                          <X size={12} />
                          Cancel
                        </button>
                        <button
                          onClick={() => saveEdit(goal.id)}
                          disabled={saveLoading}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-950 transition-base"
                          style={{ background: 'var(--accent)' }}
                        >
                          {saveLoading ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <Check size={12} />
                          )}
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ background: goal.color }}
                        />
                        <div>
                          <p className="text-sm font-medium text-zinc-200">{goal.name}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            Target: <span className="num">${goal.target.toFixed(2)}</span>
                            {goal.monthlyBudget > 0 && (
                              <>
                                {' '}· Budget: <span className="num">${goal.monthlyBudget.toFixed(2)}</span>
                              </>
                            )}
                            {' '}· Priority:{' '}
                            <span className="capitalize">{goal.priority}</span>
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => startEdit(goal)}
                        className="p-1.5 rounded-md border border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-base"
                        title="Edit goal"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* App details & Signout */}
      <section className="space-y-4">
        <h2 className="text-section-label">Account & App details</h2>
        <div className="card space-y-6">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              F
            </div>
            <div>
              <p className="text-sm font-semibold text-zinc-200">Flows</p>
              <p className="text-xs text-zinc-500">
                Track your savings goals, allocate funds automatically, and stay on track.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs text-zinc-400">Application Version</p>
              <p className="num text-xs text-zinc-500">v1.0.0 (Production Build)</p>
            </div>

            <button
              id="btn-signout"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-red-900 bg-red-950/20 text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-base disabled:opacity-50"
            >
              {signingOut ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <LogOut size={15} />
              )}
              Sign out
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
