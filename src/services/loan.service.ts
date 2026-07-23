import { getTenantPrisma } from '@/lib/prisma'
import { calculateLoanBalances } from '@/lib/loan-utils'
import { logger } from '@/lib/logger'
import { randomUUID } from 'crypto'

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
    idempotencyKey?: string,
    auditMeta?: { ipAddress: string; userAgent: string }
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
        const balances = calculateLoanBalances(loan as unknown as import('@/lib/loan-utils').Loan)
        
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
            paymentDate: new Date(),
            idempotencyKey: safeKey
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
            details: {
              loanId,
              amountPaid: actualAmountPaid,
              principalPaid,
              interestPaid,
              isFullyPaid,
              previousVersion: loan.version,
              newVersion: loan.version + 1
            },
            ipAddress: auditMeta?.ipAddress,
            userAgent: auditMeta?.userAgent,
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
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('REPAY_LOAN_FAILED', message, error, { tenantId: shopId, userId, correlationId })
      throw error
    }
  }

  static async updateStatus(
    shopId: string,
    userId: string,
    loanId: string,
    status: 'ACTIVE' | 'CLOSED' | 'OVERDUE' | 'AUCTION' | 'RENEWED',
    currentVersion: number,
    auditMeta?: { ipAddress: string; userAgent: string }
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
            details: { 
                status, 
                previousVersion: loan.version,
                newVersion: loan.version + 1
            },
            ipAddress: auditMeta?.ipAddress,
            userAgent: auditMeta?.userAgent,
          }
        })

        return { customerId: loan.customerId }
      })

      logger.info('UPDATE_LOAN_STATUS_SUCCESS', `Successfully updated status of loan ${loanId}`, { tenantId: shopId, userId, correlationId })
      return result
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('UPDATE_LOAN_STATUS_FAILED', message, error, { tenantId: shopId, userId, correlationId })
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
      itemImageUrl?: string | null
    },
    branchId?: string | null,
    idempotencyKey?: string,
    auditMeta?: { ipAddress: string; userAgent: string }
  ) {
    const prisma = getTenantPrisma(shopId)
    const correlationId = randomUUID()
    const safeKey = idempotencyKey || correlationId

    try {
      logger.info('CREATE_LOAN_START', `Initiating loan creation for customer ${loanData.customerId}`, { tenantId: shopId, userId, correlationId })

      let resolvedBranchId = branchId
      if (!resolvedBranchId) {
        const creator = await prisma.user.findUnique({
          where: { id: userId },
          select: { branchId: true }
        })
        if (creator?.branchId) {
          resolvedBranchId = creator.branchId
        } else {
          const defaultBranch = await prisma.branch.findFirst({
            where: { shopId },
            orderBy: { createdAt: 'asc' }
          })
          resolvedBranchId = defaultBranch?.id || null
        }
      }

      if (!resolvedBranchId) {
        throw new Error('A valid branch could not be determined. Please create a branch for this shop.')
      }

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
        
        const currentYear = new Date().getFullYear()
        const latestLoan = await tx.loan.findFirst({
          where: { shopId, loanNumber: { startsWith: `SGL-${currentYear}-` } },
          orderBy: { loanNumber: 'desc' },
          select: { loanNumber: true }
        })
        let nextSeq = 1
        if (latestLoan?.loanNumber) {
          const parts = latestLoan.loanNumber.split('-')
          const lastNum = parseInt(parts[2], 10)
          if (!isNaN(lastNum)) nextSeq = lastNum + 1
        }
        const loanNumber = `SGL-${currentYear}-${String(nextSeq).padStart(4, '0')}`

        const newLoan = await tx.loan.create({
          data: {
            loanNumber,
            shopId,
            branchId: resolvedBranchId,
            customerId: loanData.customerId,
            principalAmount: loanData.principalAmount,
            interestRate: loanData.interestRate,
            ltvPercentage: loanData.ltvPercentage,
            pledgedItems: {
              create: {
                shopId,
                branchId: resolvedBranchId,
                name: loanData.itemName,
                weightGrams: loanData.weightGrams,
                purity: loanData.purity,
                valuation: loanData.valuation,
                imageUrl: loanData.itemImageUrl
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
            ipAddress: auditMeta?.ipAddress,
            userAgent: auditMeta?.userAgent,
          }
        })

        if (idempotencyKey) {
          await tx.idempotencyLog.create({
            data: {
              key: idempotencyKey,
              shopId,
              userId,
              action: 'CREATE_LOAN',
              payload: JSON.stringify({ loanId: newLoan.id })
            }
          })
        }

        return { loanId: newLoan.id }
      })

      logger.info('CREATE_LOAN_SUCCESS', `Successfully created loan ${result.loanId}`, { tenantId: shopId, userId, correlationId })
      return result
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('CREATE_LOAN_FAILED', message, error, { tenantId: shopId, userId, correlationId })
      throw error
    }
  }
  static async rollbackPayment(
    shopId: string,
    userId: string,
    paymentId: string,
    auditMeta?: { ipAddress: string; userAgent: string }
  ) {
    const prisma = getTenantPrisma(shopId)
    const correlationId = randomUUID()

    try {
      logger.info('ROLLBACK_PAYMENT_START', `Initiating rollback for payment ${paymentId}`, { tenantId: shopId, userId, correlationId })

      const result = await prisma.$transaction(async (tx) => {
        const payment = await tx.payment.findFirst({
          where: { id: paymentId, loan: { shopId } },
          include: { loan: { include: { payments: true } } }
        })
        
        if (!payment) throw new Error('Payment not found or unauthorized')
        if (payment.status === 'REVERSED') throw new Error('Payment is already reversed')

        const loan = payment.loan
        const principalPaid = Number(payment.principalPaid)
        const interestPaid = Number(payment.interestPaid)

        // Calculate current balances BEFORE rollback
        const currentBalances = calculateLoanBalances(loan as any)

        // Determine new loan status
        // If loan was CLOSED, reversing a principal payment makes it ACTIVE again.
        let targetStatus = loan.status
        if (loan.status === 'CLOSED' && principalPaid > 0) {
          targetStatus = 'ACTIVE'
        }

        // Update Payment status to REVERSED
        await tx.payment.update({
          where: { id: paymentId },
          data: {
            status: 'REVERSED',
            reversedById: userId,
            reversedAt: new Date()
          }
        })

        // Update Loan status and version
        await tx.loan.update({
          where: { id: loan.id },
          data: {
            status: targetStatus,
            endDate: targetStatus === 'ACTIVE' ? null : loan.endDate,
            version: { increment: 1 }
          }
        })

        // Create compensating Reversing Ledger Entries (DEBIT to counteract CREDIT)
        if (interestPaid > 0) {
          await tx.ledgerEntry.create({
            data: {
              shopId,
              loanId: loan.id,
              paymentId: payment.id,
              category: 'INTEREST',
              type: 'DEBIT', // Reverse of CREDIT
              amount: interestPaid,
              balanceAfter: currentBalances.interestDue + interestPaid,
              performedBy: userId,
              isReversal: true,
              idempotencyKey: `reverse-interest-${payment.id}`
            }
          })
        }

        if (principalPaid > 0) {
          await tx.ledgerEntry.create({
            data: {
              shopId,
              loanId: loan.id,
              paymentId: payment.id,
              category: 'PRINCIPAL',
              type: 'DEBIT', // Reverse of CREDIT
              amount: principalPaid,
              balanceAfter: currentBalances.outstandingPrincipal + principalPaid,
              performedBy: userId,
              isReversal: true,
              idempotencyKey: `reverse-principal-${payment.id}`
            }
          })
        }

        // State history if status changed
        if (targetStatus !== loan.status) {
          await tx.loanStateHistory.create({
            data: {
              loanId: loan.id,
              fromStatus: loan.status,
              toStatus: targetStatus,
              changedById: userId,
              details: `Payment ${paymentId} reversed`
            }
          })
        }

        // Audit Logging
        await tx.auditLog.create({
          data: {
            shopId,
            userId,
            action: 'ROLLBACK_PAYMENT',
            entity: 'PAYMENT',
            entityId: payment.id,
            details: {
              loanId: loan.id,
              principalReversed: principalPaid,
              interestReversed: interestPaid,
              previousStatus: loan.status,
              newStatus: targetStatus
            },
            ipAddress: auditMeta?.ipAddress,
            userAgent: auditMeta?.userAgent,
          }
        })

        return { loanId: loan.id, targetStatus }
      })

      logger.info('ROLLBACK_PAYMENT_SUCCESS', `Successfully rolled back payment ${paymentId}`, { tenantId: shopId, userId, correlationId })
      return result
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error('ROLLBACK_PAYMENT_FAILED', message, error, { tenantId: shopId, userId, correlationId })
      throw error
    }
  }

  static async reconcileLoan(shopId: string, loanId: string) {
    const prisma = getTenantPrisma(shopId)
    
    // Fetch loan, all payments, and all ledger entries
    const loan = await prisma.loan.findFirst({
      where: { id: loanId, shopId },
      include: { payments: true }
    })

    if (!loan) throw new Error('Loan not found')

    const ledgerEntries = await prisma.ledgerEntry.findMany({
      where: { loanId, shopId },
      orderBy: { createdAt: 'asc' }
    })

    // Compute expected balances purely from ledger entries (sum of DEBITs - sum of CREDITs for PRINCIPAL)
    let ledgerPrincipal = new Decimal(0)
    for (const entry of ledgerEntries) {
      if (entry.category === 'PRINCIPAL') {
        if (entry.type === 'DEBIT') {
          ledgerPrincipal = ledgerPrincipal.plus(entry.amount)
        } else if (entry.type === 'CREDIT') {
          ledgerPrincipal = ledgerPrincipal.minus(entry.amount)
        }
      }
    }

    // Compute balance from loan utility (which uses payments and ignores REVERSED)
    const utilBalances = calculateLoanBalances(loan as any)

    // Verify
    const diff = Math.abs(ledgerPrincipal.toNumber() - utilBalances.outstandingPrincipal)
    const isConsistent = diff < 0.01

    return {
      loanId,
      isConsistent,
      ledgerDerivedPrincipal: ledgerPrincipal.toDecimalPlaces(2).toNumber(),
      utilDerivedPrincipal: utilBalances.outstandingPrincipal,
      diff,
      ledgerEntriesCount: ledgerEntries.length,
      validPaymentsCount: loan.payments.filter(p => p.status !== 'REVERSED').length
    }
  }
}
