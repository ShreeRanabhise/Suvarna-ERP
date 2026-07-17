import Link from "next/link"
import CreateLoanDialog from "@/components/create-loan-dialog"
import SearchInput from "@/components/search-input"
import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import { ArrowRight, Landmark } from "lucide-react"

export default async function LoansPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! }
  })
  if (!dbUser || !dbUser.shopId) redirect('/login')

  const { query } = await searchParams

  const loans = await prisma.loan.findMany({
    where: {
      shopId: dbUser.shopId,
      isDeleted: false,
      OR: query
        ? [
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
        : undefined,
    },
    include: {
      customer: true
    },
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading tracking-tight">Active Contracts</h2>
          <p className="text-xs text-muted-foreground mt-1">Monitor, disburse, and manage active gold loan agreements</p>
        </div>
        <CreateLoanDialog />
      </div>

      <div className="luxury-card rounded-2xl overflow-hidden">
        {/* Table Filters & Search */}
        <div className="p-5 border-b flex items-center justify-between gap-4 bg-slate-50/50">
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
