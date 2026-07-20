import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, User, Phone, MapPin, CreditCard, Shield, Plus, FileText, Sparkles, Scale } from 'lucide-react'
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
    const balances = calculateLoanBalances(loan as any)
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
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Customers</span>
        </Link>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-heading text-foreground">
              {customer.firstName} {customer.lastName}
            </h2>
            <p className="text-sm text-muted-foreground">Customer Profile</p>
          </div>
        </div>
        <div className="flex gap-2">
          <CreateLoanDialog customerId={customer.id} />
        </div>
      </div>

      {/* Grid: Info vs Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Contact Info (Col 1) */}
        <div className="md:col-span-1 bg-card border rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">KYC Details</h3>
          
          <div className="flex items-start gap-3">
            <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-xs text-muted-foreground block">Phone</span>
              <span className="font-semibold text-sm font-mono">{customer.phone}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <CreditCard className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-xs text-muted-foreground block">Aadhaar (ID)</span>
              <span className="font-semibold text-sm font-mono">{customer.aadhaar}</span>
            </div>
          </div>

          {customer.pan && (
            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="text-xs text-muted-foreground block">PAN</span>
                <span className="font-semibold text-sm font-mono uppercase">{customer.pan}</span>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <span className="text-xs text-muted-foreground block">Address</span>
              <span className="text-sm">{customer.address}</span>
            </div>
          </div>
        </div>

        {/* Stats Summary (Col 2 & 3) */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Outstanding Principal
              </span>
              <span className="text-3xl font-extrabold font-mono text-primary">
                ₹{totalActivePrincipal.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-4">For {activeLoans.length} active loans</p>
          </div>

          <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Pledged Gold Weight
              </span>
              <span className="text-3xl font-extrabold font-mono text-success flex items-baseline gap-1">
                {totalPledgedGoldGrams.toFixed(2)} <span className="text-sm font-medium">grams</span>
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-4">Safely locked in branch</p>
          </div>

          <div className="bg-card border rounded-2xl p-6 shadow-sm flex flex-col justify-between col-span-2">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Overall Account Status
                </span>
                <span className="text-lg font-semibold flex items-center gap-1.5 mt-1">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {activeLoans.length === 0 ? 'No Active Liability' : 'Active Gold Pledges'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs text-muted-foreground block">Total Loans Disbursed</span>
                <span className="font-bold text-lg font-mono">{totalLoansCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Loan History */}
      <div className="bg-card border rounded-2xl shadow-sm">
        <div className="p-5 border-b font-semibold font-heading text-lg">Loan Records</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-xs font-semibold">
              <tr>
                <th className="px-6 py-3 text-muted-foreground">Loan ID</th>
                <th className="px-6 py-3 text-muted-foreground">Pledge Item</th>
                <th className="px-6 py-3 text-muted-foreground">Principal</th>
                <th className="px-6 py-3 text-muted-foreground">Total Due</th>
                <th className="px-6 py-3 text-muted-foreground">Status</th>
                <th className="px-6 py-3 text-right text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {processedLoans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground italic">
                    No loan history exists for this customer.
                  </td>
                </tr>
              ) : (
                processedLoans.map((loan) => (
                  <tr key={loan.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-6 py-4 font-mono font-medium">{loan.loanNumber}</td>
                    <td className="px-6 py-4">
                      {loan.pledgedItems[0]?.name || 'N/A'} ({Number(loan.pledgedItems[0]?.weightGrams || 0)}g, {loan.pledgedItems[0]?.purity})
                    </td>
                    <td className="px-6 py-4 font-mono">₹{Number(loan.principalAmount).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 font-mono">
                      {loan.status === 'ACTIVE' ? `₹${Math.round(loan.totalDue).toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        loan.status === 'ACTIVE'
                          ? 'bg-success/10 text-success border-success/20'
                          : loan.status === 'CLOSED'
                          ? 'bg-muted text-muted-foreground border-muted-foreground/10'
                          : 'bg-destructive/10 text-destructive border-destructive/20'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/dashboard/loans/${loan.id}`}
                        className="text-primary hover:underline text-xs font-semibold"
                      >
                        {loan.status === 'ACTIVE' ? 'Repay / Manage' : 'View Ledger'}
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
