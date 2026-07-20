'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { ActionResult } from '@/app/actions'

const shopSchema = z.object({
  name: z.string().min(1, 'Shop name is required'),
  subscriptionPlan: z.enum(['STANDARD', 'ENTERPRISE']),
  subscriptionEnd: z.string(),
  whatsappAddon: z.boolean().default(false),
  ownerEmail: z.string().email('Invalid email address'),
  ownerName: z.string().min(1, 'Owner name is required'),
})

// Helper to verify Super Admin role
async function checkSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
  if (!dbUser || dbUser.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Super Admin access required')
  }
  return dbUser
}

export async function createShop(formData: FormData): Promise<ActionResult<{ shopId: string }>> {
  try {
    await checkSuperAdmin()

    const data = {
      name: formData.get('name') as string,
      subscriptionPlan: formData.get('subscriptionPlan') as 'STANDARD' | 'ENTERPRISE',
      subscriptionEnd: formData.get('subscriptionEnd') as string,
      whatsappAddon: formData.get('whatsappAddon') === 'true',
      ownerEmail: formData.get('ownerEmail') as string,
      ownerName: formData.get('ownerName') as string,
    }

    const parsed = shopSchema.parse(data)

    const shop = await prisma.$transaction(async (tx) => {
      // 1. Create the shop
      const newShop = await tx.shop.create({
        data: {
          name: parsed.name,
          subscriptionPlan: parsed.subscriptionPlan,
          subscriptionEnd: new Date(parsed.subscriptionEnd),
          whatsappAddon: parsed.whatsappAddon,
        }
      })

      // 2. Create the Owner user mapping
      await tx.user.create({
        data: {
          email: parsed.ownerEmail,
          name: parsed.ownerName,
          role: 'OWNER',
          shopId: newShop.id,
        }
      })

      return newShop
    })

    revalidatePath('/super-admin')
    return { success: true, data: { shopId: shop.id } }
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' }
  }
}

export async function toggleShopStatus(shopId: string, isSuspended: boolean): Promise<ActionResult> {
  try {
    await checkSuperAdmin()

  // We can suspend by setting the subscriptionEnd to past or adding a status field.
  // For this model, let's toggle the subscriptionEnd date to "now" if suspending,
  // or extend it by 1 year if activating.
  const subscriptionEnd = isSuspended
    ? new Date() // Expire immediately (Suspend)
    : new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // Renew +1 year

  await prisma.shop.update({
    where: { id: shopId },
    data: { subscriptionEnd }
  })

    revalidatePath('/super-admin')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' }
  }
}
