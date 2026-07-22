import { getCachedUser } from "@/lib/user"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import AddBranchDialog from "@/components/add-branch-dialog"
import DeleteBranchButton from "@/components/delete-branch-button"
import { Building, Users, Banknote, Award, Sparkles, MapPin } from "lucide-react"

export default async function BranchesPage() {
  const dbUser = await getCachedUser()
  if (!dbUser || !dbUser.shop) redirect('/login')

  // Check role: Only OWNER
  if (dbUser.role !== 'OWNER') {
    redirect('/dashboard')
  }

  const isEnterprise = dbUser.shop.subscriptionPlan === 'ENTERPRISE'

  // If not Enterprise, render an upgrade page
  if (!isEnterprise) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-xl shadow-subtle text-center max-w-2xl mx-auto my-12 gap-6">
        <div className="p-3 bg-primary/10 rounded-xl text-primary">
          <Award className="h-10 w-10" />
        </div>
        <div>
          <h3 className="text-2xl font-sans font-bold text-foreground">Upgrade to Enterprise Plan</h3>
          <p className="text-foreground-secondary text-xs mt-2 leading-relaxed">
            Multi-branch management and staff role assignments are exclusive features of the <strong>Enterprise Plan</strong>.
          </p>
        </div>
        <div className="border-t border-border pt-5 w-full text-left space-y-3 text-sm">
          <p className="font-bold text-foreground flex items-center gap-1.5 text-xs uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Enterprise Plan Privileges:</span>
          </p>
          <ul className="grid grid-cols-2 gap-3 text-foreground-secondary pl-1 font-medium text-xs">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Unlimited branches</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Dedicated support</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Automatic reminders</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span>Advanced auditing</span>
            </li>
          </ul>
        </div>
        <button className="w-full bg-primary text-primary-foreground hover:bg-primary-hover h-10 rounded-md font-medium text-sm transition-colors mt-2 shadow-subtle">
          Contact Sales to Upgrade
        </button>
      </div>
    )
  }

  // Fetch branches with counts
  const branches = await prisma.branch.findMany({
    where: {
      shopId: dbUser.shop.id,
    },
    include: {
      _count: {
        select: {
          users: true,
          customers: true,
          loans: true,
        }
      }
    },
    orderBy: {
      name: 'asc',
    },
  })

  const totalStaffCount = branches.reduce((sum, b) => sum + b._count.users, 0)
  const totalCustomersCount = branches.reduce((sum, b) => sum + b._count.customers, 0)
  const totalLoansCount = branches.reduce((sum, b) => sum + b._count.loans, 0)

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Page Header Bar */}
      <div className="rounded-xl border border-border bg-card shadow-subtle p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-subtle shrink-0">
            <Building className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-sans font-bold tracking-tight text-foreground">Branch Locations</h2>
            <p className="text-xs text-foreground-secondary mt-0.5">Manage store locations, staff assignments and multi-branch operations</p>
          </div>
        </div>
        <div className="shrink-0">
          <AddBranchDialog />
        </div>
      </div>

      {/* Metric KPI Summary Cards Header Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Branches */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Store Locations</span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-primary">{branches.length}</div>
            <p className="text-xs text-foreground-muted mt-1">Configured store branches</p>
          </div>
        </div>

        {/* Total Staff */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Branch Staff</span>
            <div className="h-8 w-8 rounded-lg bg-background-secondary text-foreground-muted flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-foreground">{totalStaffCount}</div>
            <p className="text-xs text-foreground-muted mt-1">Assigned staff members</p>
          </div>
        </div>

        {/* Branch Customers */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Branch Customers</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-emerald-600">{totalCustomersCount}</div>
            <p className="text-xs text-foreground-muted mt-1">Registered store clients</p>
          </div>
        </div>

        {/* Branch Loans */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Branch Loans</span>
            <div className="h-8 w-8 rounded-lg bg-background-secondary text-foreground-muted flex items-center justify-center">
              <Banknote className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-foreground">{totalLoansCount}</div>
            <p className="text-xs text-foreground-muted mt-1">Originated loan contracts</p>
          </div>
        </div>
      </div>

      {/* Main Table Container Card */}
      <div className="rounded-xl border border-border bg-card shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-border bg-background-secondary/40 font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" />
          <span>Configured Store Branches ({branches.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-background border-b border-border text-[11px] uppercase tracking-wider text-foreground-secondary font-bold">
              <tr>
                <th className="px-5 py-3.5">Branch Location</th>
                <th className="px-5 py-3.5">Staff Count</th>
                <th className="px-5 py-3.5">Customers</th>
                <th className="px-5 py-3.5">Loans Originated</th>
                <th className="px-5 py-3.5">Created Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {branches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-foreground-muted italic">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Building className="h-10 w-10 text-foreground-muted/40" />
                      <p className="text-sm font-medium">No store branches configured yet.</p>
                      <p className="text-xs text-foreground-muted">Click "Add Branch" above to setup your first location.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                branches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-background-secondary/60 transition-colors">
                    <td className="px-5 py-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                          <Building className="h-4 w-4" />
                        </div>
                        <span className="text-sm">{branch.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-sm font-semibold text-foreground">{branch._count.users} Staff</td>
                    <td className="px-5 py-4 font-mono text-sm text-foreground-secondary">{branch._count.customers} Customers</td>
                    <td className="px-5 py-4 font-mono text-sm font-semibold text-primary">{branch._count.loans} Loans</td>
                    <td className="px-5 py-4 text-xs font-mono text-foreground-secondary">
                      {new Date(branch.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <DeleteBranchButton branchId={branch.id} branchName={branch.name} />
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
