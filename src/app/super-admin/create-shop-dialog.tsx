'use client'

import { useState } from 'react'
import { createShop } from './actions'
import { Building, X } from 'lucide-react'

export default function CreateShopDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    try {
      const res = await createShop(formData)
      if (!res.success) {
        setError(res.error)
        return
      }
      setIsOpen(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to create shop account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover h-10 px-4 rounded-md font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <Building className="h-4 w-4" />
        <span>Add Shop</span>
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm animate-fade-in overflow-y-auto"
          onKeyDown={(e) => { if (e.key === 'Escape') setIsOpen(false) }}
        >
          <div 
            role="dialog"
            aria-labelledby="add-shop-modal-title"
            aria-modal="true"
            className="bg-card p-6 rounded-modal border border-border shadow-modal max-w-xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto relative"
          >
            <button 
              onClick={() => setIsOpen(false)}
              aria-label="Close dialog"
              className="absolute top-5 right-5 text-foreground-muted hover:text-foreground transition-colors p-1 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 id="add-shop-modal-title" className="text-lg font-semibold mb-6 text-foreground flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              <span>Add New Shop</span>
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div>
                <h4 className="text-sm font-semibold text-foreground-secondary border-b border-border pb-2 mb-4">
                  Shop Details & Subscription
                </h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="shopName" className="text-sm font-medium text-foreground">Shop Name *</label>
                    <input
                      id="shopName"
                      name="name"
                      required
                      autoFocus
                      placeholder="e.g. Suvarna Gold Loans"
                      className="rounded-md px-3 py-2 border border-border bg-background text-sm text-foreground placeholder:text-foreground-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="branchLocation" className="text-sm font-medium text-foreground">Location</label>
                    <input
                      id="branchLocation"
                      name="branchLocation"
                      placeholder="e.g. MG Road, Pune"
                      className="rounded-md px-3 py-2 border border-border bg-background text-sm text-foreground placeholder:text-foreground-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="subscriptionPlan" className="text-sm font-medium text-foreground">Subscription Plan *</label>
                    <select
                      id="subscriptionPlan"
                      name="subscriptionPlan"
                      className="rounded-md px-3 py-2 border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <option value="STANDARD">Standard (₹3,599/yr)</option>
                      <option value="ENTERPRISE">Enterprise (₹9,999/yr)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="subscriptionEnd" className="text-sm font-medium text-foreground">Subscription End Date *</label>
                    <input
                      id="subscriptionEnd"
                      name="subscriptionEnd"
                      type="date"
                      required
                      defaultValue={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]}
                      className="rounded-md px-3 py-2 border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="whatsappAddon" className="text-sm font-medium text-foreground">WhatsApp Reminders</label>
                    <select
                      id="whatsappAddon"
                      name="whatsappAddon"
                      className="rounded-md px-3 py-2 border border-border bg-background text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes (+₹499/mo)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-foreground-secondary border-b border-border pb-2 mb-4">
                  Owner Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ownerName" className="text-sm font-medium text-foreground">Owner Name *</label>
                    <input
                      id="ownerName"
                      name="ownerName"
                      required
                      placeholder="e.g. Ramesh Patil"
                      className="rounded-md px-3 py-2 border border-border bg-background text-sm text-foreground placeholder:text-foreground-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ownerEmail" className="text-sm font-medium text-foreground">Owner Email *</label>
                    <input
                      id="ownerEmail"
                      name="ownerEmail"
                      type="email"
                      required
                      placeholder="owner@shop.com"
                      className="rounded-md px-3 py-2 border border-border bg-background text-sm text-foreground placeholder:text-foreground-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ownerPassword" className="text-sm font-medium text-foreground">Temp Password *</label>
                    <input
                      id="ownerPassword"
                      name="ownerPassword"
                      type="text"
                      required
                      placeholder="Password"
                      className="rounded-md px-3 py-2 border border-border bg-background text-sm text-foreground placeholder:text-foreground-disabled font-mono focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-destructive text-sm font-medium bg-destructive/10 border border-destructive/20 p-3 rounded-md">
                  {error}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border mt-8">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 h-10 border border-border hover:bg-background-secondary rounded-md text-sm font-medium text-foreground-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 h-10 bg-primary text-primary-foreground hover:bg-primary-hover rounded-md text-sm font-medium transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {loading ? 'Saving...' : 'Save Shop'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
