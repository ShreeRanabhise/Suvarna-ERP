import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Landmark, Calendar, Percent, Scale, TrendingDown, DollarSign, Wallet, ShieldAlert, Award, FileText, CheckCircle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { calculateLoanBalances } from '@/lib/loan-utils'
import { RepaymentForm } from './repayment-form'
import { StatusButtons } from './status-buttons'
import { RollbackButton } from './rollback-button'
import { ReconcileButton } from './reconcile-button'

export default async function LoanDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id: loanId } = await props.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id }
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

  // Balances are used in the client forms

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border rounded-lg shadow-subtle p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-primary-light text-primary">
              Gold Collateral Contract
            </span>
            <span className="text-[10px] font-mono font-medium text-foreground-muted">UUID: {loan.id.slice(0, 8)}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-sans font-semibold text-foreground mt-2">
            Contract ID: {loan.loanNumber}
          </h2>
          <p className="text-xs text-foreground-secondary mt-1.5">
            Pledgor Client:{' '}
            <Link 
              href={`/dashboard/customers/${loan.customerId}`}
              className="text-primary hover:underline font-medium"
            >
              {loan.customer.firstName} {loan.customer.lastName}
            </Link>
          </p>
        </div>
        
        {/* Status Badge & manual action */}
        <div className="flex flex-col items-end gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1 text-xs font-semibold ${
            loan.status === 'ACTIVE'
              ? 'bg-success/10 text-success border-success/20'
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

      {/* Main Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Area (Col 1 & 2): Pledge Details & Repayment Form / Ledger */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Pledge Item details */}
          <div className="bg-card border border-border rounded-lg shadow-subtle p-6 flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-foreground-secondary uppercase tracking-widest border-b border-border pb-3">Collateral Valuation Parameters</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-[10px] uppercase text-foreground-secondary block font-medium">Item Description</span>
                <span className="font-medium text-foreground text-sm">{pledge?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-foreground-secondary block font-medium">Gold Purity</span>
                <span className="font-medium text-foreground text-sm">{pledge?.purity || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-foreground-secondary block font-medium">Gross Weight</span>
                <span className="font-medium text-foreground text-sm font-mono">{Number(pledge?.weightGrams || 0).toFixed(2)} g</span>
              </div>
            </div>

            <hr className="border-border" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] uppercase text-foreground-secondary block font-medium">Gold Appraisal Value</span>
                <span className="font-semibold text-base text-foreground font-mono">
                  ₹{Number(pledge?.valuation || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-foreground-secondary block font-medium">Allowed LTV Limit</span>
                <span className="font-medium text-xs text-foreground font-mono block mt-1">
                  {Number(loan.ltvPercentage)}% (Max eligible: ₹{Math.round(Number(pledge?.valuation || 0) * Number(loan.ltvPercentage) / 100).toLocaleString('en-IN')})
                </span>
              </div>
            </div>
          </div>

          {/* Repayment Form (if active) */}
          {loan.status === 'ACTIVE' ? (
            <div className="bg-card border border-border rounded-lg shadow-subtle p-6 flex flex-col gap-4">
              <h3 className="text-xs font-semibold text-foreground-secondary uppercase tracking-widest border-b border-border pb-3">Submit Repayment Transaction</h3>
              
              <RepaymentForm loanId={loan.id} interestDue={balances.interestDue} currentVersion={loan.version} />
            </div>
          ) : (
            <div className="bg-background-secondary border border-border rounded-lg p-8 text-center text-foreground-secondary">
              <CheckCircle className="h-8 w-8 text-success mx-auto mb-2.5" />
              <p className="font-semibold text-sm text-foreground">Contract Settled & Closed</p>
              <p className="text-xs text-foreground-secondary mt-1">This loan is closed. Collateral gold can be released to client.</p>
            </div>
          )}

          {/* Payment Ledger */}
          <div className="bg-card border border-border rounded-lg shadow-subtle overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="font-semibold font-sans text-base text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-foreground-secondary" />
                <span>Repayment Ledger History</span>
              </div>
              {/* Added Reconcile Ledger Button */}
              {dbUser.role === 'OWNER' || dbUser.role === 'SUPER_ADMIN' ? (
                <ReconcileButton loanId={loan.id} />
              ) : null}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Transaction Date</th>
                    <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Total Paid</th>
                    <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Interest Component</th>
                    <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Principal Component</th>
                    <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Mode / Ref</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loan.payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-foreground-muted italic">
                        No transactions recorded for this contract ledger.
                      </td>
                    </tr>
                  ) : (
                    [...loan.payments].sort((a,b)=> new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).map((payment) => (
                      <tr key={payment.id} className="hover:bg-background-secondary transition-colors">
                        <td className="px-5 py-4 text-xs font-mono text-foreground-secondary">
                          {new Date(payment.paymentDate).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-5 py-4 font-semibold font-mono text-xs text-foreground">
                          ₹{Number(payment.amountPaid).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-4 text-orange-600 font-mono text-xs font-medium">
                          ₹{Number(payment.interestPaid).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-4 text-success font-mono text-xs font-medium">
                          ₹{Number(payment.principalPaid).toLocaleString('en-IN')}
                        </td>
                        <td className="px-5 py-4 text-xs font-medium text-foreground-secondary">
                          {payment.paymentMode} {payment.referenceId ? `(${payment.referenceId})` : ''}
                          {(payment as any).status === 'REVERSED' && (
                            <span className="ml-2 inline-flex text-[9px] font-bold uppercase bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">Reversed</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-xs font-medium text-foreground-secondary text-right">
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

        {/* Right Side (Col 3): Financial Balances Card */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="bg-card border border-border rounded-lg shadow-subtle p-6 flex flex-col gap-5">
            <h3 className="text-xs font-semibold text-foreground-secondary uppercase tracking-widest border-b border-border pb-3">Capital Balances</h3>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase text-foreground-secondary font-semibold">Original Principal Disbursed</span>
              <span className="text-lg font-semibold font-mono text-foreground">
                ₹{Number(loan.principalAmount).toLocaleString('en-IN')}
              </span>
            </div>

            <hr className="border-border" />

            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase text-foreground-secondary font-semibold">Outstanding Principal</span>
              <span className="text-lg font-semibold font-mono text-foreground">
                ₹{Number(balances.outstandingPrincipal).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase text-foreground-secondary font-semibold flex justify-between items-center">
                <span>Accrued Interest Due</span>
                <span className="text-[9px] bg-background-secondary text-foreground-secondary border border-border px-1.5 py-0.5 rounded font-mono font-medium">
                  {Number(loan.interestRate)}% / Month
                </span>
              </span>
              <span className="text-lg font-semibold font-mono text-orange-600">
                ₹{Math.round(balances.interestDue).toLocaleString('en-IN')}
              </span>
            </div>

            <hr className="border-border" />

            <div className="flex flex-col gap-1 bg-primary-light p-4 rounded-md">
              <span className="text-[10px] uppercase text-primary font-semibold tracking-wider">Total Settlement Balance</span>
              <span className="text-2xl font-semibold font-mono text-primary mt-1">
                ₹{Math.round(balances.totalDue).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-subtle p-6 flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-foreground-secondary uppercase tracking-widest border-b border-border pb-3 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-foreground-secondary" />
              <span>Contract Timeline</span>
            </h3>

            <div className="flex justify-between text-xs">
              <span className="text-foreground-secondary font-medium">Disbursement Date</span>
              <span className="font-medium font-mono text-foreground">{new Date(loan.startDate).toLocaleDateString('en-IN')}</span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-foreground-secondary font-medium">Interest Accrued For</span>
              <span className="font-medium font-mono text-foreground">
                {Math.max(0, Math.floor((new Date().getTime() - new Date(loan.startDate).getTime()) / (1000 * 60 * 60 * 24)))} Days
              </span>
            </div>

            {loan.endDate && (
              <div className="flex justify-between text-xs border-t border-border pt-3">
                <span className="text-foreground-secondary font-medium">Maturity / End Date</span>
                <span className="font-medium font-mono text-success">{new Date(loan.endDate).toLocaleDateString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
