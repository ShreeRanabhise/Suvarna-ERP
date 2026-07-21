import { describe, it, expect } from 'vitest'
import { calculateLoanBalances, Loan } from './loan-utils'
import { Prisma } from '@prisma/client'

describe('calculateLoanBalances', () => {
  const baseLoan: Omit<Loan, 'payments'> = {
    id: 'test-loan-id',
    loanNumber: 'SGL-2024-0001',
    shopId: 'shop-id',
    branchId: null,
    customerId: 'customer-id',
    principalAmount: new Prisma.Decimal(10000), // 10k
    interestRate: new Prisma.Decimal(12), // 12% per month (this means 12/100 per month theoretically, but rate is often yearly. Wait, loan-utils says divided by 30, so it is per month)
    ltvPercentage: new Prisma.Decimal(75),
    status: 'ACTIVE',
    startDate: new Date('2024-01-01T00:00:00Z'),
    endDate: null,
    isDeleted: false,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  }

  it('should calculate balances for a loan with no payments', () => {
    const loan: Loan = { ...baseLoan, payments: [] }
    // 30 days after start
    const targetDate = new Date('2024-01-31T00:00:00Z')
    
    const result = calculateLoanBalances(loan, targetDate)
    
    // Principal: 10000
    // Rate: 12% / 30 = 0.4% per day
    // Days: 30
    // Accrued: 10000 * 0.004 * 30 = 1200
    expect(result.outstandingPrincipal).toBe(10000)
    expect(result.interestAccruedTotal).toBe(1200)
    expect(result.interestDue).toBe(1200)
    expect(result.totalDue).toBe(11200)
  })

  it('should calculate balances after a partial interest payment', () => {
    const loan: Loan = { 
      ...baseLoan, 
      payments: [
        {
          id: 'pay-1',
          loanId: 'test-loan-id',
          amountPaid: new Prisma.Decimal(1000),
          principalPaid: new Prisma.Decimal(0),
          interestPaid: new Prisma.Decimal(1000),
          paymentDate: new Date('2024-01-31T00:00:00Z'),
          paymentMode: 'CASH',
          referenceId: null,
          createdAt: new Date('2024-01-31T00:00:00Z'),
          updatedAt: new Date('2024-01-31T00:00:00Z'),
        }
      ] 
    }
    
    const targetDate = new Date('2024-01-31T00:00:00Z')
    const result = calculateLoanBalances(loan, targetDate)
    
    // Interest Accrued: 1200
    // Interest Paid: 1000
    // Due: 200
    expect(result.outstandingPrincipal).toBe(10000)
    expect(result.interestAccruedTotal).toBe(1200)
    expect(result.interestPaid).toBe(1000)
    expect(result.interestDue).toBe(200)
    expect(result.totalDue).toBe(10200)
  })

  it('should reduce principal correctly on payment', () => {
    const loan: Loan = { 
      ...baseLoan, 
      payments: [
        {
          id: 'pay-1',
          loanId: 'test-loan-id',
          amountPaid: new Prisma.Decimal(3200),
          principalPaid: new Prisma.Decimal(2000),
          interestPaid: new Prisma.Decimal(1200),
          paymentDate: new Date('2024-01-31T00:00:00Z'),
          paymentMode: 'CASH',
          referenceId: null,
          createdAt: new Date('2024-01-31T00:00:00Z'),
          updatedAt: new Date('2024-01-31T00:00:00Z'),
        }
      ] 
    }
    
    // 30 days later again (total 60 days)
    const targetDate = new Date('2024-03-01T00:00:00Z')
    const result = calculateLoanBalances(loan, targetDate)
    
    // First 30 days:
    // Accrued = 1200
    // Payment = 1200 interest, 2000 principal
    // Principal remaining = 8000
    //
    // Next 30 days (Jan 31 to Mar 1 = 30 days, assume leap year? Jan 31 to Mar 1 is 30 days)
    // Accrued = 8000 * 0.004 * 30 = 960
    
    expect(result.outstandingPrincipal).toBe(8000)
    expect(result.interestAccruedTotal).toBe(2160) // 1200 + 960
    expect(result.interestPaid).toBe(1200)
    expect(result.interestDue).toBe(960)
    expect(result.totalDue).toBe(8960)
  })
})
