import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  // If no 'next' is provided, we can assume password reset default for 'recovery' type or redirect to dashboard
  const next = requestUrl.searchParams.get('next') ?? '/auth/update-password'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin))
    }
  }

  // Handle implicit hash-based redirect (old Supabase format or PKCE failure)
  // Usually, if we get here with an error, we redirect to login
  return NextResponse.redirect(new URL('/login?message=Invalid or expired recovery link', requestUrl.origin))
}
