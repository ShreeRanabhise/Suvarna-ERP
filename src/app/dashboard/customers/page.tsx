import Link from "next/link"
import OnboardCustomerDialog from "@/components/onboard-customer-dialog"
import SearchInput from "@/components/search-input"
import { getCachedUser } from "@/lib/user"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ArrowRight, User } from "lucide-react"

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>
}) {
  const dbUser = await getCachedUser()
  if (!dbUser || !dbUser.shopId) redirect('/login')

  const { query } = await searchParams

  const customers = await prisma.customer.findMany({
    where: {
      shopId: dbUser.shopId,
      isDeleted: false,
      OR: query
        ? [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
            { aadhaar: { contains: query, mode: 'insensitive' } },
          ]
        : undefined,
    },
    include: {
      loans: {
        where: { isDeleted: false }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading tracking-tight">Customers</h2>
          <p className="text-xs text-muted-foreground mt-1">Manage and onboard active client profiles</p>
        </div>
        <OnboardCustomerDialog />
      </div>

      <div className="luxury-card rounded-2xl overflow-hidden">
        {/* Table Filters & Search */}
        <div className="p-5 border-b flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="w-full max-w-md">
            <SearchInput placeholder="Search by name, phone, or Aadhaar..." />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Client Detail</th>
                <th className="px-6 py-4">Phone Number</th>
                <th className="px-6 py-4">Active Gold Loans</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-slate-400 italic">
                    No customers found matching search criteria.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const activeLoans = customer.loans.filter(l => l.status === 'ACTIVE').length
                  return (
                    <tr key={customer.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-800 block text-sm">
                              {customer.firstName} {customer.lastName}
                            </span>
                            <span className="text-[10px] text-muted-foreground block font-mono">
                              ID: {customer.id.slice(0, 8)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">
                        {customer.phone}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          activeLoans > 0 
                            ? 'bg-primary/10 text-primary border border-primary/20' 
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {activeLoans} Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          href={`/dashboard/customers/${customer.id}`} 
                          className="inline-flex items-center gap-1 border hover:bg-slate-50 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                        >
                          <span>Profile</span>
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
