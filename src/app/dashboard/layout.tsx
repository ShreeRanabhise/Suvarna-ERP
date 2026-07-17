import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import prisma from "@/lib/prisma"
import SidebarNav from "@/components/sidebar-nav"
import { Calendar } from "lucide-react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Verify role and tenant association in DB, including shop
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: { shop: true }
  })

  if (!dbUser) {
    redirect("/login?message=User not found in database")
  }

  if (dbUser.role === 'SUPER_ADMIN') {
    redirect("/super-admin")
  }

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="flex min-h-screen w-full bg-[#F8F9FB]">
      <SidebarNav 
        userEmail={user.email!} 
        userRole={dbUser.role} 
        shopName={dbUser.shop?.name || 'Suvarna Shop'} 
        subscriptionPlan={dbUser.shop?.subscriptionPlan || 'STANDARD'} 
      />
      
      {/* Content wrapper */}
      <div className="flex flex-col flex-1 sm:pl-64 min-h-screen">
        {/* Glassmorphism Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#E5E7EB] bg-white/75 backdrop-blur-md px-6 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-primary bg-primary/10 px-2 py-0.5 rounded">
              ERP WORKSPACE
            </span>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-700">Dashboard</span>
          </div>
          
          {/* Date Widget & Profile */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/50">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              <span>{currentDate}</span>
            </div>
            
            <div className="h-px w-4 bg-slate-200 hidden md:block" />
            
            <div className="text-xs font-semibold bg-slate-900 text-white px-3 py-1.5 rounded-xl shadow-sm uppercase">
              {dbUser.role} Mode
            </div>
          </div>
        </header>
        
        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-8 max-w-6xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
