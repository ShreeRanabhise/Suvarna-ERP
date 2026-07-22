import { getTenantPrisma } from '@/lib/prisma'
import { createAdminClient } from '@/lib/supabase/admin'
import { logger } from '@/lib/logger'

export class UserService {
  static async createStaffMember(shopId: string, adminUserId: string, name: string, email: string, branchId: string | null, password: string, auditMeta?: { ipAddress: string; userAgent: string }) {
    const prisma = getTenantPrisma(shopId)

    const shop = await prisma.shop.findUnique({
      where: { id: shopId },
      select: { subscriptionPlan: true }
    })
    if (shop?.subscriptionPlan !== 'ENTERPRISE') {
      throw new Error('Staff management is only available on Enterprise plans')
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })
    if (existingUser) {
      throw new Error('A user with this email address already exists')
    }

    const adminAuth = createAdminClient()
    const { data: authData, error: authError } = await adminAuth.auth.admin.createUser({
      email,
      password: password,
      email_confirm: true,
      user_metadata: { name }
    })
    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Failed to create auth user')
    }

    const authId = authData.user.id

    const staff = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          authId,
          email,
          name,
          role: 'STAFF',
          shopId,
          branchId,
        }
      })

      await tx.auditLog.create({
        data: {
          shopId,
          userId: adminUserId,
          action: 'CREATE_STAFF_MEMBER',
          entity: 'USER',
          entityId: newUser.id,
          details: { email: newUser.email, name: newUser.name, branchId: newUser.branchId },
          ipAddress: auditMeta?.ipAddress,
          userAgent: auditMeta?.userAgent,
        }
      })

      return newUser
    })

    logger.info('CREATE_STAFF', `Staff ${email} created`, { shopId, adminUserId, staffId: staff.id })
    return staff
  }

  static async deleteStaffMember(shopId: string, adminUserId: string, staffId: string, auditMeta?: { ipAddress: string; userAgent: string }) {
    const prisma = getTenantPrisma(shopId)

    const staff = await prisma.user.findFirst({
      where: { id: staffId, shopId, role: 'STAFF' },
      select: { id: true, authId: true, email: true, name: true }
    })
    if (!staff) {
      throw new Error('Staff member not found')
    }

    const adminAuth = createAdminClient()

    await prisma.$transaction(async (tx) => {
      const deletedStaff = await tx.user.delete({
        where: { id: staffId }
      })

      if (deletedStaff.authId) {
        await adminAuth.auth.admin.deleteUser(deletedStaff.authId)
      }

      await tx.auditLog.create({
        data: {
          shopId,
          userId: adminUserId,
          action: 'DELETE_STAFF_MEMBER',
          entity: 'USER',
          entityId: staffId,
          details: { email: staff.email, name: staff.name },
          ipAddress: auditMeta?.ipAddress,
          userAgent: auditMeta?.userAgent,
        }
      })
    })

    logger.info('DELETE_STAFF', `Staff ${staffId} deleted`, { shopId, adminUserId, staffId })
  }
}
