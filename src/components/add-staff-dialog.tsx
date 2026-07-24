'use client'

import { useState } from 'react'
import { createStaffMember } from '@/app/actions'
import { UserCheck, X } from 'lucide-react'
import { LoadingButton } from '@/components/loading-button'

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
      setError(err instanceof Error ? err.message : 'Unable to add staff member. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <LoadingButton
        onClick={async () => setIsOpen(true)}
        className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover h-10 px-4 rounded-md font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <UserCheck className="h-4 w-4" />
        <span>Add Staff</span>
      </LoadingButton>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md animate-fade-in"
          onKeyDown={(e) => { if (e.key === 'Escape') setIsOpen(false) }}
        >
          <div 
            role="dialog"
            aria-labelledby="add-staff-modal-title"
            aria-modal="true"
            className="bg-card p-6 rounded-modal border border-border shadow-modal max-w-md w-full mx-4 relative"
          >
            <button 
              onClick={() => setIsOpen(false)}
              aria-label="Close dialog"
              className="absolute top-5 right-5 text-foreground-muted hover:text-foreground transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 id="add-staff-modal-title" className="text-lg font-semibold mb-6 text-foreground flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <span>Add Staff Member</span>
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="staffName" className="text-sm font-medium text-foreground">Full Name *</label>
                <input
                  id="staffName"
                  name="name"
                  required
                  autoFocus
                  minLength={2}
                  maxLength={100}
                  pattern="[a-zA-Z\s'-]+"
                  title="Name must be between 2 and 100 characters containing only letters, spaces, hyphens, and apostrophes"
                  placeholder="e.g. Amit Sharma"
                  onInput={(e) => { e.currentTarget.value = e.currentTarget.value.replace(/[^a-zA-Z\s'-]/g, '') }}
                  className="rounded-md px-3 py-2 border border-border bg-background text-sm text-foreground placeholder:text-foreground-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="staffEmail" className="text-sm font-medium text-foreground">Email Address *</label>
                <input
                  id="staffEmail"
                  name="email"
                  type="email"
                  required
                  placeholder="amit@suvarnaloan.com"
                  className="rounded-md px-3 py-2 border border-border bg-background text-sm text-foreground placeholder:text-foreground-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="staffPassword" className="text-sm font-medium text-foreground">Temporary Password *</label>
                <input
                  id="staffPassword"
                  name="password"
                  type="text"
                  required
                  placeholder="Password"
                  className="rounded-md px-3 py-2 border border-border bg-background text-sm text-foreground placeholder:text-foreground-disabled font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="branchId" className="text-sm font-medium text-foreground">Assign Branch *</label>
                <select
                  id="branchId"
                  name="branchId"
                  required
                  className="rounded-md px-3 py-2.5 border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <option value="">Select branch</option>
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
                <LoadingButton
                  type="button"
                  onClick={async () => setIsOpen(false)}
                  className="px-4 h-10 border border-border hover:bg-background-secondary rounded-md text-sm font-medium text-foreground-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Cancel
                </LoadingButton>
                <LoadingButton
                  type="submit"
                  loading={loading}
                  className="px-4 h-10 bg-primary text-primary-foreground hover:bg-primary-hover rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span>Save Staff</span>
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
