'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'
import { 
  Users, 
  LayoutDashboard, 
  FileText, 
  Settings, 
  LogOut, 
  Banknote, 
  UserCheck, 
  Building,
  Menu,
  X,
  Sparkles,
  Shield,
  Clock
} from 'lucide-react'

interface SidebarNavProps {
  userEmail: string
  userRole: string
  shopName: string
  subscriptionPlan: string
}

export default function SidebarNav({ 
  userEmail, 
  userRole, 
  shopName, 
  subscriptionPlan 
}: SidebarNavProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/customers', label: 'Customers', icon: Users },
    { href: '/dashboard/loans', label: 'Loans', icon: Banknote },
    { href: '/dashboard/reports', label: 'Reports & Analytics', icon: FileText },
  ]

  if (userRole === 'OWNER') {
    links.push(
      { href: '/dashboard/branches', label: 'Branches', icon: Building },
      { href: '/dashboard/staff', label: 'Staff Management', icon: UserCheck }
    )
  }

  return (
    <>
      {/* Mobile topbar */}
      <div className="flex sm:hidden items-center justify-between px-5 py-3.5 bg-secondary text-secondary-foreground border-b border-border/10 sticky top-0 z-50">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-bold text-lg tracking-tight font-sans text-foreground">Suvarna ERP</span>
        </div>
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-1.5 rounded-lg text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-secondary-foreground/10 transition"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar - Desktop and Mobile Drawer */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-card text-card-foreground border-r border-border flex flex-col transition-transform duration-300 ease-in-out shadow-sm sm:shadow-none
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-20 flex items-center gap-3.5 px-6 border-b border-border bg-background">
          <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-subtle">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div>
            <h1 className="font-bold font-sans text-lg text-foreground leading-none">Suvarna ERP</h1>
            <p className="text-[10px] text-muted-foreground font-semibold tracking-widest uppercase mt-1">Gold Management</p>
          </div>
        </div>

        {/* Tenant Summary */}
        <div className="px-5 py-5 border-b border-border bg-background">
          <div className="flex items-center gap-3.5 p-2.5 bg-card rounded-xl border border-border shadow-subtle">
            <div className="h-10 w-10 rounded-lg bg-primary-light text-primary flex items-center justify-center font-bold text-lg">
              {shopName[0]?.toUpperCase() || 'S'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate tracking-tight">{shopName}</p>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-primary bg-primary-light px-2 py-0.5 rounded mt-1 tracking-wider">
                {subscriptionPlan}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto custom-scrollbar bg-card">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch={true}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center gap-3.5 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 relative group
                  ${isActive 
                    ? 'text-primary bg-primary-light font-semibold' 
                    : 'text-foreground-secondary hover:text-foreground hover:bg-background-secondary'}
                `}
              >
                <Icon className={`h-4.5 w-4.5 transition-colors relative z-10 ${isActive ? 'text-primary' : 'text-foreground-muted group-hover:text-foreground'}`} />
                <span className="relative z-10">{link.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer / User Profile Profile */}
        <div className="mt-auto border-t border-border bg-background p-5">
          <div className="flex items-center gap-3.5 p-2 mb-4 rounded-lg bg-card border border-border shadow-subtle">
            <div className="h-9 w-9 rounded-md bg-secondary text-foreground flex items-center justify-center font-bold text-sm uppercase">
              {userEmail[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground truncate leading-none mb-1.5">{userEmail.split('@')[0]}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-foreground-muted font-medium">
                <Shield className="h-3 w-3" />
                <span className="truncate uppercase tracking-wider">{userRole}</span>
              </div>
            </div>
          </div>

          <form action={logout}>
            <button 
              type="submit"
              className="flex w-full items-center justify-center gap-2.5 rounded-md border border-border bg-card hover:bg-background-secondary hover:text-destructive px-4 py-2 text-xs font-semibold text-foreground-secondary transition-all duration-200"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout securely</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Overlay backdrop for mobile menu */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-30 bg-secondary/80 backdrop-blur-md sm:hidden transition-opacity duration-300"
        />
      )}
    </>
  )
}
