import { getTenantPrisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

export class BranchService {
  static async createBranch(shopId: string, userId: string, name: string, auditMeta?: { ipAddress: string; userAgent: string }) {
    const prisma = getTenantPrisma(shopId)

    const existingBranch = await prisma.branch.findFirst({
      where: { shopId, name },
      select: { id: true }
    })
    if (existingBranch) {
      throw new Error('A branch with this name already exists in your shop')
    }

    const branch = await prisma.$transaction(async (tx) => {
      const newBranch = await tx.branch.create({
        data: {
          name,
          shopId,
        }
      })

      await tx.auditLog.create({
        data: {
          shopId,
          userId,
          action: 'CREATE_BRANCH',
          entity: 'BRANCH',
          entityId: newBranch.id,
          details: { name: newBranch.name },
          ipAddress: auditMeta?.ipAddress,
          userAgent: auditMeta?.userAgent,
        }
      })

      return newBranch
    })

    logger.info('CREATE_BRANCH', `Branch ${name} created`, { shopId, userId, branchId: branch.id })
    return branch
  }

  static async deleteBranch(shopId: string, userId: string, branchId: string, auditMeta?: { ipAddress: string; userAgent: string }) {
    const prisma = getTenantPrisma(shopId)

    const branch = await prisma.branch.findFirst({
      where: { id: branchId, shopId },
      select: {
        id: true,
        name: true,
        _count: {
          select: { users: true, customers: true, loans: true }
        }
      }
    })
    
    if (!branch) {
      throw new Error('Branch not found')
    }

    if (branch._count.users > 0) {
      throw new Error('Cannot delete branch: Active staff members are still assigned to it.')
    }
    if (branch._count.customers > 0) {
      throw new Error('Cannot delete branch: Customers are still associated with it.')
    }
    if (branch._count.loans > 0) {
      throw new Error('Cannot delete branch: Active loans are still registered at it.')
    }

    await prisma.$transaction(async (tx) => {
      await tx.branch.delete({
        where: { id: branchId }
      })

      await tx.auditLog.create({
        data: {
          shopId,
          userId,
          action: 'DELETE_BRANCH',
          entity: 'BRANCH',
          entityId: branchId,
          details: { name: branch.name },
          ipAddress: auditMeta?.ipAddress,
          userAgent: auditMeta?.userAgent,
        }
      })
    })

    logger.info('DELETE_BRANCH', `Branch ${branchId} deleted`, { shopId, userId, branchId })
  }
}
