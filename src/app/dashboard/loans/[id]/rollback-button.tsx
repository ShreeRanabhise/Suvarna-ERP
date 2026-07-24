'use client'

import { useState } from 'react'
import { rollbackPayment } from '@/app/actions'
import { RotateCcw } from 'lucide-react'
import { LoadingButton } from '@/components/loading-button'

export function RollbackButton({ paymentId }: { paymentId: string }) {
  const [error, setError] = useState<string | null>(null)

  async function handleRollback() {
    if (!confirm('Are you sure you want to reverse this payment? This will create compensating ledger entries and restore the loan balance.')) return

    setError(null)
    const res = await rollbackPayment(paymentId)
    if (!res.success) {
      setError(res.error)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <LoadingButton 
        onClick={handleRollback}
        className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-destructive hover:text-destructive/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive rounded"
      >
        <RotateCcw className="h-3 w-3" />
        <span>Reverse</span>
      </LoadingButton>
      {error && <span className="text-[10px] text-destructive">{error}</span>}
    </div>
  )
}
