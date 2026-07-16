'use client'

import { useState } from 'react'
import { createShop } from './actions'

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
        className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium text-sm hover:opacity-90 transition animate-in fade-in duration-200"
      >
        Onboard New Shop
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background p-6 rounded-xl border shadow-lg max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold font-heading mb-4 text-primary">Onboard New Gold Loan Shop</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Shop Name</label>
                  <input
                    name="name"
                    required
                    placeholder="e.g. Suvarna Gold Loans"
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Subscription Plan</label>
                  <select
                    name="subscriptionPlan"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="STANDARD">Standard (₹3,599/yr)</option>
                    <option value="ENTERPRISE">Enterprise (₹9,999/yr)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Subscription End Date</label>
                  <input
                    name="subscriptionEnd"
                    type="date"
                    required
                    defaultValue={new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">WhatsApp Reminder Pack</label>
                  <select
                    name="whatsappAddon"
                    className="w-full px-3 py-2 border rounded-md bg-background"
                  >
                    <option value="false">No (Default)</option>
                    <option value="true">Yes (+₹499/mo addon)</option>
                  </select>
                </div>
              </div>

              <hr className="my-4 border-dashed" />
              <h4 className="text-sm font-semibold text-muted-foreground mb-2">Owner Profile Settings</h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Owner Name</label>
                  <input
                    name="ownerName"
                    required
                    placeholder="e.g. Ramesh Patil"
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Owner Email (Auth)</label>
                  <input
                    name="ownerEmail"
                    type="email"
                    required
                    placeholder="owner@shopdomain.com"
                    className="w-full px-3 py-2 border rounded-md bg-transparent"
                  />
                </div>
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
                  {loading ? 'Onboarding...' : 'Onboard Shop & Owner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
