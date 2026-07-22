'use client'

import { useState } from 'react'
import { onboardCustomerWithLoan } from '@/app/actions'
import { UserCheck, X } from 'lucide-react'

export default function OnboardCustomerDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState('')

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
      const res = await onboardCustomerWithLoan(formData)
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
        <UserCheck className="h-4.5 w-4.5" />
        <span>Onboard Customer & Loan</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-card p-6 rounded-modal border border-border shadow-modal max-w-lg w-full mx-4 my-8 max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-foreground-muted hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-semibold mb-6 text-foreground flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <span>Onboard Customer with Gold Loan</span>
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
              
              {/* SECTION 1: Customer Profile */}
              <div>
                <h4 className="text-sm font-semibold text-foreground-secondary border-b border-border pb-2 mb-4">
                  1. Customer Profile Details
                </h4>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
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
                    <label className="text-sm font-medium text-foreground">Mobile Number *</label>
                    <input
                      name="phone"
                      required
                      type="tel"
                      pattern="[0-9]{10}"
                      title="Must be a valid 10-digit phone number"
                      placeholder="e.g. 9876543210"
                      className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground placeholder:text-foreground-disabled font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Aadhaar (12 digits) *</label>
                    <input
                      name="aadhaar"
                      required
                      maxLength={12}
                      pattern="[0-9]{12}"
                      title="Must be a valid 12-digit Aadhaar number"
                      placeholder="123456789012"
                      className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground placeholder:text-foreground-disabled font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Email (Optional)</label>
                    <input
                      name="email"
                      type="email"
                      placeholder="customer@domain.com"
                      className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground placeholder:text-foreground-disabled font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Residential Address *</label>
                  <textarea
                    name="address"
                    required
                    minLength={5}
                    rows={2}
                    className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground placeholder:text-foreground-disabled"
                  />
                </div>
              </div>

              {/* SECTION 2: Gold & Loan Details */}
              <div>
                <h4 className="text-sm font-semibold text-foreground-secondary border-b border-border pb-2 mb-4">
                  2. Collateral Gold & Loan Parameters
                </h4>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Gold Item Name *</label>
                    <input
                      name="goldItemName"
                      required
                      placeholder="e.g. Gold Necklace"
                      className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground placeholder:text-foreground-disabled"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Purity (Karat) *</label>
                    <input
                      name="goldPurity"
                      required
                      defaultValue="22K"
                      placeholder="e.g. 22K, 24K"
                      className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground placeholder:text-foreground-disabled font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Gold Weight (g) *</label>
                    <input
                      name="goldWeight"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground placeholder:text-foreground-disabled font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Gold Valuation (₹) *</label>
                    <input
                      name="valuation"
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground placeholder:text-foreground-disabled font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-primary">Disbursement Principal Amount (₹) *</label>
                  <input
                    name="principalAmount"
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="Max 75% LTV"
                    className="rounded-md px-3 py-2 border border-primary/30 focus:border-primary focus-ring bg-background text-sm text-foreground font-mono font-medium"
                  />
                </div>
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
                  {loading ? 'Onboarding...' : 'Onboard & Disburse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
