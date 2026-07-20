import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Landmark, Calendar, Percent, Scale, TrendingDown, DollarSign, Wallet, ShieldAlert, Award, FileText, CheckCircle, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { calculateLoanBalances } from '@/lib/loan-utils'
import { RepaymentForm } from './repayment-form'
import { StatusButtons } from './status-buttons'

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

  // Calculate live balances
  const balances = calculateLoanBalances(loan as any)
  const pledge = loan.pledgedItems[0]

  // Balances are used in the client forms

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Back link */}
      <div>
        <Link 
          href="/dashboard/loans"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Active Contracts</span>
        </Link>
      </div>

      {/* Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 luxury-card rounded-2xl p-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
              Gold Collateral Contract
            </span>
            <span className="text-[10px] font-mono font-medium text-slate-400">UUID: {loan.id.slice(0, 8)}</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-heading text-slate-900 mt-2">
            Contract ID: {loan.loanNumber}
          </h2>
          <p className="text-xs text-muted-foreground mt-1.5">
            Pledgor Client:{' '}
            <Link 
              href={`/dashboard/customers/${loan.customerId}`}
              className="text-primary hover:underline font-bold"
            >
              {loan.customer.firstName} {loan.customer.lastName}
            </Link>
          </p>
        </div>
        
        {/* Status Badge & manual action */}
        <div className="flex flex-col items-end gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
            loan.status === 'ACTIVE'
              ? 'bg-success/10 text-success border border-success/20'
              : loan.status === 'CLOSED'
              ? 'bg-slate-100 text-slate-500 border border-slate-200'
              : 'bg-destructive/10 text-destructive border border-destructive/20'
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
          <div className="luxury-card rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest border-b pb-3">Collateral Valuation Parameters</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-[10px] uppercase text-muted-foreground block font-medium">Item Description</span>
                <span className="font-bold text-slate-800 text-sm">{pledge?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-muted-foreground block font-medium">Gold Purity</span>
                <span className="font-bold text-slate-800 text-sm">{pledge?.purity || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-muted-foreground block font-medium">Gross Weight</span>
                <span className="font-bold text-slate-800 text-sm font-mono">{Number(pledge?.weightGrams || 0).toFixed(2)} g</span>
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] uppercase text-muted-foreground block font-medium">Gold Appraisal Value</span>
                <span className="font-extrabold text-base text-slate-900 font-mono">
                  ₹{Number(pledge?.valuation || 0).toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-muted-foreground block font-medium">Allowed LTV Limit</span>
                <span className="font-semibold text-xs text-slate-800 font-mono block mt-1">
                  {Number(loan.ltvPercentage)}% (Max eligible: ₹{Math.round(Number(pledge?.valuation || 0) * Number(loan.ltvPercentage) / 100).toLocaleString('en-IN')})
                </span>
              </div>
            </div>
          </div>

          {/* Repayment Form (if active) */}
          {loan.status === 'ACTIVE' ? (
            <div className="luxury-card rounded-2xl p-6 flex flex-col gap-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest border-b pb-3">Submit Repayment Transaction</h3>
              
              <RepaymentForm loanId={loan.id} interestDue={balances.interestDue} />
            </div>
          ) : (
            <div className="border border-slate-200/60 bg-slate-50/50 rounded-2xl p-8 text-center text-slate-500">
              <CheckCircle className="h-8 w-8 text-success mx-auto mb-2.5" />
              <p className="font-bold text-sm text-slate-800">Contract Settled & Closed</p>
              <p className="text-xs text-muted-foreground mt-1">This loan is closed. Collateral gold can be released to client.</p>
            </div>
          )}

          {/* Payment Ledger */}
          <div className="luxury-card rounded-2xl overflow-hidden">
            <div className="p-5 border-b font-semibold font-heading text-base text-slate-800 flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>Repayment Ledger History</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Transaction Date</th>
                    <th className="px-6 py-4">Total Paid</th>
                    <th className="px-6 py-4">Interest Component</th>
                    <th className="px-6 py-4">Principal Component</th>
                    <th className="px-6 py-4">Mode / Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loan.payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400 italic">
                        No transactions recorded for this contract ledger.
                      </td>
                    </tr>
                  ) : (
                    [...loan.payments].sort((a,b)=> new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).map((payment) => (
                      <tr key={payment.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-slate-600">
                          {new Date(payment.paymentDate).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 font-bold font-mono text-xs text-slate-800">
                          ₹{Number(payment.amountPaid).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-orange-600 font-mono text-xs">
                          ₹{Number(payment.interestPaid).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-success font-mono text-xs">
                          ₹{Number(payment.principalPaid).toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                          {payment.paymentMode} {payment.referenceId ? `(${payment.referenceId})` : ''}
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
          <div className="luxury-card rounded-2xl p-6 flex flex-col gap-5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest border-b pb-3">Capital Balances</h3>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">Original Principal Disbursed</span>
              <span className="text-lg font-bold font-mono text-slate-800">
                ₹{Number(loan.principalAmount).toLocaleString('en-IN')}
              </span>
            </div>

            <hr className="border-slate-100" />

            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold">Outstanding Principal</span>
              <span className="text-lg font-bold font-mono text-slate-900">
                ₹{Number(balances.outstandingPrincipal).toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase text-muted-foreground font-semibold flex justify-between items-center">
                <span>Accrued Interest Due</span>
                <span className="text-[9px] bg-slate-100 text-slate-600 border border-slate-200/60 px-1.5 py-0.5 rounded font-mono font-bold">
                  {Number(loan.interestRate)}% / Month
                </span>
              </span>
              <span className="text-lg font-bold font-mono text-orange-600">
                ₹{Math.round(balances.interestDue).toLocaleString('en-IN')}
              </span>
            </div>

            <hr className="border-slate-100" />

            <div className="flex flex-col gap-1 bg-primary/5 p-4 rounded-xl border border-primary/10">
              <span className="text-[10px] uppercase text-primary font-bold tracking-wider">Total Settlement Balance</span>
              <span className="text-2xl font-extrabold font-mono text-primary mt-1">
                ₹{Math.round(balances.totalDue).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="luxury-card rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest border-b pb-3 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>Contract Timeline</span>
            </h3>

            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-medium">Disbursement Date</span>
              <span className="font-bold font-mono text-slate-800">{new Date(loan.startDate).toLocaleDateString('en-IN')}</span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-medium">Interest Accrued For</span>
              <span className="font-bold font-mono text-slate-800">
                {Math.max(0, Math.floor((new Date().getTime() - new Date(loan.startDate).getTime()) / (1000 * 60 * 60 * 24)))} Days
              </span>
            </div>

            {loan.endDate && (
              <div className="flex justify-between text-xs border-t border-slate-100 pt-3">
                <span className="text-slate-500 font-medium">Maturity / End Date</span>
                <span className="font-bold font-mono text-success">{new Date(loan.endDate).toLocaleDateString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
