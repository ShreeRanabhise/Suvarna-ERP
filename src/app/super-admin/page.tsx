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
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-heading tracking-tight">Platform Overview</h2>
        <CreateShopDialog />
      </div>

      {/* Analytics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium">Estimated ARR</h3>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold font-mono text-primary">₹{totalRevenue.toLocaleString('en-IN')}</div>
          <p className="text-xs text-muted-foreground">Annualized platform run-rate</p>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium">Active Tenants</h3>
            <Store className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold font-mono">{activeShopsCount}</div>
          <p className="text-xs text-muted-foreground">Shops with active subscription</p>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium">Suspended / Expired</h3>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </div>
          <div className="text-2xl font-bold font-mono text-destructive">{suspendedShopsCount}</div>
          <p className="text-xs text-muted-foreground">Subscription ended</p>
        </div>

        <div className="rounded-xl border bg-card text-card-foreground shadow p-6">
          <div className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-sm font-medium">Total Platform Loans</h3>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold font-mono">
            {shops.reduce((acc, s) => acc + s._count.loans, 0)}
          </div>
          <p className="text-xs text-muted-foreground">Active gold loan pledges</p>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-4 border-b font-semibold">Registered Shops (Tenants)</div>
        <div className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-3 font-medium text-muted-foreground">Shop Name</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Owner</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Plan</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Expires</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Stats</th>
                <th className="px-6 py-3 font-medium text-muted-foreground text-right">Status</th>
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
