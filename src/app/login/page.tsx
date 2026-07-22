import { login } from './actions'
import { Sparkles } from 'lucide-react'

export default async function LoginPage(
  props: {
    searchParams: Promise<{ message?: string }>
  }
) {
  const searchParams = await props.searchParams

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background-secondary px-6 py-12">
      <div className="w-full max-w-sm rounded-lg bg-card p-8 shadow-dropdown border border-border">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="h-10 w-10 rounded-md bg-primary text-primary-foreground flex items-center justify-center shadow-subtle mx-auto mb-4">
            <Sparkles className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold font-sans text-foreground leading-none">Suvarna ERP</h1>
          <p className="text-sm text-foreground-secondary mt-2">Sign in to your workspace</p>
        </div>

        {/* Action Form */}
        <form className="flex flex-col gap-5" action={login}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              Email Address
            </label>
            <input
              className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground placeholder:text-foreground-disabled"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              Password
            </label>
            <input
              className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground placeholder:text-foreground-disabled"
              type="password"
              name="password"
              placeholder="••••••••"
              required
            />
          </div>

          <button className="bg-primary text-primary-foreground hover:bg-primary-hover py-2 rounded-md font-medium text-sm transition-colors shadow-subtle mt-2">
            Sign In
          </button>

          {searchParams?.message && (
            <div className="mt-2 p-3 bg-destructive/10 text-destructive text-sm font-medium text-center rounded-md border border-destructive/20">
              {searchParams.message}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
