export interface Payment {
  id: string
  loanId: string
  amountPaid: any
  principalPaid: any
  interestPaid: any
  paymentDate: Date | string
  paymentMode: 'CASH' | 'UPI' | 'BANK' | 'CHEQUE'
  referenceId: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface Loan {
  id: string
  loanNumber: string
  shopId: string
  branchId: string | null
  customerId: string
  principalAmount: any
  interestRate: any
  ltvPercentage: any
  status: 'ACTIVE' | 'CLOSED' | 'OVERDUE' | 'AUCTION' | 'RENEWED'
  startDate: Date | string
  endDate: Date | string | null
  isDeleted: boolean
  createdAt: Date | string
  updatedAt: Date | string
  payments: Payment[]
}

export function calculateLoanBalances(loan: Loan, targetDate: Date = new Date()) {
  const principalAmount = Number(loan.principalAmount || 0)
  const interestRate = Number(loan.interestRate || 0)

  let outstandingPrincipal = principalAmount
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
    const paymentInterestPaid = Number(payment.interestPaid || 0)
    const paymentPrincipalPaid = Number(payment.principalPaid || 0)
    
    // Calculate interest accrued from the last date to this payment date
    const days = Math.max(0, Math.floor((paymentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)))
    const accrued = outstandingPrincipal * (interestRate / 100) * (days / 30)
    
    interestAccruedTotal += accrued
    interestPaidTotal += paymentInterestPaid
    principalPaidTotal += paymentPrincipalPaid
    
    // Deduct principal paid
    outstandingPrincipal -= paymentPrincipalPaid
    lastDate = paymentDate
  }

  // Calculate interest accrued from the last transaction date to the targetDate
  const days = Math.max(0, Math.floor((targetDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)))
  const accruedSinceLast = outstandingPrincipal * (interestRate / 100) * (days / 30)
  
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

