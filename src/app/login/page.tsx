import { login, resetPassword } from './actions'
import { AnimatedJewelryBackground } from '@/components/login/animated-jewelry-background'

export default async function LoginPage(
  props: {
    searchParams: Promise<{ message?: string }>
  }
) {
  const searchParams = await props.searchParams

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
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-foreground" htmlFor="password">
                Password
              </label>
              <button 
                formAction={resetPassword}
                formNoValidate
                className="text-xs text-[#BA390C] hover:underline bg-transparent border-none p-0 cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
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
