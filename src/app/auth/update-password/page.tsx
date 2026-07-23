import { updatePassword } from '../actions'
import { KeyRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function UpdatePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Only allow access if a session exists (set by the recovery callback)
  if (!session) {
    redirect('/login?message=Your recovery session has expired or is invalid. Please request a new link.')
  }

  const resolvedParams = await searchParams
  const message = resolvedParams.message
  const error = resolvedParams.error

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <div className="flex flex-col items-center justify-center mb-8 text-center">
        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <KeyRound className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Set New Password</h1>
        <p className="text-sm text-foreground/60 mt-2">
          Please enter your new password below. It must be at least 8 characters long.
        </p>
      </div>

      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-4 text-foreground" action={updatePassword}>
        <div className="flex flex-col gap-2">
          <label className="text-md font-medium" htmlFor="password">
            New Password
          </label>
          <input
            className="rounded-md px-4 py-2 bg-inherit border border-border focus:ring-2 focus:ring-primary focus:outline-none"
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="••••••••"
          />
        </div>

        <div className="flex flex-col gap-2 mb-4">
          <label className="text-md font-medium" htmlFor="confirmPassword">
            Confirm New Password
          </label>
          <input
            className="rounded-md px-4 py-2 bg-inherit border border-border focus:ring-2 focus:ring-primary focus:outline-none"
            name="confirmPassword"
            type="password"
            required
            minLength={8}
            placeholder="••••••••"
          />
        </div>

        <button className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-md px-4 py-2 transition-colors mb-2">
          Update Password
        </button>

        {error && (
          <div className="mt-4 p-4 bg-destructive/10 text-destructive text-sm font-medium text-center rounded-md border border-destructive/20">
            {error}
          </div>
        )}
        
        {message && (
          <div className="mt-4 p-4 bg-success/10 text-success text-sm font-medium text-center rounded-md border border-success/20">
            {message}
          </div>
        )}
      </form>
    </div>
  )
}
