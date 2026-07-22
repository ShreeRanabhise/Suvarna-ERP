import prisma from '@/lib/prisma'
import { Plus, ToggleLeft, ToggleRight, DollarSign, Store, Activity, AlertTriangle } from 'lucide-react'
import CreateShopDialog from './create-shop-dialog'
import ShopRow from './shop-row'

export default async function SuperAdminDashboard() {
  const shops = await prisma.shop.findMany({
    include: {
      users: {
        where: { role: 'OWNER' }
      },
      _count: {
        select: { customers: true, loans: true }
      }
    }
  })

  // Calculate platform statistics
  const activeShopsCount = shops.filter(s => new Date(s.subscriptionEnd) > new Date()).length
  const suspendedShopsCount = shops.length - activeShopsCount
  
  // Calculate mock revenue based on plans (STANDARD: ₹3,599/yr, ENTERPRISE: ₹9,999/yr)
  const totalRevenue = shops.reduce((acc, shop) => {
    let price = shop.subscriptionPlan === 'ENTERPRISE' ? 9999 : 3599
    if (shop.whatsappAddon) price += 499 * 12 // Annualized addon
    return acc + price
  }, 0)

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-2xl font-sans font-semibold tracking-tight text-foreground">Platform Overview</h2>
        <CreateShopDialog />
      </div>

      {/* Analytics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-card shadow-subtle p-5">
          <div className="flex flex-row items-center justify-between pb-3">
            <h3 className="text-sm font-medium text-foreground-secondary">Estimated ARR</h3>
            <DollarSign className="h-4 w-4 text-foreground-muted" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">₹{totalRevenue.toLocaleString('en-IN')}</div>
          <p className="text-xs text-foreground-muted mt-1">Annualized platform run-rate</p>
        </div>

        <div className="rounded-lg border border-border bg-card shadow-subtle p-5">
          <div className="flex flex-row items-center justify-between pb-3">
            <h3 className="text-sm font-medium text-foreground-secondary">Active Tenants</h3>
            <Store className="h-4 w-4 text-foreground-muted" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">{activeShopsCount}</div>
          <p className="text-xs text-foreground-muted mt-1">Shops with active subscription</p>
        </div>

        <div className="rounded-lg border border-border bg-card shadow-subtle p-5">
          <div className="flex flex-row items-center justify-between pb-3">
            <h3 className="text-sm font-medium text-foreground-secondary">Suspended / Expired</h3>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <div className="text-2xl font-bold font-mono text-destructive">{suspendedShopsCount}</div>
          <p className="text-xs text-foreground-muted mt-1">Subscription ended</p>
        </div>

        <div className="rounded-lg border border-border bg-card shadow-subtle p-5">
          <div className="flex flex-row items-center justify-between pb-3">
            <h3 className="text-sm font-medium text-foreground-secondary">Total Platform Loans</h3>
            <Activity className="h-4 w-4 text-foreground-muted" />
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            {shops.reduce((acc, s) => acc + s._count.loans, 0)}
          </div>
          <p className="text-xs text-foreground-muted mt-1">Active gold loan pledges</p>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="rounded-lg border border-border bg-card shadow-subtle overflow-hidden mt-4">
        <div className="p-5 border-b border-border bg-background-secondary/50 font-semibold text-foreground text-sm">
          Registered Shops (Tenants)
        </div>
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Shop Name</th>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Owner</th>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Plan</th>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Expires</th>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Stats</th>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {shops.map((shop) => (
                <ShopRow key={shop.id} shop={shop} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
