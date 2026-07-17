import Link from "next/link"
import CreateLoanDialog from "@/components/create-loan-dialog"
import SearchInput from "@/components/search-input"
import { getCachedUser } from "@/lib/user"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ArrowRight, Landmark } from "lucide-react"

export default async function LoansPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string }>
}) {
  const dbUser = await getCachedUser()
  if (!dbUser || !dbUser.shopId) redirect('/login')

  const search = await searchParams
  const rawQuery = search?.query
  const query = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery
  
  const rawStatus = search?.status
  const statusFilter = Array.isArray(rawStatus) ? rawStatus[0] : rawStatus
  
  const activeTab = statusFilter || 'ALL'

  const whereClause: any = {
    shopId: dbUser.shopId,
    isDeleted: false,
  }
  
  if (activeTab !== 'ALL') {
    whereClause.status = activeTab
  }

  if (query) {
    whereClause.OR = [
      { loanNumber: { contains: query, mode: 'insensitive' } },
      {
        customer: {
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
          ]
        }
      }
    ]
  }

  const loans = await prisma.loan.findMany({
    where: whereClause,
    include: {
      customer: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
      <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-heading tracking-tight text-slate-900">Loan Contracts</h2>
          <p className="text-sm text-muted-foreground mt-1">Monitor, disburse, and manage all gold loan agreements</p>
        </div>
        <CreateLoanDialog />
      </div>

      <div className="flex items-center gap-2 border-b border-slate-200">
        <Link 
          href={`/dashboard/loans?status=ALL${query ? `&query=${query}` : ''}`}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'ALL' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          All Contracts
        </Link>
        <Link 
          href={`/dashboard/loans?status=ACTIVE${query ? `&query=${query}` : ''}`}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'ACTIVE' ? 'border-success text-success' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Active
        </Link>
        <Link 
          href={`/dashboard/loans?status=OVERDUE${query ? `&query=${query}` : ''}`}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'OVERDUE' ? 'border-destructive text-destructive' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Overdue
        </Link>
        <Link 
          href={`/dashboard/loans?status=CLOSED${query ? `&query=${query}` : ''}`}
          className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'CLOSED' ? 'border-slate-800 text-slate-800' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          Closed
        </Link>
      </div>

      <div className="luxury-card rounded-2xl overflow-hidden shadow-sm border border-slate-200/60 bg-white">
        {/* Table Filters & Search */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="w-full max-w-md">
            <SearchInput placeholder="Search by Loan ID, customer name or phone..." />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Loan Reference</th>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Principal Amount</th>
                <th className="px-6 py-4">Contract Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 italic">
                    No active gold loan contracts found.
                  </td>
                </tr>
              ) : (
                loans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">
                      {loan.loanNumber}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800 text-sm">
                        {loan.customer.firstName} {loan.customer.lastName}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-700 font-bold">
                      ₹{Number(loan.principalAmount).toLocaleString('en-IN')}
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
                      <div className="flex justify-end gap-2">
                        {loan.status === 'ACTIVE' && (
                          <Link 
                            href={`/dashboard/loans/${loan.id}`}
                            className="inline-flex items-center bg-primary text-white hover:gold-gradient-hover px-3 py-1.5 rounded-xl text-xs font-semibold shadow-sm transition"
                          >
                            <span>Repay</span>
                          </Link>
                        )}
                        <Link 
                          href={`/dashboard/loans/${loan.id}`}
                          className="inline-flex items-center gap-1 border hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-semibold transition"
                        >
                          <span>Details</span>
                          <ArrowRight className="h-3 w-3 text-slate-400" />
                        </Link>
                      </div>
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
