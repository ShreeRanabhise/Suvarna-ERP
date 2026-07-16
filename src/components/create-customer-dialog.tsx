'use client'

import { useState } from 'react'
import { createCustomer } from '@/app/actions'

export default function CreateCustomerDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    try {
      const res = await createCustomer(formData)
      if (res.success) {
        setIsOpen(false)
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:opacity-90 transition"
      >
        Add Customer
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background p-6 rounded-xl border shadow-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-bold font-heading mb-4">Add New Customer</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">First Name</label>
                <input
                  name="firstName"
                  required
                  className="w-full px-3 py-2 border rounded-md bg-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Last Name</label>
                <input
                  name="lastName"
                  required
                  className="w-full px-3 py-2 border rounded-md bg-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  name="phone"
                  required
                  type="tel"
                  className="w-full px-3 py-2 border rounded-md bg-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Aadhaar Number (12 digits) *</label>
                <input
                  name="aadhaar"
                  required
                  maxLength={12}
                  placeholder="123456789012"
                  className="w-full px-3 py-2 border rounded-md bg-transparent font-mono"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address *</label>
                <textarea
                  name="address"
                  required
                  className="w-full px-3 py-2 border rounded-md bg-transparent"
                />
              </div>

              {error && (
                <p className="text-destructive text-sm bg-destructive/10 p-2 rounded">{error}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border rounded-md hover:bg-muted text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
