'use client'

import { useState } from 'react'
import { createLoan } from '@/app/actions'

export default function CreateLoanDialog({
  customerId
}: {
  customerId?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    try {
      const res = await createLoan(formData)
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
        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:opacity-90 transition"
      >
        Create Loan
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background p-6 rounded-xl border shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold font-heading mb-4">Create New Gold Loan</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Customer ID</label>
                <input
                  name="customerId"
                  required
                  defaultValue={customerId || ''}
                  placeholder="Paste Customer UUID"
                  className="w-full px-3 py-2 border rounded-md bg-transparent font-mono text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Principal Amount (₹)</label>
                  <input
                    name="principalAmount"
                    type="number"
                    required
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Interest Rate (% monthly)</label>
                  <input
                    name="interestRate"
                    type="number"
                    step="0.01"
                    required
                    defaultValue="2.0"
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">LTV Percentage (%)</label>
                  <input
                    name="ltvPercentage"
                    type="number"
                    required
                    defaultValue="75"
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 font-semibold text-primary">Pledged Item Name</label>
                  <input
                    name="itemName"
                    required
                    placeholder="e.g. Gold Chain"
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Weight (Grams)</label>
                  <input
                    name="weightGrams"
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Purity (Karat)</label>
                  <input
                    name="purity"
                    required
                    defaultValue="22K"
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Gold Valuation (₹)</label>
                <input
                  name="valuation"
                  type="number"
                  required
                  className="w-full px-3 py-2 border rounded-md bg-transparent"
                />
              </div>

              {error && (
                <p className="text-destructive text-sm bg-destructive/10 p-2 rounded">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border rounded-md hover:bg-muted text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
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
