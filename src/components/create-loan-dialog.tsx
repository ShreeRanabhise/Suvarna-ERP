'use client'

import { useState, useRef } from 'react'
import { createLoan, lookupCustomer } from '@/app/actions'
import { Landmark, X, UploadCloud, RefreshCw, Trash2, Eye, User, Search, CheckCircle2, ShieldAlert } from 'lucide-react'
import { formatNumericCustomerId } from '@/lib/loan-utils'

interface UploadedFileState {
  file: File | null
  previewUrl: string | null
  filePath: string | null
  uploading: boolean
  error: string | null
}

function GoldPhotoUploadCard({
  label = "Gold Photo (Optional)",
  fileState,
  onChange,
  onRemove,
}: {
  label?: string
  fileState: UploadedFileState
  onChange: (file: File) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  function handleFileSelected(selectedFile: File | null) {
    if (!selectedFile) return
    if (selectedFile.size > 5 * 1024 * 1024) {
      alert('File size exceeds maximum allowed size of 5MB.')
      return
    }
    onChange(selectedFile)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0])
    }
  }

  const displayUrl = fileState.previewUrl || (fileState.filePath ? (fileState.filePath.startsWith('/') || fileState.filePath.startsWith('http') ? fileState.filePath : `/api/kyc/view?path=${encodeURIComponent(fileState.filePath)}`) : null)

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground flex items-center justify-between">
        <span>{label}</span>
      </label>

      <input 
        ref={inputRef} 
        type="file" 
        accept="image/jpeg,image/jpg,image/png,image/webp" 
        className="hidden" 
        onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
      />

      {displayUrl ? (
        <div className="relative rounded-lg border border-border bg-card p-3 flex items-center gap-3 shadow-subtle">
          <img 
            src={displayUrl} 
            alt="Gold Item Photo" 
            onClick={() => setIsPreviewOpen(true)}
            className="h-14 w-20 object-cover rounded-md border border-border bg-background cursor-pointer hover:opacity-80 transition-opacity"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              {fileState.file?.name || 'Gold Photo Uploaded'}
            </p>
            <p className="text-[10px] text-foreground-muted mt-0.5">
              {fileState.file ? `${(fileState.file.size / 1024).toFixed(0)} KB` : 'Uploaded'}
            </p>
            {fileState.uploading && (
              <span className="text-[10px] text-primary font-medium flex items-center gap-1 mt-1">
                <RefreshCw className="h-3 w-3 animate-spin" /> Uploading...
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              aria-label="Preview gold photo"
              className="p-1.5 text-primary hover:bg-primary-light/50 rounded-md transition-colors"
              title="Preview photo"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              aria-label="Replace photo"
              className="p-1.5 text-foreground-secondary hover:text-foreground hover:bg-background-secondary rounded-md transition-colors"
              title="Replace file"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onRemove}
              aria-label="Delete photo"
              className="p-1.5 text-destructive hover:bg-destructive/10 rounded-md transition-colors"
              title="Remove file"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging 
              ? 'border-primary bg-primary-light/20' 
              : 'border-border hover:border-primary/50 bg-background-secondary/40'
          }`}
        >
          <div className="p-2 bg-background rounded-full border border-border shadow-subtle mb-1 text-primary">
            <UploadCloud className="h-5 w-5" />
          </div>
          <p className="text-xs font-semibold text-foreground">
            Click to upload gold photo or drag & drop
          </p>
          <p className="text-[10px] text-foreground-muted mt-0.5">
            JPG, PNG, WEBP (Max 5MB)
          </p>
        </div>
      )}

      {/* Lightbox Preview Modal */}
      {isPreviewOpen && displayUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/80 backdrop-blur-md animate-fade-in p-4"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div className="relative bg-card rounded-modal border border-border shadow-modal max-w-3xl w-full p-4 flex flex-col my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-3 border-b border-border mb-4">
              <h4 className="text-sm font-semibold text-foreground">{label} Preview</h4>
              <button onClick={() => setIsPreviewOpen(false)} className="text-foreground-muted hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex items-center justify-center bg-background p-2 rounded-md border border-border min-h-[300px]">
              <img src={displayUrl} alt="Gold Item Photo" className="max-h-[65vh] w-auto max-w-full object-contain rounded-md" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function CreateLoanDialog({
  customerId
}: {
  customerId?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [idempotencyKey, setIdempotencyKey] = useState('')
  const [inputCustomerId, setInputCustomerId] = useState(customerId ? formatNumericCustomerId(customerId) : '')
  const [fetchedCustomer, setFetchedCustomer] = useState<{
    customerId: string
    fullName: string
    phone: string
    kycStatus: string
    numericId: string
  } | null>(null)
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [goldPhoto, setGoldPhoto] = useState<UploadedFileState>({
    file: null, previewUrl: null, filePath: null, uploading: false, error: null
  })

  async function handleFetchCustomer(queryToFetch?: string) {
    const query = (queryToFetch || inputCustomerId).trim()
    if (!query) {
      setFetchError('Enter a Customer ID or Mobile number')
      return
    }
    setFetching(true)
    setFetchError(null)
    setFetchedCustomer(null)

    try {
      const res = await lookupCustomer(query)
      if (!res.success || !res.data) {
        setFetchError(res.error || 'No customer found')
      } else {
        setFetchedCustomer(res.data)
        setInputCustomerId(res.data.numericId)
      }
    } catch {
      setFetchError('Failed to lookup customer')
    } finally {
      setFetching(false)
    }
  }

  // Generate a new idempotency key every time the dialog opens
  const openDialog = () => {
    setIdempotencyKey(crypto.randomUUID())
    setIsOpen(true)
    setError(null)
    setFetchError(null)
    setGoldPhoto({ file: null, previewUrl: null, filePath: null, uploading: false, error: null })

    if (customerId) {
      const formattedId = formatNumericCustomerId(customerId)
      setInputCustomerId(formattedId)
      handleFetchCustomer(formattedId)
    } else {
      setInputCustomerId('')
      setFetchedCustomer(null)
    }
  }

  async function uploadFileDirect(file: File): Promise<string> {
    const uploadData = new FormData()
    uploadData.append('file', file)
    if (customerId) uploadData.append('customerId', customerId)

    const res = await fetch('/api/kyc/upload', {
      method: 'POST',
      body: uploadData
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.error || 'Failed to upload item photo')
    }

    const { filePath } = await res.json()
    return filePath
  }

  function handleFileChange(file: File) {
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64Url = e.target?.result as string || ''
      setGoldPhoto({ file, previewUrl: base64Url, filePath: null, uploading: true, error: null })

      try {
        const filePath = await uploadFileDirect(file)
        setGoldPhoto({ file, previewUrl: base64Url, filePath, uploading: false, error: null })
      } catch {
        setGoldPhoto({ file, previewUrl: base64Url, filePath: null, uploading: false, error: null })
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(event.currentTarget)
    try {
      let itemPath = goldPhoto.filePath
      if (goldPhoto.file && !itemPath) {
        itemPath = await uploadFileDirect(goldPhoto.file)
      }

      if (itemPath) {
        formData.set('itemImageUrl', itemPath)
      }

      const res = await createLoan(formData)
      if (!res.success) {
        setError(res.error)
        return
      }
      setIsOpen(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to create loan. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={openDialog}
        className="flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary-hover h-10 px-4 rounded-md font-medium text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm w-full sm:w-auto"
      >
        <Landmark className="h-4 w-4" />
        <span>Create Loan</span>
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md animate-fade-in p-4 overflow-y-auto"
          onKeyDown={(e) => { if (e.key === 'Escape') setIsOpen(false) }}
        >
          <div 
            role="dialog"
            aria-labelledby="create-loan-modal-title"
            aria-modal="true"
            className="bg-card p-6 md:p-8 rounded-modal border border-border shadow-modal max-w-3xl w-full relative my-auto"
          >
            <button 
              onClick={() => setIsOpen(false)}
              aria-label="Close dialog"
              className="absolute top-5 right-5 text-foreground-muted hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 id="create-loan-modal-title" className="text-lg font-semibold mb-6 text-foreground flex items-center gap-2 border-b border-border pb-3">
              <Landmark className="h-5 w-5 text-primary" />
              <span>Create Gold Loan</span>
            </h3>
            
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-x-6 gap-y-4">
              <input type="hidden" name="idempotencyKey" value={idempotencyKey} />

              {/* Left Column: Customer & Financial Terms */}
              <div className="flex flex-col gap-4">
                {/* Customer ID/Mobile No. Assignment */}
                <div className="flex flex-col gap-2 bg-background-secondary/40 p-3.5 rounded-lg border border-border">
                  <label htmlFor="customerId" className="text-sm font-semibold text-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <User className="h-4 w-4 text-primary" />
                      <span>Customer ID/Mobile No. *</span>
                    </span>
                    {customerId && (
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded font-mono font-semibold">
                        Auto-Assigned
                      </span>
                    )}
                  </label>

                  <div className="flex items-center gap-2">
                    <input
                      id="customerId"
                      name="customerId"
                      type="text"
                      required
                      value={inputCustomerId}
                      onChange={(e) => {
                        setInputCustomerId(e.target.value)
                        setFetchedCustomer(null)
                        setFetchError(null)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleFetchCustomer()
                        }
                      }}
                      placeholder="Enter Customer ID or Mobile No."
                      className="flex-1 h-10 rounded-md px-3.5 border border-border bg-background text-sm text-foreground font-mono font-bold placeholder:text-foreground-disabled placeholder:font-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-subtle"
                    />
                    <button
                      type="button"
                      onClick={() => handleFetchCustomer()}
                      disabled={fetching || !inputCustomerId.trim()}
                      title="Fetch Customer Details"
                      aria-label="Fetch Customer Details"
                      className="h-10 w-10 inline-flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary-hover rounded-md transition-all disabled:opacity-40 shadow-subtle shrink-0"
                    >
                      {fetching ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {/* Fetched Customer Summary Box */}
                  {fetchedCustomer && (
                    <div 
                      className={`mt-1 p-3 rounded-md flex items-center justify-between shadow-subtle animate-fade-in border transition-all ${
                        fetchedCustomer.kycStatus === 'VERIFIED'
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-950 dark:text-emerald-100'
                          : 'bg-red-500/15 border-red-500/40 text-red-950 dark:text-red-100'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold leading-tight">{fetchedCustomer.fullName}</p>
                        <p className="text-[10px] font-mono opacity-80 mt-0.5">ID: {fetchedCustomer.numericId} • {fetchedCustomer.phone}</p>
                      </div>
                      <div>
                        {fetchedCustomer.kycStatus === 'VERIFIED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> VERIFIED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold bg-red-600/20 text-red-700 dark:text-red-300 border border-red-500/40">
                            <ShieldAlert className="h-3 w-3 text-red-600 dark:text-red-400" /> UNVERIFIED
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {fetchError && (
                    <p className="text-xs text-destructive font-medium mt-1">{fetchError}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="principalAmount" className="text-sm font-medium text-foreground">Principal Loan Amount (₹) *</label>
                  <input
                    id="principalAmount"
                    name="principalAmount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="e.g. 50000"
                    className="rounded-md px-3 py-2 border border-border bg-background text-sm text-foreground font-mono font-medium placeholder:text-foreground-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="interestRate" className="text-sm font-medium text-foreground">Interest Rate (%/mo) *</label>
                    <input
                      id="interestRate"
                      name="interestRate"
                      type="number"
                      step="0.01"
                      min="0.1"
                      max="100"
                      required
                      defaultValue="1.5"
                      placeholder="e.g. 1.5"
                      className="rounded-md px-3 py-2 border border-border bg-background text-sm text-foreground font-mono font-medium placeholder:text-foreground-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="ltvPercentage" className="text-sm font-medium text-foreground">LTV Ratio (%) *</label>
                    <input
                      id="ltvPercentage"
                      name="ltvPercentage"
                      type="number"
                      step="0.1"
                      min="1"
                      max="100"
                      required
                      defaultValue="75"
                      placeholder="e.g. 75"
                      className="rounded-md px-3 py-2 border border-border bg-background text-sm text-foreground font-mono font-medium placeholder:text-foreground-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Gold Asset Details */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="itemName" className="text-sm font-medium text-foreground">Pledged Gold Item Name *</label>
                  <input
                    id="itemName"
                    name="itemName"
                    required
                    placeholder="e.g. 22K Gold Bangle Set (2 Pcs)"
                    className="rounded-md px-3 py-2 border border-border bg-background text-sm text-foreground placeholder:text-foreground-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="weightGrams" className="text-sm font-medium text-foreground">Net Weight (g) *</label>
                    <input
                      id="weightGrams"
                      name="weightGrams"
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      placeholder="e.g. 15.5"
                      className="rounded-md px-3 py-2 border border-border bg-background text-sm text-foreground font-mono placeholder:text-foreground-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="purity" className="text-sm font-medium text-foreground">Gold Purity *</label>
                    <select
                      id="purity"
                      name="purity"
                      required
                      defaultValue="22K (91.6%)"
                      className="rounded-md px-3 py-2 border border-border bg-background text-sm text-foreground font-mono font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
                    >
                      <option value="24K (99.9%)">24K (99.9% Fine)</option>
                      <option value="22K (91.6%)">22K (91.6% BIS)</option>
                      <option value="20K (83.3%)">20K (83.3%)</option>
                      <option value="18K (75.0%)">18K (75.0%)</option>
                      <option value="14K (58.3%)">14K (58.3%)</option>
                      <option value="12K (50.0%)">12K (50.0%)</option>
                      <option value="10K (41.7%)">10K (41.7%)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor="valuation" className="text-sm font-medium text-foreground">Gold Valuation (₹) *</label>
                  <input
                    id="valuation"
                    name="valuation"
                    type="number"
                    required
                    min="0.01"
                    step="0.01"
                    placeholder="e.g. 70000"
                    className="rounded-md px-3 py-2 border border-border bg-background text-sm text-foreground font-mono font-medium placeholder:text-foreground-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </div>

                {/* Gold Photo Upload Card */}
                <GoldPhotoUploadCard
                  label="Gold Photo (Optional)"
                  fileState={goldPhoto}
                  onChange={handleFileChange}
                  onRemove={() => setGoldPhoto({ file: null, previewUrl: null, filePath: null, uploading: false, error: null })}
                />
              </div>

              {error && (
                <div className="md:col-span-2 text-xs text-destructive font-medium bg-destructive/10 p-3 rounded-md border border-destructive/20">
                  {error}
                </div>
              )}

              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-3 border-t border-border mt-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 rounded-md border border-border bg-background hover:bg-background-secondary text-sm font-medium text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || goldPhoto.uploading}
                  className="px-5 py-2 rounded-md bg-primary hover:bg-primary-hover text-sm font-medium text-primary-foreground transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-subtle flex items-center gap-2"
                >
                  {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                  <span>{loading ? 'Creating Loan...' : 'Create Gold Loan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
