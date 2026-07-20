'use client'

import { useState } from 'react'
import { createCustomer } from '@/app/actions'
import { User, X } from 'lucide-react'

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
        className="flex items-center gap-2 bg-primary text-white hover:gold-gradient-hover px-4 py-2 rounded-xl font-bold text-sm shadow-sm transition"
      >
        <User className="h-4 w-4" />
        <span>Add Customer</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl max-w-md w-full mx-4 relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold font-heading mb-4 text-slate-800 flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <span>Create Customer Profile</span>
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">First Name *</label>
                  <input
                    name="firstName"
                    required
                    pattern="[a-zA-Z\s]+"
                    title="Only letters and spaces allowed"
                    className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Last Name *</label>
                  <input
                    name="lastName"
                    required
                    pattern="[a-zA-Z\s]*"
                    title="Only letters and spaces allowed"
                    className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Contact Phone *</label>
                <input
                  name="phone"
                  required
                  type="tel"
                  pattern="[0-9]{10}"
                  title="Must be a valid 10-digit phone number"
                  className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Aadhaar (12 digits) *</label>
                <input
                  name="aadhaar"
                  required
                  maxLength={12}
                  pattern="[0-9]{12}"
                  title="Must be a valid 12-digit Aadhaar number"
                  placeholder="123456789012"
                  className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Residential Address *</label>
                <textarea
                  name="address"
                  required
                  minLength={5}
                  rows={2}
                  className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition"
                />
              </div>

              {error && (
                <div className="text-destructive text-xs font-bold bg-destructive/10 border border-destructive/20 p-2.5 rounded-xl uppercase tracking-wide">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-primary text-white hover:gold-gradient-hover rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50"
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
