import { login } from './actions'
import { Sparkles } from 'lucide-react'

export default async function LoginPage(
  props: {
    searchParams: Promise<{ message?: string }>
  }
) {
  const searchParams = await props.searchParams

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8F9FB] px-6 py-12">
      <div className="w-full max-w-md luxury-card rounded-2xl bg-white p-8 shadow-sm">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="h-10 w-10 rounded-xl gold-gradient flex items-center justify-center shadow-md mx-auto mb-4">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-heading text-slate-900 leading-none">Suvarna ERP</h1>
          <p className="text-xs text-muted-foreground mt-2">Sign in to your Gold Loan Management Workspace</p>
        </div>

        {/* Action Form */}
        <form className="flex flex-col gap-4" action={login}>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider" htmlFor="email">
              Email Address
            </label>
            <input
              className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider" htmlFor="password">
              Password
            </label>
            <input
              className="rounded-xl px-3 py-2 border border-slate-200 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 bg-transparent text-sm text-slate-800 outline-none transition"
              type="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button className="bg-primary text-white hover:gold-gradient-hover py-2.5 rounded-xl font-bold text-sm transition shadow-sm mt-3">
            Sign In
          </button>

          {searchParams?.message && (
            <div className="mt-2 p-3 bg-destructive/10 text-destructive text-xs font-bold text-center rounded-xl border border-destructive/20 uppercase tracking-wide">
              {searchParams.message}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
