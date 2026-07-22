import Link from "next/link"
import CreateLoanDialog from "@/components/create-loan-dialog"
import SearchInput from "@/components/search-input"
import { getCachedUser } from "@/lib/user"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { redirect } from "next/navigation"
import { ArrowRight, Landmark, ChevronLeft, ChevronRight } from "lucide-react"
import { calculateLoanBalances } from "@/lib/loan-utils"

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

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h2 className="text-2xl font-sans font-semibold tracking-tight text-foreground">Loan Contracts</h2>
          <p className="text-sm text-foreground-secondary mt-1">Monitor, disburse, and manage all gold loan agreements</p>
        </div>
        <CreateLoanDialog />
      </div>

      <div className="flex items-center gap-2 border-b border-border">
        <Link 
          href={`/dashboard/loans?status=ALL${query ? `&query=${query}` : ''}`}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ALL' ? 'border-primary text-primary' : 'border-transparent text-foreground-secondary hover:text-foreground'}`}
        >
          All Contracts
        </Link>
        <Link 
          href={`/dashboard/loans?status=ACTIVE${query ? `&query=${query}` : ''}`}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'ACTIVE' ? 'border-success text-success' : 'border-transparent text-foreground-secondary hover:text-foreground'}`}
        >
          Active
        </Link>
        <Link 
          href={`/dashboard/loans?status=OVERDUE${query ? `&query=${query}` : ''}`}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'OVERDUE' ? 'border-destructive text-destructive' : 'border-transparent text-foreground-secondary hover:text-foreground'}`}
        >
          Overdue
        </Link>
        <Link 
          href={`/dashboard/loans?status=CLOSED${query ? `&query=${query}` : ''}`}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'CLOSED' ? 'border-foreground text-foreground' : 'border-transparent text-foreground-secondary hover:text-foreground'}`}
        >
          Closed
        </Link>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-subtle overflow-hidden mt-4">
        {/* Table Filters & Search */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-4 bg-background-secondary/50">
          <div className="w-full max-w-md">
            <SearchInput placeholder="Search by Loan ID, customer name or phone..." />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Loan Reference</th>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Customer Name</th>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Total Due</th>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Contract Status</th>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-foreground-muted italic">
                    No active gold loan contracts found.
                  </td>
                </tr>
              ) : (
                loans.map((loan) => {
                  const balances = calculateLoanBalances(loan as unknown as import('@/lib/loan-utils').Loan)
                  return (
                  <tr key={loan.id} className="hover:bg-background-secondary transition-colors">
                    <td className="px-5 py-4 font-mono text-sm font-medium text-foreground">
                      {loan.loanNumber}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-medium text-foreground text-sm">
                        {loan.customer.firstName} {loan.customer.lastName}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono text-sm text-foreground font-semibold">
                      ₹{balances.totalDue.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium ${
                        loan.status === 'ACTIVE'
                          ? 'bg-success/10 text-success border border-success/20'
                          : loan.status === 'CLOSED'
                          ? 'bg-background-secondary text-foreground-secondary border border-border'
                          : 'bg-destructive/10 text-destructive border border-destructive/20'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {loan.status === 'ACTIVE' && (
                          <Link 
                            href={`/dashboard/loans/${loan.id}`}
                            className="inline-flex items-center bg-primary text-primary-foreground hover:bg-primary-hover px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                          >
                            <span>Repay</span>
                          </Link>
                        )}
                        <Link 
                          href={`/dashboard/loans/${loan.id}`}
                          className="inline-flex items-center gap-1.5 border border-border hover:bg-background-secondary text-foreground-secondary px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                        >
                          <span>Details</span>
                          <ArrowRight className="h-3 w-3" />
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
        
        {/* Pagination Controls */}
        {(hasPrevPage || hasNextPage) && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-background-secondary/50">
            <span className="text-xs text-foreground-secondary font-medium">
              Navigation
            </span>
            <div className="flex items-center gap-2">
              {hasPrevPage && (
                <Link 
                  href={`/dashboard/loans?status=${activeTab}&cursor=${firstCursor}&direction=prev${query ? `&query=${query}` : ''}`}
                  className="px-3 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-background-secondary transition-colors text-xs font-medium flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Link>
              )}
              {hasNextPage && (
                <Link 
                  href={`/dashboard/loans?status=${activeTab}&cursor=${lastCursor}&direction=next${query ? `&query=${query}` : ''}`}
                  className="px-3 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-background-secondary transition-colors text-xs font-medium flex items-center gap-1"
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
