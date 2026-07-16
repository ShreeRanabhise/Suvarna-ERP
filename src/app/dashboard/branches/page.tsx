import { createClient } from "@/lib/supabase/server"
import { PrismaClient } from "@prisma/client"
import { redirect } from "next/navigation"
import AddBranchDialog from "@/components/add-branch-dialog"
import DeleteBranchButton from "@/components/delete-branch-button"
import { Building, Users, Banknote, Award } from "lucide-react"

const prisma = new PrismaClient()

export default async function BranchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: { shop: true }
  })
  if (!dbUser || !dbUser.shop) redirect('/login')

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
          Branch management and multi-branch operations are exclusive features of our <strong>Enterprise Plan</strong>.
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

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading tracking-tight">Branch Management</h2>
          <p className="text-sm text-muted-foreground mt-1">Create and manage your branch offices.</p>
        </div>
        <AddBranchDialog />
      </div>

      <div className="rounded-xl border bg-card text-card-foreground shadow">
        <div className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-6 py-3 font-medium text-muted-foreground">Branch Name</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Staff Members</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Customers</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Active Loans</th>
                <th className="px-6 py-3 font-medium text-muted-foreground">Created Date</th>
                <th className="px-6 py-3 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {branches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-muted-foreground">
                    No branches found. Click "Add Branch" to create one.
                  </td>
                </tr>
              ) : (
                branches.map((branch) => (
                  <tr key={branch.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-6 py-4 font-medium flex items-center gap-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      {branch.name}
                    </td>
                    <td className="px-6 py-4 font-mono font-medium">{branch._count.users}</td>
                    <td className="px-6 py-4 font-mono">{branch._count.customers}</td>
                    <td className="px-6 py-4 font-mono">{branch._count.loans}</td>
                    <td className="px-6 py-4 text-xs font-mono">
                      {new Date(branch.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right">
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
