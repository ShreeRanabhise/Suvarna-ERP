import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Landmark, Calendar, Percent, Scale, TrendingDown, DollarSign, Wallet, ShieldAlert, Award, FileText, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { calculateLoanBalances } from '@/lib/loan-utils'
import { repayLoan, updateLoanStatus } from '@/app/actions'

export default async function LoanDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id: loanId } = await props.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! }
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

  // Server actions wrapper to satisfy form action type constraints (Promise<void>)
  const handleSetOverdue = async () => {
    'use server'
    await updateLoanStatus(loan.id, 'OVERDUE')
  }

  const handleSetAuction = async () => {
    'use server'
    await updateLoanStatus(loan.id, 'AUCTION')
  }

  const handleSetActive = async () => {
    'use server'
    await updateLoanStatus(loan.id, 'ACTIVE')
  }

  const handleRepay = async (formData: FormData) => {
    'use server'
    await repayLoan(formData)
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Back link */}
      <div>
        <Link 
          href="/dashboard/loans"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Loans</span>
        </Link>
      </div>

      {/* Header Card */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-muted text-muted-foreground">Gold Loan</span>
            <span className="text-sm font-mono font-medium text-muted-foreground">{loan.id}</span>
          </div>
          <h2 className="text-2xl font-bold font-heading text-foreground mt-1">
            Loan ID: {loan.loanNumber}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Pledged by:{' '}
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
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-semibold ${
            loan.status === 'ACTIVE'
              ? 'bg-success/10 text-success border-success/20'
              : loan.status === 'CLOSED'
              ? 'bg-muted text-muted-foreground border-muted-foreground/15'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}>
            {loan.status === 'ACTIVE' && <Landmark className="h-4 w-4" />}
            {loan.status === 'CLOSED' && <CheckCircle className="h-4 w-4" />}
            {loan.status}
          </span>
          
          {loan.status === 'ACTIVE' && (
            <div className="flex gap-2">
              <form action={handleSetOverdue}>
                <button type="submit" className="text-xs border px-2.5 py-1 rounded-md text-destructive hover:bg-destructive/5 font-medium">
                  Mark Overdue
                </button>
              </form>
              <form action={handleSetAuction}>
                <button type="submit" className="text-xs border px-2.5 py-1 rounded-md text-orange-600 hover:bg-orange-50 font-medium">
                  Send to Auction
                </button>
              </form>
            </div>
          )}

          {loan.status !== 'ACTIVE' && loan.status !== 'CLOSED' && (
            <form action={handleSetActive}>
              <button type="submit" className="text-xs border px-2.5 py-1 rounded-md text-primary hover:bg-primary/5 font-medium">
                Revert to Active
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Area (Col 1 & 2): Pledge Details & Repayment Form / Ledger */}
        <div className="md:col-span-2 flex flex-col gap-6">
          {/* Pledge Item details */}
          <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Pledge Asset details</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-muted-foreground block">Item Description</span>
                <span className="font-semibold text-sm">{pledge?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Purity</span>
                <span className="font-semibold text-sm">{pledge?.purity || 'N/A'}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Gold Weight</span>
                <span className="font-semibold text-sm font-mono">{pledge?.weightGrams || 0} grams</span>
              </div>
            </div>

            <hr />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-muted-foreground block">Market Valuation</span>
                <span className="font-bold text-sm text-foreground font-mono">
                  ₹{pledge?.valuation.toLocaleString('en-IN') || 0}
                </span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">Allowed LTV Ratio</span>
                <span className="font-semibold text-sm text-foreground font-mono">
                  {loan.ltvPercentage}% (Max eligible: ₹{Math.round(pledge?.valuation * loan.ltvPercentage / 100).toLocaleString('en-IN')})
                </span>
              </div>
            </div>
          </div>

          {/* Repayment Form (if active) */}
          {loan.status === 'ACTIVE' ? (
            <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Record Repayment</h3>
              
              <form action={handleRepay} className="space-y-4">
                <input type="hidden" name="loanId" value={loan.id} />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Repayment Amount (₹)</label>
                    <input 
                      name="amountPaid"
                      type="number"
                      required
                      min="1"
                      step="0.01"
                      placeholder="e.g. 5000"
                      className="w-full px-3 py-2 border rounded-md bg-transparent font-mono text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Payment Mode</label>
                    <select 
                      name="paymentMode"
                      className="w-full px-3 py-2 border rounded-md bg-transparent text-sm"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI / QR Code</option>
                      <option value="BANK">Bank Transfer</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground mb-1">Reference ID (optional)</label>
                  <input 
                    name="referenceId"
                    type="text"
                    placeholder="e.g. UPI Txn ID, Cheque number"
                    className="w-full px-3 py-2 border rounded-md bg-transparent font-mono text-sm"
                  />
                </div>

                <div className="bg-muted/40 rounded-lg p-3 text-xs text-muted-foreground border">
                  <strong>Repayment Allocation Rule:</strong> The paid amount will first satisfy any accrued interest due (₹{Math.round(balances.interestDue).toLocaleString('en-IN')}). Any excess amount will be applied to reduce the outstanding principal. If the principal reaches ₹0, the loan will automatically close.
                </div>

                <button 
                  type="submit"
                  className="w-full bg-primary text-primary-foreground py-2 rounded-md font-semibold text-sm hover:opacity-90 transition shadow-sm"
                >
                  Submit Repayment
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-muted/30 border border-dashed rounded-2xl p-6 text-center text-muted-foreground">
              <CheckCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="font-semibold text-sm">Loan Repayment Completed</p>
              <p className="text-xs">No further payments are accepted since this loan is marked as {loan.status}.</p>
            </div>
          )}

          {/* Payment Ledger */}
          <div className="bg-card border rounded-2xl shadow-sm overflow-hidden">
            <div className="p-5 border-b font-semibold font-heading text-md flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span>Payment Ledger</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 border-b text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-3 text-muted-foreground">Date</th>
                    <th className="px-6 py-3 text-muted-foreground">Paid Amount</th>
                    <th className="px-6 py-3 text-muted-foreground">Interest Paid</th>
                    <th className="px-6 py-3 text-muted-foreground">Principal Paid</th>
                    <th className="px-6 py-3 text-muted-foreground">Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {loan.payments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-muted-foreground italic">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    [...loan.payments].sort((a,b)=> new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()).map((payment) => (
                      <tr key={payment.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="px-6 py-4 text-xs font-mono">
                          {new Date(payment.paymentDate).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4 font-semibold font-mono text-foreground">
                          ₹{payment.amountPaid.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-orange-600 font-mono">
                          ₹{payment.interestPaid.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-success font-mono">
                          ₹{payment.principalPaid.toLocaleString('en-IN')}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium">
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
          <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col gap-6">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Loan Balances</h3>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Original Principal</span>
              <span className="text-xl font-bold font-mono text-foreground">
                ₹{loan.principalAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <hr />

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground">Outstanding Principal</span>
              <span className="text-xl font-bold font-mono text-primary">
                ₹{balances.outstandingPrincipal.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-xs text-muted-foreground flex justify-between items-center">
                <span>Accrued Interest Due</span>
                <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                  {loan.interestRate}% monthly
                </span>
              </span>
              <span className="text-xl font-bold font-mono text-orange-600">
                ₹{Math.round(balances.interestDue).toLocaleString('en-IN')}
              </span>
            </div>

            <hr />

            <div className="flex flex-col gap-1 bg-primary/5 p-4 rounded-xl border border-primary/10">
              <span className="text-xs text-primary font-semibold">Total Settlement Due</span>
              <span className="text-2xl font-extrabold font-mono text-primary mt-1">
                ₹{Math.round(balances.totalDue).toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Timeline Parameters</span>
            </h3>

            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Disbursement Date</span>
              <span className="font-semibold font-mono">{new Date(loan.startDate).toLocaleDateString('en-IN')}</span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Accrual Period</span>
              <span className="font-semibold font-mono">
                {Math.max(0, Math.floor((new Date().getTime() - new Date(loan.startDate).getTime()) / (1000 * 60 * 60 * 24)))} days
              </span>
            </div>

            {loan.endDate && (
              <div className="flex justify-between text-xs border-t pt-2">
                <span className="text-muted-foreground">Settlement Date</span>
                <span className="font-semibold font-mono text-success">{new Date(loan.endDate).toLocaleDateString('en-IN')}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
