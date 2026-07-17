import { Users, Banknote, TrendingUp, AlertCircle, Scale } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"

// Utility helper to format currency in Indian style (Lakh/Crore)
function formatINR(amount: number) {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`
  }
  return `₹${amount.toLocaleString('en-IN')}`
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! }
  })
  if (!dbUser || !dbUser.shopId) redirect('/login')

  const shopId = dbUser.shopId

  // 1. Total Customers count
  const totalCustomers = await prisma.customer.count({
    where: { shopId, isDeleted: false }
  })

  // 2. Active Loans count
  const activeLoansCount = await prisma.loan.count({
    where: { shopId, status: 'ACTIVE', isDeleted: false }
  })

  // 3. Sum of outstanding principal balance for active loans
  const outstandingAgg = await prisma.loan.aggregate({
    where: { shopId, status: 'ACTIVE', isDeleted: false },
    _sum: { principalAmount: true }
  })
  const outstandingBalance = outstandingAgg._sum.principalAmount || 0

  // 4. Active Loans due/expired by the end of this month
  const now = new Date()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  const dueThisMonthCount = await prisma.loan.count({
    where: {
      shopId,
      status: 'ACTIVE',
      isDeleted: false,
      endDate: {
        lte: endOfMonth
      }
    }
  })

  // 5. Total Gold Reserved (weight of pledged items for active loans)
  const goldReservedAgg = await prisma.pledgedItem.aggregate({
    where: {
      loan: {
        shopId,
        status: 'ACTIVE',
        isDeleted: false
      }
    },
    _sum: {
      weightGrams: true
    }
  })
  const totalGoldReserved = goldReservedAgg._sum.weightGrams || 0

  // 5. Query recent 5 payments
  const recentPayments = await prisma.payment.findMany({
    where: {
      loan: {
        shopId,
        isDeleted: false
      }
    },
    include: {
      loan: {
        include: {
          customer: true
        }
      }
    },
    orderBy: { paymentDate: 'desc' },
    take: 5
  })

  // 6. Query monthly disbursements (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5)
  sixMonthsAgo.setDate(1)
  sixMonthsAgo.setHours(0,0,0,0)

  const disbursements = await prisma.loan.findMany({
    where: {
      shopId,
      isDeleted: false,
      startDate: { gte: sixMonthsAgo }
    },
    select: {
      principalAmount: true,
      startDate: true
    }
  })

  const monthlyDisbursementsData = Array.from({ length: 6 }).map((_, idx) => {
    const date = new Date()
    date.setMonth(date.getMonth() - (5 - idx))
    const monthName = date.toLocaleString('default', { month: 'short' })
    const year = date.getFullYear()
    const monthNumber = date.getMonth()

    const totalAmount = disbursements
      .filter(d => {
        const dDate = new Date(d.startDate)
        return dDate.getMonth() === monthNumber && dDate.getFullYear() === year
      })
      .reduce((sum, d) => sum + d.principalAmount, 0)

    return { month: monthName, amount: totalAmount }
  })

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-3xl font-heading tracking-tight">Overview</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* KPI Cards */}
        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Total Customers</h3>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold font-mono">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Registered in your database</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Active Loans</h3>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold font-mono">{activeLoansCount}</div>
            <p className="text-xs text-muted-foreground">Currently outstanding</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Outstanding Balance</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold font-mono text-primary">{formatINR(outstandingBalance)}</div>
            <p className="text-xs text-muted-foreground">Across all active loans</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Gold Reserved</h3>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold font-mono text-primary">{totalGoldReserved.toFixed(2)} g</div>
            <p className="text-xs text-muted-foreground">Total weight of pledged gold</p>
          </div>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow">
          <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Due/Soon Overdue</h3>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold font-mono text-destructive">{dueThisMonthCount}</div>
            <p className="text-xs text-muted-foreground">Expiring by end of month</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="rounded-xl border bg-card text-card-foreground shadow lg:col-span-4">
          <div className="p-6">
            <h3 className="font-semibold leading-none tracking-tight">Monthly Disbursements</h3>
            <p className="text-sm text-muted-foreground mt-2">Loan disbursements over the last 6 months.</p>
            {/* Displaying simple HTML progress bars for visual graphing */}
            <div className="mt-6 space-y-4">
              {monthlyDisbursementsData.map((data, idx) => {
                const maxVal = Math.max(...monthlyDisbursementsData.map(m => m.amount), 1)
                const percentage = (data.amount / maxVal) * 100
                return (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="w-12 text-sm text-muted-foreground">{data.month}</span>
                    <div className="flex-1 h-4 bg-muted/30 rounded overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-20 text-right text-xs font-mono font-medium">
                      ₹{data.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        <div className="rounded-xl border bg-card text-card-foreground shadow lg:col-span-3">
          <div className="p-6">
            <h3 className="font-semibold leading-none tracking-tight">Recent Payments</h3>
            <p className="text-sm text-muted-foreground mt-2">Latest loan installments recorded.</p>
            <div className="mt-4 space-y-4">
              {recentPayments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">No payments recorded yet.</p>
              ) : (
                recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <div>
                      <p className="text-sm font-medium">{payment.loan.loanNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {payment.loan.customer.firstName} {payment.loan.customer.lastName}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-success">
                        +₹{payment.amountPaid.toLocaleString('en-IN')}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {payment.paymentMode}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
