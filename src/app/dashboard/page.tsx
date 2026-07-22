import { Suspense } from "react"
import { Users, Banknote, TrendingUp, AlertCircle, Scale, ArrowUpRight } from "lucide-react"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getCachedUser } from "@/lib/user"

function formatINR(amount: number) {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2)} Cr`
  } else if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(2)} L`
  }
  return `₹${amount.toLocaleString('en-IN')}`
}

function MetricSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card shadow-subtle p-6 flex flex-col justify-between h-32 animate-pulse">
      <div className="flex items-center justify-between pb-3">
        <div className="h-3 w-24 bg-background-secondary rounded-full"></div>
        <div className="h-8 w-8 rounded-md bg-background-secondary"></div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-6 w-20 bg-background-secondary rounded-md"></div>
        <div className="h-2 w-32 bg-background-secondary rounded-full"></div>
      </div>
    </div>
  )
}

function ChartSkeleton() {
  return <div className="rounded-lg border border-border bg-card shadow-subtle p-6 lg:col-span-4 h-96 animate-pulse"></div>
}

function ListSkeleton() {
  return <div className="rounded-lg border border-border bg-card shadow-subtle p-6 lg:col-span-3 h-96 animate-pulse"></div>
}

async function KpiMetrics({ shopId }: { shopId: string }) {
  const now = new Date()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  const [
    totalCustomers,
    activeLoansCount,
    outstandingAgg,
    repaidAgg,
    dueThisMonthCount,
    goldReservedAgg,
  ] = await Promise.all([
    prisma.customer.count({ where: { shopId, isDeleted: false } }),
    prisma.loan.count({ where: { shopId, status: 'ACTIVE', isDeleted: false } }),
    prisma.loan.aggregate({ where: { shopId, status: 'ACTIVE', isDeleted: false }, _sum: { principalAmount: true } }),
    prisma.payment.aggregate({ where: { loan: { shopId, status: 'ACTIVE', isDeleted: false } }, _sum: { principalPaid: true } }),
    prisma.loan.count({ where: { shopId, status: 'ACTIVE', isDeleted: false, endDate: { lte: endOfMonth } } }),
    prisma.pledgedItem.aggregate({ where: { loan: { shopId, status: 'ACTIVE', isDeleted: false } }, _sum: { weightGrams: true } }),
  ])

  const totalPrincipal = Number(outstandingAgg._sum.principalAmount || 0)
  const totalRepaidPrincipal = Number(repaidAgg._sum.principalPaid || 0)
  const outstandingBalance = totalPrincipal - totalRepaidPrincipal
  const totalGoldReserved = Number(goldReservedAgg._sum.weightGrams || 0)

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <div className="rounded-lg border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3">
          <span className="text-sm font-medium text-foreground-secondary">Total Customers</span>
          <div className="h-8 w-8 rounded-md bg-background-secondary flex items-center justify-center text-foreground-muted">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-foreground">{totalCustomers}</div>
          <p className="text-xs text-foreground-muted mt-1">Active in database</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3">
          <span className="text-sm font-medium text-foreground-secondary">Active Loans</span>
          <div className="h-8 w-8 rounded-md bg-background-secondary flex items-center justify-center text-foreground-muted">
            <Banknote className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-foreground">{activeLoansCount}</div>
          <p className="text-xs text-foreground-muted mt-1">Currently outstanding</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3">
          <span className="text-sm font-medium text-foreground-secondary">Outstanding Balance</span>
          <div className="h-8 w-8 rounded-md bg-primary-light flex items-center justify-center text-primary">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-primary">{formatINR(outstandingBalance)}</div>
          <p className="text-xs text-foreground-muted mt-1">Active capital in market</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3">
          <span className="text-sm font-medium text-foreground-secondary">Gold Reserved</span>
          <div className="h-8 w-8 rounded-md bg-background-secondary flex items-center justify-center text-foreground-muted">
            <Scale className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-foreground">{totalGoldReserved.toFixed(2)}<span className="text-lg text-foreground-muted ml-1">g</span></div>
          <p className="text-xs text-foreground-muted mt-1">Total weight in vault</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3">
          <span className="text-sm font-medium text-foreground-secondary">Due / Overdue</span>
          <div className="h-8 w-8 rounded-md bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertCircle className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2">
          <div className="text-2xl font-bold font-mono text-destructive">{dueThisMonthCount}</div>
          <p className="text-xs text-foreground-muted mt-1">Expiring by end of month</p>
        </div>
      </div>
    </div>
  )
}

async function MonthlyDisbursements({ shopId }: { shopId: string }) {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const disbursements = await prisma.loan.findMany({
    where: { shopId, isDeleted: false, startDate: { gte: sixMonthsAgo } },
    select: { principalAmount: true, startDate: true }
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
      .reduce((sum, d) => sum + Number(d.principalAmount), 0)

    return { month: monthName, amount: totalAmount }
  })

  return (
    <div className="rounded-lg border border-border bg-card shadow-subtle p-6 lg:col-span-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
          <div>
            <h3 className="font-semibold text-lg text-foreground tracking-tight">Monthly Disbursements</h3>
            <p className="text-xs text-foreground-muted mt-1">Valuation trend over the last 6 months</p>
          </div>
          <span className="text-xs font-medium text-foreground-secondary bg-background-secondary px-2 py-1 rounded-md border border-border">
            Trend chart
          </span>
        </div>
        
        <div className="space-y-4">
          {monthlyDisbursementsData.map((data, idx) => {
            const maxVal = Math.max(...monthlyDisbursementsData.map(m => m.amount), 1)
            const percentage = (data.amount / maxVal) * 100
            return (
              <div key={idx} className="flex items-center gap-4">
                <span className="w-10 text-xs font-medium text-foreground-secondary">{data.month}</span>
                <div className="flex-1 h-2.5 bg-background-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary rounded-full" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <span className="w-24 text-right text-sm font-mono font-semibold text-foreground">
                  ₹{data.amount.toLocaleString('en-IN')}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

async function RecentCollections({ shopId }: { shopId: string }) {
  const recentPayments = await prisma.payment.findMany({
    where: { loan: { shopId, isDeleted: false } },
    include: { loan: { include: { customer: true } } },
    orderBy: { paymentDate: 'desc' },
    take: 5
  })

  return (
    <div className="rounded-lg border border-border bg-card shadow-subtle p-6 lg:col-span-3 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div>
            <h3 className="font-semibold text-lg text-foreground tracking-tight">Recent Collections</h3>
            <p className="text-xs text-foreground-muted mt-1">Real-time payment logs</p>
          </div>
          <Link 
            href="/dashboard/reports"
            className="text-primary hover:text-primary-hover transition-colors text-xs font-medium flex items-center gap-1 bg-primary-light px-2 py-1 rounded-md"
          >
            <span>Ledger</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        
        <div className="space-y-2">
          {recentPayments.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xs text-foreground-muted italic">No payments recorded yet.</p>
            </div>
          ) : (
            recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 rounded-md hover:bg-background-secondary transition-colors border border-transparent">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-md bg-secondary text-foreground flex items-center justify-center font-bold text-xs uppercase">
                    {payment.loan.customer.firstName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {payment.loan.customer.firstName} {payment.loan.customer.lastName}
                    </p>
                    <p className="text-[10px] text-foreground-muted font-mono mt-0.5 uppercase">
                      ID: {payment.loan.loanNumber}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold font-mono text-success">
                    +₹{Number(payment.amountPaid).toLocaleString('en-IN')}
                  </p>
                  <span className="inline-block text-[10px] font-medium text-foreground-secondary bg-background border border-border px-1.5 py-0.5 rounded mt-1">
                    {payment.paymentMode}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const dbUser = await getCachedUser()
  if (!dbUser || !dbUser.shopId) redirect('/login')
  const shopId = dbUser.shopId

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* Welcome Banner Card */}
      <div className="rounded-lg border border-border bg-card shadow-subtle p-8 flex flex-col gap-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-primary bg-primary-light px-2 py-1 rounded-md">
            Gold Loan SaaS
          </span>
        </div>
        <h2 className="text-2xl font-sans font-semibold tracking-tight text-foreground">
          Welcome back to your workspace
        </h2>
        <p className="text-sm text-foreground-secondary max-w-2xl">
          Monitor and manage active gold ledger valuations, customer collateral parameters, and real-time payments allocations in one unified platform.
        </p>
      </div>
      
      {/* KPI Cards Grid */}
      <Suspense fallback={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <MetricSkeleton /><MetricSkeleton /><MetricSkeleton /><MetricSkeleton /><MetricSkeleton />
        </div>
      }>
        <KpiMetrics shopId={shopId} />
      </Suspense>

      {/* Main Charts & Activities Section */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Suspense fallback={<ChartSkeleton />}>
          <MonthlyDisbursements shopId={shopId} />
        </Suspense>

        <Suspense fallback={<ListSkeleton />}>
          <RecentCollections shopId={shopId} />
        </Suspense>
      </div>
    </div>
  )
}
