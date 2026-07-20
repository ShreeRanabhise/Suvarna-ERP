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
          <span className="font-bold text-lg tracking-tight font-heading text-primary">Suvarna ERP</span>
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
        fixed inset-y-0 left-0 z-40 w-64 bg-secondary text-secondary-foreground border-r border-border/10 flex flex-col transition-transform duration-300 ease-in-out shadow-2xl sm:shadow-none
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-20 flex items-center gap-3.5 px-6 border-b border-border/5 bg-secondary-foreground/[0.02]">
          <div className="h-9 w-9 rounded-xl gold-gradient flex items-center justify-center shadow-lg shadow-primary/20">
            <Sparkles className="h-4.5 w-4.5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold font-heading text-lg text-secondary-foreground leading-none">Suvarna ERP</h1>
            <p className="text-[10px] text-primary/80 font-bold tracking-widest uppercase mt-1">Gold Management</p>
          </div>
        </div>

        {/* Tenant Summary */}
        <div className="px-5 py-5 border-b border-border/5 bg-secondary-foreground/[0.01]">
          <div className="flex items-center gap-3.5 p-2.5 bg-secondary-foreground/5 rounded-2xl border border-secondary-foreground/10 backdrop-blur-sm shadow-inner">
            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-lg shadow-sm">
              {shopName[0]?.toUpperCase() || 'S'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-secondary-foreground truncate tracking-tight">{shopName}</p>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-1 border border-primary/20 tracking-wider">
                {subscriptionPlan}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto custom-scrollbar">
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
                  flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 relative group overflow-hidden
                  ${isActive 
                    ? 'text-primary-foreground bg-primary/10 font-semibold' 
                    : 'text-secondary-foreground/60 hover:text-secondary-foreground hover:bg-secondary-foreground/5'}
                `}
              >
                {isActive && (
                  <div className="absolute inset-0 gold-gradient opacity-10"></div>
                )}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-md shadow-[0_0_8px_rgba(212,163,63,0.6)]"></div>
                )}
                <Icon className={`h-4.5 w-4.5 transition-colors relative z-10 ${isActive ? 'text-primary' : 'text-secondary-foreground/40 group-hover:text-secondary-foreground/80'}`} />
                <span className="relative z-10">{link.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer / User Profile Profile */}
        <div className="mt-auto border-t border-border/5 bg-secondary-foreground/[0.02] p-5">
          <div className="flex items-center gap-3.5 p-2 mb-4 rounded-xl">
            <div className="h-9 w-9 rounded-full bg-secondary-foreground/10 border border-secondary-foreground/20 flex items-center justify-center font-bold text-sm text-secondary-foreground uppercase shadow-inner">
              {userEmail[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-secondary-foreground truncate leading-none mb-1.5">{userEmail.split('@')[0]}</p>
              <div className="flex items-center gap-1.5 text-[10px] text-secondary-foreground/50 font-medium">
                <Shield className="h-3 w-3 text-primary/80" />
                <span className="truncate uppercase tracking-wider">{userRole}</span>
              </div>
            </div>
          </div>

          <form action={logout}>
            <button 
              type="submit"
              className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-secondary-foreground/10 bg-secondary-foreground/5 hover:bg-destructive/10 hover:border-destructive/20 hover:text-destructive px-4 py-2.5 text-xs font-semibold text-secondary-foreground/70 transition-all duration-300"
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
