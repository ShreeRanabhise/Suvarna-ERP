import Link from "next/link"
import CreateLoanDialog from "@/components/create-loan-dialog"
import SearchInput from "@/components/search-input"
import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"

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
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-heading tracking-tight">Loans</h2>
        <CreateLoanDialog />
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-4 border-b flex items-center gap-4">
          <SearchInput placeholder="Search loan ID, customer name or phone..." />
        </div>
        <div className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-3 font-medium text-muted-foreground">Loan ID</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Customer</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Principal</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-6 py-3 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    No active loans found. Click "Create Loan" to create your first gold loan.
                  </td>
                </tr>
              ) : (
                loans.map((loan) => (
                  <tr key={loan.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-6 py-4 font-mono font-medium">{loan.loanNumber}</td>
                    <td className="px-6 py-4">
                      {loan.customer.firstName} {loan.customer.lastName}
                    </td>
                    <td className="px-6 py-4 font-mono">₹{Number(loan.principalAmount).toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                        loan.status === 'ACTIVE'
                          ? 'bg-success/10 text-success border-success/20'
                          : loan.status === 'CLOSED'
                          ? 'bg-muted text-muted-foreground border-muted-foreground/10'
                          : 'bg-destructive/10 text-destructive border-destructive/20'
                      }`}>
                        {loan.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {loan.status === 'ACTIVE' ? (
                        <Link 
                          href={`/dashboard/loans/${loan.id}`}
                          className="text-primary hover:underline text-xs font-semibold mr-4"
                        >
                          Receive Payment
                        </Link>
                      ) : null}
                      <Link 
                        href={`/dashboard/loans/${loan.id}`}
                        className="text-muted-foreground hover:underline text-xs font-semibold"
                      >
                        View Details
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
