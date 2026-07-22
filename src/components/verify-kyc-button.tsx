'use client'

import { useState } from 'react'
import { updateCustomerKYCStatus } from '@/app/actions'
import { CheckCircle2, ShieldAlert, XCircle, RefreshCw, ShieldCheck } from 'lucide-react'

interface VerifyKYCButtonProps {
  customerId: string
  currentStatus: string
  verifiedAt?: Date | string | null
  verifiedBy?: string | null
}

export default function VerifyKYCButton({
  customerId,
  currentStatus,
  verifiedAt,
  verifiedBy
}: VerifyKYCButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const status = currentStatus?.toUpperCase() || 'UNVERIFIED'

  async function handleStatusChange(newStatus: 'VERIFIED' | 'UNVERIFIED' | 'REJECTED') {
    setError(null)
    setLoading(true)

    try {
      const res = await updateCustomerKYCStatus(customerId, newStatus)
      if (!res.success) {
        setError(res.error)
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase text-foreground-secondary font-medium">KYC Verification Status</span>
        {status === 'VERIFIED' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-success/10 text-success border border-success/20">
            <CheckCircle2 className="h-3.5 w-3.5" /> VERIFIED
          </span>
        ) : status === 'REJECTED' ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-destructive/10 text-destructive border border-destructive/20">
            <XCircle className="h-3.5 w-3.5" /> REJECTED
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-warning/10 text-warning border border-warning/20">
            <ShieldAlert className="h-3.5 w-3.5" /> UNVERIFIED
          </span>
        )}
      </div>

      {verifiedBy && verifiedAt && status === 'VERIFIED' && (
        <p className="text-[10px] text-foreground-muted italic">
          Verified by <span className="font-medium text-foreground">{verifiedBy}</span> on{' '}
          {new Date(verifiedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </p>
      )}

      {error && (
        <p className="text-[11px] text-destructive font-medium">{error}</p>
      )}

      {/* Action Buttons for Owner / Manager */}
      <div className="flex items-center gap-2 pt-1 border-t border-border mt-1">
        {status !== 'VERIFIED' && (
          <button
            onClick={() => handleStatusChange('VERIFIED')}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-1 bg-success text-success-foreground hover:bg-success/90 h-8 px-3 rounded text-xs font-medium transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
            <span>Approve KYC</span>
          </button>
        )}

        {status !== 'REJECTED' && (
          <button
            onClick={() => handleStatusChange('REJECTED')}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1 bg-destructive/10 text-destructive hover:bg-destructive/20 h-8 px-3 rounded text-xs font-medium border border-destructive/20 transition-colors disabled:opacity-50"
          >
            <XCircle className="h-3.5 w-3.5" />
            <span>Reject</span>
          </button>
        )}

        {status !== 'UNVERIFIED' && (
          <button
            onClick={() => handleStatusChange('UNVERIFIED')}
            disabled={loading}
            className="inline-flex items-center justify-center gap-1 bg-background-secondary text-foreground-secondary hover:text-foreground h-8 px-2.5 rounded text-xs font-medium border border-border transition-colors disabled:opacity-50"
            title="Reset verification status"
          >
            <RefreshCw className="h-3 w-3" /> Reset
          </button>
        )}
      </div>
    </div>
  )
}
