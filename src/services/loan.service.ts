import { getTenantPrisma } from '@/lib/prisma'
import { calculateLoanBalances } from '@/lib/loan-utils'
import { logger } from '@/lib/logger'
import { randomUUID } from 'crypto'
import { Decimal } from 'decimal.js'

const VALID_TRANSITIONS: Record<string, string[]> = {
  ACTIVE: ['OVERDUE', 'CLOSED', 'RENEWED'],
  OVERDUE: ['AUCTION', 'ACTIVE', 'CLOSED'],
  AUCTION: ['ACTIVE', 'CLOSED'],
  CLOSED: [],
  RENEWED: []
}

function validateStateTransition(from: string, to: string) {
  const allowed = VALID_TRANSITIONS[from] || []
  if (from !== to && !allowed.includes(to)) {
    throw new Error(`Invalid status transition from ${from} to ${to}`)
  }
}

export class LoanService {
  /**
   * Repays a loan with Optimistic Concurrency Control (OCC).
   */
  static async repayLoan(
    shopId: string,
    userId: string,
    loanId: string,
    amountPaid: number,
    paymentMode: 'CASH' | 'UPI' | 'BANK' | 'CHEQUE',
    referenceId: string | null,
    currentVersion: number,
    idempotencyKey?: string
  ) {
    const prisma = getTenantPrisma(shopId)
    const correlationId = randomUUID()
    const safeKey = idempotencyKey || correlationId

    try {
      logger.info('REPAY_LOAN_START', `Initiating repayment of ${amountPaid} for loan ${loanId}`, { tenantId: shopId, userId, correlationId })

      const result = await prisma.$transaction(async (tx) => {
        // Idempotency check
        const existingLog = await tx.idempotencyLog.findUnique({
          where: { key: safeKey }
        })
        if (existingLog && existingLog.payload) {
          return JSON.parse(existingLog.payload) as { paymentId: string, isFullyPaid: boolean, customerId: string }
        }

        // Optimistic Locking: We only fetch the loan if the version matches what the client expects.
        // If someone else modified the loan (version incremented), this will return null.
        const loan = await tx.loan.findFirst({
          where: { id: loanId, version: currentVersion },
          include: { payments: true }
        })

        if (!loan) {
            // Distinguish between Not Found and Concurrency Conflict
            const exists = await tx.loan.findUnique({ where: { id: loanId }})
            if (exists) {
                throw new Error('Concurrency Conflict: The loan was modified by another user. Please refresh and try again.')
            }
            throw new Error('Loan not found or unauthorized')
        }

        if (loan.status === 'CLOSED') throw new Error('Loan is already closed')

        // Calculate balances
        const balances = calculateLoanBalances(loan as any)
        
        // Exact decimal calculations
        const interestPaid = Math.min(amountPaid, balances.interestDue)
        const rawPrincipalPaid = Math.max(0, amountPaid - interestPaid)
        const principalPaid = Math.min(rawPrincipalPaid, balances.outstandingPrincipal)
        const actualAmountPaid = interestPaid + principalPaid

        // Create the payment
        const newPayment = await tx.payment.create({
          data: {
            loanId,
            amountPaid: actualAmountPaid,
            principalPaid,
            interestPaid,
            paymentMode,
            referenceId: referenceId || null,
            paymentDate: new Date()
          }
        })

        const finalOutstandingPrincipal = balances.outstandingPrincipal - principalPaid
        const isFullyPaid = finalOutstandingPrincipal <= 0.01
        const targetStatus = isFullyPaid ? 'CLOSED' : loan.status

        if (isFullyPaid) {
          validateStateTransition(loan.status, 'CLOSED')
        }

        // Increment version safely for Optimistic Concurrency Control
        await tx.loan.update({
          where: { id: loanId },
          data: {
            status: targetStatus,
            endDate: isFullyPaid ? new Date() : loan.endDate,
            version: { increment: 1 }
          }
        })

        // Double-entry ledger logic
        if (interestPaid > 0) {
          await tx.ledgerEntry.create({
            data: {
              shopId,
              loanId,
              paymentId: newPayment.id,
              category: 'INTEREST',
              type: 'CREDIT',
              amount: interestPaid,
              balanceAfter: Math.max(0, balances.interestDue - interestPaid),
              performedBy: userId,
              idempotencyKey: `repay-interest-${newPayment.id}`
            }
          })
        }

        if (principalPaid > 0) {
          await tx.ledgerEntry.create({
            data: {
              shopId,
              loanId,
              paymentId: newPayment.id,
              category: 'PRINCIPAL',
              type: 'CREDIT',
              amount: principalPaid,
              balanceAfter: finalOutstandingPrincipal,
              performedBy: userId,
              idempotencyKey: `repay-principal-${newPayment.id}`
            }
          })
        }

        // State history
        if (isFullyPaid) {
          await tx.loanStateHistory.create({
            data: {
              loanId,
              fromStatus: loan.status,
              toStatus: 'CLOSED',
              changedById: userId,
              details: 'Loan fully paid off'
            }
          })
        }

        // Audit Logging
        await tx.auditLog.create({
          data: {
            shopId,
            userId,
            action: 'RECORD_REPAYMENT',
            entity: 'PAYMENT',
            entityId: newPayment.id,
            details: JSON.stringify({
              loanId,
              amountPaid: actualAmountPaid,
              principalPaid,
              interestPaid,
              isFullyPaid,
              previousVersion: loan.version,
              newVersion: loan.version + 1
            })
          }
        })

        const payload = { paymentId: newPayment.id, isFullyPaid, customerId: loan.customerId }

        if (idempotencyKey) {
          await tx.idempotencyLog.create({
            data: {
              key: safeKey,
              shopId,
              userId,
              action: 'REPAY_LOAN',
              payload: JSON.stringify(payload)
            }
          })
        }

        return payload
      })

      logger.info('REPAY_LOAN_SUCCESS', `Successfully repaid ${amountPaid} for loan ${loanId}`, { tenantId: shopId, userId, correlationId })
      return result
    } catch (error: any) {
      logger.error('REPAY_LOAN_FAILED', error.message, error, { tenantId: shopId, userId, correlationId })
      throw error
    }
  }

  static async updateStatus(
    shopId: string,
    userId: string,
    loanId: string,
    status: 'ACTIVE' | 'CLOSED' | 'OVERDUE' | 'AUCTION' | 'RENEWED',
    currentVersion: number
  ) {
    const prisma = getTenantPrisma(shopId)
    const correlationId = randomUUID()

    try {
      logger.info('UPDATE_LOAN_STATUS_START', `Updating status of loan ${loanId} to ${status}`, { tenantId: shopId, userId, correlationId })

      const result = await prisma.$transaction(async (tx) => {
        const loan = await tx.loan.findFirst({
          where: { id: loanId, version: currentVersion },
          select: { id: true, customerId: true, status: true, version: true }
        })
        
        if (!loan) {
            const exists = await tx.loan.findUnique({ where: { id: loanId }})
            if (exists) {
                throw new Error('Concurrency Conflict: The loan was modified by another user. Please refresh and try again.')
            }
            throw new Error('Loan not found or unauthorized')
        }

        validateStateTransition(loan.status, status)

        await tx.loan.update({
          where: { id: loanId },
          data: { 
            status,
            version: { increment: 1 } 
          }
        })

        await tx.loanStateHistory.create({
          data: {
            loanId,
            fromStatus: loan.status,
            toStatus: status,
            changedById: userId,
            details: 'Manual status update via dashboard'
          }
        })

        await tx.auditLog.create({
          data: {
            shopId,
            userId,
            action: 'UPDATE_LOAN_STATUS',
            entity: 'LOAN',
            entityId: loanId,
            details: JSON.stringify({ 
                status, 
                previousVersion: loan.version,
                newVersion: loan.version + 1
            })
          }
        })

        return { customerId: loan.customerId }
      })

      logger.info('UPDATE_LOAN_STATUS_SUCCESS', `Successfully updated status of loan ${loanId}`, { tenantId: shopId, userId, correlationId })
      return result
    } catch (error: any) {
      logger.error('UPDATE_LOAN_STATUS_FAILED', error.message, error, { tenantId: shopId, userId, correlationId })
      throw error
    }
  }

  static async createLoan(
    shopId: string,
    userId: string,
    loanData: {
      customerId: string
      principalAmount: number
      interestRate: number
      ltvPercentage: number
      itemName: string
      weightGrams: number
      purity: string
      valuation: number
    },
    branchId?: string | null,
    idempotencyKey?: string
  ) {
    const prisma = getTenantPrisma(shopId)
    const correlationId = randomUUID()
    const safeKey = idempotencyKey || correlationId

    try {
      logger.info('CREATE_LOAN_START', `Initiating loan creation for customer ${loanData.customerId}`, { tenantId: shopId, userId, correlationId })

      const result = await prisma.$transaction(async (tx) => {
        // Idempotency check
        const existingLog = await tx.idempotencyLog.findUnique({
          where: { key: safeKey }
        })
        if (existingLog && existingLog.payload) {
          return JSON.parse(existingLog.payload) as { loanId: string }
        }

        // Pessimistically lock the shop row to guarantee sequential loan numbers
        await tx.$queryRaw`SELECT id FROM "Shop" WHERE id = ${shopId} FOR UPDATE`
        
        const count = await tx.loan.count({ where: { shopId } })
        const loanNumber = `SGL-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

        const newLoan = await tx.loan.create({
          data: {
            loanNumber,
            shopId,
            branchId,
            customerId: loanData.customerId,
            principalAmount: loanData.principalAmount,
            interestRate: loanData.interestRate,
            ltvPercentage: loanData.ltvPercentage,
            pledgedItems: {
              create: {
                name: loanData.itemName,
                weightGrams: loanData.weightGrams,
                purity: loanData.purity,
                valuation: loanData.valuation
              }
            }
          }
        })

        // Initialize Ledger with Principal Disbursement
        await tx.ledgerEntry.create({
          data: {
            shopId,
            loanId: newLoan.id,
            category: 'PRINCIPAL',
            type: 'DEBIT',
            amount: loanData.principalAmount,
            balanceAfter: loanData.principalAmount,
            performedBy: userId,
            idempotencyKey: `disburse-loan-principal-${safeKey}`
          }
        })

        // Log state machine status initialization
        await tx.loanStateHistory.create({
          data: {
            loanId: newLoan.id,
            fromStatus: 'ACTIVE',
            toStatus: 'ACTIVE',
            changedById: userId,
            details: 'Initial disburse'
          }
        })

        await tx.auditLog.create({
          data: {
            shopId,
            userId,
            action: 'CREATE_LOAN',
            entity: 'LOAN',
            entityId: newLoan.id,
          }
        })

        if (idempotencyKey) {
          await tx.idempotencyLog.create({
            data: {
              key: idempotencyKey,
              action: 'CREATE_LOAN',
              payload: JSON.stringify({ loanId: newLoan.id })
            }
          })
        }

        return { loanId: newLoan.id }
      })

      logger.info('CREATE_LOAN_SUCCESS', `Successfully created loan ${result.loanId}`, { tenantId: shopId, userId, correlationId })
      return result
    } catch (error: any) {
      logger.error('CREATE_LOAN_FAILED', error.message, error, { tenantId: shopId, userId, correlationId })
      throw error
    }
  }
}
