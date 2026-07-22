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
      // Handle file uploads first
      const aadhaarFile = formData.get('aadhaarPhoto') as File | null
      const customerFile = formData.get('customerPhoto') as File | null
      
      formData.delete('aadhaarPhoto')
      formData.delete('customerPhoto')

      async function uploadFile(file: File) {
        const ext = file.name.split('.').pop() || 'jpg'
        const res = await fetch('/api/kyc/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ extension: ext })
        })
        if (!res.ok) throw new Error('Failed to get upload URL')
        const { uploadUrl, filePath } = await res.json()
        
        const uploadRes = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          headers: { 'Content-Type': file.type }
        })
        if (!uploadRes.ok) throw new Error('Failed to upload file to storage')
        return filePath
      }

      if (aadhaarFile && aadhaarFile.size > 0) {
        const path = await uploadFile(aadhaarFile)
        formData.set('aadhaarPhotoUrl', path)
      }
      
      if (customerFile && customerFile.size > 0) {
        const path = await uploadFile(customerFile)
        formData.set('customerPhotoUrl', path)
      }

      const res = await createCustomer(formData)
      if (!res.success) {
        setError(res.error)
        return
      }
      setIsOpen(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover h-10 px-4 rounded-md font-medium text-sm transition-colors"
      >
        <User className="h-4 w-4" />
        <span>Add Customer</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/20 backdrop-blur-sm animate-fade-in">
          <div className="bg-card p-6 rounded-modal border border-border shadow-modal max-w-lg w-full mx-4 relative">
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-5 right-5 text-foreground-muted hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-semibold mb-6 text-foreground flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <span>Create Customer Profile</span>
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">First Name *</label>
                  <input
                    name="firstName"
                    required
                    pattern="[a-zA-Z\s]+"
                    title="Only letters and spaces allowed"
                    className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Last Name *</label>
                  <input
                    name="lastName"
                    required
                    pattern="[a-zA-Z\s]*"
                    title="Only letters and spaces allowed"
                    className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Contact Phone *</label>
                <input
                  name="phone"
                  required
                  type="tel"
                  pattern="[0-9]{10}"
                  title="Must be a valid 10-digit phone number"
                  className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Aadhaar (12 digits) *</label>
                <input
                  name="aadhaar"
                  required
                  maxLength={12}
                  pattern="[0-9]{12}"
                  title="Must be a valid 12-digit Aadhaar number"
                  placeholder="123456789012"
                  className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground placeholder:text-foreground-disabled font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Residential Address *</label>
                <textarea
                  name="address"
                  required
                  minLength={5}
                  rows={2}
                  className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Aadhaar Photo</label>
                  <input
                    type="file"
                    name="aadhaarPhoto"
                    accept="image/*,.pdf"
                    className="text-sm text-foreground-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-background-secondary file:text-foreground hover:file:bg-border transition-colors cursor-pointer border border-border rounded-md px-2 py-1.5 bg-background"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Customer Photo</label>
                  <input
                    type="file"
                    name="customerPhoto"
                    accept="image/*"
                    className="text-sm text-foreground-secondary file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-background-secondary file:text-foreground hover:file:bg-border transition-colors cursor-pointer border border-border rounded-md px-2 py-1.5 bg-background"
                  />
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
                  className="px-4 h-10 border border-border hover:bg-background-secondary rounded-md text-sm font-medium text-foreground-secondary transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 h-10 bg-primary text-primary-foreground hover:bg-primary-hover rounded-md text-sm font-medium transition-colors disabled:opacity-50"
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
