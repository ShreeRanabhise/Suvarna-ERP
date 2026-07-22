'use client'

import { useState, useTransition } from 'react'
import { rollbackPayment } from '@/app/actions'
import { RotateCcw } from 'lucide-react'

export function RollbackButton({ paymentId }: { paymentId: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleRollback() {
    if (!confirm('Are you sure you want to reverse this payment? This will create compensating ledger entries and restore the loan balance.')) return

    startTransition(async () => {
      setError(null)
      const res = await rollbackPayment(paymentId)
      if (!res.success) {
        setError(res.error)
      }
    })
  }

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={handleRollback}
        disabled={isPending}
        className="inline-flex items-center gap-1 text-[10px] uppercase font-bold text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50"
      >
        <RotateCcw className="h-3 w-3" />
        {isPending ? 'Reversing...' : 'Reverse'}
      </button>
      {error && <span className="text-[10px] text-destructive">{error}</span>}
    </div>
  )
}
