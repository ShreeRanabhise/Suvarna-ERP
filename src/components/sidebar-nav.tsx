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
      <div className="flex sm:hidden items-center justify-between px-4 py-3 bg-[#0B0F19] text-white border-b border-slate-800 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-bold text-md tracking-tight font-heading text-primary">Suvarna ERP</span>
        </div>
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar - Desktop and Mobile Drawer */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-[#0B0F19] text-slate-300 border-r border-slate-900 flex flex-col transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
      `}>
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-900 bg-[#070a12]/50">
          <div className="h-8 w-8 rounded-lg gold-gradient flex items-center justify-center shadow-lg shadow-primary/10">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold font-heading text-lg text-white leading-none">Suvarna ERP</h1>
            <p className="text-[10px] text-primary font-semibold tracking-wider uppercase mt-1">Gold Management</p>
          </div>
        </div>

        {/* Tenant Summary */}
        <div className="px-4 py-4 border-b border-slate-900 bg-[#070a12]/20">
          <div className="flex items-center gap-3 p-2 bg-slate-950/40 rounded-xl border border-slate-800/40">
            <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold">
              {shopName[0]?.toUpperCase() || 'S'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate">{shopName}</p>
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-0.5">
                {subscriptionPlan}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {links.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname.startsWith(link.href))
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative group
                  ${isActive 
                    ? 'text-white bg-slate-900/60 font-semibold border-l-2 border-primary pl-[14px]' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-950/40'}
                `}
              >
                <Icon className={`h-4.5 w-4.5 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-white'}`} />
                <span>{link.label}</span>
                {isActive && (
                  <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-primary gold-glow" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer / User Profile Profile */}
        <div className="mt-auto border-t border-slate-900 bg-[#070a12]/40 p-4">
          <div className="flex items-center gap-3 p-1.5 mb-3 rounded-lg">
            <div className="h-8 w-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-white uppercase">
              {userEmail[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-white truncate leading-none mb-1">{userEmail.split('@')[0]}</p>
              <div className="flex items-center gap-1 text-[9px] text-slate-400">
                <Shield className="h-3 w-3 text-primary" />
                <span className="truncate uppercase font-medium">{userRole}</span>
              </div>
            </div>
          </div>

          <form action={logout}>
            <button 
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/20 hover:bg-destructive/10 hover:border-destructive/20 hover:text-destructive px-3 py-2 text-xs font-semibold text-slate-400 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Overlay backdrop for mobile menu */}
      {isMobileOpen && (
        <div 
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm sm:hidden"
        />
      )}
    </>
  )
}
