import Link from "next/link"
import CreateCustomerDialog from "@/components/create-customer-dialog"
import SearchInput from "@/components/search-input"
import { getCachedUser } from "@/lib/user"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { redirect } from "next/navigation"
import { ArrowRight, Users, ChevronLeft, ChevronRight, UserCheck, ShieldCheck, Banknote, UserPlus } from "lucide-react"
import DeleteCustomerButton from "@/components/delete-customer-button"
import { formatNumericCustomerId } from "@/lib/loan-utils"

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const dbUser = await getCachedUser()
  if (!dbUser || !dbUser.shopId) redirect('/login')

  const search = await searchParams
  const rawQuery = search?.query
  const query = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery
  
  const rawFilter = search?.filter
  const activeFilter = Array.isArray(rawFilter) ? rawFilter[0] : rawFilter || 'ALL'

  const cursor = Array.isArray(search?.cursor) ? search.cursor[0] : search?.cursor
  const direction = Array.isArray(search?.direction) ? search.direction[0] : search?.direction || 'next'
  const pageSize = 10

  const whereClause: Prisma.CustomerWhereInput = {
    shopId: dbUser.shopId,
    isDeleted: false,
  }

  if (dbUser.role === 'STAFF') {
    whereClause.branchId = dbUser.branchId || 'UNASSIGNED'
  }

  // Calculate Metrics for Header Cards
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalCustomersCount,
    activeLoanCustomersCount,
    kycVerifiedCount,
    newThisMonthCount
  ] = await Promise.all([
    prisma.customer.count({ where: whereClause }),
    prisma.customer.count({ where: { ...whereClause, loans: { some: { status: 'ACTIVE', isDeleted: false } } } }),
    prisma.customer.count({ where: { ...whereClause, panVerificationStatus: 'VERIFIED' } }),
    prisma.customer.count({ where: { ...whereClause, createdAt: { gte: startOfMonth } } }),
  ])

  if (activeFilter === 'ACTIVE_LOANS') {
    whereClause.loans = { some: { status: 'ACTIVE', isDeleted: false } }
  } else if (activeFilter === 'VERIFIED') {
    whereClause.panVerificationStatus = 'VERIFIED'
  }

  if (query) {
    whereClause.OR = [
      { firstName: { contains: query, mode: 'insensitive' } },
      { lastName: { contains: query, mode: 'insensitive' } },
      { phone: { contains: query, mode: 'insensitive' } },
      { aadhaar: { contains: query, mode: 'insensitive' } },
      { pan: { contains: query, mode: 'insensitive' } },
    ]
  }

  const takeCount = direction === 'prev' ? -(pageSize + 1) : (pageSize + 1)

  const rawCustomers = await prisma.customer.findMany({
    where: whereClause,
    include: {
      loans: {
        where: { isDeleted: false }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: takeCount,
    skip: cursor ? 1 : 0,
    ...(cursor ? { cursor: { id: cursor } } : {})
  })
  
  let hasNextPage = false
  let hasPrevPage = false
  const customers = [...rawCustomers]

  if (direction === 'next' || !cursor) {
    if (customers.length > pageSize) {
      hasNextPage = true
      customers.pop()
    }
    hasPrevPage = !!cursor
  } else if (direction === 'prev') {
    if (customers.length > pageSize) {
      hasPrevPage = true
      customers.shift()
    }
    hasNextPage = true
  }

  const firstCursor = customers.length > 0 ? customers[0].id : null
  const lastCursor = customers.length > 0 ? customers[customers.length - 1].id : null

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Page Header Bar */}
      <div className="rounded-xl border border-border bg-card shadow-subtle p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-subtle shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-sans font-bold tracking-tight text-foreground">Customer Directory</h2>
            <p className="text-xs text-foreground-secondary mt-0.5">Manage customer profiles, KYC verification and active loan accounts</p>
          </div>
        </div>
        <div className="shrink-0">
          <CreateCustomerDialog />
        </div>
      </div>

      {/* Metric KPI Summary Cards Header Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Customers */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Total Customers</span>
            <div className="h-8 w-8 rounded-lg bg-background-secondary text-foreground-muted flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-foreground">{totalCustomersCount}</div>
            <p className="text-xs text-foreground-muted mt-1">Registered customer profiles</p>
          </div>
        </div>

        {/* Active Loan Customers */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Active Borrowers</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-emerald-600">{activeLoanCustomersCount}</div>
            <p className="text-xs text-foreground-muted mt-1">Customers with active loans</p>
          </div>
        </div>

        {/* KYC Verified */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">KYC Verified</span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-primary">{kycVerifiedCount}</div>
            <p className="text-xs text-foreground-muted mt-1">Pan / Identity verified</p>
          </div>
        </div>

        {/* New This Month */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">New This Month</span>
            <div className="h-8 w-8 rounded-lg bg-background-secondary text-foreground-muted flex items-center justify-center">
              <UserPlus className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-foreground">{newThisMonthCount}</div>
            <p className="text-xs text-foreground-muted mt-1">Recent registrations</p>
          </div>
        </div>
      </div>

      {/* Main Content Card Container */}
      <div className="rounded-xl border border-border bg-card shadow-subtle overflow-hidden">
        
        {/* Controls Bar: Filter Pills & Search */}
        <div className="p-4 border-b border-border bg-background-secondary/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Tab Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            <Link 
              href={`/dashboard/customers?filter=ALL${query ? `&query=${query}` : ''}`}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === 'ALL' 
                  ? 'bg-primary text-primary-foreground shadow-subtle' 
                  : 'bg-background hover:bg-background-secondary text-foreground-secondary hover:text-foreground border border-border'
              }`}
            >
              <span>All Customers</span>
              <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${activeFilter === 'ALL' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background-secondary text-foreground-muted'}`}>
                {totalCustomersCount}
              </span>
            </Link>

            <Link 
              href={`/dashboard/customers?filter=ACTIVE_LOANS${query ? `&query=${query}` : ''}`}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === 'ACTIVE_LOANS' 
                  ? 'bg-emerald-600 text-white shadow-subtle' 
                  : 'bg-background hover:bg-background-secondary text-foreground-secondary hover:text-foreground border border-border'
              }`}
            >
              <span>Active Borrowers</span>
              <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${activeFilter === 'ACTIVE_LOANS' ? 'bg-white/20 text-white' : 'bg-background-secondary text-foreground-muted'}`}>
                {activeLoanCustomersCount}
              </span>
            </Link>

            <Link 
              href={`/dashboard/customers?filter=VERIFIED${query ? `&query=${query}` : ''}`}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeFilter === 'VERIFIED' 
                  ? 'bg-foreground text-background shadow-subtle' 
                  : 'bg-background hover:bg-background-secondary text-foreground-secondary hover:text-foreground border border-border'
              }`}
            >
              <span>KYC Verified</span>
              <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${activeFilter === 'VERIFIED' ? 'bg-background/20 text-background' : 'bg-background-secondary text-foreground-muted'}`}>
                {kycVerifiedCount}
              </span>
            </Link>
          </div>

          {/* Search Box */}
          <div className="w-full md:w-80 shrink-0">
            <SearchInput placeholder="Search name, mobile, Aadhaar or PAN..." />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-background border-b border-border text-[11px] uppercase tracking-wider text-foreground-secondary font-bold">
              <tr>
                <th className="px-5 py-3.5">Customer Name & ID</th>
                <th className="px-5 py-3.5">Contact Mobile</th>
                <th className="px-5 py-3.5">KYC Status</th>
                <th className="px-5 py-3.5">Active Loans</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-16 text-foreground-muted italic">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Users className="h-10 w-10 text-foreground-muted/40" />
                      <p className="text-sm font-medium">No customers found matching search criteria.</p>
                      <p className="text-xs text-foreground-muted">Try clearing search filters or add a new customer.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const activeLoans = customer.loans.filter(l => l.status === 'ACTIVE').length
                  return (
                    <tr key={customer.id} className="hover:bg-background-secondary/60 transition-colors group">
                      {/* Customer Name & ID */}
                      <td className="px-5 py-4">
                        <div>
                          <span className="font-semibold text-foreground block text-sm leading-tight">
                            {customer.firstName} {customer.lastName}
                          </span>
                          <span className="text-[11px] font-mono text-foreground-muted block mt-0.5">
                            ID: {formatNumericCustomerId(customer.id)}
                          </span>
                        </div>
                      </td>

                      {/* Contact Phone */}
                      <td className="px-5 py-4 font-mono text-sm text-foreground">
                        {customer.phone}
                      </td>

                      {/* KYC Status */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold uppercase ${
                          customer.panVerificationStatus === 'VERIFIED'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-destructive/10 text-destructive border border-destructive/20'
                        }`}>
                          KYC {customer.panVerificationStatus || 'UNVERIFIED'}
                        </span>
                      </td>

                      {/* Active Loans */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                          activeLoans > 0 
                            ? 'bg-primary/10 text-primary border border-primary/20' 
                            : 'bg-background-secondary text-foreground-secondary border border-border'
                        }`}>
                          {activeLoans} Active {activeLoans === 1 ? 'Loan' : 'Loans'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2 items-center">
                          <Link 
                            href={`/dashboard/customers/${customer.id}`} 
                            className="inline-flex items-center gap-1.5 border border-border bg-background hover:bg-background-secondary text-foreground px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-subtle"
                          >
                            <span>View Details</span>
                            <ArrowRight className="h-3.5 w-3.5 text-foreground-muted" />
                          </Link>
                          {dbUser.role !== 'STAFF' && (
                            <DeleteCustomerButton 
                              customerId={customer.id} 
                              customerName={`${customer.firstName} ${customer.lastName}`} 
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        {(hasPrevPage || hasNextPage) && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-background-secondary/40">
            <span className="text-xs text-foreground-secondary font-medium font-mono">
              Showing page records
            </span>
            <div className="flex items-center gap-2">
              {hasPrevPage && (
                <Link 
                  href={`/dashboard/customers?filter=${activeFilter}&cursor=${firstCursor}&direction=prev${query ? `&query=${query}` : ''}`}
                  className="px-3.5 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-background-secondary transition-colors text-xs font-medium flex items-center gap-1 shadow-subtle"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Link>
              )}
              {hasNextPage && (
                <Link 
                  href={`/dashboard/customers?filter=${activeFilter}&cursor=${lastCursor}&direction=next${query ? `&query=${query}` : ''}`}
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
