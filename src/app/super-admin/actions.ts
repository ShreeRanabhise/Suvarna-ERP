'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { ActionResult } from '@/app/actions'
import { requirePermission } from '@/lib/permissions'
import { ShopService } from '@/services/shop.service'

const shopSchema = z.object({
  name: z.string().min(1, 'Shop name is required').max(100).trim(),
  subscriptionPlan: z.enum(['STANDARD', 'ENTERPRISE']),
  subscriptionEnd: z.string(),
  whatsappAddon: z.boolean().default(false),
  ownerEmail: z.string().email('Invalid email address').max(100),
  ownerName: z.string().min(1, 'Owner name is required').max(100).trim(),
})

// Helper to verify Super Admin role
async function checkSuperAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const dbUser = await prisma.user.findUnique({ where: { authId: user.id } })
  if (!dbUser) throw new Error('User not found')

  requirePermission(dbUser.role, 'shops.manage')
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

    const shop = await ShopService.createShop(parsed)

    revalidatePath('/super-admin')
    return { success: true, data: { shopId: shop.id } }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function toggleShopStatus(shopId: string, isSuspended: boolean): Promise<ActionResult> {
  try {
    await checkSuperAdmin()

    await ShopService.toggleShopStatus(shopId, isSuspended)

    revalidatePath('/super-admin')
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}
