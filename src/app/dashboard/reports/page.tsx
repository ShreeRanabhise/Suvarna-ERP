import { redirect } from 'next/navigation'
import { Landmark, Scale, DollarSign, Wallet, FileText, ChevronRight, Activity, AlertTriangle, ArrowRight } from 'lucide-react'
import prisma from '@/lib/prisma'
import { calculateLoanBalances } from '@/lib/loan-utils'
import ExportButton from '@/components/export-button'
import Link from 'next/link'

import { getCachedUser } from '@/lib/user'

export default async function ReportsPage() {
  const dbUser = await getCachedUser()
  if (!dbUser || !dbUser.shopId) redirect('/login')

  const shopId = dbUser.shopId

  // Fetch all loans and payments in parallel
  const [loans, payments] = await Promise.all([
    prisma.loan.findMany({
      where: { shopId, isDeleted: false },
      include: {
        customer: true,
        pledgedItems: true,
        payments: true
      }
    }),
    prisma.payment.findMany({
      where: {
        loan: { shopId, isDeleted: false }
      },
      include: {
        loan: {
          include: { customer: true }
        }
      },
      orderBy: { paymentDate: 'desc' }
    })
  ])

  // Financial calculations
  let totalDisbursed = 0
  let totalOutstandingPrincipal = 0
  let totalGoldLockerGrams = 0
  
  // Gold Weight by Purity map
  const goldInventoryByPurity: Record<string, number> = {}

  const overdueLoans: Array<typeof loans[0] & { outstandingPrincipal: number; totalDue: number }> = []

  loans.forEach(loan => {
    totalDisbursed += Number(loan.principalAmount)
    
    const balances = calculateLoanBalances(loan as unknown as import('@/lib/loan-utils').Loan)
    const goldWeight = loan.pledgedItems.reduce((sum, item) => sum + Number(item.weightGrams), 0)

    if (loan.status !== 'CLOSED') {
      totalOutstandingPrincipal += balances.outstandingPrincipal
      totalGoldLockerGrams += goldWeight

      // Map gold inventory by purity
      loan.pledgedItems.forEach(item => {
        const purity = item.purity.toUpperCase().trim()
        goldInventoryByPurity[purity] = (goldInventoryByPurity[purity] || 0) + Number(item.weightGrams)
      })

      // Check if loan is overdue (either status is OVERDUE, AUCTION or endDate is in the past)
      const isPastDueDate = loan.endDate ? new Date(loan.endDate) < new Date() : false
      if (loan.status === 'OVERDUE' || loan.status === 'AUCTION' || isPastDueDate) {
        overdueLoans.push({
          ...loan,
          outstandingPrincipal: balances.outstandingPrincipal,
          totalDue: balances.totalDue
        })
      }
    }
  })

  // Payment collections
  let totalCollected = 0
  let totalInterestCollected = 0
  let totalPrincipalCollected = 0

  payments.forEach(payment => {
    totalCollected += Number(payment.amountPaid)
    totalInterestCollected += Number(payment.interestPaid)
    totalPrincipalCollected += Number(payment.principalPaid)
  })

  // Prepare ledger data for Excel Export
  const excelExportData = payments.map(p => ({
    'Payment Date': new Date(p.paymentDate).toLocaleDateString('en-IN'),
    'Loan Number': p.loan.loanNumber,
    'Customer Name': `${p.loan.customer.firstName} ${p.loan.customer.lastName}`,
    'Total Paid (₹)': Number(p.amountPaid),
    'Interest Component (₹)': Number(p.interestPaid),
    'Principal Component (₹)': Number(p.principalPaid),
    'Payment Mode': p.paymentMode,
    'Reference ID': p.referenceId || 'N/A'
  }))

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Page Header Bar */}
      <div className="rounded-xl border border-border bg-card shadow-subtle p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-subtle shrink-0">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-sans font-bold tracking-tight text-foreground">Financial Reports</h2>
            <p className="text-xs text-foreground-secondary mt-0.5">Audit collection transactions, loan balances and gold vault inventory</p>
          </div>
        </div>
        <div className="shrink-0">
          <ExportButton 
            data={excelExportData} 
            fileName={`Suvarna_Collections_Report_${new Date().getFullYear()}`} 
            sheetName="Collections Ledger"
            buttonText="Export Report"
          />
        </div>
      </div>

      {/* Analytics KPI Summary Cards Header Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Loans Given */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Total Disbursed</span>
            <div className="h-8 w-8 rounded-lg bg-background-secondary text-foreground-muted flex items-center justify-center">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-foreground">₹{totalDisbursed.toLocaleString('en-IN')}</div>
            <p className="text-xs text-foreground-muted mt-1">Cumulative loans created</p>
          </div>
        </div>

        {/* Total Collections */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Total Payments</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-emerald-600">₹{totalCollected.toLocaleString('en-IN')}</div>
            <p className="text-[11px] text-foreground-muted mt-1 font-mono">
              ₹{totalInterestCollected.toLocaleString('en-IN')} int | ₹{totalPrincipalCollected.toLocaleString('en-IN')} prin
            </p>
          </div>
        </div>

        {/* Remaining Loans Principal */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Remaining Principal</span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-primary">₹{totalOutstandingPrincipal.toLocaleString('en-IN')}</div>
            <p className="text-xs text-foreground-muted mt-1">Current unpaid loan principal</p>
          </div>
        </div>

        {/* Vault Locker Gold */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Vault Gold</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-foreground">{totalGoldLockerGrams.toFixed(2)}<span className="text-lg text-foreground-muted ml-1">g</span></div>
            <p className="text-xs text-foreground-muted mt-1">Total weight in lockers</p>
          </div>
        </div>
      </div>

      {/* Grid: Gold Inventory by Purity & Overdue Loans Tracker */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Gold Inventory Breakdown */}
        <div className="md:col-span-1 rounded-xl border border-border bg-card shadow-subtle p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Scale className="h-4 w-4 text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Vault Stock Purity</h3>
          </div>
          
          <div className="flex flex-col gap-3">
            {Object.keys(goldInventoryByPurity).length === 0 ? (
              <p className="text-xs text-foreground-muted italic">No gold collateral in lockers.</p>
            ) : (
              Object.entries(goldInventoryByPurity).map(([purity, weight]) => (
                <div key={purity} className="flex justify-between items-center text-sm border-b border-border pb-2.5 last:border-0 last:pb-0">
                  <span className="font-semibold text-foreground text-xs">{purity} Gold</span>
                  <span className="font-mono text-xs text-primary font-bold">{weight.toFixed(2)} g</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Overdue Loans Tracker */}
        <div className="md:col-span-2 rounded-xl border border-border bg-card shadow-subtle overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border font-semibold text-sm flex items-center justify-between bg-destructive/5">
            <span className="flex items-center gap-2 text-destructive font-bold">
              <AlertTriangle className="h-4.5 w-4.5" />
              <span>Overdue Loans Action Center</span>
            </span>
            <span className="text-[10px] font-bold bg-destructive/10 text-destructive px-2.5 py-0.5 rounded-full border border-destructive/20 uppercase font-mono">
              {overdueLoans.length} Alerts
            </span>
          </div>

          <div className="overflow-x-auto flex-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-background border-b border-border text-[11px] uppercase tracking-wider text-foreground-secondary font-bold">
                <tr>
                  <th className="px-5 py-3">Loan ID</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Remaining Principal</th>
                  <th className="px-5 py-3">Total Due</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border bg-card">
                {overdueLoans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-foreground-muted italic text-xs">
                      All active loans are within their timeline limits!
                    </td>
                  </tr>
                ) : (
                  overdueLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-background-secondary/60 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs font-bold text-destructive">{loan.loanNumber}</td>
                      <td className="px-5 py-3.5 text-xs text-foreground font-semibold">
                        {loan.customer.firstName} {loan.customer.lastName}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-xs text-foreground-secondary">₹{Number(loan.outstandingPrincipal).toLocaleString('en-IN')}</td>
                      <td className="px-5 py-3.5 font-mono text-xs text-destructive font-bold">
                        ₹{Math.round(loan.totalDue).toLocaleString('en-IN')}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link 
                          href={`/dashboard/loans/${loan.id}`}
                          className="inline-flex items-center gap-1 border border-border bg-background hover:bg-background-secondary text-foreground px-3 py-1 rounded-md text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-subtle"
                        >
                          <span>Manage</span>
                          <ArrowRight className="h-3 w-3 text-foreground-muted" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Transactions Collections Ledger */}
      <div className="rounded-xl border border-border bg-card shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-border font-bold text-sm text-foreground flex items-center gap-2 bg-background-secondary/40">
          <Activity className="h-4 w-4 text-primary" />
          <span>Recent Transactions Collections Ledger</span>
        </div>
        <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-background border-b border-border text-[11px] uppercase tracking-wider text-foreground-secondary font-bold">
              <tr>
                <th className="px-5 py-3.5">Transaction Date</th>
                <th className="px-5 py-3.5">Contract Reference</th>
                <th className="px-5 py-3.5">Customer Name</th>
                <th className="px-5 py-3.5">Total Amount Paid</th>
                <th className="px-5 py-3.5">Principal Component</th>
                <th className="px-5 py-3.5">Interest Component</th>
                <th className="px-5 py-3.5">Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-foreground-muted italic">
                    No transactions recorded on this platform yet.
                  </td>
                </tr>
              ) : (
                payments.slice(0, 10).map((payment) => (
                  <tr key={payment.id} className="hover:bg-background-secondary/60 transition-colors">
                    <td className="px-5 py-4 text-xs font-mono text-foreground-secondary">
                      {new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs font-bold text-foreground">{payment.loan.loanNumber}</td>
                    <td className="px-5 py-4 text-xs font-semibold text-foreground">
                      {payment.loan.customer.firstName} {payment.loan.customer.lastName}
                    </td>
                    <td className="px-5 py-4 font-bold font-mono text-xs text-foreground">
                      ₹{Number(payment.amountPaid).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4 text-emerald-600 font-mono text-xs font-bold">
                      ₹{Number(payment.principalPaid).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4 text-amber-600 font-mono text-xs font-bold">
                      ₹{Number(payment.interestPaid).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4 text-xs">
                      <span className="inline-flex items-center text-[10px] font-bold uppercase text-foreground-secondary bg-background border border-border px-2 py-0.5 rounded font-mono">
                        {payment.paymentMode}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {payments.length > 10 && (
            <div className="p-4 text-center border-t border-border text-xs text-foreground-secondary font-medium bg-background-secondary/40 font-mono">
              Showing recent 10 transactions. Export the report to review all {payments.length} transactions.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
