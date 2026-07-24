'use client'

import { useState } from 'react'
import { verifyLoanLedger } from '@/app/actions'
import { LoadingButton } from '@/components/loading-button'
import { Activity, CheckCircle2 } from 'lucide-react'

export function ReconcileButton({ loanId }: { loanId: string }) {
  const [result, setResult] = useState<{isConsistent: boolean, diff: number} | null>(null)

  async function handleReconcile() {
    const res = await verifyLoanLedger(loanId)
    if (res.success && res.data) {
      setResult(res.data)
    } else if (!res.success) {
      alert(res.error || 'Failed to verify ledger')
    } else {
      alert('Failed to verify ledger')
    }
  }

  return (
    <div className="flex items-center gap-2 mt-2">
      <LoadingButton 
        onClick={handleReconcile}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border bg-background hover:bg-background-secondary rounded-md text-xs font-medium text-foreground-secondary transition-colors disabled:opacity-50 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Activity className="h-3.5 w-3.5" />
        <span>Reconcile Ledger</span>
      </LoadingButton>
      {result && (
        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${result.isConsistent ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'}`}>
          {result.isConsistent ? 'Ledger Consistent' : `Mismatch (₹${result.diff})`}
        </span>
      )}
    </div>
  )
}
