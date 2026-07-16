import { createClient } from "@/lib/supabase/server"
import { PrismaClient } from "@prisma/client"
import { redirect } from "next/navigation"
import AddStaffDialog from "@/components/add-staff-dialog"
import DeleteStaffButton from "@/components/delete-staff-button"
import { Users, Building, ShieldAlert, Award } from "lucide-react"

const prisma = new PrismaClient()

export default async function StaffPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: { shop: true }
  })
  if (!dbUser || !dbUser.shopId) redirect('/login')

  // Check role: Only OWNER
  if (dbUser.role !== 'OWNER') {
    redirect('/dashboard')
  }

  const isEnterprise = dbUser.shop.subscriptionPlan === 'ENTERPRISE'

  // If not Enterprise, render an upgrade page
  if (!isEnterprise) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-card border rounded-xl shadow-sm text-center max-w-2xl mx-auto my-12 gap-4 animate-in fade-in duration-200">
        <div className="p-3 bg-primary/10 rounded-full text-primary">
          <Award className="h-10 w-10" />
        </div>
        <h3 className="text-2xl font-bold font-heading">Upgrade to Enterprise</h3>
        <p className="text-muted-foreground">
          Staff management and multi-branch operations are exclusive features of our <strong>Enterprise Plan</strong>.
        </p>
        <div className="border-t pt-4 w-full text-left space-y-2 text-sm">
          <p className="font-semibold text-muted-foreground">Enterprise Plan includes:</p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
            <li>Unlimited customers and gold loan accounts</li>
            <li>Multi-branch system and staff role assignments</li>
            <li>Automatic WhatsApp reminders (+₹499/mo)</li>
            <li>Advanced reports and audit trails</li>
          </ul>
        </div>
        <button className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground font-medium rounded-md hover:opacity-90 transition">
          Contact Sales to Upgrade
        </button>
      </div>
    )
  }

  // Fetch staff
  const staff = await prisma.user.findMany({
    where: {
      shopId: dbUser.shopId,
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
      shopId: dbUser.shopId,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading tracking-tight">Staff Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage staff users and their branch assignments.</p>
        </div>
        {branches.length > 0 ? (
          <AddStaffDialog branches={branches} />
        ) : (
          <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md font-medium">
            Create a branch first to add staff.
          </div>
        )}
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-3 font-medium text-muted-foreground">Name</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Email</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Role</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Assigned Branch</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Joined Date</th>
                <th className="px-6 py-3 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    No staff members found. Click "Add Staff Member" to add one.
                  </td>
                </tr>
              ) : (
                staff.map((member) => (
                  <tr key={member.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-6 py-4 font-medium">{member.name}</td>
                    <td className="px-6 py-4">{member.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center rounded-full bg-secondary/10 border border-secondary/20 px-2.5 py-0.5 text-xs font-semibold text-secondary">
                        {member.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-primary">
                      {member.branch ? (
                        <span className="flex items-center gap-1">
                          <Building className="h-3.5 w-3.5 text-muted-foreground" />
                          {member.branch.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic text-xs">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono">
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
