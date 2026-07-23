import { getCachedUser } from "@/lib/user"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import AddStaffDialog from "@/components/add-staff-dialog"
import DeleteStaffButton from "@/components/delete-staff-button"
import { Users, Building, ShieldCheck, Award, Sparkles, User, UserCheck, UserX } from "lucide-react"

export default async function StaffPage() {
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

  // Fetch staff
  const staff = await prisma.user.findMany({
    where: {
      shopId: dbUser.shop.id,
      role: 'STAFF',
    },
    include: {
      branch: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Fetch branches
  const branches = await prisma.branch.findMany({
    where: {
      shopId: dbUser.shop.id,
    },
    orderBy: {
      name: 'asc',
    },
  })

  const assignedStaffCount = staff.filter(s => s.branchId !== null).length
  const unassignedStaffCount = staff.length - assignedStaffCount

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      {/* Page Header Bar */}
      <div className="rounded-xl border border-border bg-card shadow-subtle p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold shadow-subtle shrink-0">
            <UserCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-sans font-bold tracking-tight text-foreground">Staff & Team Roster</h2>
            <p className="text-xs text-foreground-secondary mt-0.5">Manage employee accounts, system access and branch store assignments</p>
          </div>
        </div>
        <div className="shrink-0">
          {branches.length > 0 ? (
            <AddStaffDialog branches={branches} />
          ) : (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md font-medium">
              Create a branch first to add staff members.
            </div>
          )}
        </div>
      </div>

      {/* Metric KPI Summary Cards Header Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Staff */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Total Staff</span>
            <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-primary">{staff.length}</div>
            <p className="text-xs text-foreground-muted mt-1">Active employee accounts</p>
          </div>
        </div>

        {/* Assigned Staff */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Assigned to Branch</span>
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-emerald-600">{assignedStaffCount}</div>
            <p className="text-xs text-foreground-muted mt-1">Assigned to store locations</p>
          </div>
        </div>

        {/* Unassigned Staff */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Unassigned Staff</span>
            <div className="h-8 w-8 rounded-lg bg-background-secondary text-foreground-muted flex items-center justify-center">
              <UserX className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-foreground">{unassignedStaffCount}</div>
            <p className="text-xs text-foreground-muted mt-1">Pending location assignment</p>
          </div>
        </div>

        {/* Active Store Branches */}
        <div className="rounded-xl border border-border bg-card shadow-subtle p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">Store Locations</span>
            <div className="h-8 w-8 rounded-lg bg-background-secondary text-foreground-muted flex items-center justify-center">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold font-mono text-foreground">{branches.length}</div>
            <p className="text-xs text-foreground-muted mt-1">Configured store branches</p>
          </div>
        </div>
      </div>

      {/* Main Table Container Card */}
      <div className="rounded-xl border border-border bg-card shadow-subtle overflow-hidden">
        <div className="p-4 border-b border-border bg-background-secondary/40 font-bold text-xs uppercase tracking-wider text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <span>Registered Staff Roster ({staff.length})</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-background border-b border-border text-[11px] uppercase tracking-wider text-foreground-secondary font-bold">
              <tr>
                <th className="px-5 py-3.5">Staff Member</th>
                <th className="px-5 py-3.5">Email Address</th>
                <th className="px-5 py-3.5">Role</th>
                <th className="px-5 py-3.5">Assigned Branch</th>
                <th className="px-5 py-3.5">Joined Date</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-card">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-foreground-muted italic">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserCheck className="h-10 w-10 text-foreground-muted/40" />
                      <p className="text-sm font-medium">No staff members registered.</p>
                      <p className="text-xs text-foreground-muted">Click &quot;Add Staff&quot; above to create an employee account.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-background-secondary/60 transition-colors">
                    <td className="px-5 py-4 font-semibold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-secondary text-foreground flex items-center justify-center font-bold text-xs shrink-0">
                          {member.name ? member.name[0].toUpperCase() : <User className="h-4 w-4" />}
                        </div>
                        <span className="text-sm">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-sm text-foreground-secondary">{member.email}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary border border-primary/20 uppercase font-mono">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {member.branch ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 text-xs bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-md">
                          <Building className="h-3 w-3" />
                          {member.branch.name}
                        </span>
                      ) : (
                        <span className="text-foreground-muted italic text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-foreground-secondary">
                      {new Date(member.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <DeleteStaffButton staffId={member.id} staffName={member.name || member.email} />
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
