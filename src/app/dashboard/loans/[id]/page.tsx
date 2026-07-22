import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Landmark, Calendar, Percent, Scale, TrendingDown, DollarSign, Wallet, ShieldAlert, Award, FileText, CheckCircle, ArrowRight, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { calculateLoanBalances, formatNumericCustomerId } from '@/lib/loan-utils'
import { RepaymentForm } from './repayment-form'
import { StatusButtons } from './status-buttons'
import { RollbackButton } from './rollback-button'
import GoldItemThumbnail from '@/components/gold-item-thumbnail'
import PrintReceiptDialog from '@/components/print-receipt-dialog'

export default async function LoanDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id: loanId } = await props.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    include: { shop: true }
  })
  if (!dbUser || !dbUser.shopId) redirect('/login')

  const loan = await prisma.loan.findFirst({
    where: { id: loanId, shopId: dbUser.shopId },
    include: {
      customer: true,
      pledgedItems: true,
      payments: true
    }
  })

  if (!loan) {
    redirect('/dashboard/loans')
  }

  const balances = calculateLoanBalances(loan as unknown as import('@/lib/loan-utils').Loan)
  const pledge = loan.pledgedItems[0]

  // Timeline calculations
  const startDate = new Date(loan.startDate)
  const now = new Date()

  // Calculate elapsed days
  const elapsedMs = Math.max(0, now.getTime() - startDate.getTime())
  const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24))

  // Serialize Prisma object (converting Decimal objects & Date prototypes to plain JSON types for Client Component)
  const serializableLoan = JSON.parse(JSON.stringify(loan))

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      {/* Back link */}
      <div>
        <Link 
          href="/dashboard/loans"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Active Contracts</span>
        </Link>
      </div>

      {/* Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border rounded-xl shadow-subtle p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">
              Gold Collateral Contract
            </span>
            <span className="text-[10px] font-mono font-medium text-foreground-muted">Customer ID: {formatNumericCustomerId(loan.customerId)}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-sans font-bold text-foreground mt-2">
            Contract ID: {loan.loanNumber}
          </h2>
          <p className="text-xs text-foreground-secondary mt-1.5">
            Pledgor Client:{' '}
            <Link 
              href={`/dashboard/customers/${loan.customerId}`}
              className="text-primary hover:underline font-semibold"
            >
              {loan.customer.firstName} {loan.customer.lastName}
            </Link>
          </p>
        </div>
        
        {/* Status Badge & manual action */}
        <div className="flex flex-col items-end gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-bold ${
            loan.status === 'ACTIVE'
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
              : loan.status === 'CLOSED'
              ? 'bg-background-secondary text-foreground-secondary border-border'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}>
            {loan.status === 'ACTIVE' && <Landmark className="h-3.5 w-3.5" />}
            {loan.status === 'CLOSED' && <CheckCircle className="h-3.5 w-3.5" />}
            {loan.status}
          </span>
          <StatusButtons loanId={loan.id} status={loan.status} />
        </div>
      </div>

      {/* Top Main Grid: Collateral Appraisal & Payment Form / Capital Balances & Timeline */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Area (Col 1 & 2): Pledge Details & Repayment Form */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Pledge Item details */}
          <div className="bg-card border border-border rounded-xl shadow-subtle p-6 flex flex-col gap-4">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest border-b border-border pb-3">Collateral Valuation Parameters</h3>
            
            <div className="flex items-center gap-4">
              <GoldItemThumbnail
                imageUrl={pledge?.imageUrl}
                itemName={pledge?.name || 'Gold Item'}
                subtitle={`${Number(pledge?.weightGrams || 0).toFixed(2)}g • ${pledge?.purity}`}
              />
              <div className="grid grid-cols-3 gap-4 flex-1">
                <div>
                  <span className="text-[10px] uppercase text-foreground-secondary block font-semibold">Item Description</span>
                  <span className="font-semibold text-foreground text-sm">{pledge?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-foreground-secondary block font-semibold">Gold Purity</span>
                  <span className="font-semibold text-foreground text-sm">{pledge?.purity || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase text-foreground-secondary block font-semibold">Gross Weight</span>
                  <span className="font-bold text-foreground text-sm font-mono">{Number(pledge?.weightGrams || 0).toFixed(2)} g</span>
                </div>
              </div>
            </div>

            <hr className="border-border" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] uppercase text-foreground-secondary block font-semibold">Gold Appraisal Value</span>
                <span className="font-bold text-base text-foreground font-mono">
                  ₹{Number(pledge?.valuation || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-foreground-secondary block font-semibold">Allowed LTV Limit</span>
                <span className="font-semibold text-xs text-foreground font-mono block mt-1">
                  {Number(loan.ltvPercentage)}% (Max eligible: ₹{Math.round(Number(pledge?.valuation || 0) * Number(loan.ltvPercentage) / 100).toLocaleString('en-IN')})
                </span>
              </div>
            </div>
          </div>

          {/* Repayment Form (if active) */}
          {loan.status === 'ACTIVE' ? (
            <div className="bg-card border border-border rounded-xl shadow-subtle p-6 flex flex-col gap-4">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-widest border-b border-border pb-3">Submit Repayment Transaction</h3>
              
              <RepaymentForm loanId={loan.id} interestDue={balances.interestDue} currentVersion={loan.version} />
            </div>
          ) : (
            <div className="bg-background-secondary border border-border rounded-xl p-8 text-center text-foreground-secondary">
              <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2.5" />
              <p className="font-bold text-sm text-foreground">Contract Settled & Closed</p>
              <p className="text-xs text-foreground-secondary mt-1">This loan is closed. Collateral gold can be released to client.</p>
            </div>
          )}
        </div>

        {/* Right Side (Col 3): Financial Capital Balances & Timeline Cards */}
        <div className="md:col-span-1 flex flex-col gap-6">
          {/* Capital Balances Card */}
          <div className="bg-card border border-border rounded-xl shadow-subtle p-6 flex flex-col gap-5">
            <h3 className="text-xs font-bold text-foreground uppercase tracking-widest border-b border-border pb-3">Capital Balances</h3>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase text-foreground-secondary font-bold">Original Principal Disbursed</span>
              <span className="text-lg font-bold font-mono text-foreground">
                ₹{Number(loan.principalAmount).toLocaleString('en-IN')}
              </span>
            </div>

            <hr className="border-border" />

            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase text-foreground-secondary font-bold">Outstanding Principal</span>
              <span className="text-lg font-bold font-mono text-foreground">
                ₹{Number(balances.outstandingPrincipal).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase text-foreground-secondary font-bold flex justify-between items-center">
                <span>Accrued Interest Due</span>
                <span className="text-[9px] bg-background-secondary text-foreground-secondary border border-border px-1.5 py-0.5 rounded font-mono font-bold">
                  {Number(loan.interestRate)}% / Month
                </span>
              </span>
              <span className="text-lg font-bold font-mono text-amber-600">
                ₹{Math.round(balances.interestDue).toLocaleString('en-IN')}
              </span>
            </div>

            <hr className="border-border" />

            <div className="flex flex-col gap-1 bg-primary/5 p-3 rounded-lg border border-primary/20">
              <span className="text-[10px] uppercase text-primary font-bold">Total Remaining Due</span>
              <span className="text-2xl font-bold font-mono text-primary">
                ₹{Math.round(balances.totalDue).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {/* Loan Start Date & Timeline Schedule Card (Below Capital Balances) */}
          <div className="bg-card border border-border rounded-xl shadow-subtle p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold text-foreground uppercase tracking-widest">Contract Schedule & Dates</h3>
            </div>

            <div className="flex flex-col gap-3">
              {/* Start Date */}
              <div className="flex justify-between items-center text-sm border-b border-border pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-foreground-secondary uppercase tracking-wider">Loan Start Date</span>
                </div>
                <span className="font-mono text-xs text-foreground font-bold">
                  {startDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* Elapsed Time */}
              <div className="flex justify-between items-center text-sm pt-0.5">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-foreground-muted" />
                  <span className="text-xs font-bold text-foreground-secondary uppercase tracking-wider">Duration Active</span>
                </div>
                <span className="font-mono text-xs text-primary font-bold">
                  {elapsedDays} Days ({Math.ceil(elapsedDays / 30)} Mos)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Width Repayment Ledger History Section */}
      <div className="rounded-xl border border-border bg-card shadow-subtle overflow-hidden w-full">
        <div className="p-5 border-b border-border bg-background-secondary/40 flex items-center justify-between">
          <div className="font-bold font-sans text-base text-foreground flex items-center gap-2">
            <FileText className="h-4.5 w-4.5 text-primary" />
            <span>Repayment Ledger History ({loan.payments.length} Transactions)</span>
          </div>
          {/* Print Receipt Button replacing Reconcile Ledger */}
          <PrintReceiptDialog 
            loan={serializableLoan} 
            balances={balances} 
            shopName={dbUser.shop?.name || 'Suvarna Gold ERP'} 
          />
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-background border-b border-border text-[11px] uppercase tracking-wider text-foreground-secondary font-bold">
              <tr>
                <th className="px-6 py-3.5">Transaction Date</th>
                <th className="px-6 py-3.5">Total Amount Paid</th>
                <th className="px-6 py-3.5">Interest Component</th>
                <th className="px-6 py-3.5">Principal Component</th>
                <th className="px-6 py-3.5">Mode / Reference ID</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {loan.payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-foreground-muted italic">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FileText className="h-10 w-10 text-foreground-muted/40" />
                      <p className="text-sm font-medium">No transactions recorded for this contract ledger yet.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                [...loan.payments].sort((a,b)=> new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).map((payment) => (
                  <tr key={payment.id} className="hover:bg-background-secondary/60 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-foreground-secondary">
                      {new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 font-bold font-mono text-sm text-foreground">
                      ₹{Number(payment.amountPaid).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-amber-600 font-mono text-sm font-bold">
                      ₹{Number(payment.interestPaid).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-emerald-600 font-mono text-sm font-bold">
                      ₹{Number(payment.principalPaid).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-foreground-secondary">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="uppercase font-mono bg-background border border-border px-2 py-0.5 rounded text-[11px] font-bold">
                          {payment.paymentMode}
                        </span>
                        {payment.referenceId && (
                          <span className="font-mono text-foreground-muted">Ref: {payment.referenceId}</span>
                        )}
                        {(payment as any).status === 'REVERSED' && (
                          <span className="ml-1 inline-flex text-[10px] font-bold uppercase bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 rounded">
                            Reversed
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-right">
                      {(payment as any).status !== 'REVERSED' && (dbUser.role === 'OWNER' || dbUser.role === 'SUPER_ADMIN') && (
                        <RollbackButton paymentId={payment.id} />
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
