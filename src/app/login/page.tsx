import { login } from './actions'

export default async function LoginPage(
  props: {
    searchParams: Promise<{ message?: string }>
  }
) {
  const searchParams = await props.searchParams

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 min-h-screen mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-heading text-primary">Suvarna ERP</h1>
        <p className="text-muted-foreground mt-2">Sign in to your shop</p>
      </div>

      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground" action={login}>
        <label className="text-md" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          name="email"
          placeholder="you@example.com"
          required
        />
        <label className="text-md" htmlFor="password">
          Password
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border mb-6"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        <button className="bg-primary text-primary-foreground rounded-md px-4 py-2 mb-2 font-medium hover:opacity-90">
          Sign In
        </button>
        {searchParams?.message && (
          <p className="mt-4 p-4 bg-destructive/10 text-destructive text-center rounded-md">
            {searchParams.message}
          </p>
        )}
      </form>
    </div>
  )
}
