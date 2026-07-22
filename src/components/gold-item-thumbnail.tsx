'use client'

import { useState } from 'react'
import { ZoomIn, X, Download, Package } from 'lucide-react'

interface GoldItemThumbnailProps {
  imageUrl?: string | null
  itemName: string
  subtitle?: string
}

function resolvePhotoUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null
  if (rawUrl.startsWith('/') || rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
    return rawUrl
  }
  return `/api/kyc/view?path=${encodeURIComponent(rawUrl)}`
}

export default function GoldItemThumbnail({
  imageUrl,
  itemName,
  subtitle
}: GoldItemThumbnailProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const resolvedUrl = resolvePhotoUrl(imageUrl || null)

  if (!resolvedUrl) {
    return (
      <div className="h-10 w-10 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center font-bold text-xs shrink-0" title="No photo uploaded">
        <Package className="h-5 w-5" />
      </div>
    )
  }

  return (
    <>
      <div 
        onClick={() => setIsPreviewOpen(true)}
        className="relative h-10 w-10 rounded-md border border-border overflow-hidden cursor-pointer group shrink-0 bg-background shadow-subtle hover:border-primary transition-all"
        title="Click to preview gold item photo"
      >
        <img 
          src={resolvedUrl} 
          alt={itemName} 
          className="h-full w-full object-cover rounded-md transition-transform duration-200 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-background rounded-md">
          <ZoomIn className="h-4 w-4" />
        </div>
      </div>

      {/* Fullscreen Lightbox Modal */}
      {isPreviewOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div 
            className="relative bg-card border border-border rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground leading-tight">{itemName}</h3>
                {subtitle && <p className="text-xs text-foreground-muted font-mono mt-0.5">{subtitle}</p>}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={resolvedUrl}
                  download={`Gold_Item_${itemName.replace(/\s+/g, '_')}`}
                  className="p-2 text-foreground-secondary hover:text-foreground bg-background hover:bg-background-secondary rounded-lg border border-border transition-colors"
                  title="Download Image"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 text-foreground-secondary hover:text-foreground bg-background hover:bg-background-secondary rounded-lg border border-border transition-colors"
                  title="Close preview"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Photo Container */}
            <div className="flex-1 flex items-center justify-center bg-background-secondary/50 rounded-lg p-3 overflow-hidden max-h-[65vh]">
              <img 
                src={resolvedUrl} 
                alt={itemName} 
                className="max-h-full max-w-full object-contain rounded-md shadow-md"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
