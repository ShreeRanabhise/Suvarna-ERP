import { redirect } from "next/navigation"
import { getCachedUser } from "@/lib/user"
import SidebarNav from "@/components/sidebar-nav"
import { Calendar } from "lucide-react"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const dbUser = await getCachedUser()

  if (!dbUser) {
    redirect("/login")
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
    <div className="flex min-h-screen w-full bg-background selection:bg-primary/20">
      <SidebarNav 
        userEmail={dbUser.email} 
        userRole={dbUser.role} 
        shopName={dbUser.shop?.name || 'Suvarna Shop'} 
        subscriptionPlan={dbUser.shop?.subscriptionPlan || 'STANDARD'} 
      />
      
      {/* Content wrapper */}
      <div className="flex flex-col flex-1 sm:pl-64 min-h-screen">
        {/* Glassmorphism Header */}
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur-xl px-8 shadow-sm transition-all duration-300">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold tracking-widest uppercase text-primary bg-primary/10 px-2.5 py-1 rounded-md ring-1 ring-primary/20">
              ERP Workspace
            </span>
            <span className="text-muted-foreground/40 font-light">/</span>
            <span className="text-sm font-semibold text-foreground tracking-tight">Dashboard</span>
          </div>
          
          {/* Date Widget & Profile */}
          <div className="flex items-center gap-5">
            <div className="hidden md:flex items-center gap-2.5 text-xs font-medium text-muted-foreground bg-card px-4 py-2 rounded-full border border-border shadow-sm">
              <Calendar className="h-4 w-4 text-primary" />
              <span>{currentDate}</span>
            </div>
            
            <div className="h-4 w-px bg-border hidden md:block" />
            
            <div className="text-xs font-bold bg-foreground text-background px-4 py-2 rounded-full shadow-md uppercase tracking-wider flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary gold-glow"></span>
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
