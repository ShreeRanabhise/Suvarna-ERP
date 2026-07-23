import { updatePassword } from '../actions'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AnimatedJewelryBackground } from '@/components/login/animated-jewelry-background'
import { SubmitButton } from '@/components/login/submit-button'

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
    <div className="relative flex flex-col items-center justify-center min-h-screen px-6 py-12 overflow-hidden">
      <AnimatedJewelryBackground />
      
      <div 
        className="w-full max-w-sm p-8 relative z-10 rounded-[24px] backdrop-blur-[18px]"
        style={{
          background: "rgba(255, 255, 255, 0.82)",
          border: "1px solid rgba(255, 215, 120, 0.25)",
          boxShadow: "0 25px 80px rgba(0, 0, 0, 0.08)"
        }}
      >
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold font-sans text-foreground leading-none">Suvarna ERP</h1>
          <p className="text-sm text-foreground-secondary mt-2">Set new password for your workspace</p>
        </div>
        {/* Action Form */}
        <form className="flex flex-col gap-5" action={updatePassword}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              New Password
            </label>
            <input
              className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground placeholder:text-foreground-disabled"
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-foreground" htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <input
              className="rounded-md px-3 py-2 border border-border bg-background focus-ring text-sm text-foreground placeholder:text-foreground-disabled"
              name="confirmPassword"
              type="password"
              required
              minLength={8}
              placeholder="••••••••"
            />
          </div>

          <SubmitButton>
            Update Password
          </SubmitButton>

          {error && (
            <div className="mt-2 p-3 bg-destructive/10 text-destructive text-sm font-medium text-center rounded-md border border-destructive/20">
              {error}
            </div>
          )}
          
          {message && (
            <div className="mt-2 p-3 bg-success/10 text-success text-sm font-medium text-center rounded-md border border-success/20">
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
