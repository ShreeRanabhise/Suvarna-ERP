'use client'

import { useState } from 'react'
import { createLoan } from '@/app/actions'
import { Landmark, X } from 'lucide-react'

export default function CreateLoanDialog({
  customerId
}: {
  customerId?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState('')

  // Generate a new idempotency key every time the dialog opens
  const openDialog = () => {
    setIdempotencyKey(crypto.randomUUID())
    setIsOpen(true)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    try {
      const res = await createLoan(formData)
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
        onClick={openDialog}
        className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover h-10 px-4 rounded-md font-medium text-sm transition-colors"
      >
        <Landmark className="h-4 w-4" />
        <span>Create Loan</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-card p-6 rounded-modal border border-border shadow-modal max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-foreground-muted hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-semibold mb-6 text-foreground flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              <span>Create Gold Loan Contract</span>
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
              
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Customer Reference ID</label>
                <input
                  name="customerId"
                  required
                  defaultValue={customerId || ''}
                  placeholder="Paste Customer UUID"
                  className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground placeholder:text-foreground-disabled font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Principal Amount (₹)</label>
                  <input
                    name="principalAmount"
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground font-mono font-medium"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Interest Rate (% Monthly)</label>
                  <input
                    name="interestRate"
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="100"
                    required
                    defaultValue="2.0"
                    className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">LTV Percentage (%)</label>
                  <input
                    name="ltvPercentage"
                    type="number"
                    required
                    min="0.1"
                    max="100"
                    defaultValue="75"
                    className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Pledged Gold Item Name</label>
                  <input
                    name="itemName"
                    required
                    placeholder="e.g. Gold Necklace"
                    className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground placeholder:text-foreground-disabled"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Weight (Grams)</label>
                  <input
                    name="weightGrams"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Gold Purity (Karat)</label>
                  <input
                    name="purity"
                    required
                    defaultValue="22K"
                    className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground font-mono font-medium"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Gold Appraisal Valuation (₹)</label>
                <input
                  name="valuation"
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground font-mono font-medium"
                />
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
                  {loading ? 'Creating...' : 'Create Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
