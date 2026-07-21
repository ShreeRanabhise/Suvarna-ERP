import prisma from './prisma'
import { logger } from './logger'

/**
 * Validates against a fixed-window database rate limit.
 * @param action - The name of the action (e.g. CREATE_LOAN)
 * @param identifier - The unique identifier of the caller (e.g. userId or IP)
 * @param limit - Maximum number of allowed requests in the window
 * @param windowMs - Time window in milliseconds
 */
export async function enforceRateLimit(
  action: string,
  identifier: string,
  limit: number = 20,
  windowMs: number = 60000 // 1 minute default
) {
  const key = `${action}:${identifier}`
  
  try {
    const now = new Date()
    
    // We use a Prisma transaction to ensure atomic updates
    const result = await prisma.$transaction(async (tx) => {
      let record = await tx.rateLimit.findUnique({
        where: { key }
      })

      if (!record || record.expiresAt < now) {
        // Reset or create
        record = await tx.rateLimit.upsert({
          where: { key },
          create: {
            key,
            count: 1,
            expiresAt: new Date(now.getTime() + windowMs)
          },
          update: {
            count: 1,
            expiresAt: new Date(now.getTime() + windowMs)
          }
        })
      } else {
        // Increment
        record = await tx.rateLimit.update({
          where: { key },
          data: { count: { increment: 1 } }
        })
      }

      return record
    })

    if (result.count > limit) {
      logger.warn('RATE_LIMIT_EXCEEDED', `Rate limit exceeded for ${key}`, { count: result.count, limit })
      throw new Error('Too many requests. Please try again later.')
    }
  } catch (error: any) {
    if (error.message.includes('Too many requests')) {
      throw error
    }
    // Fail open if the database is down or there's a concurrency issue updating the limit
    logger.error('RATE_LIMIT_ERROR', 'Failed to enforce rate limit', error, { key })
  }
}
