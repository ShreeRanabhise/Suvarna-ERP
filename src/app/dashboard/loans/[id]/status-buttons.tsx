'use client'

import { useState } from 'react'
import { updateLoanStatus } from '@/app/actions'
import { LoadingButton } from '@/components/loading-button'

export function StatusButtons({ 
  loanId, 
  status 
}: { 
  loanId: string, 
  status: string 
}) {
  const [error, setError] = useState<string | null>(null)

  async function handleStatusChange(newStatus: 'ACTIVE' | 'CLOSED' | 'OVERDUE' | 'AUCTION' | 'RENEWED') {
    setError(null)
    const res = await updateLoanStatus(loanId, newStatus)
    if (!res.success) {
      setError(res.error)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1 mt-1">
      <div className="flex gap-1.5">
        {status === 'ACTIVE' && (
          <>
            <LoadingButton 
              onClick={async () => await handleStatusChange('OVERDUE')}
              className="text-[10px] border border-border bg-background px-2.5 py-1.5 rounded-md text-destructive hover:bg-destructive/10 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
            >
              <span>Mark Overdue</span>
            </LoadingButton>
            <LoadingButton 
              onClick={async () => await handleStatusChange('AUCTION')}
              className="text-[10px] border border-border bg-background px-2.5 py-1.5 rounded-md text-orange-600 hover:bg-orange-600/10 font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
            >
              <span>Send to Auction</span>
            </LoadingButton>
          </>
        )}

        {status !== 'ACTIVE' && status !== 'CLOSED' && (
          <LoadingButton 
            onClick={async () => await handleStatusChange('ACTIVE')}
            className="text-[10px] border border-border bg-background px-3 py-1.5 rounded-md text-primary hover:bg-primary-light font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span>Revert to Active</span>
          </LoadingButton>
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
