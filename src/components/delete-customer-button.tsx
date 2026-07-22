'use client'

import { useState } from 'react'
import { deleteCustomer } from '@/app/actions'
import { Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function DeleteCustomerButton({ customerId, customerName }: { customerId: string, customerName: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setLoading(true)
    setError(null)
    const res = await deleteCustomer(customerId)
    if (!res.success) {
      setError(res.error)
      setLoading(false)
    } else {
      setIsOpen(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="p-1.5 text-slate-400 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
        title="Delete Customer"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-card p-6 rounded-modal border border-border shadow-modal max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-foreground mb-2">Delete Customer</h3>
            <p className="text-sm text-foreground-secondary mb-4">
              Are you sure you want to delete <strong>{customerName}</strong>? This action cannot be undone. Active loans must be closed first.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm font-medium">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsOpen(false)}
                disabled={loading}
                className="px-4 h-9 text-sm font-medium border border-border text-foreground-secondary hover:bg-background-secondary rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="px-4 h-9 text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-md transition-colors flex items-center justify-center min-w-[100px]"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
