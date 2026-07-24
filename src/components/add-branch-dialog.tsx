'use client'

import { useState } from 'react'
import { createBranch } from '@/app/actions'
import { Building, X } from 'lucide-react'
import { LoadingButton } from '@/components/loading-button'

export default function AddBranchDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    try {
      const res = await createBranch(formData)
      if (!res.success) {
        setError(res.error)
        return
      }
      setIsOpen(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to add branch. Please try again.')
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
        <Building className="h-4 w-4" />
        <span>Add Branch</span>
      </LoadingButton>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md animate-fade-in"
          onKeyDown={(e) => { if (e.key === 'Escape') setIsOpen(false) }}
        >
          <div 
            role="dialog"
            aria-labelledby="add-branch-modal-title"
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

            <h3 id="add-branch-modal-title" className="text-lg font-semibold mb-6 text-foreground flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <span>Add New Branch</span>
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="branchName" className="text-sm font-medium text-foreground">Branch Name *</label>
                <input
                  id="branchName"
                  name="name"
                  required
                  autoFocus
                  minLength={3}
                  placeholder="e.g. Main Market Branch"
                  className="rounded-md px-3 py-2 border border-border bg-background text-sm text-foreground placeholder:text-foreground-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
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
                  <span>Save Branch</span>
                </LoadingButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
