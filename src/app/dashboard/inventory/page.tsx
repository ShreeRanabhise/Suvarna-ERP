import Link from "next/link"
import SearchInput from "@/components/search-input"
import ExportButton from "@/components/export-button"
import { getCachedUser } from "@/lib/user"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { redirect } from "next/navigation"
import { ArrowRight, Package, Scale, Landmark, ChevronLeft, ChevronRight, ExternalLink, Sparkles, CheckCircle2 } from "lucide-react"
import GoldItemThumbnail from "@/components/gold-item-thumbnail"

function formatINR(amount: number) {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`
  }
  return `₹${amount.toLocaleString('en-IN')}`
}

export default async function InventoryPage({
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
  const pageSize = 12

  const whereClause: Prisma.PledgedItemWhereInput = {
    shopId: dbUser.shopId,
    loan: {
      isDeleted: false,
    }
  }

  if (dbUser.role === 'STAFF') {
    whereClause.branchId = dbUser.branchId || 'UNASSIGNED'
  }

  if (activeTab !== 'ALL') {
    whereClause.loan = {
      ...(whereClause.loan as Prisma.LoanWhereInput),
      status: activeTab as any
    }
  }

  if (query) {
    whereClause.OR = [
      { name: { contains: query, mode: 'insensitive' } },
      { purity: { contains: query, mode: 'insensitive' } },
      {
        loan: {
          is: {
            OR: [
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
        }
      }
    ]
  }

  const takeCount = direction === 'prev' ? -(pageSize + 1) : (pageSize + 1)

  const [
    rawItems, 
    totalStats, 
    activeStats, 
    closedCount
  ] = await Promise.all([
    prisma.pledgedItem.findMany({
      where: whereClause,
      include: {
        loan: {
          include: {
            customer: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: takeCount,
      skip: cursor ? 1 : 0,
      ...(cursor ? { cursor: { id: cursor } } : {})
    }),
    prisma.pledgedItem.aggregate({
      where: dbUser.role === 'STAFF' 
        ? { shopId: dbUser.shopId, branchId: dbUser.branchId || 'UNASSIGNED', loan: { isDeleted: false } }
        : { shopId: dbUser.shopId, loan: { isDeleted: false } },
      _sum: {
        weightGrams: true,
        valuation: true,
      },
      _count: {
        id: true,
      }
    }),
    prisma.pledgedItem.aggregate({
      where: dbUser.role === 'STAFF'
        ? { shopId: dbUser.shopId, branchId: dbUser.branchId || 'UNASSIGNED', loan: { status: 'ACTIVE', isDeleted: false } }
        : { shopId: dbUser.shopId, loan: { status: 'ACTIVE', isDeleted: false } },
      _count: {
        id: true
      }
    }),
    prisma.pledgedItem.count({
      where: dbUser.role === 'STAFF'
        ? { shopId: dbUser.shopId, branchId: dbUser.branchId || 'UNASSIGNED', loan: { status: 'CLOSED', isDeleted: false } }
        : { shopId: dbUser.shopId, loan: { status: 'CLOSED', isDeleted: false } }
    })
  ])

  let hasNextPage = false
  let hasPrevPage = false
  let items = [...rawItems]

  if (direction === 'next' || !cursor) {
    if (items.length > pageSize) {
      hasNextPage = true
      items.pop()
    }
    hasPrevPage = !!cursor
  } else if (direction === 'prev') {
    if (items.length > pageSize) {
      hasPrevPage = true
      items.shift()
    }
    hasNextPage = true
  }

  const firstCursor = items.length > 0 ? items[0].id : null
  const lastCursor = items.length > 0 ? items[items.length - 1].id : null

  const totalVaultWeight = Number(totalStats._sum.weightGrams || 0)
  const totalValuation = Number(totalStats._sum.valuation || 0)
  const totalItemCount = totalStats._count.id
  const activeItemCount = activeStats._count.id

  const exportData = items.map(item => ({
    'Item Name': item.name,
    'Purity': item.purity,
    'Weight (Grams)': Number(item.weightGrams),
    'Valuation (₹)': Number(item.valuation),
    'Customer Name': `${item.loan.customer.firstName} ${item.loan.customer.lastName}`,
    'Customer Phone': item.loan.customer.phone,
    'Loan Number': item.loan.loanNumber,
    'Loan Status': item.loan.status,
    'Date Added': new Date(item.createdAt).toLocaleDateString('en-IN')
  }))

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Page Header Bar */}
      <div className="rounded-xl border border-border bg-card shadow-subtle p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-subtle shrink-0">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-sans font-bold tracking-tight text-foreground">Vault Inventory</h2>
            <p className="text-xs text-foreground-secondary mt-0.5">All pledged gold collateral items, weight metrics and appraisals</p>
          </div>
        </div>
        <div className="shrink-0">
          <ExportButton 
            data={exportData} 
            fileName={`Suvarna_Vault_Inventory_${new Date().getFullYear()}`} 
            sheetName="Gold Inventory"
            buttonText="Export Inventory"
          />
        </div>
      </div>

      {/* Metric KPI Summary Cards Header Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Vault Weight */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Total Vault Gold</span>
            <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-foreground">{totalVaultWeight.toFixed(2)}<span className="text-lg text-foreground-muted ml-1">g</span></div>
            <p className="text-xs text-foreground-muted mt-1">Total weight in lockers</p>
          </div>
        </div>

        {/* Total Valuation */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Total Valuation</span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Landmark className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-primary">{formatINR(totalValuation)}</div>
            <p className="text-xs text-foreground-muted mt-1">Appraised market value</p>
          </div>
        </div>

        {/* Active Collateral Items */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Active Collateral</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Sparkles className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-emerald-600">{activeItemCount}</div>
            <p className="text-xs text-foreground-muted mt-1">Pledged in active loans</p>
          </div>
        </div>

        {/* Total Pledged Items */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Total Pledged Items</span>
            <div className="h-8 w-8 rounded-lg bg-background-secondary text-foreground-muted flex items-center justify-center">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-foreground">{totalItemCount}</div>
            <p className="text-xs text-foreground-muted mt-1">Items catalogued in vault</p>
          </div>
        </div>
      </div>

      {/* Main Table Container Card */}
      <div className="rounded-xl border border-border bg-card shadow-subtle overflow-hidden">
        
        {/* Controls Bar: Filter Pills & Search Input */}
        <div className="p-4 border-b border-border bg-background-secondary/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          
          {/* Tab Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
            <Link 
              href={`/dashboard/inventory?status=ALL${query ? `&query=${query}` : ''}`}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ALL' 
                  ? 'bg-primary text-primary-foreground shadow-subtle' 
                  : 'bg-background hover:bg-background-secondary text-foreground-secondary hover:text-foreground border border-border'
              }`}
            >
              <span>All Items</span>
              <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${activeTab === 'ALL' ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background-secondary text-foreground-muted'}`}>
                {totalItemCount}
              </span>
            </Link>

            <Link 
              href={`/dashboard/inventory?status=ACTIVE${query ? `&query=${query}` : ''}`}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ACTIVE' 
                  ? 'bg-emerald-600 text-white shadow-subtle' 
                  : 'bg-background hover:bg-background-secondary text-foreground-secondary hover:text-foreground border border-border'
              }`}
            >
              <span>Active Collateral</span>
              <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${activeTab === 'ACTIVE' ? 'bg-white/20 text-white' : 'bg-background-secondary text-foreground-muted'}`}>
                {activeItemCount}
              </span>
            </Link>

            <Link 
              href={`/dashboard/inventory?status=CLOSED${query ? `&query=${query}` : ''}`}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'CLOSED' 
                  ? 'bg-foreground text-background shadow-subtle' 
                  : 'bg-background hover:bg-background-secondary text-foreground-secondary hover:text-foreground border border-border'
              }`}
            >
              <span>Released / Closed</span>
              <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${activeTab === 'CLOSED' ? 'bg-background/20 text-background' : 'bg-background-secondary text-foreground-muted'}`}>
                {closedCount}
              </span>
            </Link>
          </div>

          {/* Search Box */}
          <div className="w-full md:w-80 shrink-0">
            <SearchInput placeholder="Search item, purity, customer or loan #..." />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-background border-b border-border text-[11px] uppercase tracking-wider text-foreground-secondary font-bold">
              <tr>
                <th className="px-5 py-3.5">Gold Item</th>
                <th className="px-5 py-3.5">Weight & Purity</th>
                <th className="px-5 py-3.5">Valuation</th>
                <th className="px-5 py-3.5">Customer Info</th>
                <th className="px-5 py-3.5">Loan Contract #</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-foreground-muted italic">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="h-10 w-10 text-foreground-muted/40" />
                      <p className="text-sm font-medium">No pledged gold items found matching criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-background-secondary/60 transition-colors group">
                    {/* Item Thumbnail & Name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <GoldItemThumbnail
                          imageUrl={item.imageUrl}
                          itemName={item.name}
                          subtitle={`${Number(item.weightGrams).toFixed(2)}g • ${item.purity}`}
                        />
                        <div>
                          <span className="font-semibold text-foreground block text-sm">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-foreground-muted block font-mono">
                            Added: {new Date(item.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Weight & Purity */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-foreground">
                          {Number(item.weightGrams).toFixed(2)} g
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-700 border border-amber-500/20 font-mono dark:text-amber-400">
                          {item.purity}
                        </span>
                      </div>
                    </td>

                    {/* Valuation */}
                    <td className="px-5 py-4 font-mono text-sm text-primary font-bold">
                      ₹{Number(item.valuation).toLocaleString('en-IN')}
                    </td>

                    {/* Customer Info */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col">
                        <Link 
                          href={`/dashboard/customers/${item.loan.customer.id}`}
                          className="font-semibold text-foreground text-sm hover:text-primary transition-colors flex items-center gap-1 group/link"
                        >
                          <span>{item.loan.customer.firstName} {item.loan.customer.lastName}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity text-primary" />
                        </Link>
                        <span className="text-[11px] font-mono text-foreground-muted">
                          {item.loan.customer.phone}
                        </span>
                      </div>
                    </td>

                    {/* Loan Reference */}
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-0.5">
                        <Link 
                          href={`/dashboard/loans/${item.loan.id}`}
                          className="font-mono text-sm font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1 group/loan"
                        >
                          <span>{item.loan.loanNumber}</span>
                          <ExternalLink className="h-3 w-3 opacity-0 group-hover/loan:opacity-100 transition-opacity text-primary" />
                        </Link>
                        <span className={`inline-flex items-center gap-1 w-fit px-2 py-0.2 rounded text-[10px] font-bold uppercase ${
                          item.loan.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : 'bg-background-secondary text-foreground-secondary border border-border'
                        }`}>
                          {item.loan.status}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <Link 
                        href={`/dashboard/loans/${item.loan.id}`}
                        className="inline-flex items-center gap-1 border border-border bg-background hover:bg-background-secondary text-foreground px-3 py-1.5 rounded-md text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-subtle"
                      >
                        <span>View Contract</span>
                        <ArrowRight className="h-3.5 w-3.5 text-foreground-muted" />
                      </Link>
                    </td>
                  </tr>
                ))
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
                  href={`/dashboard/inventory?status=${activeTab}&cursor=${firstCursor}&direction=prev${query ? `&query=${query}` : ''}`}
                  className="px-3.5 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-background-secondary transition-colors text-xs font-medium flex items-center gap-1 shadow-subtle"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Link>
              )}
              {hasNextPage && (
                <Link 
                  href={`/dashboard/inventory?status=${activeTab}&cursor=${lastCursor}&direction=next${query ? `&query=${query}` : ''}`}
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
