import { redirect } from "next/navigation"
import Link from "next/link"
import { LayoutDashboard, ShieldAlert, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { logout } from "@/app/login/actions"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Verify Super Admin status in database
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! }
  })

  if (!dbUser || dbUser.role !== 'SUPER_ADMIN') {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/super-admin" className="flex items-center gap-2 font-semibold">
            <span className="text-primary font-heading text-xl">Suvarna Admin</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-2">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-2">
            <Link
              href="/super-admin"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-muted"
            >
              <LayoutDashboard className="h-4 w-4" />
              Platform Overview
            </Link>
          </nav>
        </div>
        <div className="mt-auto p-4 border-t">
          <form action={logout}>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-destructive hover:bg-destructive/10">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </form>
        </div>
      </aside>
      
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-64 w-full">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
          <div className="flex items-center gap-2 text-destructive font-semibold">
            <ShieldAlert className="h-5 w-5" />
            <span>Super Admin Portal</span>
          </div>
          <div className="relative ml-auto flex-1 md:grow-0">
            <div className="text-sm font-medium">{user.email}</div>
          </div>
        </header>
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  )
}
