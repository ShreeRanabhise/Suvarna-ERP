import { verifyRecoveryOtp } from '../actions'
import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { AnimatedJewelryBackground } from '@/components/login/animated-jewelry-background'
import { SubmitButton } from '@/components/login/submit-button'

export default async function VerifyOtpPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; message?: string; error?: string }>
}) {
  const resolvedParams = await searchParams
  const email = resolvedParams.email || ''
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
          href="/auth/forgot-password"
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
          Back
        </Link>

        {/* Brand Header */}
        <div className="text-center mb-8 mt-6">
          <div className="mx-auto h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold font-sans text-foreground leading-none">Enter Code</h1>
          <p className="text-sm text-foreground-secondary mt-2">
            We sent a 6-digit code to <span className="font-semibold text-foreground">{email}</span>
          </p>
        </div>

        {/* Action Form */}
        <form className="flex flex-col gap-5" action={verifyRecoveryOtp}>
          {/* Hidden input to pass email along with OTP */}
          <input type="hidden" name="email" value={email} />

          <div className="flex flex-col gap-1.5 text-center">
            <label className="text-sm font-medium text-foreground" htmlFor="token">
              6-Digit Verification Code
            </label>
            <input
              className="rounded-md px-3 py-3 text-center tracking-widest text-lg font-bold border border-border bg-background focus-ring text-foreground placeholder:text-foreground-disabled"
              name="token"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="••••••"
              required
              autoFocus
            />
          </div>

          <SubmitButton>
            Verify and Continue
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

        <div className="mt-6 text-center text-sm text-foreground-secondary">
          Didn&apos;t receive the code?{' '}
          <Link href="/auth/forgot-password" className="text-primary font-medium hover:underline">
            Try again
          </Link>
        </div>
      </div>
    </div>
  )
}
