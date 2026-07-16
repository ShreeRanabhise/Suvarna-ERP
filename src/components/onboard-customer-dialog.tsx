'use client'

import { useState } from 'react'
import { onboardCustomerWithLoan } from '@/app/actions'

export default function OnboardCustomerDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    try {
      const res = await onboardCustomerWithLoan(formData)
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
        Onboard Customer & Loan
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto">
          <div className="bg-background p-6 rounded-xl border shadow-lg max-w-lg w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold font-heading mb-4 text-primary">Onboard Customer with Gold Loan</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* SECTION 1: Customer Profile */}
              <h4 className="text-sm font-semibold text-muted-foreground border-b pb-1">1. Customer Details</h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Full Name *</label>
                  <input
                    name="name"
                    required
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Mobile Number *</label>
                  <input
                    name="phone"
                    required
                    type="tel"
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Aadhaar (12 digits) *</label>
                  <input
                    name="aadhaar"
                    required
                    maxLength={12}
                    placeholder="123456789012"
                    className="w-full px-3 py-2 border rounded-md bg-transparent font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email (Optional)</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="customer@domain.com"
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address *</label>
                <textarea
                  name="address"
                  required
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md bg-transparent"
                />
              </div>

              {/* SECTION 2: Gold & Loan Details */}
              <h4 className="text-sm font-semibold text-muted-foreground border-b pb-1 pt-2">2. Pledged Gold & Loan Details</h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Gold Item Name *</label>
                  <input
                    name="goldItemName"
                    required
                    placeholder="e.g. Gold Necklace"
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Purity (Karat) *</label>
                  <input
                    name="goldPurity"
                    required
                    defaultValue="22K"
                    placeholder="e.g. 22K, 24K"
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Gold Weight (Grams) *</label>
                  <input
                    name="goldWeight"
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Gold Valuation (₹) *</label>
                  <input
                    name="valuation"
                    type="number"
                    required
                    className="w-full px-3 py-2 border rounded-md bg-transparent font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 font-semibold text-primary">Requested Loan Amount (₹) *</label>
                <input
                  name="principalAmount"
                  type="number"
                  required
                  placeholder="Max 75% of gold valuation"
                  className="w-full px-3 py-2 border rounded-md bg-transparent font-bold font-mono"
                />
              </div>

              {error && (
                <p className="text-destructive text-sm bg-destructive/10 p-2 rounded">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t mt-4">
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
                  {loading ? 'Onboarding...' : 'Onboard & Issue Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
