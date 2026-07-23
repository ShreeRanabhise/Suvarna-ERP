// Customer Profile Detail Page
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, User, Phone, MapPin, CreditCard, ShieldCheck, Shield, FileText, Sparkles, Plus, Scale, ArrowRight } from 'lucide-react'
import { formatAadhaar, formatPAN } from '@/lib/validation'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import CreateLoanDialog from '@/components/create-loan-dialog'
import CustomerProfileHeader from '@/components/customer-profile-header'
import DocumentGallery from '@/components/document-gallery'
import VerifyKYCButton from '@/components/verify-kyc-button'
import GoldItemThumbnail from '@/components/gold-item-thumbnail'
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

  const whereClause: any = { id: customerId, shopId: dbUser.shopId }
  if (dbUser.role === 'STAFF') {
    whereClause.branchId = dbUser.branchId || 'UNASSIGNED'
  }

  const customer = await prisma.customer.findFirst({
    where: whereClause,
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

  const activeGoldItems = activeLoans.flatMap(loan => 
    loan.pledgedItems.map(item => ({
      ...item,
      loanNumber: loan.loanNumber
    }))
  )

  const serializedCustomer = JSON.parse(JSON.stringify(customer))

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
      <CustomerProfileHeader 
        customerId={customer.id}
        firstName={customer.firstName}
        lastName={customer.lastName}
        customerPhotoUrl={customer.customerPhotoUrl}
        customer={serializedCustomer}
      />

      {/* Primary Customer Details & Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6 items-stretch">
        {/* Contact & KYC Info (Col 1) */}
        <div className="bg-card border border-border rounded-lg shadow-subtle p-5 md:p-6 flex flex-col justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-foreground-secondary">
              <Phone className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase text-foreground-secondary block font-medium">Contact Phone</span>
              <span className="font-semibold text-foreground text-sm font-mono">{customer.phone}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-foreground-secondary">
              <CreditCard className="h-4 w-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase text-foreground-secondary block font-medium">Aadhaar UID</span>
              <span className="font-medium text-sm text-foreground font-mono">{formatAadhaar(customer.aadhaar)}</span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-0.5 text-foreground-secondary">
              <ShieldCheck className="h-4 w-4 text-primary" />
            </div>
            <div>
              <span className="text-[10px] uppercase text-foreground-secondary block font-medium">PAN Card</span>
              <span className="font-medium text-sm text-foreground font-mono uppercase">{customer.pan ? formatPAN(customer.pan) : 'Not Provided'}</span>
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <VerifyKYCButton
              customerId={customer.id}
              currentStatus={customer.panVerificationStatus}
              verifiedAt={customer.panVerifiedAt}
              verifiedBy={customer.panVerifiedBy}
            />
          </div>

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

        {/* Stats Summary & Active Gold Items Gallery (Col 2 & 3) */}
        <div className="md:col-span-2 flex flex-col gap-3 h-full">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-lg shadow-subtle p-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-foreground-secondary uppercase tracking-wider block mb-1">
                  Outstanding Principal
                </span>
                <span className="text-xl md:text-2xl font-bold font-mono text-primary">
                  ₹{totalActivePrincipal.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[10px] text-foreground-muted mt-1.5 font-medium">For {activeLoans.length} active gold loans</p>
            </div>

            <div className="bg-card border border-border rounded-lg shadow-subtle p-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-semibold text-foreground-secondary uppercase tracking-wider block mb-1">
                  Pledged Gold Weight
                </span>
                <span className="text-xl md:text-2xl font-bold font-mono text-success flex items-baseline gap-1">
                  {totalPledgedGoldGrams.toFixed(2)} <span className="text-xs font-semibold text-foreground-secondary uppercase tracking-wider">g</span>
                </span>
              </div>
              <p className="text-[10px] text-foreground-muted mt-1.5 font-medium">Safely locked in branch lockers</p>
            </div>
          </div>

          <div className="flex-1 bg-card border border-border rounded-lg shadow-subtle p-5 md:p-6 flex flex-col justify-between gap-5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-start gap-4">
              <div>
                <span className="text-[11px] font-semibold text-foreground-secondary uppercase tracking-wider block mb-1">
                  Overall Account Status
                </span>
                <span className="text-sm md:text-base font-semibold flex items-center gap-1.5 text-foreground mt-0.5">
                  <Sparkles className="h-4 w-4 text-primary shrink-0" />
                  <span>{activeLoans.length === 0 ? 'No Active Liabilities' : 'Loan Records Ledger'}</span>
                </span>
              </div>
              <div className="text-left md:text-right border-t md:border-t-0 border-border pt-3 md:pt-0 w-full md:w-auto">
                <span className="text-[10px] uppercase text-foreground-secondary block font-semibold tracking-wider">Total Contracts</span>
                <span className="font-bold text-lg font-mono text-primary mt-0.5 block">{totalLoansCount}</span>
              </div>
            </div>

            {/* Active Pledged Gold Items Gallery */}
            <div className="border-t border-border pt-3.5 mt-1">
              <span className="text-[10px] uppercase text-foreground-secondary font-bold block mb-2 tracking-wider">
                Active Pledged Gold Gallery ({activeGoldItems.length} Items)
              </span>
              {activeGoldItems.length === 0 ? (
                <p className="text-xs text-foreground-muted italic py-1">No active gold items pledged.</p>
              ) : (
                <div className="flex items-center gap-3 overflow-x-auto pb-1.5 custom-scrollbar">
                  {activeGoldItems.map((goldItem) => (
                    <div key={goldItem.id} className="flex items-center gap-2.5 bg-background p-2.5 rounded-lg border border-border shrink-0 shadow-subtle">
                      <GoldItemThumbnail
                        imageUrl={goldItem.imageUrl}
                        itemName={goldItem.name}
                        subtitle={`${Number(goldItem.weightGrams).toFixed(2)}g • ${goldItem.purity} • ${goldItem.loanNumber}`}
                      />
                      <div className="pr-1">
                        <p className="text-xs font-bold text-foreground max-w-[120px] truncate">{goldItem.name}</p>
                        <p className="text-[10px] font-mono text-foreground-muted">{Number(goldItem.weightGrams).toFixed(2)}g • {goldItem.purity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Loan Records Ledger Table */}
            <div className="border-t border-border pt-3.5">
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead className="bg-background border-b border-border text-[10px] uppercase text-foreground-secondary font-semibold tracking-wider">
                    <tr>
                      <th className="px-3.5 py-2.5">Loan ID</th>
                      <th className="px-3.5 py-2.5">Principal</th>
                      <th className="px-3.5 py-2.5">Total Due</th>
                      <th className="px-3.5 py-2.5">Status</th>
                      <th className="px-3.5 py-2.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-card">
                    {processedLoans.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-6 text-foreground-muted italic">
                          No loan records for this customer profile.
                        </td>
                      </tr>
                    ) : (
                      processedLoans.map((loan) => (
                        <tr key={loan.id} className="hover:bg-background-secondary transition-colors">
                          <td className="px-3.5 py-2.5 font-mono font-semibold text-foreground">{loan.loanNumber}</td>
                          <td className="px-3.5 py-2.5 font-mono text-foreground">₹{Number(loan.principalAmount).toLocaleString('en-IN')}</td>
                          <td className="px-3.5 py-2.5 font-mono text-foreground">
                            {loan.status === 'ACTIVE' ? `₹${Math.round(loan.totalDue).toLocaleString('en-IN')}` : '-'}
                          </td>
                          <td className="px-3.5 py-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              loan.status === 'ACTIVE'
                                ? 'bg-success/10 text-success border-success/20'
                                : loan.status === 'CLOSED'
                                ? 'bg-background-secondary text-foreground-secondary border-border'
                                : 'bg-destructive/10 text-destructive border-destructive/20'
                            }`}>
                              {loan.status}
                            </span>
                          </td>
                          <td className="px-3.5 py-2.5 text-right">
                            <Link 
                              href={`/dashboard/loans/${loan.id}`}
                              className="inline-flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary-hover px-2.5 py-1 rounded text-[11px] font-bold transition-colors shadow-subtle"
                            >
                              <span>{loan.status === 'ACTIVE' ? 'Repay' : 'View'}</span>
                              <ArrowRight className="h-3 w-3" />
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
        </div>
      </div>

      {/* KYC Documents & Photos Gallery */}
      <DocumentGallery 
        customerPhotoUrl={customer.customerPhotoUrl}
        aadhaarPhotoUrl={customer.aadhaarPhotoUrl}
        panPhotoUrl={customer.panPhotoUrl}
        customerName={`${customer.firstName} ${customer.lastName}`}
        aadhaarNumber={customer.aadhaar}
        panNumber={customer.pan}
      />
    </div>
  )
}
