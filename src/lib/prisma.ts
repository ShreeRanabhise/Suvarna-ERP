import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient().$extends({
    query: {
      customer: {
        async findMany({ args, query }) {
          args.where = { ...args.where, isDeleted: false }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, isDeleted: false }
          return query(args)
        },
        async findUnique({ args, query }) {
          args.where = { ...args.where, isDeleted: false }
          return query(args)
        },
        async count({ args, query }) {
          args.where = { ...args.where, isDeleted: false }
          return query(args)
        },
      },
      loan: {
        async findMany({ args, query }) {
          args.where = { ...args.where, isDeleted: false }
          return query(args)
        },
        async findFirst({ args, query }) {
          args.where = { ...args.where, isDeleted: false }
          return query(args)
        },
        async findUnique({ args, query }) {
          args.where = { ...args.where, isDeleted: false }
          return query(args)
        },
        async count({ args, query }) {
          args.where = { ...args.where, isDeleted: false }
          return query(args)
        },
      }
    }
  })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma

/**
 * Creates a tenant-scoped Prisma client.
 * Use this wrapper inside Server Actions and Services to automatically enforce `shopId`.
 */
export function getTenantPrisma(shopId: string) {
  if (!shopId) throw new Error('Tenant context (shopId) is required to instantiate tenant Prisma client.')

  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Only inject shopId if the model has a shopId field
          const modelsWithShopId = ['Branch', 'Customer', 'Loan', 'NotificationLog', 'AuditLog', 'LedgerEntry', 'User']
          
          if (modelsWithShopId.includes(model)) {
            if (operation === 'findUnique' || operation === 'findFirst' || operation === 'findMany' || operation === 'count' || operation === 'update' || operation === 'updateMany' || operation === 'delete' || operation === 'deleteMany' || operation === 'aggregate' || operation === 'groupBy') {
               // @ts-expect-error
               args.where = { ...args.where, shopId }
            }
          }

          // Special case for Shop model itself - tenant can only query their own shop
          if (model === 'Shop' && (operation === 'findUnique' || operation === 'findFirst' || operation === 'update')) {
              // @ts-expect-error
             args.where = { ...args.where, id: shopId }
          }
          
          return query(args)
        }
      }
    }
  })
}
