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
      if (!res.success) {
        setError(res.error)
        return
      }
      setIsOpen(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover h-10 px-4 rounded-md font-medium text-sm transition-colors"
      >
        <UserCheck className="h-4 w-4" />
        <span>Add Staff</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-card p-6 rounded-modal border border-border shadow-modal max-w-md w-full mx-4 relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-foreground-muted hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-semibold mb-6 text-foreground flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <span>Register Staff Member</span>
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Full Name *</label>
                <input
                  name="name"
                  required
                  pattern="[a-zA-Z\s]+"
                  title="Only letters and spaces allowed"
                  placeholder="e.g. Amit Sharma"
                  className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground placeholder:text-foreground-disabled"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Email Address *</label>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="amit@suvarnaloan.com"
                  className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground placeholder:text-foreground-disabled"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Temporary Password *</label>
                <input
                  name="password"
                  type="text"
                  required
                  placeholder="e.g. Suvarna@2024"
                  className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground placeholder:text-foreground-disabled font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Assign to Counter Branch *</label>
                <select
                  name="branchId"
                  required
                  className="rounded-md px-3 py-2.5 border border-border bg-background focus-ring text-sm text-foreground"
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
                <div className="text-destructive text-sm font-medium bg-destructive/10 border border-destructive/20 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-8">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 h-10 border border-border hover:bg-background-secondary rounded-md text-sm font-medium text-foreground-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 h-10 bg-primary text-primary-foreground hover:bg-primary-hover rounded-md text-sm font-medium transition-colors disabled:opacity-50"
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
