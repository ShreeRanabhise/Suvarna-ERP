'use client'

import { useState } from 'react'
import { Printer, X, FileText, Landmark, Scale, Wallet, User } from 'lucide-react'

interface PaymentRecord {
  id: string
  paymentDate: Date | string
  amountPaid: number | string
  principalPaid: number | string
  interestPaid: number | string
  paymentMode: string
  referenceId?: string | null
  status?: string | null
}

interface PledgedItemRecord {
  id: string
  name: string
  weightGrams: number | string
  purity: string
  valuation: number | string
}

interface CustomerRecord {
  id: string
  firstName: string
  lastName: string
  phone: string
  aadhaar: string
  address: string
}

interface LoanRecord {
  id: string
  loanNumber: string
  status: string
  startDate: Date | string
  principalAmount: number | string
  interestRate: number | string
  ltvPercentage: number | string
  customer: CustomerRecord
  pledgedItems: PledgedItemRecord[]
  payments: PaymentRecord[]
}

interface BalancesRecord {
  outstandingPrincipal: number
  interestDue: number
  totalDue: number
}

interface PrintReceiptDialogProps {
  loan: LoanRecord
  balances: BalancesRecord
  shopName?: string
}

export default function PrintReceiptDialog({ loan, balances, shopName = 'Suvarna Gold ERP' }: PrintReceiptDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  const customerName = `${loan.customer.firstName} ${loan.customer.lastName}`.trim()
  const startDateFormatted = new Date(loan.startDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })

  const sortedPayments = [...loan.payments].sort(
    (a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
  )

  const handlePrint = () => {
    window.print()
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 border border-border bg-background hover:bg-background-secondary text-foreground px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-subtle transition-colors cursor-pointer"
      >
        <Printer className="h-4 w-4 text-primary" />
        <span>Print Receipt</span>
      </button>

      {/* Modal Dialog Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 sm:p-6 animate-fade-in overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          
          {/* Print CSS Fix: Pure Black & White Monochrome Output */}
          <style>{`
            @media print {
              @page {
                size: A4 portrait;
                margin: 10mm;
              }
              body * {
                visibility: hidden !important;
              }
              #printable-receipt-sheet, #printable-receipt-sheet * {
                visibility: visible !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
              }
              #printable-receipt-sheet {
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
          <div className="relative bg-white border border-black rounded-lg shadow-2xl max-w-4xl w-full max-h-[94vh] flex flex-col my-auto overflow-hidden text-black">
            
            {/* Modal Controls Bar (Hidden on Print) */}
            <div className="px-6 py-3.5 border-b border-black bg-gray-100 flex items-center justify-between shrink-0 print-hidden-control print:hidden">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded bg-black text-white flex items-center justify-center font-bold shadow-sm">
                  <Printer className="h-4.5 w-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-black leading-tight">Loan Statement & Repayment Receipt</h3>
                  <p className="text-[10px] text-black font-mono">Contract ID: {loan.loanNumber}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 bg-black text-white hover:bg-gray-800 px-4 py-1.5 rounded-md text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print / Save as PDF</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-black hover:bg-gray-200 rounded-md transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Printable PDF Canvas */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-gray-100 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              
              <div id="printable-receipt-sheet" className="max-w-3xl mx-auto flex flex-col gap-6 bg-white border border-black rounded-lg p-6 md:p-8 shadow-sm text-black">
                
                {/* Header Banner */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-black gap-4">
                  <div>
                    <span className="text-2xl font-bold font-sans tracking-tight text-black block">
                      {shopName}
                    </span>
                    <span className="text-xs text-black font-medium block mt-0.5">
                      Gold Loan & Repayment Ledger Statement
                    </span>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="inline-block px-3 py-1 bg-white text-black text-xs font-mono font-bold rounded uppercase border border-black">
                      RECEIPT #{loan.loanNumber}
                    </span>
                    <span className="text-[11px] text-black block mt-1 font-mono">
                      Issued Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>

                {/* Section 1: Customer & Loan Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg border border-black">
                  {/* Customer Information */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-black flex items-center gap-1">
                      <User className="h-3.5 w-3.5" /> Customer Information
                    </span>
                    <div className="text-sm font-bold text-black">{customerName}</div>
                    <div className="text-xs font-mono text-black">Mobile: {loan.customer.phone}</div>
                    <div className="text-xs text-black">Address: {loan.customer.address}</div>
                  </div>

                  {/* Contract Information */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-black flex items-center gap-1">
                      <Landmark className="h-3.5 w-3.5" /> Contract Details
                    </span>
                    <div className="text-xs font-mono text-black">Status: <strong className="uppercase">{loan.status}</strong></div>
                    <div className="text-xs font-mono text-black">Start Date: {startDateFormatted}</div>
                    <div className="text-xs font-mono text-black">Interest Rate: {Number(loan.interestRate)}% / Month</div>
                  </div>
                </div>

                {/* Section 2: Pledged Collateral Gold */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-black flex items-center gap-1">
                    <Scale className="h-3.5 w-3.5 text-black" /> Pledged Gold Collateral
                  </span>
                  <div className="overflow-x-auto rounded border border-black [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-100 border-b border-black text-[10px] uppercase font-bold text-black">
                        <tr>
                          <th className="px-4 py-2">Gold Item</th>
                          <th className="px-4 py-2">Purity</th>
                          <th className="px-4 py-2">Gross Weight</th>
                          <th className="px-4 py-2 text-right">Appraisal Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black font-mono text-xs text-black">
                        {loan.pledgedItems.map((item) => (
                          <tr key={item.id}>
                            <td className="px-4 py-2 font-sans font-bold text-black">{item.name}</td>
                            <td className="px-4 py-2 font-bold text-black">{item.purity}</td>
                            <td className="px-4 py-2 text-black">{Number(item.weightGrams).toFixed(2)} g</td>
                            <td className="px-4 py-2 text-right font-bold text-black">₹{Number(item.valuation).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 3: Capital & Account Balances */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3 bg-gray-50 border border-black rounded">
                    <span className="text-[10px] font-bold text-black uppercase block">Disbursed Principal</span>
                    <span className="text-sm font-bold font-mono text-black">₹{Number(loan.principalAmount).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="p-3 bg-gray-50 border border-black rounded">
                    <span className="text-[10px] font-bold text-black uppercase block">Unpaid Principal</span>
                    <span className="text-sm font-bold font-mono text-black">₹{balances.outstandingPrincipal.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="p-3 bg-gray-50 border border-black rounded">
                    <span className="text-[10px] font-bold text-black uppercase block">Interest Due</span>
                    <span className="text-sm font-bold font-mono text-black">₹{Math.round(balances.interestDue).toLocaleString('en-IN')}</span>
                  </div>

                  <div className="p-3 bg-gray-100 border border-black rounded">
                    <span className="text-[10px] font-bold text-black uppercase block">Total Due</span>
                    <span className="text-sm font-bold font-mono text-black">₹{Math.round(balances.totalDue).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Section 4: Repayment Ledger History Table */}
                <div className="flex flex-col gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-black flex items-center gap-1">
                    <Wallet className="h-3.5 w-3.5 text-black" /> Repayment Ledger History ({sortedPayments.length} Payments)
                  </span>
                  <div className="overflow-x-auto rounded border border-black [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-100 border-b border-black text-[10px] uppercase font-bold text-black">
                        <tr>
                          <th className="px-4 py-2">Date & Time</th>
                          <th className="px-4 py-2">Total Paid</th>
                          <th className="px-4 py-2">Principal Paid</th>
                          <th className="px-4 py-2">Interest Paid</th>
                          <th className="px-4 py-2">Payment Mode / Ref</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black font-mono text-xs text-black">
                        {sortedPayments.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-6 text-black italic font-sans">
                              No payment transactions recorded on this contract yet.
                            </td>
                          </tr>
                        ) : (
                          sortedPayments.map((payment) => (
                            <tr key={payment.id} className={payment.status === 'REVERSED' ? 'opacity-50 line-through' : ''}>
                              <td className="px-4 py-2 text-black">
                                {new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </td>
                              <td className="px-4 py-2 font-bold text-black">₹{Number(payment.amountPaid).toLocaleString('en-IN')}</td>
                              <td className="px-4 py-2 font-bold text-black">₹{Number(payment.principalPaid).toLocaleString('en-IN')}</td>
                              <td className="px-4 py-2 font-bold text-black">₹{Number(payment.interestPaid).toLocaleString('en-IN')}</td>
                              <td className="px-4 py-2 text-black">
                                {payment.paymentMode} {payment.referenceId ? `(${payment.referenceId})` : ''}
                                {payment.status === 'REVERSED' && <span className="ml-1 text-[9px] text-black font-bold uppercase">[Reversed]</span>}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer Signatures */}
                <div className="pt-6 border-t border-black flex justify-between items-end text-xs text-black">
                  <div>
                    <div className="font-mono text-[10px] text-black">Computer Generated Financial Receipt Statement</div>
                    <div className="font-bold text-black mt-0.5">{shopName}</div>
                  </div>
                  <div className="text-right">
                    <div className="h-10 border-b border-black w-44 mb-1" />
                    <div className="font-bold text-black">Authorized Signatory</div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}
    </>
  )
}
