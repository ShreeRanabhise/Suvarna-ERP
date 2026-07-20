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
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Customers</span>
        </Link>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 luxury-card rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20 shadow-sm">
            <User className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-bold font-heading text-slate-900 leading-tight">
              {customer.firstName} {customer.lastName}
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
              <span>Customer ID:</span>
              <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
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
        <div className="md:col-span-1 luxury-card rounded-2xl p-6 flex flex-col gap-5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest border-b pb-3">KYC Verification</h3>
          
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-slate-400">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase text-muted-foreground block font-medium">Contact Phone</span>
              <span className="font-bold text-sm text-slate-800 font-mono">{customer.phone}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-slate-400">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase text-muted-foreground block font-medium">Aadhaar UID</span>
              <span className="font-bold text-sm text-slate-800 font-mono">{customer.aadhaar}</span>
            </div>
          </div>

          {customer.pan && (
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-slate-400">
                <Shield className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase text-muted-foreground block font-medium">PAN Number</span>
                <span className="font-bold text-sm text-slate-800 font-mono uppercase">{customer.pan}</span>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 border-t pt-4">
            <div className="mt-0.5 text-slate-400">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase text-muted-foreground block font-medium">Residential Address</span>
              <span className="text-xs text-slate-700 leading-relaxed mt-0.5 block">{customer.address}</span>
            </div>
          </div>
        </div>

        {/* Stats Summary (Col 2 & 3) */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <div className="luxury-card rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Outstanding Principal
              </span>
              <span className="text-3xl font-extrabold font-mono text-primary">
                ₹{totalActivePrincipal.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-4">For {activeLoans.length} active gold loans</p>
          </div>

          <div className="luxury-card rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                Pledged Gold Weight
              </span>
              <span className="text-3xl font-extrabold font-mono text-success flex items-baseline gap-1">
                {totalPledgedGoldGrams.toFixed(2)} <span className="text-sm font-semibold text-slate-500 uppercase tracking-widest">g</span>
              </span>
            </div>
            <p className="text-[10px] text-muted-foreground mt-4">Safely locked in branch lockers</p>
          </div>

          <div className="luxury-card rounded-2xl p-6 flex flex-col justify-between col-span-2 bg-slate-50/50">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-1">
                  Overall Account Status
                </span>
                <span className="text-sm font-bold flex items-center gap-1.5 mt-1 text-slate-800">
                  <Sparkles className="h-4 w-4 text-primary" />
                  {activeLoans.length === 0 ? 'No Active Liabilities' : 'Active Collateral Pledges'}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase text-muted-foreground block font-medium">Total Gold Contracts</span>
                <span className="font-extrabold text-lg font-mono text-slate-800">{totalLoansCount}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Loan History */}
      <div className="luxury-card rounded-2xl overflow-hidden mt-2">
        <div className="p-5 border-b font-semibold font-heading text-base text-slate-800">Loan Records Ledger</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Loan ID</th>
                <th className="px-6 py-4">Pledge Item</th>
                <th className="px-6 py-4">Principal</th>
                <th className="px-6 py-4">Total Due</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {processedLoans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                    No loan history exists for this customer profile.
                  </td>
                </tr>
              ) : (
                processedLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">{loan.loanNumber}</td>
                    <td className="px-6 py-4 text-xs">
                      {loan.pledgedItems[0]?.name || 'N/A'} ({Number(loan.pledgedItems[0]?.weightGrams || 0)}g, {loan.pledgedItems[0]?.purity})
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-700">₹{Number(loan.principalAmount).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-700">
                      {loan.status === 'ACTIVE' ? `₹${Math.round(loan.totalDue).toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        loan.status === 'ACTIVE'
                          ? 'bg-success/10 text-success border border-success/20'
                          : loan.status === 'CLOSED'
                          ? 'bg-slate-100 text-slate-500 border border-slate-200'
                          : 'bg-destructive/10 text-destructive border border-destructive/20'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/dashboard/loans/${loan.id}`}
                        className="inline-flex items-center gap-1 border hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                      >
                        <span>{loan.status === 'ACTIVE' ? 'Repay' : 'Ledger'}</span>
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
  )
}
