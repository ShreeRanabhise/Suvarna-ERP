'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logout } from '@/app/login/actions'
import { changePassword } from '@/app/actions'
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
  Clock,
  Package,
  User,
  KeyRound,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  RefreshCw
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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  
  // Change Password State
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState<string | null>(null)
  const [pwSuccess, setPwSuccess] = useState<string | null>(null)
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)

  async function handleChangePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(null)
    setPwLoading(true)

    const form = e.currentTarget
    const formData = new FormData(form)
    try {
      const res = await changePassword(formData)
      if (!res.success) {
        setPwError(res.error || 'Failed to update password')
      } else {
        setPwSuccess('Password updated successfully!')
        form.reset()
        setTimeout(() => {
          setShowChangePassword(false)
          setPwSuccess(null)
        }, 2000)
      }
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setPwLoading(false)
    }
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/customers', label: 'Customers', icon: Users },
    { href: '/dashboard/loans', label: 'Loans', icon: Banknote },
    { href: '/dashboard/inventory', label: 'Inventory', icon: Package },
    { href: '/dashboard/reports', label: 'Reports', icon: FileText },
  ]

  if (userRole === 'SUPER_ADMIN') {
    links.push(
      { href: '/super-admin', label: 'Super Admin', icon: Shield }
    )
  }

  if (userRole === 'OWNER') {
    links.push(
      { href: '/dashboard/branches', label: 'Branches', icon: Building },
      { href: '/dashboard/staff', label: 'Staff', icon: UserCheck }
    )
  }

  return (
    <>
      {/* Mobile topbar */}
      <div className="flex sm:hidden items-center justify-between px-5 py-3.5 bg-secondary text-secondary-foreground border-b border-border/10 sticky top-0 z-50">
        <div className="flex items-center gap-2.5 min-w-0">
          <Sparkles className="h-5 w-5 text-primary shrink-0" />
          <div className="min-w-0">
            <span className="font-bold text-lg tracking-tight font-sans text-foreground truncate block leading-tight">{shopName}</span>
            <span className="text-[10px] text-foreground-muted uppercase tracking-wider block font-mono">{subscriptionPlan} PLAN</span>
          </div>
        </div>
        <button 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-label={isMobileOpen ? "Close navigation menu" : "Open navigation menu"}
          className="p-1.5 rounded-lg text-secondary-foreground/70 hover:text-secondary-foreground hover:bg-secondary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition"
        >
          {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar - Desktop and Mobile Drawer */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-card text-card-foreground border-r border-border flex flex-col transition-transform duration-300 ease-in-out shadow-sm sm:shadow-none
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
      `}>
        {/* Brand Header - Shop Name and Subscription Plan */}
        <div className="p-4 border-b border-border bg-background">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl shadow-subtle shrink-0">
              {shopName[0]?.toUpperCase() || 'S'}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-bold font-sans text-lg text-foreground truncate leading-tight tracking-tight">
                {shopName}
              </h1>
              <div className="mt-1">
                <span className="inline-flex items-center gap-1 text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded tracking-wider uppercase">
                  {subscriptionPlan} PLAN
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav aria-label="Main Navigation" className="flex-1 px-4 py-5 space-y-1 overflow-y-auto custom-scrollbar bg-card">
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
                  flex items-center gap-3.5 px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 relative group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
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

        {/* Footer / Profile Button & Logout */}
        <div className="mt-auto border-t border-border bg-background p-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setIsProfileModalOpen(true)}
            className="flex w-full items-center justify-center gap-2.5 rounded-md border border-border bg-card hover:bg-background-secondary px-4 py-2 text-xs font-semibold text-foreground transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-subtle"
          >
            <User className="h-4 w-4 text-primary" />
            <span>Profile Info</span>
          </button>

          <form action={logout} className="w-full">
            <button 
              type="submit"
              className="flex w-full items-center justify-center gap-2.5 rounded-md border border-border bg-card hover:bg-background-secondary hover:text-destructive px-4 py-2 text-xs font-semibold text-foreground-secondary transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <LogOut className="h-4 w-4" />
              <span>Log Out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Read-Only Shop & Owner Info Modal */}
      {isProfileModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/60 backdrop-blur-sm p-4 animate-fade-in"
          onClick={() => setIsProfileModalOpen(false)}
        >
          <div 
            className="relative bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border pb-3 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-lg bg-primary-light text-primary flex items-center justify-center font-bold">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground leading-tight">Shop & Owner Profile</h3>
                  <p className="text-[10px] text-foreground-muted uppercase tracking-wider font-mono">Read-Only System Info</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="p-1.5 text-foreground-muted hover:text-foreground rounded-md hover:bg-background-secondary transition-colors"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Read-Only Details */}
            <div className="space-y-3.5 text-sm">
              <div className="p-3.5 bg-background border border-border rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase text-foreground-muted font-bold block">Shop Name</span>
                  <span className="font-bold text-foreground text-sm">{shopName}</span>
                </div>
                <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded uppercase font-mono">
                  {subscriptionPlan} PLAN
                </span>
              </div>

              <div className="p-3.5 bg-background border border-border rounded-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase text-foreground-muted font-bold">Owner Email / ID</span>
                  <span className="font-mono font-semibold text-foreground text-xs">{userEmail}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase text-foreground-muted font-bold">Access Role</span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-background-secondary border border-border px-2 py-0.5 rounded text-foreground">
                    <Shield className="h-3 w-3 text-primary" /> {userRole}
                  </span>
                </div>
              </div>


              {/* Change Password Section */}
              <div className="pt-2 border-t border-border">
                {!showChangePassword ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePassword(true)
                      setPwError(null)
                      setPwSuccess(null)
                    }}
                    className="w-full py-2 px-3 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <KeyRound className="h-3.5 w-3.5" />
                    <span>Change Password</span>
                  </button>
                ) : (
                  <form onSubmit={handleChangePassword} className="bg-background p-4 border border-border rounded-lg space-y-3 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <KeyRound className="h-3.5 w-3.5 text-primary" />
                        <span>Verify & Change Password</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowChangePassword(false)}
                        className="text-[10px] text-foreground-muted hover:text-foreground underline"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-foreground-secondary">Current Password *</label>
                      <div className="relative">
                        <input
                          name="currentPassword"
                          type={showCurrentPw ? 'text' : 'password'}
                          required
                          placeholder="Verify current password"
                          className="w-full rounded-md px-3 py-1.5 pr-8 border border-border bg-card text-xs text-foreground placeholder:text-foreground-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPw(!showCurrentPw)}
                          className="absolute right-2 top-2 text-foreground-muted hover:text-foreground"
                        >
                          {showCurrentPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-foreground-secondary">New Password *</label>
                      <div className="relative">
                        <input
                          name="newPassword"
                          type={showNewPw ? 'text' : 'password'}
                          required
                          minLength={6}
                          placeholder="Min 6 characters"
                          className="w-full rounded-md px-3 py-1.5 pr-8 border border-border bg-card text-xs text-foreground placeholder:text-foreground-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-2 top-2 text-foreground-muted hover:text-foreground"
                        >
                          {showNewPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase font-bold text-foreground-secondary">Confirm New Password *</label>
                      <input
                        name="confirmPassword"
                        type="password"
                        required
                        minLength={6}
                        placeholder="Re-enter new password"
                        className="w-full rounded-md px-3 py-1.5 border border-border bg-card text-xs text-foreground placeholder:text-foreground-disabled focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      />
                    </div>

                    {pwError && (
                      <p className="text-[11px] font-medium text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">{pwError}</p>
                    )}

                    {pwSuccess && (
                      <p className="text-[11px] font-medium text-success bg-success/10 p-2 rounded border border-success/20 flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" /> {pwSuccess}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={pwLoading}
                      className="w-full py-2 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-subtle mt-1"
                    >
                      {pwLoading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                      <span>{pwLoading ? 'Verifying & Updating...' : 'Update Password'}</span>
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="px-4 py-2 rounded-md bg-background hover:bg-background-secondary border border-border text-xs font-semibold text-foreground transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
