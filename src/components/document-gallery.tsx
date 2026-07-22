'use client'

import { useState } from 'react'
import { FileText, Eye, X, Download, ZoomIn, User, ShieldCheck, CreditCard } from 'lucide-react'

interface DocumentGalleryProps {
  customerPhotoUrl?: string | null
  aadhaarPhotoUrl?: string | null
  panPhotoUrl?: string | null
  customerName: string
  aadhaarNumber: string
  panNumber?: string | null
}

interface DocumentItem {
  id: string
  title: string
  subtitle: string
  url: string | null
  icon: typeof FileText
  badge?: string
}

function resolveDocumentUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null
  if (rawUrl.startsWith('/') || rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
    return rawUrl
  }
  return `/api/kyc/view?path=${encodeURIComponent(rawUrl)}`
}

export default function DocumentGallery({
  customerPhotoUrl,
  aadhaarPhotoUrl,
  panPhotoUrl,
  customerName,
  aadhaarNumber,
  panNumber
}: DocumentGalleryProps) {
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null)

  // Parse Aadhaar Front & Back URLs
  let aadhaarFrontUrl: string | null = null
  let aadhaarBackUrl: string | null = null

  if (aadhaarPhotoUrl) {
    try {
      const parsed = JSON.parse(aadhaarPhotoUrl)
      if (typeof parsed === 'object' && parsed !== null) {
        aadhaarFrontUrl = parsed.front || parsed.frontUrl || null
        aadhaarBackUrl = parsed.back || parsed.backUrl || null
      } else {
        aadhaarFrontUrl = aadhaarPhotoUrl
      }
    } catch {
      aadhaarFrontUrl = aadhaarPhotoUrl
    }
  }

  const documents: DocumentItem[] = [
    {
      id: 'aadhaar-front',
      title: 'Aadhaar Card (Front)',
      subtitle: `UID: ${aadhaarNumber}`,
      url: resolveDocumentUrl(aadhaarFrontUrl),
      icon: CreditCard,
      badge: 'Mandatory KYC'
    },
    {
      id: 'aadhaar-back',
      title: 'Aadhaar Card (Back)',
      subtitle: `UID: ${aadhaarNumber}`,
      url: resolveDocumentUrl(aadhaarBackUrl),
      icon: CreditCard,
      badge: 'Mandatory KYC'
    },
    {
      id: 'pan-photo',
      title: 'PAN Card Photo',
      subtitle: panNumber ? `PAN: ${panNumber}` : 'Not Provided',
      url: resolveDocumentUrl(panPhotoUrl || null),
      icon: ShieldCheck,
      badge: panNumber ? 'Verified PAN' : 'Optional'
    }
  ]

  return (
    <div className="bg-card border border-border rounded-lg shadow-subtle p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="text-xs font-semibold text-foreground-secondary uppercase tracking-widest flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span>Uploaded KYC Documents & Photos</span>
        </h3>
        <span className="text-[10px] font-mono text-foreground-muted">
          Click thumbnail to expand
        </span>
      </div>

      {/* Grid of Document Preview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {documents.map((doc) => (
          <div 
            key={doc.id}
            className="group relative rounded-lg border border-border bg-background flex flex-col overflow-hidden hover:border-primary/50 transition-all shadow-subtle"
          >
            {/* Thumbnail Preview Area */}
            <div 
              onClick={() => doc.url && setSelectedDoc(doc)}
              className={`h-32 w-full flex items-center justify-center bg-background-secondary relative overflow-hidden ${
                doc.url ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
              }`}
            >
              {doc.url ? (
                <>
                  <img 
                    src={doc.url} 
                    alt={doc.title} 
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <div className="p-2 rounded-full bg-background/90 text-foreground shadow-md">
                      <ZoomIn className="h-4 w-4" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-foreground-muted p-2 text-center">
                  <doc.icon className="h-8 w-8 mb-1 opacity-40" />
                  <span className="text-[10px] font-medium italic">No document image</span>
                </div>
              )}
            </div>

            {/* Document Info Footer */}
            <div className="p-2.5 flex flex-col justify-between flex-1 border-t border-border bg-card">
              <div>
                <span className="text-xs font-semibold text-foreground block truncate">
                  {doc.title}
                </span>
                <span className="text-[10px] text-foreground-muted block font-mono truncate">
                  {doc.subtitle}
                </span>
              </div>
              
              {doc.url && (
                <button
                  onClick={() => setSelectedDoc(doc)}
                  className="mt-2 text-[11px] font-medium text-primary hover:underline flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" /> Preview Fullscreen
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Image Preview Modal */}
      {selectedDoc && selectedDoc.url && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in p-4"
          onClick={() => setSelectedDoc(null)}
          onKeyDown={(e) => { if (e.key === 'Escape') setSelectedDoc(null) }}
        >
          <div 
            className="relative bg-card rounded-modal border border-border shadow-modal max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-background-secondary/50">
              <div>
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <selectedDoc.icon className="h-4 w-4 text-primary" />
                  <span>{selectedDoc.title}</span>
                </h4>
                <p className="text-xs text-foreground-muted mt-0.5 font-mono">{selectedDoc.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="p-1.5 text-foreground-secondary hover:text-foreground hover:bg-background rounded-md transition-colors text-xs flex items-center gap-1 font-medium border border-border"
                >
                  <Download className="h-4 w-4" /> Download
                </a>
                <button 
                  onClick={() => setSelectedDoc(null)}
                  className="p-1.5 text-foreground-secondary hover:text-foreground hover:bg-background rounded-md transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* High Resolution Image Viewer */}
            <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-background min-h-[350px]">
              <img 
                src={selectedDoc.url} 
                alt={selectedDoc.title} 
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-md border border-border shadow-subtle"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
