export interface Payment {
  id: string
  loanId: string
  amountPaid: number
  principalPaid: number
  interestPaid: number
  paymentDate: Date
  paymentMode: 'CASH' | 'UPI' | 'BANK' | 'CHEQUE'
  referenceId: string | null
  createdAt: Date
  updatedAt: Date
}

export interface Loan {
  id: string
  loanNumber: string
  shopId: string
  branchId: string | null
  customerId: string
  principalAmount: number
  interestRate: number
  ltvPercentage: number
  status: 'ACTIVE' | 'CLOSED' | 'OVERDUE' | 'AUCTION' | 'RENEWED'
  startDate: Date
  endDate: Date | null
  isDeleted: boolean
  createdAt: Date
  updatedAt: Date
  payments: Payment[]
}

export function calculateLoanBalances(loan: Loan, targetDate: Date = new Date()) {
  let outstandingPrincipal = loan.principalAmount
  let lastDate = new Date(loan.startDate)
  let interestAccruedTotal = 0
  let interestPaidTotal = 0
  let principalPaidTotal = 0

  // Sort payments chronologically
  const sortedPayments = [...(loan.payments || [])].sort(
    (a, b) => new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime()
  )

  for (const payment of sortedPayments) {
    const paymentDate = new Date(payment.paymentDate)
    
    // Calculate interest accrued from the last date to this payment date
    const days = Math.max(0, Math.floor((paymentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)))
    const accrued = outstandingPrincipal * (loan.interestRate / 100) * (days / 30)
    
    interestAccruedTotal += accrued
    interestPaidTotal += payment.interestPaid
    principalPaidTotal += payment.principalPaid
    
    // Deduct principal paid
    outstandingPrincipal -= payment.principalPaid
    lastDate = paymentDate
  }

  // Calculate interest accrued from the last transaction date to the targetDate
  const days = Math.max(0, Math.floor((targetDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)))
  const accruedSinceLast = outstandingPrincipal * (loan.interestRate / 100) * (days / 30)
  
  interestAccruedTotal += accruedSinceLast

  const interestDue = Math.max(0, interestAccruedTotal - interestPaidTotal)
  const totalDue = Math.max(0, outstandingPrincipal + interestDue)

  return {
    outstandingPrincipal: Math.max(0, outstandingPrincipal),
    interestAccruedTotal,
    interestPaid: interestPaidTotal,
    interestDue,
    totalDue,
    daysSinceLast: days,
  }
}
