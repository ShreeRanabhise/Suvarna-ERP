import Link from "next/link"
import CreateLoanDialog from "@/components/create-loan-dialog"
import SearchInput from "@/components/search-input"
import { getCachedUser } from "@/lib/user"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { redirect } from "next/navigation"
import { ArrowRight, Landmark, ChevronLeft, ChevronRight, Banknote, AlertCircle, CheckCircle2, Scale, Shield } from "lucide-react"
import { calculateLoanBalances } from "@/lib/loan-utils"

function formatINR(amount: number) {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`
  }
  return `₹${amount.toLocaleString('en-IN')}`
}

export default async function LoansPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const dbUser = await getCachedUser()
  if (!dbUser || !dbUser.shopId) redirect('/login')

  const search = await searchParams
  const rawQuery = search?.query
  const query = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery
  
  const rawStatus = search?.status
  const statusFilter = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus
  
  const activeTab = statusFilter || 'ALL'
  
  const cursor = Array.isArray(search?.cursor) ? search.cursor[0] : search?.cursor
  const direction = Array.isArray(search?.direction) ? search.direction[0] : search?.direction || 'next'
  const pageSize = 10

  const whereClause: Prisma.LoanWhereInput = {
    shopId: dbUser.shopId,
    isDeleted: false,
  }
  
  if (dbUser.role === 'STAFF') {
    whereClause.branchId = dbUser.branchId || 'UNASSIGNED'
  }

  // Fetch KPI Counts for Tabs & Metric Header
  const [
    totalCount,
    activeCount,
    overdueCount,
    closedCount,
    activeLoansSummary,
    allLoansSummary
  ] = await Promise.all([
    prisma.loan.count({ where: whereClause }),
    prisma.loan.count({ where: { ...whereClause, status: 'ACTIVE' } }),
    prisma.loan.count({ where: { ...whereClause, status: 'OVERDUE' } }),
    prisma.loan.count({ where: { ...whereClause, status: 'CLOSED' } }),
    prisma.loan.aggregate({ where: { ...whereClause, status: 'ACTIVE' }, _sum: { principalAmount: true } }),
    prisma.loan.aggregate({ where: whereClause, _sum: { principalAmount: true } }),
  ])

  if (activeTab !== 'ALL') {
    whereClause.status = activeTab as Prisma.EnumLoanStatusFilter | "ACTIVE" | "CLOSED" | "OVERDUE" | "AUCTION" | "RENEWED"
  }

  if (query) {
    whereClause.OR = [
      { loanNumber: { contains: query, mode: 'insensitive' } },
      {
        customer: {
          is: {
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { phone: { contains: query, mode: 'insensitive' } },
            ]
          }
        }
      }
    ]
  }

  const takeCount = direction === 'prev' ? -(pageSize + 1) : (pageSize + 1)

  const rawLoans = await prisma.loan.findMany({
    where: whereClause,
    include: {
      customer: true,
      payments: true,
      pledgedItems: true,
    },
    orderBy: { createdAt: 'desc' },
    take: takeCount,
    skip: cursor ? 1 : 0,
    ...(cursor ? { cursor: { id: cursor } } : {})
  })
  
  let hasNextPage = false
  let hasPrevPage = false
  let loans = [...rawLoans]

  if (direction === 'next' || !cursor) {
    if (loans.length > pageSize) {
      hasNextPage = true
      loans.pop()
    }
    hasPrevPage = !!cursor
  } else if (direction === 'prev') {
    if (loans.length > pageSize) {
      hasPrevPage = true
      loans.shift()
    }
    hasNextPage = true
  }

  const firstCursor = loans.length > 0 ? loans[0].id : null
  const lastCursor = loans.length > 0 ? loans[loans.length - 1].id : null

  const totalActivePrincipal = Number(activeLoansSummary._sum.principalAmount || 0)
  const totalAllPrincipal = Number(allLoansSummary._sum.principalAmount || 0)

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Page Header Bar */}
      <div className="rounded-xl border border-border bg-card shadow-subtle p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-subtle shrink-0">
            <Landmark className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-sans font-bold tracking-tight text-foreground">Loans Ledger</h2>
            <p className="text-xs text-foreground-secondary mt-0.5">Manage gold loan agreements, repayments and pledged collateral</p>
          </div>
        </div>
        <div className="shrink-0">
          <CreateLoanDialog />
        </div>
      </div>

      {/* Metric KPI Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Loans Card */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Total Contracts</span>
            <div className="h-8 w-8 rounded-lg bg-background-secondary text-foreground-muted flex items-center justify-center">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-foreground">{totalCount}</div>
            <p className="text-xs text-foreground-muted mt-1">Disbursed: <span className="font-mono font-semibold text-foreground">{formatINR(totalAllPrincipal)}</span></p>
          </div>
        </div>

        {/* Active Loans Card */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Active Portfolio</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-emerald-600">{activeCount}</div>
            <p className="text-xs text-foreground-muted mt-1">Principal: <span className="font-mono font-semibold text-foreground">{formatINR(totalActivePrincipal)}</span></p>
          </div>
        </div>

        {/* Overdue Loans Card */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Overdue Loans</span>
            <div className="h-8 w-8 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-destructive">{overdueCount}</div>
            <p className="text-xs text-foreground-muted mt-1">Requires immediate follow-up</p>
          </div>
        </div>

        {/* Closed Loans Card */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Closed Contracts</span>
            <div className="h-8 w-8 rounded-lg bg-background-secondary text-foreground-muted flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-foreground">{closedCount}</div>
            <p className="text-xs text-foreground-muted mt-1">Fully settled agreements</p>
          </div>
        </div>
      </div>

      {/* Main Table Container Card */}
      <div className="rounded-xl border border-border bg-card shadow-subtle overflow-hidden">
        
        {/* Controls Bar: Tabs & Search Input */}
        <div className="p-4 border-b border-border bg-background-secondary/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Tab Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            <Link 
              href={`/dashboard/loans?status=ALL${query ? `&query=${query}` : ''}`}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ALL' 
                  ? 'bg-primary text-primary-foreground shadow-subtle' 
                  : 'bg-background hover:bg-background-secondary text-foreground-secondary hover:text-foreground border border-border'
              }`}
            >
              <span>All Loans</span>
              <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${activeTab === 'ALL' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background-secondary text-foreground-muted'}`}>
                {totalCount}
              </span>
            </Link>

            <Link 
              href={`/dashboard/loans?status=ACTIVE${query ? `&query=${query}` : ''}`}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ACTIVE' 
                  ? 'bg-emerald-600 text-white shadow-subtle' 
                  : 'bg-background hover:bg-background-secondary text-foreground-secondary hover:text-foreground border border-border'
              }`}
            >
              <span>Active</span>
              <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${activeTab === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-background-secondary text-foreground-muted'}`}>
                {activeCount}
              </span>
            </Link>

            <Link 
              href={`/dashboard/loans?status=OVERDUE${query ? `&query=${query}` : ''}`}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'OVERDUE' 
                  ? 'bg-destructive text-destructive-foreground shadow-subtle' 
                  : 'bg-background hover:bg-background-secondary text-foreground-secondary hover:text-foreground border border-border'
              }`}
            >
              <span>Overdue</span>
              <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${activeTab === 'OVERDUE' ? 'bg-destructive-foreground/20 text-destructive-foreground' : 'bg-background-secondary text-foreground-muted'}`}>
                {overdueCount}
              </span>
            </Link>

            <Link 
              href={`/dashboard/loans?status=CLOSED${query ? `&query=${query}` : ''}`}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'CLOSED' 
                  ? 'bg-foreground text-background shadow-subtle' 
                  : 'bg-background hover:bg-background-secondary text-foreground-secondary hover:text-foreground border border-border'
              }`}
            >
              <span>Closed</span>
              <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${activeTab === 'CLOSED' ? 'bg-background/20 text-background' : 'bg-background-secondary text-foreground-muted'}`}>
                {closedCount}
              </span>
            </Link>
          </div>

          {/* Search Input Box */}
          <div className="w-full md:w-80 shrink-0">
            <SearchInput placeholder="Search loan #, customer or mobile..." />
          </div>
        </div>

        {/* Main Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-background border-b border-border text-[11px] uppercase tracking-wider text-foreground-secondary font-bold">
              <tr>
                <th className="px-5 py-3.5">Loan ID</th>
                <th className="px-5 py-3.5">Customer Name</th>
                <th className="px-5 py-3.5">Pledged Collateral</th>
                <th className="px-5 py-3.5">Remaining Due</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {loans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-foreground-muted italic">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Landmark className="h-10 w-10 text-foreground-muted/40" />
                      <p className="text-sm font-medium">No gold loans found matching your criteria.</p>
                      <p className="text-xs text-foreground-muted">Try clearing search filters or create a new loan contract.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                loans.map((loan) => {
                  const balances = calculateLoanBalances(loan as unknown as import('@/lib/loan-utils').Loan)
                  const totalCollateralWeight = (loan.pledgedItems || []).reduce((sum, item) => sum + Number(item.weightGrams || 0), 0)
                  const pledgedItemsCount = (loan.pledgedItems || []).length

                  return (
                    <tr key={loan.id} className="hover:bg-background-secondary/60 transition-colors group">
                      {/* Loan Reference ID */}
                      <td className="px-5 py-4">
                        <div>
                          <span className="font-mono text-sm font-bold text-foreground block">
                            {loan.loanNumber}
                          </span>
                          <span className="text-[10px] text-foreground-muted">
                            {new Date(loan.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-foreground text-sm leading-tight">
                            {loan.customer.firstName} {loan.customer.lastName}
                          </p>
                          <span className="font-mono text-[11px] text-foreground-muted">
                            {loan.customer.phone}
                          </span>
                        </div>
                      </td>

                      {/* Collateral Summary */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 bg-background border border-border px-2 py-1 rounded text-xs font-medium text-foreground">
                            <Scale className="h-3.5 w-3.5 text-primary" />
                            <span>{totalCollateralWeight > 0 ? `${totalCollateralWeight.toFixed(2)} g` : 'No Weight'}</span>
                          </span>
                          <span className="text-[10px] text-foreground-muted font-mono">
                            ({pledgedItemsCount} {pledgedItemsCount === 1 ? 'item' : 'items'})
                          </span>
                        </div>
                      </td>

                      {/* Financial Balances */}
                      <td className="px-5 py-4">
                        <div>
                          <span className="font-mono text-sm font-bold text-foreground block">
                            ₹{balances.totalDue.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] text-foreground-muted font-mono">
                            Principal: ₹{Number(loan.principalAmount).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                          loan.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : loan.status === 'CLOSED'
                            ? 'bg-background-secondary text-foreground-secondary border border-border'
                            : 'bg-destructive/10 text-destructive border border-destructive/20'
                        }`}>
                          {loan.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {loan.status === 'ACTIVE' && (
                            <Link 
                              href={`/dashboard/loans/${loan.id}`}
                              className="inline-flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary-hover px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-subtle"
                            >
                              <span>Payment</span>
                            </Link>
                          )}
                          <Link 
                            href={`/dashboard/loans/${loan.id}`}
                            className="inline-flex items-center gap-1 border border-border bg-background hover:bg-background-secondary text-foreground px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-subtle"
                          >
                            <span>View Details</span>
                            <ArrowRight className="h-3.5 w-3.5 text-foreground-muted" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls Footer */}
        {(hasPrevPage || hasNextPage) && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-background-secondary/40">
            <span className="text-xs text-foreground-secondary font-medium font-mono">
              Showing page records
            </span>
            <div className="flex items-center gap-2">
              {hasPrevPage && (
                <Link 
                  href={`/dashboard/loans?status=${activeTab}&cursor=${firstCursor}&direction=prev${query ? `&query=${query}` : ''}`}
                  className="px-3.5 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-background-secondary transition-colors text-xs font-medium flex items-center gap-1 shadow-subtle"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Link>
              )}
              {hasNextPage && (
                <Link 
                  href={`/dashboard/loans?status=${activeTab}&cursor=${lastCursor}&direction=next${query ? `&query=${query}` : ''}`}
                  className="px-3.5 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-background-secondary transition-colors text-xs font-medium flex items-center gap-1 shadow-subtle"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
