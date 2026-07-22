'use client'

import { useState } from 'react'
import { createBranch } from '@/app/actions'
import { Building, X } from 'lucide-react'

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
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 gold-gradient text-primary-foreground hover:gold-gradient-hover px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
      >
        <Building className="h-4.5 w-4.5" />
        <span>Add Branch</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-secondary/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-card p-8 rounded-3xl border border-border shadow-2xl max-w-md w-full mx-4 relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-muted-foreground hover:text-foreground bg-secondary/5 hover:bg-secondary/10 p-2 rounded-full transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="text-xl font-bold font-heading mb-6 text-foreground flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Building className="h-5 w-5 text-primary" />
              </div>
              <span>Create New Branch</span>
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Branch Identifier Name *</label>
                <input
                  name="name"
                  required
                  minLength={3}
                  placeholder="e.g. South Mumbai Branch"
                  className="rounded-xl px-4 py-3 border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 bg-background text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/50"
                />
              </div>

              {error && (
                <div className="text-destructive text-xs font-bold bg-destructive/10 border border-destructive/20 p-2.5 rounded-xl uppercase tracking-wide">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-6 border-t border-border mt-8">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-5 py-2.5 border border-border hover:bg-secondary/5 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 gold-gradient hover:gold-gradient-hover text-primary-foreground rounded-xl text-sm font-bold shadow-md transition-all hover:shadow-lg disabled:opacity-50 disabled:hover:translate-y-0"
                >
                  {loading ? 'Adding...' : 'Add Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
