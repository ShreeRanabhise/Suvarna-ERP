'use client'

// Customer Profile Header Component
import { useState, useEffect } from 'react'
import { User, X, ZoomIn, Download, Camera, Copy, Check } from 'lucide-react'
import { formatNumericCustomerId } from '@/lib/loan-utils'
import CreateLoanDialog from '@/components/create-loan-dialog'
import ShareCustomerPdfDialog from '@/components/share-customer-pdf-dialog'

interface CustomerProfileHeaderProps {
  customerId: string
  firstName: string
  lastName: string
  customerPhotoUrl?: string | null
  customer?: any
}

function resolveDocumentUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null
  if (rawUrl.startsWith('/') || rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
    return rawUrl
  }
  return `/api/kyc/view?path=${encodeURIComponent(rawUrl)}`
}

export default function CustomerProfileHeader({
  customerId,
  firstName,
  lastName,
  customerPhotoUrl,
  customer
}: CustomerProfileHeaderProps) {
  const [mounted, setMounted] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const resolvedPhotoUrl = resolveDocumentUrl(customerPhotoUrl || null)
  const fullName = `${firstName} ${lastName}`.trim()
  const numericId = formatNumericCustomerId(customerId)

  function handleCopyId() {
    if (typeof window !== 'undefined' && navigator?.clipboard) {
      navigator.clipboard.writeText(numericId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 w-full" suppressHydrationWarning>
      {/* Standalone 3:4 Customer Profile Photo Card */}
      <div className="relative shrink-0">
        {resolvedPhotoUrl ? (
          <div 
            onClick={() => setIsPreviewOpen(true)}
            className="relative w-32 h-44 aspect-[3/4] rounded-lg border-2 border-primary/80 overflow-hidden cursor-pointer group shadow-subtle bg-card p-1 hover:border-primary transition-all hover:shadow-md"
            title="Click to preview customer photo"
          >
            <img 
              src={resolvedPhotoUrl} 
              alt={fullName} 
              className="h-full w-full object-cover rounded-md transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-background rounded-md">
              <ZoomIn className="h-6 w-6" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">Preview</span>
            </div>
          </div>
        ) : (
          <div className="w-32 h-44 aspect-[3/4] bg-card text-primary rounded-lg flex flex-col items-center justify-center font-bold border border-border shadow-subtle p-3 text-center">
            <User className="h-10 w-10 mb-1 text-primary/70" />
            <span className="text-[11px] font-medium text-foreground-secondary truncate max-w-full">{firstName}</span>
            <span className="text-[9px] text-foreground-muted mt-0.5 font-mono">3:4 Photo</span>
          </div>
        )}
      </div>

      {/* Separate Customer Details & Actions Card */}
      <div className="flex-1 min-w-0 w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border rounded-lg shadow-subtle p-5 md:p-6 h-44" suppressHydrationWarning>
        <div>
          <h2 className="text-2xl md:text-3xl font-sans font-bold text-foreground leading-tight tracking-tight">
            {fullName}
          </h2>
          <div className="flex items-center gap-2.5 text-sm text-foreground-secondary mt-2.5">
            <span className="font-semibold text-foreground-muted">Customer ID:</span>
            <span className="font-mono bg-background-secondary border border-border text-primary font-bold px-3 py-1 rounded-md text-sm md:text-base shadow-subtle tracking-wide" suppressHydrationWarning>
              {numericId}
            </span>
            {mounted && (
              <button
                type="button"
                onClick={handleCopyId}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-background hover:bg-background-secondary border border-border rounded-md text-xs font-semibold text-foreground-secondary hover:text-foreground transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-subtle"
                title="Copy Customer ID"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-success" />
                    <span className="text-success font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-primary" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons: Share Customer Dossier (PDF) on top, Create Loan below */}
        <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto min-w-[210px] items-stretch">
          {customer && <ShareCustomerPdfDialog customer={customer} />}
          <CreateLoanDialog customerId={customerId} />
        </div>
      </div>

      {/* Full-Screen Avatar Photo Lightbox Preview Modal */}
      {isPreviewOpen && resolvedPhotoUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4"
          onClick={() => setIsPreviewOpen(false)}
          onKeyDown={(e) => { if (e.key === 'Escape') setIsPreviewOpen(false) }}
        >
          <div 
            className="relative bg-card rounded-modal border border-border shadow-modal max-w-lg w-full p-4 flex flex-col my-auto text-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-border flex items-center justify-between bg-background-secondary/50 rounded-t-md mb-4">
              <div className="flex items-center gap-2 text-left">
                <Camera className="h-4 w-4 text-primary" />
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{fullName}</h4>
                  <p className="text-[11px] font-mono text-foreground-muted">ID: {numericId}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={resolvedPhotoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="p-1.5 text-foreground-secondary hover:text-foreground hover:bg-background rounded-md transition-colors text-xs flex items-center gap-1 font-medium border border-border"
                >
                  <Download className="h-4 w-4" /> Download
                </a>
                <button 
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-1.5 text-foreground-secondary hover:text-foreground hover:bg-background rounded-md transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-2 flex items-center justify-center bg-background rounded-md border border-border">
              <img 
                src={resolvedPhotoUrl} 
                alt={fullName} 
                className="max-h-[65vh] aspect-[3/4] w-auto object-cover rounded-lg border-2 border-primary shadow-subtle"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
