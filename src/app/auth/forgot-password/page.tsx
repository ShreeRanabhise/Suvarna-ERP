import { requestPasswordReset } from '../actions'
import Link from 'next/link'
import { Shield } from 'lucide-react'
import { AnimatedJewelryBackground } from '@/components/login/animated-jewelry-background'
import { SubmitButton } from '@/components/login/submit-button'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
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
        <Link
          href="/login"
          className="absolute left-6 top-6 text-foreground-secondary hover:text-foreground flex items-center group text-xs font-medium transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mr-1 h-3.5 w-3.5 transition-transform group-hover:-translate-x-1"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Login
        </Link>

        {/* Brand Header */}
        <div className="text-center mb-8 mt-6">
          <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold font-sans text-foreground leading-none">Reset Password</h1>
          <p className="text-sm text-foreground-secondary mt-2">
            Enter your email and we&apos;ll send you a secure link.
          </p>
        </div>

        {/* Action Form */}
        <form className="flex flex-col gap-5" action={requestPasswordReset}>
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

          <SubmitButton>
            Send Secure Reset Link
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
