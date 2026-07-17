'use client'

import { useState } from 'react'
import { createStaffMember } from '@/app/actions'
import { UserCheck, X } from 'lucide-react'

interface Branch {
  id: string
  name: string
}

export default function AddStaffDialog({ branches }: { branches: Branch[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    try {
      const res = await createStaffMember(formData)
      if (res.success) {
        setIsOpen(false)
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-primary text-white hover:gold-gradient-hover px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition"
      >
        <UserCheck className="h-4 w-4" />
        <span>Add Staff</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl max-w-md w-full mx-4 relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold font-heading mb-4 text-slate-800 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <span>Register Staff Member</span>
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name *</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Amit Sharma"
                  className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address *</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="amit@suvarnaloan.com"
                  className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Assign to Counter Branch *</label>
                <select
                  name="branchId"
                  required
                  className="rounded-xl px-3 py-2.5 border border-slate-200 focus:border-primary/50 bg-white text-sm text-slate-700 outline-none transition"
                >
                  <option value="">Select branch counter</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <div className="text-destructive text-xs font-bold bg-destructive/10 border border-destructive/20 p-2.5 rounded-xl uppercase tracking-wide">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-white hover:gold-gradient-hover rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
