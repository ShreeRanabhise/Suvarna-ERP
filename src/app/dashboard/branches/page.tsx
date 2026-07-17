import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import { redirect } from "next/navigation"
import AddBranchDialog from "@/components/add-branch-dialog"
import DeleteBranchButton from "@/components/delete-branch-button"
import { Building, Users, Banknote, Award, Sparkles, Calendar } from "lucide-react"

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
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-heading tracking-tight">Branches</h2>
          <p className="text-xs text-muted-foreground mt-1">Manage physical gold vault branch counters</p>
        </div>
        <AddBranchDialog />
      </div>

      <div className="luxury-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Branch Detail</th>
                <th className="px-6 py-4">Staff Members</th>
                <th className="px-6 py-4">Active Customers</th>
                <th className="px-6 py-4">Active Loans</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {branches.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                    No branches configured. Click "Add Branch" to begin.
                  </td>
                </tr>
              ) : (
                branches.map((branch) => (
                  <tr key={branch.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 border">
                        <Building className="h-4 w-4" />
                      </div>
                      <span>{branch.name}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-700">{branch._count.users}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{branch._count.customers}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{branch._count.loans}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
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
