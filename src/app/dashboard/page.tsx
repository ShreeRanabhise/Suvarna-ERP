import { Users, Banknote, TrendingUp, AlertCircle, Scale, DollarSign, Wallet, ArrowUpRight } from "lucide-react"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"

import { getCachedUser } from "@/lib/user"

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
  const dbUser = await getCachedUser()
  if (!dbUser || !dbUser.shopId) redirect('/login')

  const shopId = dbUser.shopId

  // 1. Calculate dates needed for queries
  const now = new Date()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
  const sixMonthsAgo = new Date()

  // 2. Fetch all queries in parallel
  const [
    totalCustomers,
    activeLoansCount,
    outstandingAgg,
    dueThisMonthCount,
    goldReservedAgg,
    recentPayments,
    disbursements
  ] = await Promise.all([
    prisma.customer.count({
      where: { shopId, isDeleted: false }
    }),
    prisma.loan.count({
      where: { shopId, status: 'ACTIVE', isDeleted: false }
    }),
    prisma.loan.aggregate({
      where: { shopId, status: 'ACTIVE', isDeleted: false },
      _sum: { principalAmount: true }
    }),
    prisma.loan.count({
      where: {
        shopId,
        status: 'ACTIVE',
        isDeleted: false,
        endDate: {
          lte: endOfMonth
        }
      }
    }),
    prisma.pledgedItem.aggregate({
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
    }),
    prisma.payment.findMany({
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
    }),
    prisma.loan.findMany({
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
  ])

  const outstandingBalance = Number(outstandingAgg._sum.principalAmount || 0)
  const totalGoldReserved = Number(goldReservedAgg._sum.weightGrams || 0)

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
    <div className="flex flex-col gap-8 w-full">
      {/* Welcome Banner Card */}
      <div className="relative overflow-hidden rounded-2xl bg-[#0B0F19] text-white p-6 md:p-8 border border-slate-900 shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 max-w-xl">
          <span className="text-[10px] text-primary uppercase font-bold tracking-widest bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
            Gold Loan SaaS
          </span>
          <h2 className="text-2xl md:text-3xl font-heading text-white font-semibold mt-4">
            Welcome back to your workspace
          </h2>
          <p className="text-slate-400 text-sm mt-2 leading-relaxed">
            Monitor and manage active gold ledger valuations, customer collateral parameters, and real-time payments allocations in one unified platform.
          </p>
        </div>
      </div>
      
      {/* KPI Cards Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* Card 1 */}
        <div className="luxury-card rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Customers</span>
            <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold font-mono text-slate-900 leading-none">{totalCustomers}</div>
            <p className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
              Active in database
            </p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="luxury-card rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Loans</span>
            <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold font-mono text-slate-900 leading-none">{activeLoansCount}</div>
            <p className="text-[10px] text-muted-foreground mt-2">Currently outstanding</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="luxury-card rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Outstanding Balance</span>
            <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold font-mono text-primary leading-none">{formatINR(outstandingBalance)}</div>
            <p className="text-[10px] text-muted-foreground mt-2">Active capital in market</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="luxury-card rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Gold Reserved</span>
            <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
              <Scale className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold font-mono text-slate-900 leading-none">{totalGoldReserved.toFixed(2)} g</div>
            <p className="text-[10px] text-muted-foreground mt-2">Total weight in vault</p>
          </div>
        </div>

        {/* Card 5 */}
        <div className="luxury-card rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Due / Overdue</span>
            <div className="h-7 w-7 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
              <AlertCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold font-mono text-destructive leading-none">{dueThisMonthCount}</div>
            <p className="text-[10px] text-muted-foreground mt-2">Expiring by end of month</p>
          </div>
        </div>
      </div>

      {/* Main Charts & Activities Section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Left Card: Monthly Disbursements Chart */}
        <div className="luxury-card rounded-2xl p-6 lg:col-span-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <div>
                <h3 className="font-semibold text-base text-slate-800">Monthly Disbursements</h3>
                <p className="text-xs text-muted-foreground mt-1">Valuation trend over the last 6 months</p>
              </div>
              <span className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                Trend chart
              </span>
            </div>
            
            <div className="space-y-4">
              {monthlyDisbursementsData.map((data, idx) => {
                const maxVal = Math.max(...monthlyDisbursementsData.map(m => m.amount), 1)
                const percentage = (data.amount / maxVal) * 100
                return (
                  <div key={idx} className="flex items-center gap-4">
                    <span className="w-12 text-xs font-medium text-slate-500">{data.month}</span>
                    <div className="flex-1 h-3.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full gold-gradient rounded-full transition-all duration-700 ease-out" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-24 text-right text-xs font-mono font-bold text-slate-800">
                      ₹{data.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Right Card: Recent Collections */}
        <div className="luxury-card rounded-2xl p-6 lg:col-span-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b pb-4 mb-4">
              <div>
                <h3 className="font-semibold text-base text-slate-800">Recent Collections</h3>
                <p className="text-xs text-muted-foreground mt-1">Real-time payment logs</p>
              </div>
              <Link 
                href="/dashboard/reports"
                className="text-primary hover:underline text-xs font-semibold flex items-center gap-0.5"
              >
                <span>Ledger</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
            
            <div className="space-y-4.5">
              {recentPayments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-xs text-muted-foreground italic">No payments recorded yet.</p>
                </div>
              ) : (
                recentPayments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between pb-3 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-600 uppercase">
                        {payment.loan.customer.firstName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">
                          {payment.loan.customer.firstName} {payment.loan.customer.lastName}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          ID: {payment.loan.loanNumber}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-extrabold font-mono text-success">
                        +₹{Number(payment.amountPaid).toLocaleString('en-IN')}
                      </p>
                      <span className="inline-flex items-center text-[9px] font-bold uppercase text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded mt-1 font-mono">
                        {payment.paymentMode}
                      </span>
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
