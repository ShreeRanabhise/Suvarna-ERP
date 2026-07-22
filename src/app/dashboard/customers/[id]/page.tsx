import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, User, Phone, MapPin, CreditCard, Shield, Plus, FileText, Sparkles, Scale, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import CreateLoanDialog from '@/components/create-loan-dialog'
import { calculateLoanBalances } from '@/lib/loan-utils'

export default async function CustomerDetailPage(props: { params: Promise<{ id: string }> }) {
  const { id: customerId } = await props.params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id }
  })
  if (!dbUser || !dbUser.shopId) redirect('/login')

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, shopId: dbUser.shopId },
    include: {
      loans: {
        where: { isDeleted: false },
        include: { pledgedItems: true, payments: true },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!customer) {
    redirect('/dashboard/customers')
  }

  // Calculate statistics
  const activeLoans = customer.loans.filter(l => l.status === 'ACTIVE')
  const totalLoansCount = customer.loans.length
  
  let totalActivePrincipal = 0
  let totalPledgedGoldGrams = 0
  
  const processedLoans = customer.loans.map(loan => {
    const balances = calculateLoanBalances(loan as unknown as import('@/lib/loan-utils').Loan)
    const goldWeight = loan.pledgedItems.reduce((sum, item) => sum + Number(item.weightGrams), 0)
    
    if (loan.status === 'ACTIVE') {
      totalActivePrincipal += balances.outstandingPrincipal
      totalPledgedGoldGrams += goldWeight
    }

    return {
      ...loan,
      outstandingPrincipal: balances.outstandingPrincipal,
      interestDue: balances.interestDue,
      totalDue: balances.totalDue
    }
  })

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Back button */}
      <div>
        <Link 
          href="/dashboard/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-secondary hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Customers</span>
        </Link>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border border-border rounded-lg shadow-subtle p-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-primary-light rounded-md flex items-center justify-center text-primary">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-sans font-semibold text-foreground leading-tight">
              {customer.firstName} {customer.lastName}
            </h2>
            <div className="flex items-center gap-2 text-xs text-foreground-secondary mt-1">
              <span>Customer ID:</span>
              <span className="font-mono bg-background-secondary border border-border text-foreground-secondary px-1.5 py-0.5 rounded text-[10px]">
                {customer.id.slice(0, 8)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <CreateLoanDialog customerId={customer.id} />
        </div>
      </div>

      {/* Grid: Info vs Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Contact Info (Col 1) */}
        <div className="md:col-span-1 bg-card border border-border rounded-lg shadow-subtle p-6 flex flex-col gap-5">
          <h3 className="text-xs font-semibold text-foreground-secondary uppercase tracking-widest border-b border-border pb-3">KYC Verification</h3>
          
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-foreground-secondary">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase text-foreground-secondary block font-medium">Contact Phone</span>
              <span className="font-medium text-sm text-foreground font-mono">{customer.phone}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-foreground-secondary">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase text-foreground-secondary block font-medium">Aadhaar UID</span>
              <span className="font-medium text-sm text-foreground font-mono">{customer.aadhaar}</span>
            </div>
          </div>

          {customer.pan && (
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-foreground-secondary">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase text-foreground-secondary block font-medium">PAN Number</span>
                <span className="font-medium text-sm text-foreground font-mono uppercase">{customer.pan}</span>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 border-t border-border pt-4">
            <div className="mt-0.5 text-foreground-secondary">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase text-foreground-secondary block font-medium">Residential Address</span>
              <span className="text-xs text-foreground leading-relaxed mt-0.5 block">{customer.address}</span>
            </div>
          </div>
        </div>

        {/* Stats Summary (Col 2 & 3) */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg shadow-subtle p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider block mb-1">
                Outstanding Principal
              </span>
              <span className="text-3xl font-semibold font-mono text-primary">
                ₹{totalActivePrincipal.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[10px] text-foreground-secondary mt-4">For {activeLoans.length} active gold loans</p>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-subtle p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider block mb-1">
                Pledged Gold Weight
              </span>
              <span className="text-3xl font-semibold font-mono text-success flex items-baseline gap-1">
                {totalPledgedGoldGrams.toFixed(2)} <span className="text-sm font-semibold text-foreground-secondary uppercase tracking-widest">g</span>
              </span>
            </div>
            <p className="text-[10px] text-foreground-secondary mt-4">Safely locked in branch lockers</p>
          </div>

          <div className="bg-card border border-border rounded-lg shadow-subtle p-6 flex flex-col justify-between col-span-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider block mb-1">
                  Overall Account Status
                </span>
                <span className="text-sm font-medium flex items-center gap-1.5 mt-1 text-foreground">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {activeLoans.length === 0 ? 'No Active Liabilities' : 'Active Collateral Pledges'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-foreground-secondary block font-medium">Total Gold Contracts</span>
                <span className="font-semibold text-lg font-mono text-foreground">{totalLoansCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Loan History */}
      <div className="bg-card border border-border rounded-lg shadow-subtle overflow-hidden mt-2">
        <div className="p-5 border-b border-border font-semibold font-sans text-base text-foreground">Loan Records Ledger</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Loan ID</th>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Pledge Item</th>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Principal</th>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Total Due</th>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {processedLoans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-foreground-muted italic">
                    No loan history exists for this customer profile.
                  </td>
                </tr>
              ) : (
                processedLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-background-secondary transition-colors">
                    <td className="px-5 py-4 font-mono text-sm font-medium text-foreground">{loan.loanNumber}</td>
                    <td className="px-5 py-4 text-sm text-foreground">
                      {loan.pledgedItems[0]?.name || 'N/A'} ({Number(loan.pledgedItems[0]?.weightGrams || 0)}g, {loan.pledgedItems[0]?.purity})
                    </td>
                    <td className="px-5 py-4 font-mono text-sm text-foreground">₹{Number(loan.principalAmount).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-4 font-mono text-sm text-foreground">
                      {loan.status === 'ACTIVE' ? `₹${Math.round(loan.totalDue).toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium uppercase border ${
                        loan.status === 'ACTIVE'
                          ? 'bg-success/10 text-success border-success/20'
                          : loan.status === 'CLOSED'
                          ? 'bg-background-secondary text-foreground-secondary border-border'
                          : 'bg-destructive/10 text-destructive border-destructive/20'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link 
                        href={`/dashboard/loans/${loan.id}`}
                        className="inline-flex items-center gap-1 border border-border hover:bg-background-secondary text-foreground-secondary px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                      >
                        <span>{loan.status === 'ACTIVE' ? 'Repay' : 'Ledger'}</span>
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
  )
}
