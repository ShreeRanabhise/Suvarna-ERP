import { requestPasswordReset } from '../actions'
import Link from 'next/link'
import { Shield } from 'lucide-react'

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>
}) {
  const resolvedParams = await searchParams
  const message = resolvedParams.message
  const error = resolvedParams.error

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <Link
        href="/login"
        className="absolute left-8 top-8 py-2 px-4 rounded-md no-underline text-foreground bg-btn-background hover:bg-btn-background-hover flex items-center group text-sm"
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
          className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Login
      </Link>

      <div className="flex flex-col items-center justify-center mb-8 text-center">
        <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Reset Password</h1>
        <p className="text-sm text-foreground/60 mt-2">
          Enter your email address and we'll send you a secure link to reset your password.
        </p>
      </div>

      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground" action={requestPasswordReset}>
        <label className="text-md font-medium" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border border-border mb-6 focus:ring-2 focus:ring-primary focus:outline-none"
          name="email"
          placeholder="you@example.com"
          type="email"
          required
        />

        <button className="bg-primary text-primary-foreground hover:bg-primary/90 font-medium rounded-md px-4 py-2 transition-colors mb-2">
          Send Secure Reset Link
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
