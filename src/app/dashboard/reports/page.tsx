import { redirect } from 'next/navigation'
import { Landmark, Scale, DollarSign, Wallet, FileText, ChevronRight, Activity, AlertTriangle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { calculateLoanBalances } from '@/lib/loan-utils'
import ExportButton from '@/components/export-button'
import Link from 'next/link'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! }
  })
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

  const overdueLoans: any[] = []

  loans.forEach(loan => {
    totalDisbursed += Number(loan.principalAmount)
    
    const balances = calculateLoanBalances(loan as any)
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
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading tracking-tight">Reports & Ledger Analytics</h2>
          <p className="text-xs text-muted-foreground mt-1">Audit historical disbursements, payment flows, and gold vault weights</p>
        </div>
        <div>
          <ExportButton 
            data={excelExportData} 
            fileName={`Suvarna_Collections_Report_${new Date().getFullYear()}`} 
            sheetName="Collections Ledger"
            buttonText="Export Collections Ledger"
          />
        </div>
      </div>

      {/* Analytics KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Disbursements */}
        <div className="luxury-card rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Disbursements</h3>
            <DollarSign className="h-4.5 w-4.5 text-muted-foreground" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold font-mono text-slate-900 leading-none">₹{totalDisbursed.toLocaleString('en-IN')}</div>
            <p className="text-[10px] text-muted-foreground mt-2">Cumulative loans created</p>
          </div>
        </div>

        {/* Collections */}
        <div className="luxury-card rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Collections</h3>
            <Wallet className="h-4.5 w-4.5 text-success" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold font-mono text-success leading-none">₹{totalCollected.toLocaleString('en-IN')}</div>
            <p className="text-[10px] text-muted-foreground mt-2">
              ₹{totalInterestCollected.toLocaleString('en-IN')} int. | ₹{totalPrincipalCollected.toLocaleString('en-IN')} prin.
            </p>
          </div>
        </div>

        {/* Outstanding Active Principal */}
        <div className="luxury-card rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outstanding Capital</h3>
            <Landmark className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold font-mono text-primary leading-none">₹{totalOutstandingPrincipal.toLocaleString('en-IN')}</div>
            <p className="text-[10px] text-muted-foreground mt-2">Current active market principal</p>
          </div>
        </div>

        {/* Locker Inventory */}
        <div className="luxury-card rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vault Inventory</h3>
            <Scale className="h-4.5 w-4.5 text-yellow-600" />
          </div>
          <div className="mt-4">
            <div className="text-2xl font-extrabold font-mono text-slate-900 leading-none">{totalGoldLockerGrams.toFixed(2)} g</div>
            <p className="text-[10px] text-muted-foreground mt-2">Total weight in vault lockers</p>
          </div>
        </div>
      </div>

      {/* Grid: Gold Inventory by Purity & NPA Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Gold Inventory Breakdown */}
        <div className="md:col-span-1 luxury-card rounded-2xl p-6 flex flex-col gap-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest border-b pb-3">Vault Stock Purity</h3>
          
          <div className="flex flex-col gap-3.5">
            {Object.keys(goldInventoryByPurity).length === 0 ? (
              <p className="text-xs text-slate-400 italic">No gold collateral in lockers.</p>
            ) : (
              Object.entries(goldInventoryByPurity).map(([purity, weight]) => (
                <div key={purity} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2.5 last:border-0 last:pb-0">
                  <span className="font-bold text-primary text-xs">{purity} Standard Gold</span>
                  <span className="font-mono text-xs text-slate-800 font-bold">{weight.toFixed(2)} g</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Overdue/NPA Loans tracker */}
        <div className="md:col-span-2 luxury-card rounded-2xl overflow-hidden flex flex-col">
          <div className="p-5 border-b font-semibold font-heading text-sm flex items-center justify-between bg-destructive/[0.03] border-destructive/10">
            <span className="flex items-center gap-2 text-destructive font-bold">
              <AlertTriangle className="h-4.5 w-4.5" />
              <span>NPA & Overdue Tracker</span>
            </span>
            <span className="text-[10px] font-extrabold bg-destructive/10 text-destructive px-2 py-0.5 rounded-full border border-destructive/20 uppercase font-mono">
              {overdueLoans.length} Alerts
            </span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Contract ID</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Overdue Principal</th>
                  <th className="px-6 py-3.5">Total Settlement</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {overdueLoans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-slate-400 italic text-xs">
                      Zero NPAs. All active loans are within their timeline limits!
                    </td>
                  </tr>
                ) : (
                  overdueLoans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-xs font-bold text-destructive">{loan.loanNumber}</td>
                      <td className="px-6 py-3.5 text-xs text-slate-800 font-semibold">
                        {loan.customer.firstName} {loan.customer.lastName}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-xs text-slate-600">₹{Number(loan.outstandingPrincipal).toLocaleString('en-IN')}</td>
                      <td className="px-6 py-3.5 font-mono text-xs text-destructive font-bold">
                        ₹{Math.round(loan.totalDue).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <Link 
                          href={`/dashboard/loans/${loan.id}`}
                          className="inline-flex items-center gap-1 border hover:bg-slate-50 text-slate-600 px-3 py-1 rounded-xl text-[11px] font-semibold transition"
                        >
                          <span>Manage</span>
                          <ArrowRight className="h-3 w-3 text-slate-400" />
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

      {/* Transactions Ledger */}
      <div className="luxury-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b font-semibold font-heading text-base text-slate-800 flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span>Collections Transaction Ledger</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Transaction Date</th>
                <th className="px-6 py-4">Contract Reference</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Amount Paid</th>
                <th className="px-6 py-4">Principal Component</th>
                <th className="px-6 py-4">Interest Component</th>
                <th className="px-6 py-4">Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 italic">
                    No transactions recorded on this platform yet.
                  </td>
                </tr>
              ) : (
                payments.slice(0, 10).map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-slate-600">
                      {new Date(payment.paymentDate).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">{payment.loan.loanNumber}</td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-800">
                      {payment.loan.customer.firstName} {payment.loan.customer.lastName}
                    </td>
                    <td className="px-6 py-4 font-bold font-mono text-xs text-slate-800">
                      ₹{Number(payment.amountPaid).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-success font-mono text-xs font-bold">
                      ₹{Number(payment.principalPaid).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-orange-600 font-mono text-xs font-bold">
                      ₹{Number(payment.interestPaid).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-xs">
                      <span className="inline-flex items-center text-[10px] font-bold uppercase text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                        {payment.paymentMode}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {payments.length > 10 && (
            <div className="p-4 text-center border-t border-slate-100 text-xs text-muted-foreground font-medium bg-slate-50/45">
              Showing recent 10 transactions. Export the collections ledger to review all {payments.length} transactions.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
