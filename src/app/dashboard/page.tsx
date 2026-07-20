import { Suspense } from "react"
import { Users, Banknote, TrendingUp, AlertCircle, Scale, DollarSign, Wallet, ArrowUpRight } from "lucide-react"
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
    <div className="luxury-card rounded-3xl p-7 flex flex-col justify-between group h-32 animate-pulse bg-secondary/5">
      <div className="flex items-center justify-between pb-3">
        <div className="h-3 w-24 bg-muted rounded-full"></div>
        <div className="h-9 w-9 rounded-xl bg-muted"></div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="h-8 w-20 bg-muted rounded-md"></div>
        <div className="h-2 w-32 bg-muted rounded-full"></div>
      </div>
    </div>
  )
}

function ChartSkeleton() {
  return <div className="luxury-card rounded-3xl p-8 lg:col-span-4 h-96 animate-pulse bg-secondary/5"></div>
}

function ListSkeleton() {
  return <div className="luxury-card rounded-3xl p-8 lg:col-span-3 h-96 animate-pulse bg-secondary/5"></div>
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
    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <div className="luxury-card rounded-3xl p-7 flex flex-col justify-between group">
        <div className="flex items-center justify-between pb-3">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Total Customers</span>
          <div className="h-9 w-9 rounded-xl bg-secondary/5 group-hover:bg-primary/10 transition-colors duration-500 flex items-center justify-center text-secondary/40 group-hover:text-primary">
            <Users className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-4xl font-extrabold font-mono text-foreground tracking-tighter">{totalCustomers}</div>
          <p className="text-[11px] text-muted-foreground/70 mt-2 font-medium">Active in database</p>
        </div>
      </div>

      <div className="luxury-card rounded-3xl p-7 flex flex-col justify-between group">
        <div className="flex items-center justify-between pb-3">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Active Loans</span>
          <div className="h-9 w-9 rounded-xl bg-secondary/5 group-hover:bg-primary/10 transition-colors duration-500 flex items-center justify-center text-secondary/40 group-hover:text-primary">
            <Banknote className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-4xl font-extrabold font-mono text-foreground tracking-tighter">{activeLoansCount}</div>
          <p className="text-[11px] text-muted-foreground/70 mt-2 font-medium">Currently outstanding</p>
        </div>
      </div>

      <div className="luxury-card rounded-3xl p-7 flex flex-col justify-between group relative overflow-hidden">
        <div className="absolute right-0 bottom-0 w-32 h-32 bg-primary/5 rounded-tl-full blur-2xl transition-transform duration-700 group-hover:scale-150"></div>
        <div className="relative z-10 flex items-center justify-between pb-3">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Outstanding Balance</span>
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm shadow-primary/20">
            <TrendingUp className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="relative z-10 mt-4">
          <div className="text-4xl font-extrabold font-mono text-primary tracking-tighter">{formatINR(outstandingBalance)}</div>
          <p className="text-[11px] text-muted-foreground/70 mt-2 font-medium">Active capital in market</p>
        </div>
      </div>

      <div className="luxury-card rounded-3xl p-7 flex flex-col justify-between group">
        <div className="flex items-center justify-between pb-3">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Gold Reserved</span>
          <div className="h-9 w-9 rounded-xl bg-secondary/5 group-hover:bg-primary/10 transition-colors duration-500 flex items-center justify-center text-secondary/40 group-hover:text-primary">
            <Scale className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-4xl font-extrabold font-mono text-foreground tracking-tighter">{totalGoldReserved.toFixed(2)}<span className="text-2xl text-muted-foreground/50 ml-1">g</span></div>
          <p className="text-[11px] text-muted-foreground/70 mt-2 font-medium">Total weight in vault</p>
        </div>
      </div>

      <div className="luxury-card rounded-3xl p-7 flex flex-col justify-between group">
        <div className="flex items-center justify-between pb-3">
          <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Due / Overdue</span>
          <div className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
            <AlertCircle className="h-4.5 w-4.5" />
          </div>
        </div>
        <div className="mt-4">
          <div className="text-4xl font-extrabold font-mono text-destructive tracking-tighter">{dueThisMonthCount}</div>
          <p className="text-[11px] text-muted-foreground/70 mt-2 font-medium">Expiring by end of month</p>
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
    <div className="luxury-card rounded-3xl p-8 lg:col-span-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-border/40 pb-5 mb-7">
          <div>
            <h3 className="font-bold text-lg text-foreground tracking-tight">Monthly Disbursements</h3>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">Valuation trend over the last 6 months</p>
          </div>
          <span className="text-[10px] font-bold tracking-widest uppercase bg-secondary/5 text-secondary/60 px-3 py-1 rounded-full border border-border/50">
            Trend chart
          </span>
        </div>
        
        <div className="space-y-5">
          {monthlyDisbursementsData.map((data, idx) => {
            const maxVal = Math.max(...monthlyDisbursementsData.map(m => m.amount), 1)
            const percentage = (data.amount / maxVal) * 100
            return (
              <div key={idx} className="flex items-center gap-5 group">
                <span className="w-12 text-xs font-bold text-muted-foreground uppercase tracking-wider">{data.month}</span>
                <div className="flex-1 h-3 bg-secondary/5 rounded-full overflow-hidden shadow-inner">
                  <div 
                    className="h-full gold-gradient rounded-full transition-all duration-1000 ease-out relative overflow-hidden" 
                    style={{ width: `${percentage}%` }}
                  >
                     <div className="absolute inset-0 bg-white/20 w-full h-full transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  </div>
                </div>
                <span className="w-28 text-right text-sm font-mono font-bold text-foreground">
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
    <div className="luxury-card rounded-3xl p-8 lg:col-span-3 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between border-b border-border/40 pb-5 mb-5">
          <div>
            <h3 className="font-bold text-lg text-foreground tracking-tight">Recent Collections</h3>
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">Real-time payment logs</p>
          </div>
          <Link 
            href="/dashboard/reports"
            className="text-primary hover:text-primary/80 transition-colors text-xs font-bold uppercase tracking-wider flex items-center gap-1 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-full"
          >
            <span>Ledger</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        
        <div className="space-y-1">
          {recentPayments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-xs text-muted-foreground/60 italic font-medium">No payments recorded yet.</p>
            </div>
          ) : (
            recentPayments.map((payment) => (
              <div key={payment.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-secondary/5 transition-colors border border-transparent hover:border-border/50">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-secondary/5 border border-border/50 flex items-center justify-center font-bold text-sm text-foreground uppercase shadow-sm">
                    {payment.loan.customer.firstName[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate tracking-tight">
                      {payment.loan.customer.firstName} {payment.loan.customer.lastName}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-1 tracking-wider uppercase">
                      ID: {payment.loan.loanNumber}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-extrabold font-mono text-success tracking-tight">
                    +₹{Number(payment.amountPaid).toLocaleString('en-IN')}
                  </p>
                  <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-widest text-secondary/60 bg-secondary/5 px-2 py-0.5 rounded-md mt-1.5 border border-border/40">
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
    <div className="flex flex-col gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden rounded-3xl bg-secondary text-secondary-foreground p-8 md:p-10 border border-secondary-foreground/10 shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none -mr-32 -mt-32 transition-transform duration-1000 ease-out hover:scale-110" />
        <div className="relative z-10 max-w-xl">
          <span className="text-[10px] text-primary uppercase font-bold tracking-widest bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20 backdrop-blur-md">
            Gold Loan SaaS
          </span>
          <h2 className="text-3xl md:text-4xl font-heading text-secondary-foreground font-semibold mt-6 tracking-tight">
            Welcome back to your workspace
          </h2>
          <p className="text-secondary-foreground/60 text-sm mt-3 leading-relaxed font-light">
            Monitor and manage active gold ledger valuations, customer collateral parameters, and real-time payments allocations in one unified platform.
          </p>
        </div>
      </div>
      
      {/* KPI Cards Grid */}
      <Suspense fallback={
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <MetricSkeleton /><MetricSkeleton /><MetricSkeleton /><MetricSkeleton /><MetricSkeleton />
        </div>
      }>
        <KpiMetrics shopId={shopId} />
      </Suspense>

      {/* Main Charts & Activities Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
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
