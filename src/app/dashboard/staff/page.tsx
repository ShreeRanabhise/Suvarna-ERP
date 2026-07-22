import { getCachedUser } from "@/lib/user"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import AddStaffDialog from "@/components/add-staff-dialog"
import DeleteStaffButton from "@/components/delete-staff-button"
import { Users, Building, ShieldAlert, Award, Sparkles, User, Badge } from "lucide-react"

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
      <div className="flex flex-col items-center justify-center p-8 bg-card border border-border rounded-lg shadow-subtle text-center max-w-2xl mx-auto my-12 gap-6">
        <div className="p-3 bg-primary-light rounded-lg text-primary">
          <Award className="h-10 w-10" />
        </div>
        <div>
          <h3 className="text-2xl font-sans font-semibold text-foreground">Upgrade to Enterprise Plan</h3>
          <p className="text-foreground-secondary text-sm mt-2 leading-relaxed">
            Multi-branch management and staff role assignments are exclusive features of the <strong>Enterprise Plan</strong>.
          </p>
        </div>
        <div className="border-t border-border pt-5 w-full text-left space-y-3 text-sm">
          <p className="font-semibold text-foreground flex items-center gap-1.5 text-xs uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Enterprise Plan Privileges:</span>
          </p>
          <ul className="grid grid-cols-2 gap-3 text-foreground-secondary pl-1 font-medium">
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
        <button className="w-full bg-primary text-primary-foreground hover:bg-primary-hover h-10 rounded-md font-medium text-sm transition-colors mt-2">
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

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-2xl font-sans font-semibold tracking-tight text-foreground">Staff Management</h2>
          <p className="text-sm text-foreground-secondary mt-1">Manage staff users and physical branch vault counter assignments</p>
        </div>
        {branches.length > 0 ? (
          <AddStaffDialog branches={branches} />
        ) : (
          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md font-medium">
            Create a branch first to add staff members.
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border bg-card shadow-subtle overflow-hidden mt-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="bg-background border-b border-border">
              <tr>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Staff Member</th>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Email Address</th>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Assigned Role</th>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Counter Branch</th>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider">Joined Date</th>
                <th className="px-5 py-3 font-medium text-foreground-secondary text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-foreground-muted italic">
                    No staff members registered. Click "Add Staff" to create one.
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-background-secondary transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-md bg-secondary flex items-center justify-center font-semibold text-foreground text-xs">
                          {member.name ? member.name[0].toUpperCase() : <User className="h-4 w-4" />}
                        </div>
                        <span className="font-medium text-foreground text-sm">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-sm text-foreground">{member.email}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-background-secondary text-foreground-secondary border border-border uppercase">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {member.branch ? (
                        <span className="inline-flex items-center gap-1 font-medium text-primary text-xs bg-primary-light px-2 py-0.5 rounded">
                          <Building className="h-3 w-3" />
                          {member.branch.name}
                        </span>
                      ) : (
                        <span className="text-foreground-muted italic text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs font-mono text-foreground-secondary">
                      {new Date(member.createdAt).toLocaleDateString('en-IN')}
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
