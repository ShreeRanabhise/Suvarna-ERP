'use client'

import { useState, useEffect } from 'react'
import { repayLoan } from '@/app/actions'
import { LoadingButton } from '@/components/loading-button'

export function RepaymentForm({ 
  loanId, 
  interestDue,
  currentVersion
}: { 
  loanId: string, 
  interestDue: number,
  currentVersion: number
}) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState('')

  // Generate idempotency key on mount to prevent hydration mismatch
  // and preserve the key across network retries of the same intent.
  useEffect(() => {
    setIdempotencyKey(crypto.randomUUID())
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const form = event.currentTarget
    const formData = new FormData(form)
    // Only append if it exists (might be empty initially)
    if (idempotencyKey) {
      formData.append('idempotencyKey', idempotencyKey)
    }

    try {
      const res = await repayLoan(formData)
      if (!res.success) {
        setError(res.error)
        return
      }
      form.reset()
      // Generate a new key for the NEXT payment intent only after success
      setIdempotencyKey(crypto.randomUUID())
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="loanId" value={loanId} />
      <input type="hidden" name="currentVersion" value={currentVersion} />
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5">Repayment Amount (₹)</label>
          <input 
            name="amountPaid"
            type="number"
            required
            min="1"
            step="0.01"
            placeholder="e.g. 5000"
            className="w-full px-3 py-2 border border-border focus-ring rounded-md bg-background font-mono text-sm font-medium text-foreground outline-none transition-shadow"
          />
        </div>
        <div>
          <label className="block text-[10px] font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5">Payment Mode</label>
          <select 
            name="paymentMode"
            className="w-full px-3 py-2 border border-border focus-ring rounded-md bg-background text-sm font-medium text-foreground outline-none transition-shadow"
          >
            <option value="CASH">Cash Drawer</option>
            <option value="UPI">UPI / QR Code</option>
            <option value="BANK">IMPS / NEFT Transfer</option>
            <option value="CHEQUE">Cheque Clearance</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-foreground-secondary uppercase tracking-wider mb-1.5">Reference ID (optional)</label>
        <input 
          name="referenceId"
          type="text"
          placeholder="e.g. UPI Transaction ID, Cheque Number"
          className="w-full px-3 py-2 border border-border focus-ring rounded-md bg-background font-mono text-xs text-foreground outline-none transition-shadow"
        />
      </div>

      {error && (
        <div className="text-destructive text-xs font-semibold bg-destructive/10 border border-destructive/20 p-2.5 rounded-md uppercase tracking-wide">
          {error}
        </div>
      )}

      <div className="bg-background-secondary border border-border rounded-md p-3 text-[11px] text-foreground-secondary leading-relaxed">
        <strong>Settlement Principle:</strong> Paid capital is allocated to accrued interest due first (₹{Math.round(interestDue).toLocaleString('en-IN')}). Remaining balances directly reduce outstanding principal. Principal reaching ₹0 closes the contract automatically.
      </div>

      <LoadingButton 
        type="submit"
        loading={loading}
        className="w-full bg-primary text-primary-foreground hover:bg-primary-hover h-10 rounded-md font-medium text-sm transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span>Submit Payment Record</span>
      </LoadingButton>
    </form>
  )
}
