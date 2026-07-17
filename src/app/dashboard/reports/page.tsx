import { redirect } from 'next/navigation'
import { Landmark, Scale, DollarSign, Wallet, FileText, ChevronRight, Activity, AlertTriangle } from 'lucide-react'
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

  // Fetch all loans with details
  const loans = await prisma.loan.findMany({
    where: { shopId, isDeleted: false },
    include: {
      customer: true,
      pledgedItems: true,
      payments: true
    }
  })

  // Fetch all payments directly
  const payments = await prisma.payment.findMany({
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

  // Financial calculations
  let totalDisbursed = 0
  let totalOutstandingPrincipal = 0
  let totalGoldLockerGrams = 0
  
  // Gold Weight by Purity map
  const goldInventoryByPurity: Record<string, number> = {}

  const overdueLoans: any[] = []

  loans.forEach(loan => {
    totalDisbursed += loan.principalAmount
    
    const balances = calculateLoanBalances(loan as any)
    const goldWeight = loan.pledgedItems.reduce((sum, item) => sum + item.weightGrams, 0)

    if (loan.status !== 'CLOSED') {
      totalOutstandingPrincipal += balances.outstandingPrincipal
      totalGoldLockerGrams += goldWeight

      // Map gold inventory by purity
      loan.pledgedItems.forEach(item => {
        const purity = item.purity.toUpperCase().trim()
        goldInventoryByPurity[purity] = (goldInventoryByPurity[purity] || 0) + item.weightGrams
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
    totalCollected += payment.amountPaid
    totalInterestCollected += payment.interestPaid
    totalPrincipalCollected += payment.principalPaid
  })

  // Prepare ledger data for Excel Export
  const excelExportData = payments.map(p => ({
    'Payment Date': new Date(p.paymentDate).toLocaleDateString('en-IN'),
    'Loan Number': p.loan.loanNumber,
    'Customer Name': `${p.loan.customer.firstName} ${p.loan.customer.lastName}`,
    'Total Paid (₹)': p.amountPaid,
    'Interest Component (₹)': p.interestPaid,
    'Principal Component (₹)': p.principalPaid,
    'Payment Mode': p.paymentMode,
    'Reference ID': p.referenceId || 'N/A'
  }))

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-heading tracking-tight">Reports & Analytics</h2>
        <ExportButton 
          data={excelExportData} 
          fileName={`Suvarna_Collections_Report_${new Date().getFullYear()}`} 
          sheetName="Collections Ledger"
          buttonText="Export Collections Ledger"
        />
      </div>

      {/* Analytics KPI cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Disbursements */}
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Disbursements</h3>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono">₹{totalDisbursed.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-1">Cumulative loans created</p>
          </div>
        </div>

        {/* Collections */}
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Total Collections</h3>
            <Wallet className="h-4 w-4 text-success" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-success">₹{totalCollected.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ₹{totalInterestCollected.toLocaleString('en-IN')} interest | ₹{totalPrincipalCollected.toLocaleString('en-IN')} principal
            </p>
          </div>
        </div>

        {/* Outstanding Active Principal */}
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Outstanding Principal</h3>
            <Landmark className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-primary">₹{totalOutstandingPrincipal.toLocaleString('en-IN')}</div>
            <p className="text-xs text-muted-foreground mt-1">Current active capital in market</p>
          </div>
        </div>

        {/* Locker Inventory */}
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6 flex flex-col justify-between">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium text-muted-foreground">Locker Gold Inventory</h3>
            <Scale className="h-4 w-4 text-yellow-600" />
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-yellow-600">{totalGoldLockerGrams.toFixed(2)} g</div>
            <p className="text-xs text-muted-foreground mt-1">Total collateral weight in vault</p>
          </div>
        </div>
      </div>

      {/* Grid: Gold Inventory by Purity & NPA Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Gold Inventory Breakdown */}
        <div className="md:col-span-1 bg-card border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Vault Inventory by Purity</h3>
          
          <div className="flex flex-col gap-3">
            {Object.keys(goldInventoryByPurity).length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No gold collateral in locker.</p>
            ) : (
              Object.entries(goldInventoryByPurity).map(([purity, weight]) => (
                <div key={purity} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                  <span className="font-semibold text-primary">{purity} Gold</span>
                  <span className="font-mono text-foreground font-semibold">{weight.toFixed(2)} grams</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Overdue/NPA Loans tracker */}
        <div className="md:col-span-2 bg-card border rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b font-semibold font-heading text-md flex items-center justify-between bg-destructive/5 border-destructive/10">
            <span className="flex items-center gap-2 text-destructive font-semibold">
              <AlertTriangle className="h-5 w-5" />
              <span>Overdue & NPA Monitor</span>
            </span>
            <span className="text-xs font-bold bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
              {overdueLoans.length} Loans
            </span>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b text-xs font-semibold">
                <tr>
                  <th className="px-6 py-3 text-muted-foreground">Loan ID</th>
                  <th className="px-6 py-3 text-muted-foreground">Customer</th>
                  <th className="px-6 py-3 text-muted-foreground">Outstanding Principal</th>
                  <th className="px-6 py-3 text-muted-foreground">Total Settlement</th>
                  <th className="px-6 py-3 text-right text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {overdueLoans.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-muted-foreground italic">
                      Zero NPAs. All active loans are within their timeline limits!
                    </td>
                  </tr>
                ) : (
                  overdueLoans.map((loan) => (
                    <tr key={loan.id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="px-6 py-4 font-mono font-medium text-destructive">{loan.loanNumber}</td>
                      <td className="px-6 py-4">
                        {loan.customer.firstName} {loan.customer.lastName}
                      </td>
                      <td className="px-6 py-4 font-mono">₹{loan.outstandingPrincipal.toLocaleString('en-IN')}</td>
                      <td className="px-6 py-4 font-mono text-destructive font-semibold">
                        ₹{Math.round(loan.totalDue).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/dashboard/loans/${loan.id}`}
                          className="text-primary hover:underline text-xs font-semibold"
                        >
                          Details
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
      <div className="bg-card border rounded-2xl shadow-sm">
        <div className="p-5 border-b font-semibold font-heading text-md flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span>Collections Transaction Ledger</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-xs font-semibold">
              <tr>
                <th className="px-6 py-3 text-muted-foreground">Date</th>
                <th className="px-6 py-3 text-muted-foreground">Loan ID</th>
                <th className="px-6 py-3 text-muted-foreground">Customer</th>
                <th className="px-6 py-3 text-muted-foreground">Amount Paid</th>
                <th className="px-6 py-3 text-muted-foreground">Principal Paid</th>
                <th className="px-6 py-3 text-muted-foreground">Interest Paid</th>
                <th className="px-6 py-3 text-muted-foreground">Mode</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground italic">
                    No transactions recorded on this platform yet.
                  </td>
                </tr>
              ) : (
                payments.slice(0, 10).map((payment) => (
                  <tr key={payment.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-6 py-4 text-xs font-mono">
                      {new Date(payment.paymentDate).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium">{payment.loan.loanNumber}</td>
                    <td className="px-6 py-4">
                      {payment.loan.customer.firstName} {payment.loan.customer.lastName}
                    </td>
                    <td className="px-6 py-4 font-bold font-mono text-foreground">
                      ₹{payment.amountPaid.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-success font-mono">
                      ₹{payment.principalPaid.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-orange-600 font-mono">
                      ₹{payment.interestPaid.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium uppercase">{payment.paymentMode}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {payments.length > 10 && (
            <div className="p-3 text-center border-t text-xs text-muted-foreground">
              Showing recent 10 transactions. Export the ledger to view all {payments.length} transactions.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
