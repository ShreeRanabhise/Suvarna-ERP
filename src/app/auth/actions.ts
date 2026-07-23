'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = await createClient()

  if (!email) {
    redirect('/auth/forgot-password?message=Email is required')
  }

  const headersList = await headers()
  const host = headersList.get('host')
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const origin = `${protocol}://${host}`

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/auth/update-password`,
  })

  if (error) {
    console.error('Password reset error:', error)
    redirect('/auth/forgot-password?error=Could not send reset link. Please try again.')
  }

  redirect('/auth/forgot-password?message=Check your email for the secure reset link.')
}

export async function updatePassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string
  const supabase = await createClient()

  if (password !== confirmPassword) {
    redirect('/auth/update-password?error=Passwords do not match')
  }

  if (password.length < 8) {
    redirect('/auth/update-password?error=Password must be at least 8 characters long')
  }

  const { error } = await supabase.auth.updateUser({
    password: password
  })

  if (error) {
    console.error('Update password error:', error)
    redirect('/auth/update-password?error=Failed to update password. Please try again.')
  }

  // Force sign out to require fresh login with new credentials
  await supabase.auth.signOut()

  redirect('/login?message=Password updated successfully. Please log in with your new credentials.')
}
