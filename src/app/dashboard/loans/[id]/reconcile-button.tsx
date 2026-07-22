'use client'

import { useState, useTransition } from 'react'
import { verifyLoanLedger } from '@/app/actions'
import { Activity } from 'lucide-react'

export function ReconcileButton({ loanId }: { loanId: string }) {
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{isConsistent: boolean, diff: number} | null>(null)

  function handleReconcile() {
    startTransition(async () => {
      const res = await verifyLoanLedger(loanId)
      if (res.success && res.data) {
        setResult(res.data)
      } else {
        alert(res.error || 'Failed to reconcile')
      }
    })
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <button 
        onClick={handleReconcile}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border bg-background hover:bg-background-secondary rounded-md text-xs font-medium text-foreground-secondary transition-colors disabled:opacity-50 shadow-sm"
      >
        <Activity className="h-3.5 w-3.5" />
        {isPending ? 'Verifying...' : 'Reconcile Ledger'}
      </button>
      {result && (
        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${result.isConsistent ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
          {result.isConsistent ? 'Ledger Consistent' : `Mismatch (₹${result.diff})`}
        </span>
      )}
    </div>
  )
}
