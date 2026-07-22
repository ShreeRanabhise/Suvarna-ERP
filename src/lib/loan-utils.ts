import { Prisma } from '@prisma/client'
const Decimal = Prisma.Decimal
export interface Payment {
  id: string
  loanId: string
  amountPaid: Prisma.Decimal.Value
  principalPaid: Prisma.Decimal.Value
  interestPaid: Prisma.Decimal.Value
  paymentDate: Date | string
  paymentMode: 'CASH' | 'UPI' | 'BANK' | 'CHEQUE'
  referenceId: string | null
  status?: 'COMPLETED' | 'REVERSED'
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Loan {
  id: string
  loanNumber: string
  shopId: string
  branchId: string | null
  customerId: string
  principalAmount: Prisma.Decimal.Value
  interestRate: Prisma.Decimal.Value
  ltvPercentage: Prisma.Decimal.Value
  status: 'ACTIVE' | 'CLOSED' | 'OVERDUE' | 'AUCTION' | 'RENEWED'
  startDate: Date | string
  endDate: Date | string | null
  isDeleted: boolean
  createdAt: Date | string
  updatedAt: Date | string
  payments: Payment[]
}

export function calculateLoanBalances(loan: Loan, targetDate: Date = new Date()) {
  const principalAmount = new Decimal(loan.principalAmount || 0)
  const interestRate = new Decimal(loan.interestRate || 0)

  let outstandingPrincipal = principalAmount
  let lastDate = new Date(loan.startDate)
  let interestAccruedTotal = new Decimal(0)
  let interestPaidTotal = new Decimal(0)
  let principalPaidTotal = new Decimal(0)

  // Sort payments chronologically, excluding REVERSED payments
  const sortedPayments = [...(loan.payments || [])]
    .filter(p => p.status !== 'REVERSED')
    .sort((a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime())

  for (const payment of sortedPayments) {
    const paymentDate = new Date(payment.paymentDate)
    const paymentInterestPaid = new Decimal(payment.interestPaid || 0)
    const paymentPrincipalPaid = new Decimal(payment.principalPaid || 0)
    
    // Calculate interest accrued from the last date to this payment date
    const msDiff = Math.max(0, paymentDate.getTime() - lastDate.getTime())
    const days = new Decimal(msDiff).dividedBy(1000 * 60 * 60 * 24).floor()
    
    // accrued = outstandingPrincipal * (interestRate / 100) * (days / 30)
    const ratePerDay = interestRate.dividedBy(100).dividedBy(30)
    const accrued = outstandingPrincipal.times(ratePerDay).times(days)
    
    interestAccruedTotal = interestAccruedTotal.plus(accrued)
    interestPaidTotal = interestPaidTotal.plus(paymentInterestPaid)
    principalPaidTotal = principalPaidTotal.plus(paymentPrincipalPaid)
    
    // Deduct principal paid
    outstandingPrincipal = outstandingPrincipal.minus(paymentPrincipalPaid)
    lastDate = paymentDate
  }

  // Calculate interest accrued from the last transaction date to the targetDate
  const msDiff = Math.max(0, targetDate.getTime() - lastDate.getTime())
  const daysSinceLast = new Decimal(msDiff).dividedBy(1000 * 60 * 60 * 24).floor()
  
  const ratePerDay = interestRate.dividedBy(100).dividedBy(30)
  const accruedSinceLast = outstandingPrincipal.times(ratePerDay).times(daysSinceLast)
  
  interestAccruedTotal = interestAccruedTotal.plus(accruedSinceLast)

  const interestDue = Decimal.max(0, interestAccruedTotal.minus(interestPaidTotal))
  const totalDue = Decimal.max(0, outstandingPrincipal.plus(interestDue))

  return {
    outstandingPrincipal: Decimal.max(0, outstandingPrincipal).toDecimalPlaces(2).toNumber(),
    interestAccruedTotal: interestAccruedTotal.toDecimalPlaces(2).toNumber(),
    interestPaid: interestPaidTotal.toDecimalPlaces(2).toNumber(),
    interestDue: interestDue.toDecimalPlaces(2).toNumber(),
    totalDue: totalDue.toDecimalPlaces(2).toNumber(),
    daysSinceLast: daysSinceLast.toNumber(),
  }
}

export function formatNumericCustomerId(id: string): string {
  if (!id) return '00000000'
  const digits = id
    .toLowerCase()
    .replace(/[^0-9a-f]/g, '')
    .split('')
    .map(c => {
      const code = c.charCodeAt(0)
      if (code >= 48 && code <= 57) return c
      if (code >= 97 && code <= 102) return String(code - 96)
      return '0'
    })
    .join('')
  return digits.slice(0, 8)
}
