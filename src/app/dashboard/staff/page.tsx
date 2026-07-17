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
      <div className="flex flex-col items-center justify-center p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center max-w-2xl mx-auto my-12 gap-6 animate-in fade-in duration-200">
        <div className="p-3 bg-primary/10 rounded-2xl text-primary border border-primary/20 shadow-sm">
          <Award className="h-10 w-10" />
        </div>
        <div>
          <h3 className="text-2xl font-bold font-heading text-slate-900">Upgrade to Enterprise Plan</h3>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
            Multi-branch management and staff role assignments are exclusive features of the <strong>Enterprise Plan</strong>.
          </p>
        </div>
        <div className="border-t border-slate-100 pt-5 w-full text-left space-y-3 text-sm">
          <p className="font-bold text-slate-800 flex items-center gap-1.5 text-xs uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>Enterprise Plan Privileges:</span>
          </p>
          <ul className="grid grid-cols-2 gap-3 text-slate-600 pl-1 font-medium">
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
        <button className="w-full bg-primary text-white hover:gold-gradient-hover py-2.5 rounded-xl font-bold text-sm transition shadow-sm mt-2">
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading tracking-tight">Staff Management</h2>
          <p className="text-xs text-muted-foreground mt-1">Manage staff users and physical branch vault counter assignments</p>
        </div>
        {branches.length > 0 ? (
          <AddStaffDialog branches={branches} />
        ) : (
          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-xl font-semibold">
            Create a branch first to add staff members.
          </div>
        )}
      </div>

      <div className="luxury-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Staff Member</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Assigned Role</th>
                <th className="px-6 py-4">Counter Branch</th>
                <th className="px-6 py-4">Joined Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                    No staff members registered. Click "Add Staff" to create one.
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500 border text-xs">
                          <User className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-slate-800 text-sm">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{member.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase font-mono">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {member.branch ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-700 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-lg">
                          <Building className="h-3 w-3" />
                          {member.branch.name}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                      {new Date(member.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <DeleteStaffButton staffId={member.id} staffName={member.name} />
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
