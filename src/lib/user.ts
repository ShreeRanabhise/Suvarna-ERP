import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export const getCachedUser = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      shopId: true,
      shop: {
        select: {
          id: true,
          name: true,
          subscriptionPlan: true
        }
      }
    }
  })

  return dbUser
})
