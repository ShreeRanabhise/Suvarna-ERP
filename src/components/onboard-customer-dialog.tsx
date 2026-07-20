'use client'

import { useState } from 'react'
import { onboardCustomerWithLoan } from '@/app/actions'
import { UserCheck, X, Sparkles } from 'lucide-react'

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
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={openDialog}
        className="flex items-center gap-2 bg-primary text-white hover:gold-gradient-hover px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm transition"
      >
        <UserCheck className="h-4.5 w-4.5" />
        <span>Onboard Customer & Loan</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full mx-4 my-8 max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold font-heading mb-6 text-slate-800 flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              <span>Onboard Customer with Gold Loan</span>
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
              
              {/* SECTION 1: Customer Profile */}
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                1. Customer Profile Details
              </h4>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name *</label>
                  <input
                    name="name"
                    required
                    pattern="[a-zA-Z\s]+"
                    title="Only letters and spaces allowed"
                    placeholder="e.g. Amit Sharma"
                    className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mobile Number *</label>
                  <input
                    name="phone"
                    required
                    type="tel"
                    pattern="[0-9]{10}"
                    title="Must be a valid 10-digit phone number"
                    placeholder="e.g. 9876543210"
                    className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Aadhaar (12 digits) *</label>
                  <input
                    name="aadhaar"
                    required
                    maxLength={12}
                    pattern="[0-9]{12}"
                    title="Must be a valid 12-digit Aadhaar number"
                    placeholder="123456789012"
                    className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email (Optional)</label>
                  <input
                    name="email"
                    type="email"
                    placeholder="customer@domain.com"
                    className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition font-mono"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Residential Address *</label>
                <textarea
                  name="address"
                  required
                  minLength={5}
                  rows={2}
                  className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition"
                />
              </div>

              {/* SECTION 2: Gold & Loan Details */}
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2 pt-2">
                2. Collateral Gold & Loan Parameters
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gold Item Name *</label>
                  <input
                    name="goldItemName"
                    required
                    placeholder="e.g. Gold Necklace"
                    className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Purity (Karat) *</label>
                  <input
                    name="goldPurity"
                    required
                    defaultValue="22K"
                    placeholder="e.g. 22K, 24K"
                    className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition font-mono font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gold Weight (Grams) *</label>
                  <input
                    name="goldWeight"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gold Valuation (₹) *</label>
                  <input
                    name="valuation"
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-primary uppercase tracking-wider">Disbursement Principal Amount (₹) *</label>
                <input
                  name="principalAmount"
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  placeholder="Max 75% LTV of gold valuation"
                  className="rounded-xl px-3 py-2 border border-primary/30 focus:border-primary/60 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition font-mono font-extrabold"
                />
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
