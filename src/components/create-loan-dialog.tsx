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
        className="flex items-center gap-2 bg-primary text-white hover:gold-gradient-hover px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition"
      >
        <Landmark className="h-4 w-4" />
        <span>Create Loan</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold font-heading mb-4 text-slate-800 flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              <span>Create Gold Loan Contract</span>
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Customer Reference ID</label>
                <input
                  name="customerId"
                  required
                  defaultValue={customerId || ''}
                  placeholder="Paste Customer UUID"
                  className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Principal Amount (₹)</label>
                  <input
                    name="principalAmount"
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition font-mono font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Interest Rate (% Monthly)</label>
                  <input
                    name="interestRate"
                    type="number"
                    step="0.01"
                    min="0.1"
                    max="100"
                    required
                    defaultValue="2.0"
                    className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">LTV Percentage (%)</label>
                  <input
                    name="ltvPercentage"
                    type="number"
                    required
                    min="0.1"
                    max="100"
                    defaultValue="75"
                    className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-primary uppercase tracking-wider">Pledged Gold Item Name</label>
                  <input
                    name="itemName"
                    required
                    placeholder="e.g. Gold Necklace"
                    className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Weight (Grams)</label>
                  <input
                    name="weightGrams"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gold Purity (Karat)</label>
                  <input
                    name="purity"
                    required
                    defaultValue="22K"
                    className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition font-mono font-bold"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gold Appraisal Valuation (₹)</label>
                <input
                  name="valuation"
                  type="number"
                  required
                  min="0.01"
                  step="0.01"
                  className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition font-mono font-bold"
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
