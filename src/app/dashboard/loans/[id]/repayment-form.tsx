'use client'

import { useState } from 'react'
import { repayLoan } from '@/app/actions'

export function RepaymentForm({ 
  loanId, 
  interestDue 
}: { 
  loanId: string, 
  interestDue: number 
}) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    try {
      const res = await repayLoan(formData)
      if (!res.success) {
        setError(res.error)
        return
      }
      if (event.currentTarget) {
        event.currentTarget.reset()
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="loanId" value={loanId} />
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Repayment Amount (₹)</label>
          <input 
            name="amountPaid"
            type="number"
            required
            min="1"
            step="0.01"
            placeholder="e.g. 5000"
            className="w-full px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl bg-transparent font-mono text-sm font-bold text-slate-800 outline-none"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Payment Mode</label>
          <select 
            name="paymentMode"
            className="w-full px-3 py-2 border border-slate-200 focus:border-primary/50 rounded-xl bg-white text-sm font-medium text-slate-700 outline-none"
          >
            <option value="CASH">Cash Drawer</option>
            <option value="UPI">UPI / QR Code</option>
            <option value="BANK">IMPS / NEFT Transfer</option>
            <option value="CHEQUE">Cheque Clearance</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Reference ID (optional)</label>
        <input 
          name="referenceId"
          type="text"
          placeholder="e.g. UPI Transaction ID, Cheque Number"
          className="w-full px-3 py-2 border border-slate-200 focus:border-primary/50 rounded-xl bg-transparent font-mono text-xs text-slate-800 outline-none"
        />
      </div>

      {error && (
        <div className="text-destructive text-xs font-bold bg-destructive/10 border border-destructive/20 p-2.5 rounded-xl uppercase tracking-wide">
          {error}
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 text-[11px] text-muted-foreground leading-relaxed">
        <strong>Settlement Principle:</strong> Paid capital is allocated to accrued interest due first (₹{Math.round(interestDue).toLocaleString('en-IN')}). Remaining balances directly reduce outstanding principal. Principal reaching ₹0 closes the contract automatically.
      </div>

      <button 
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-white hover:gold-gradient-hover py-2.5 rounded-xl font-bold text-sm transition shadow-sm disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Submit Payment Record'}
      </button>
    </form>
  )
}
