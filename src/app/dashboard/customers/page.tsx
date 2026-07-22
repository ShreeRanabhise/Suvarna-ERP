import Link from "next/link"
import OnboardCustomerDialog from "@/components/onboard-customer-dialog"
import SearchInput from "@/components/search-input"
import { getCachedUser } from "@/lib/user"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { redirect } from "next/navigation"
import { ArrowRight, User, ChevronLeft, ChevronRight } from "lucide-react"
import DeleteCustomerButton from "@/components/delete-customer-button"

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

  if (query) {
    whereClause.OR = [
      { firstName: { contains: query, mode: 'insensitive' } },
      { lastName: { contains: query, mode: 'insensitive' } },
      { phone: { contains: query, mode: 'insensitive' } },
      { aadhaar: { contains: query, mode: 'insensitive' } },
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
  let customers = [...rawCustomers]

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
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-sans font-semibold tracking-tight text-foreground">Customers</h2>
          <p className="text-sm text-foreground-secondary mt-1">Manage and onboard active client profiles</p>
        </div>
        <OnboardCustomerDialog />
      </div>

      <div className="rounded-lg border border-border bg-card shadow-subtle overflow-hidden mt-4">
        {/* Table Filters & Search */}
        <div className="p-4 border-b border-border flex items-center justify-between gap-4 bg-background-secondary/50">
          <div className="w-full max-w-md">
            <SearchInput placeholder="Search by name, phone, or Aadhaar..." />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Client Detail</th>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Phone Number</th>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Active Gold Loans</th>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-foreground-muted italic">
                    No customers found matching search criteria.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const activeLoans = customer.loans.filter(l => l.status === 'ACTIVE').length
                  return (
                    <tr key={customer.id} className="hover:bg-background-secondary transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-md bg-secondary flex items-center justify-center text-foreground font-semibold text-sm">
                            {customer.firstName[0]}
                          </div>
                          <div>
                            <span className="font-semibold text-foreground block text-sm">
                              {customer.firstName} {customer.lastName}
                            </span>
                            <span className="text-[10px] text-foreground-muted block font-mono mt-0.5">
                              ID: {customer.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-sm text-foreground">
                        {customer.phone}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium ${
                          activeLoans > 0 
                            ? 'bg-primary-light text-primary border border-primary/20' 
                            : 'bg-background-secondary text-foreground-secondary border border-border'
                        }`}>
                          {activeLoans} Active
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right flex justify-end gap-2">
                        <Link 
                          href={`/dashboard/customers/${customer.id}`} 
                          className="inline-flex items-center gap-1.5 border border-border hover:bg-background-secondary text-foreground-secondary px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
                        >
                          <span>Profile</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                        {dbUser.role !== 'STAFF' && (
                          <DeleteCustomerButton 
                            customerId={customer.id} 
                            customerName={`${customer.firstName} ${customer.lastName}`} 
                          />
                        )}
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
                  href={`/dashboard/customers?cursor=${firstCursor}&direction=prev${query ? `&query=${query}` : ''}`}
                  className="px-3 py-1.5 rounded-md border border-border bg-card text-foreground hover:bg-background-secondary transition-colors text-xs font-medium flex items-center gap-1"
                >
                  <ChevronLeft className="h-4 w-4" /> Previous
                </Link>
              )}
              {hasNextPage && (
                <Link 
                  href={`/dashboard/customers?cursor=${lastCursor}&direction=next${query ? `&query=${query}` : ''}`}
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
