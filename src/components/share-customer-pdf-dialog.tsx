'use client'

import { useState } from 'react'
import { FileText, Printer, X, User, Building, ShieldCheck, Package, Shield, Calendar, Sparkles } from 'lucide-react'
import { formatNumericCustomerId } from '@/lib/loan-utils'
import { formatAadhaar, formatPAN } from '@/lib/validation'
import { LoadingButton } from '@/components/loading-button'

interface PledgedItem {
  id: string
  name: string
  weightGrams: number | string
  purity: string
  imageUrl?: string | null
}

interface LoanContract {
  id: string
  loanNumber: string
  status: string
  pledgedItems: PledgedItem[]
}

interface CustomerData {
  id: string
  firstName: string
  lastName: string
  phone: string
  aadhaar: string
  pan?: string | null
  address: string
  customerPhotoUrl?: string | null
  aadhaarPhotoUrl?: string | null
  panPhotoUrl?: string | null
  panVerificationStatus?: string
  loans?: LoanContract[]
}

interface ShareCustomerPdfDialogProps {
  customer: CustomerData
  shopName?: string
}

function resolveDocumentUrl(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null

  // Intercept accidentally saved Supabase public URLs (which fail if the bucket is private)
  // and convert them back to relative paths for the view API to sign properly.
  if (rawUrl.includes('/object/public/kyc-documents/')) {
    const extractedPath = rawUrl.split('/object/public/kyc-documents/')[1]
    if (extractedPath) {
      return `/api/kyc/view?path=${encodeURIComponent('/uploads/kyc/' + extractedPath)}`
    }
  }

  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://') || rawUrl.startsWith('data:') || rawUrl.startsWith('blob:')) {
    return rawUrl
  }
  // Route ALL relative paths through the view API so it can check Supabase vs Local
  return `/api/kyc/view?path=${encodeURIComponent(rawUrl)}`
}

export default function ShareCustomerPdfDialog({ customer, shopName = 'Gold ERP' }: ShareCustomerPdfDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  const fullName = `${customer.firstName} ${customer.lastName}`.trim()
  const numericId = formatNumericCustomerId(customer.id)
  
  const profilePhotoUrl = resolveDocumentUrl(customer.customerPhotoUrl)
  
  // Parse Aadhaar Front & Back URLs
  let aadhaarFrontUrl: string | null = null
  let aadhaarBackUrl: string | null = null

  if (customer.aadhaarPhotoUrl) {
    try {
      const parsed = typeof customer.aadhaarPhotoUrl === 'string' 
        ? JSON.parse(customer.aadhaarPhotoUrl) 
        : customer.aadhaarPhotoUrl

      if (typeof parsed === 'object' && parsed !== null) {
        aadhaarFrontUrl = resolveDocumentUrl(parsed.front || parsed.frontUrl || null)
        aadhaarBackUrl = resolveDocumentUrl(parsed.back || parsed.backUrl || null)
      } else {
        aadhaarFrontUrl = resolveDocumentUrl(customer.aadhaarPhotoUrl)
      }
    } catch {
      aadhaarFrontUrl = resolveDocumentUrl(customer.aadhaarPhotoUrl)
    }
  }

  // Parse PAN URL
  let panResolvedUrl: string | null = null
  if (customer.panPhotoUrl) {
    try {
      const parsed = typeof customer.panPhotoUrl === 'string'
        ? JSON.parse(customer.panPhotoUrl)
        : customer.panPhotoUrl

      if (typeof parsed === 'object' && parsed !== null) {
        panResolvedUrl = resolveDocumentUrl(parsed.url || parsed.front || parsed.panUrl || null)
      } else {
        panResolvedUrl = resolveDocumentUrl(customer.panPhotoUrl)
      }
    } catch {
      panResolvedUrl = resolveDocumentUrl(customer.panPhotoUrl)
    }
  }

  // Collect all pledged gold items across active/all contracts
  const allPledgedGoldItems = (customer.loans || []).flatMap(loan => 
    (loan.pledgedItems || []).map(item => ({
      ...item,
      loanNumber: loan.loanNumber,
      loanStatus: loan.status
    }))
  )

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print()
    }
  }

  return (
    <>
      <LoadingButton
        type="button"
        onClick={async () => setIsOpen(true)}
        className="flex items-center justify-center gap-2 bg-background hover:bg-background-secondary border border-border text-foreground h-10 px-4 rounded-md font-medium text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm w-full"
        title="Share & Print Customer Info PDF"
      >
        <FileText className="h-4 w-4 text-primary shrink-0" />
        <span>Customer Info</span>
      </LoadingButton>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 sm:p-6 animate-fade-in overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          
          {/* Print CSS Fix: 100% 1:1 Matching High-Res PDF Output */}
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
              body * {
                visibility: hidden !important;
              }
              #printable-pdf-sheet, #printable-pdf-sheet * {
                visibility: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              #printable-pdf-sheet {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 190mm !important; /* A4 width minus 20mm margins */
                margin: 0 !important;
                padding: 0 !important;
                background-color: #ffffff !important;
                border: none !important;
                box-shadow: none !important;
              }
              /* Prevent splitting tables or cards across pages */
              table, tr, td, th, .break-inside-avoid {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              h3, h4, h5 {
                page-break-after: avoid !important;
                break-after: avoid !important;
              }
              .print-hidden-control {
                display: none !important;
              }
            }
          `}</style>

          {/* Modal Card Wrapper */}
          <div className="relative bg-white border border-gray-300 rounded-lg shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col my-auto overflow-hidden animate-scale-in text-gray-900">
            
            {/* Modal Controls Bar (Hidden on Print) */}
            <div className="px-6 py-3.5 border-b border-gray-200 bg-gray-50 flex items-center justify-between shrink-0 print-hidden-control print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                  <FileText className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">Customer Information Dossier</h3>
                  <p className="text-[10px] text-gray-500 font-mono">1:1 High-Resolution PDF Print Sheet</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <LoadingButton
                  type="button"
                  onClick={async () => handlePrint()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-all shadow-sm"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print / Save as PDF</span>
                </LoadingButton>
                <LoadingButton
                  type="button"
                  onClick={async () => setIsOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-200 rounded transition-colors"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </LoadingButton>
              </div>
            </div>

            {/* Printable PDF Sheet Area - Masterclass Executive Design */}
            <div id="printable-pdf-sheet" className="p-8 sm:p-10 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-white text-gray-900 space-y-7 print:p-0 print:overflow-visible print:bg-white">
              
              {/* Document Header */}
              <div className="border-b border-gray-300 pb-5 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-emerald-800 mb-1">
                    <Building className="h-4 w-4 text-emerald-700" />
                    <span>{shopName}</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
                    CUSTOMER DOSSIER & PROFILE RECORD
                  </h1>
                </div>

                <div className="flex flex-col sm:items-end font-mono text-xs">
                  <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded border border-gray-200">
                    <span className="font-bold text-[10px] text-gray-600 uppercase">Customer Ref ID:</span>
                    <span className="font-extrabold text-sm text-emerald-800">{numericId}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">Date of Issue: {currentDate}</span>
                </div>
              </div>

              {/* Primary Customer Profile & Identity Card */}
              <div className="bg-gray-50/80 border border-gray-200 rounded-lg p-5 space-y-4 break-inside-avoid shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                  
                  {/* Left: 3:4 Customer Profile Photo */}
                  <div className="md:col-span-1 flex flex-col items-center justify-center text-center border-b md:border-b-0 md:border-r border-gray-200 pb-4 md:pb-0 md:pr-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-2 block">Customer Photo</span>
                    {profilePhotoUrl ? (
                      <div className="w-32 h-40 aspect-[3/4] bg-white rounded border border-gray-300 p-1 shadow-sm">
                        <img 
                          src={profilePhotoUrl} 
                          alt={fullName} 
                          className="h-full w-full object-cover rounded-sm"
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-40 aspect-[3/4] bg-gray-200 rounded flex flex-col items-center justify-center text-gray-500 p-2">
                        <User className="h-10 w-10 mb-1 text-gray-400" />
                        <span className="text-[10px] font-mono">No Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Personal Information & Contact Grid */}
                  <div className="md:col-span-3 space-y-3.5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-200 pb-3">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 block">Full Customer Name</span>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight">{fullName}</h2>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase px-3 py-1 rounded border ${
                        customer.panVerificationStatus === 'VERIFIED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-red-50 text-red-800 border-red-300'
                      }`}>
                        <Shield className="h-3.5 w-3.5" />
                        KYC {customer.panVerificationStatus || 'UNVERIFIED'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-gray-500 block mb-0.5">Contact Phone</span>
                        <span className="font-bold text-sm text-gray-900">{customer.phone}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-gray-500 block mb-0.5">Aadhaar UID</span>
                        <span className="font-bold text-sm text-gray-900">{formatAadhaar(customer.aadhaar)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-gray-500 block mb-0.5">PAN Card Number</span>
                        <span className="font-bold text-sm text-gray-900">{customer.pan ? formatPAN(customer.pan) : 'Not Provided'}</span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-2.5">
                      <span className="text-[10px] font-extrabold uppercase text-gray-500 block mb-0.5">Residential Address</span>
                      <p className="text-xs font-medium text-gray-800 leading-relaxed">{customer.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 1: Verified KYC Identity Documents */}
              <div className="space-y-3 break-inside-avoid">
                <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-700" />
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900">
                    Verified KYC Identity Documents
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Aadhaar Front */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col items-center text-center">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 mb-2 block">
                      Aadhaar Card (Front View)
                    </span>
                    {aadhaarFrontUrl ? (
                      <div className="h-44 w-full bg-white rounded border border-gray-200 p-1 flex items-center justify-center shadow-sm">
                        <img 
                          src={aadhaarFrontUrl} 
                          alt="Aadhaar Card Front" 
                          className="max-h-full w-auto max-w-full object-contain rounded-sm"
                        />
                      </div>
                    ) : (
                      <div className="h-44 w-full bg-gray-100 rounded flex items-center justify-center text-gray-500 text-xs italic border border-gray-200">
                        No Aadhaar Front Photo
                      </div>
                    )}
                  </div>

                  {/* Aadhaar Back */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col items-center text-center">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 mb-2 block">
                      Aadhaar Card (Back View)
                    </span>
                    {aadhaarBackUrl ? (
                      <div className="h-44 w-full bg-white rounded border border-gray-200 p-1 flex items-center justify-center shadow-sm">
                        <img 
                          src={aadhaarBackUrl} 
                          alt="Aadhaar Card Back" 
                          className="max-h-full w-auto max-w-full object-contain rounded-sm"
                        />
                      </div>
                    ) : (
                      <div className="h-44 w-full bg-gray-100 rounded flex items-center justify-center text-gray-500 text-xs italic border border-gray-200">
                        No Aadhaar Back Photo
                      </div>
                    )}
                  </div>

                  {/* PAN Card */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col items-center text-center">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-600 mb-2 block">
                      PAN Card Document
                    </span>
                    {panResolvedUrl ? (
                      <div className="h-44 w-full bg-white rounded border border-gray-200 p-1 flex items-center justify-center shadow-sm">
                        <img 
                          src={panResolvedUrl} 
                          alt="PAN Card Document" 
                          className="max-h-full w-auto max-w-full object-contain rounded-sm"
                        />
                      </div>
                    ) : (
                      <div className="h-44 w-full bg-gray-100 rounded flex items-center justify-center text-gray-500 text-xs italic border border-gray-200">
                        No PAN Document Photo
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Pledged Collateral Gold Inventory */}
              <div className="space-y-3 break-inside-avoid">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-emerald-700" />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900">
                      Pledged Gold Items Inventory
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold font-mono text-gray-600 uppercase bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                    {allPledgedGoldItems.length} Items
                  </span>
                </div>

                {allPledgedGoldItems.length === 0 ? (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-xs text-gray-500 italic">
                    No active pledged gold items on record.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {allPledgedGoldItems.map((goldItem, idx) => {
                      const goldUrl = resolveDocumentUrl(goldItem.imageUrl)
                      return (
                        <div key={goldItem.id || idx} className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex flex-col gap-2 shadow-sm">
                          <div className="h-40 w-full bg-white rounded border border-gray-200 overflow-hidden flex items-center justify-center p-1">
                            {goldUrl ? (
                              <img src={goldUrl} alt={goldItem.name} className="h-full w-auto max-w-full object-contain rounded-sm" />
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">No Item Image</span>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 truncate">{goldItem.name}</p>
                            <div className="flex items-center justify-between mt-1 text-[10px] font-mono">
                              <span className="font-bold text-gray-800">{Number(goldItem.weightGrams).toFixed(2)} g</span>
                              <span className="font-extrabold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded uppercase">
                                {goldItem.purity}
                              </span>
                            </div>
                            <p className="text-[9px] font-mono text-gray-500 mt-1 border-t border-gray-200 pt-1">
                              Contract ID: <span className="font-bold text-gray-900">{goldItem.loanNumber}</span>
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Confidential Document Footer */}
              <div className="border-t border-gray-200 pt-4 text-center text-[10px] text-gray-500 font-mono space-y-1">
                <p className="font-semibold text-gray-700">OFFICIAL CONFIDENTIAL RECORD • GENERATED BY {shopName.toUpperCase()}</p>
                <p>This document is a system-generated Customer Profile & Pledged Collateral Dossier intended solely for authorized ERP operations.</p>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  )
}
