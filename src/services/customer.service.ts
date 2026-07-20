import { getTenantPrisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { randomUUID } from 'crypto'

export class CustomerService {
  static async onboardCustomerWithLoan(
    shopId: string,
    userId: string,
    customerData: {
      firstName: string
      phone: string
      email: string | null
      aadhaar: string
      address: string
    },
    loanData: {
      principalAmount: number
      goldItemName: string
      goldWeight: number
      goldPurity: string
      valuation: number
    },
    idempotencyKey?: string
  ) {
    const prisma = getTenantPrisma(shopId)
    const correlationId = randomUUID()
    const safeIdempotencyKey = idempotencyKey || correlationId

    try {
      logger.info('ONBOARD_CUSTOMER_START', `Starting customer onboarding for ${customerData.phone}`, { tenantId: shopId, userId, correlationId })

      // 1. Validate Loan LTV (cannot exceed 75% default for safe operations)
      const maxAllowedLoan = (loanData.valuation * 75) / 100
      if (loanData.principalAmount > maxAllowedLoan) {
        throw new Error(`Loan amount (₹${loanData.principalAmount}) exceeds maximum LTV threshold of 75% (₹${maxAllowedLoan})`)
      }

      const result = await prisma.$transaction(async (tx) => {
        // Pessimistically lock the shop row to guarantee limits and sequential loan numbers
        await tx.$queryRaw`SELECT id FROM "Shop" WHERE id = ${shopId} FOR UPDATE`
        
        const shop = await tx.shop.findUnique({
          where: { id: shopId },
          select: {
            subscriptionPlan: true,
            _count: { select: { customers: true } }
          }
        })

        if (shop?.subscriptionPlan === 'STANDARD' && (shop._count?.customers || 0) >= 100) {
          throw new Error('Standard plan limit reached (100 customers max). Please upgrade to Enterprise.')
        }
        
        // A. Create Customer
        const newCustomer = await tx.customer.create({
          data: {
            shopId,
            firstName: customerData.firstName,
            lastName: '',
            phone: customerData.phone,
            email: customerData.email,
            aadhaar: customerData.aadhaar,
            address: customerData.address,
          }
        })

        // B. Create initial KYC Version
        await tx.customerKYCVersion.create({
          data: {
            customerId: newCustomer.id,
            version: 1,
            firstName: customerData.firstName,
            lastName: '',
            phone: customerData.phone,
            email: customerData.email,
            aadhaar: customerData.aadhaar,
            address: customerData.address,
            changedById: userId,
            reason: 'Initial onboarding'
          }
        })

        // Generate Loan Number SGL-{YEAR}-{COUNT} inside the lock
        const count = await tx.loan.count({ where: { shopId } })
        const loanNumber = `SGL-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

        // C. Create Loan
        const newLoan = await tx.loan.create({
          data: {
            loanNumber,
            shopId,
            customerId: newCustomer.id,
            principalAmount: loanData.principalAmount,
            interestRate: 2.0, // default interest rate: 2% monthly
            ltvPercentage: 75,
            version: 1, // initialize version to 1
            pledgedItems: {
              create: {
                name: loanData.goldItemName,
                weightGrams: loanData.goldWeight,
                purity: loanData.goldPurity,
                valuation: loanData.valuation
              }
            }
          }
        })

        // D. Record disbursement debit in double-entry ledger
        await tx.ledgerEntry.create({
          data: {
            shopId,
            loanId: newLoan.id,
            category: 'PRINCIPAL',
            type: 'DEBIT',
            amount: loanData.principalAmount,
            balanceAfter: loanData.principalAmount,
            performedBy: userId,
            idempotencyKey: `onboard-loan-principal-${safeIdempotencyKey}`
          }
        })

        // E. Log state machine status initialization
        await tx.loanStateHistory.create({
          data: {
            loanId: newLoan.id,
            fromStatus: 'ACTIVE',
            toStatus: 'ACTIVE',
            changedById: userId,
            details: 'Initial disburse'
          }
        })

        // F. Write Audit Logs
        await tx.auditLog.create({
          data: {
            shopId,
            userId,
            action: 'ONBOARD_CUSTOMER_WITH_LOAN',
            entity: 'CUSTOMER',
            entityId: newCustomer.id,
            details: JSON.stringify({ loanId: newLoan.id, loanNumber })
          }
        })

        return { customerId: newCustomer.id, loanId: newLoan.id }
      })

      logger.info('ONBOARD_CUSTOMER_SUCCESS', `Successfully onboarded customer ${result.customerId}`, { tenantId: shopId, userId, correlationId })
      return result
    } catch (error: any) {
      logger.error('ONBOARD_CUSTOMER_FAILED', error.message, error, { tenantId: shopId, userId, correlationId })
      throw error
    }
  }
}
