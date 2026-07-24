'use client'

import { useState } from 'react'
import { deleteCustomer } from '@/app/actions'
import { Trash2, Loader2 } from 'lucide-react'
import { LoadingButton } from '@/components/loading-button'
import { useRouter } from 'next/navigation'

export default function DeleteCustomerButton({ customerId, customerName }: { customerId: string, customerName: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setError(null)
    const res = await deleteCustomer(customerId)
    if (!res.success) {
      setError(res.error)
    } else {
      setIsOpen(false)
    }
  }

  return (
    <>
      <LoadingButton 
        onClick={async () => setIsOpen(true)}
        className="p-1.5 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        title="Delete Customer"
        aria-label={`Delete customer ${customerName}`}
      >
        <Trash2 className="h-4 w-4" />
      </LoadingButton>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md animate-fade-in"
          onKeyDown={(e) => { if (e.key === 'Escape') setIsOpen(false) }}
        >
          <div 
            role="dialog"
            aria-labelledby="delete-customer-title"
            aria-modal="true"
            className="bg-card p-6 rounded-modal border border-border shadow-modal max-w-sm w-full mx-4"
          >
            <h3 id="delete-customer-title" className="text-lg font-semibold text-foreground mb-2">Delete Customer</h3>
            <p className="text-sm text-foreground-secondary mb-4">
              Are you sure you want to delete <strong>{customerName}</strong>? Customers with active loans cannot be removed.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <LoadingButton
                onClick={async () => setIsOpen(false)}
                className="px-4 h-9 text-sm font-medium border border-border text-foreground-secondary hover:bg-background-secondary rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Cancel
              </LoadingButton>
              <LoadingButton
                onClick={handleDelete}
                className="px-4 h-9 text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-md transition-colors flex items-center justify-center min-w-[100px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Delete Customer
              </LoadingButton>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
