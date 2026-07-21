import prisma from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'

export class ShopService {
  /**
   * Creates a new shop and its owner in a transaction.
   * Supabase Auth user is created first using the Admin API.
   */
  static async createShop(data: {
    name: string
    subscriptionPlan: 'STANDARD' | 'ENTERPRISE'
    subscriptionEnd: string
    whatsappAddon: boolean
    ownerEmail: string
    ownerName: string
  }) {
    // 1. Create User in Supabase Auth via Admin API
    const adminAuth = createAdminClient()
    const { data: authData, error: authError } = await adminAuth.auth.admin.createUser({
      email: data.ownerEmail,
      password: 'Welcome@123', // Default password for new shops
      email_confirm: true,
      user_metadata: { name: data.ownerName }
    })
    
    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Failed to create auth user for shop owner')
    }

    const authId = authData.user.id

    // 2. Database Transaction
    const shop = await prisma.$transaction(async (tx) => {
      const newShop = await tx.shop.create({
        data: {
          name: data.name,
          subscriptionPlan: data.subscriptionPlan,
          subscriptionEnd: new Date(data.subscriptionEnd),
          whatsappAddon: data.whatsappAddon,
        }
      })

      // 3. Create the Owner user mapping
      await tx.user.create({
        data: {
          authId,
          email: data.ownerEmail,
          name: data.ownerName,
          role: 'OWNER',
          shopId: newShop.id,
        }
      })

      return newShop
    })

    return shop
  }

  /**
   * Toggles the suspension status of a shop by modifying its subscription end date.
   */
  static async toggleShopStatus(shopId: string, isSuspended: boolean) {
    const subscriptionEnd = isSuspended
      ? new Date() // Expire immediately (Suspend)
      : new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // Renew +1 year

    return await prisma.shop.update({
      where: { id: shopId },
      data: { subscriptionEnd }
    })
  }
}
