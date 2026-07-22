'use client'

import { useState } from 'react'
import { updateLoanStatus } from '@/app/actions'

export function StatusButtons({ 
  loanId, 
  status 
}: { 
  loanId: string, 
  status: string 
}) {
  const [error, setError] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  async function handleStatusChange(newStatus: 'ACTIVE' | 'CLOSED' | 'OVERDUE' | 'AUCTION' | 'RENEWED') {
    setError(null)
    setLoadingAction(newStatus)
    try {
      const res = await updateLoanStatus(loanId, newStatus)
      if (!res.success) {
        setError(res.error)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed')
    } finally {
      setLoadingAction(null)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1 mt-1">
      <div className="flex gap-1.5">
        {status === 'ACTIVE' && (
          <>
            <button 
              onClick={() => handleStatusChange('OVERDUE')}
              disabled={!!loadingAction}
              className="text-[10px] border border-border bg-background px-2.5 py-1.5 rounded-md text-destructive hover:bg-destructive/10 font-semibold transition-colors disabled:opacity-50"
            >
              {loadingAction === 'OVERDUE' ? '...' : 'Mark Overdue'}
            </button>
            <button 
              onClick={() => handleStatusChange('AUCTION')}
              disabled={!!loadingAction}
              className="text-[10px] border border-border bg-background px-2.5 py-1.5 rounded-md text-orange-600 hover:bg-orange-600/10 font-semibold transition-colors disabled:opacity-50"
            >
              {loadingAction === 'AUCTION' ? '...' : 'Send to Auction'}
            </button>
          </>
        )}

        {status !== 'ACTIVE' && status !== 'CLOSED' && (
          <button 
            onClick={() => handleStatusChange('ACTIVE')}
            disabled={!!loadingAction}
            className="text-[10px] border border-border bg-background px-3 py-1.5 rounded-md text-primary hover:bg-primary-light font-semibold transition-colors disabled:opacity-50"
          >
            {loadingAction === 'ACTIVE' ? '...' : 'Revert to Active'}
          </button>
        )}
      </div>
      
      {error && (
        <div className="text-destructive text-[10px] font-bold bg-destructive/10 px-2 py-1 rounded mt-1 max-w-[200px] text-right">
          {error}
        </div>
      )}
    </div>
  )
}
