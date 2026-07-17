'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { calculateLoanBalances } from '@/lib/loan-utils'

// Validation Schemas
const customerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  aadhaar: z.string().min(12, '12-digit Aadhaar required').max(12),
  address: z.string().min(1, 'Address is required'),
})

const loanSchema = z.object({
  customerId: z.string().uuid(),
  principalAmount: z.number().positive(),
  interestRate: z.number().positive(),
  ltvPercentage: z.number().positive().max(100),
  itemName: z.string(),
  weightGrams: z.number().positive(),
  purity: z.string(),
  valuation: z.number().positive(),
})

const paymentSchema = z.object({
  loanId: z.string().uuid(),
  amountPaid: z.number().positive(),
  principalPaid: z.number().min(0),
  interestPaid: z.number().min(0),
  paymentMode: z.enum(['CASH', 'UPI', 'BANK', 'CHEQUE']),
})

// Helper to get current tenant
async function getTenantContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // In a real implementation, we'd fetch the user from our DB to get their shopId and role
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
    select: { id: true, shopId: true, role: true }
  })
  if (!dbUser || !dbUser.shopId) throw new Error('No tenant associated')

  return { userId: dbUser.id, shopId: dbUser.shopId, role: dbUser.role }
}

export async function createCustomer(formData: FormData) {
  const { shopId, userId } = await getTenantContext()
  
  // Check subscription limits (max 100 customers for Standard)
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      subscriptionPlan: true,
      _count: { select: { customers: true } }
    }
  })

  if (shop?.subscriptionPlan === 'STANDARD' && shop._count.customers >= 100) {
    throw new Error('Standard plan limit reached (100 customers max). Please upgrade to Enterprise.')
  }

  const data = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    phone: formData.get('phone') as string,
    aadhaar: formData.get('aadhaar') as string,
    address: formData.get('address') as string,
  }

  const parsed = customerSchema.parse(data)

  const customer = await prisma.$transaction(async (tx) => {
    const newCustomer = await tx.customer.create({
      data: {
        ...parsed,
        shopId,
      }
    })

    // Write initial KYC Version
    await tx.customerKYCVersion.create({
      data: {
        customerId: newCustomer.id,
        version: 1,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        phone: parsed.phone,
        email: null,
        aadhaar: parsed.aadhaar,
        address: parsed.address,
        changedById: userId,
        reason: 'Initial registration'
      }
    })

    return newCustomer
  })

  await prisma.auditLog.create({
    data: {
      shopId,
      userId,
      action: 'CREATE_CUSTOMER',
      entity: 'CUSTOMER',
      entityId: customer.id,
    }
  })

  revalidatePath('/dashboard/customers')
  return { success: true, customerId: customer.id }
}

export async function createLoan(formData: FormData) {
  const { shopId, userId } = await getTenantContext()
  
  const data = {
    customerId: formData.get('customerId') as string,
    principalAmount: Number(formData.get('principalAmount')),
    interestRate: Number(formData.get('interestRate')),
    ltvPercentage: Number(formData.get('ltvPercentage')),
    itemName: formData.get('itemName') as string,
    weightGrams: Number(formData.get('weightGrams')),
    purity: formData.get('purity') as string,
    valuation: Number(formData.get('valuation')),
  }

  const parsed = loanSchema.parse(data)

  // Validate LTV
  const maxAllowedLoan = (parsed.valuation * parsed.ltvPercentage) / 100
  if (parsed.principalAmount > maxAllowedLoan) {
    throw new Error('Loan amount exceeds allowed LTV')
  }

  // Generate Loan Number SGL-{YEAR}-{COUNT}
  const count = await prisma.loan.count({ where: { shopId } })
  const loanNumber = `SGL-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

  const loan = await prisma.$transaction(async (tx) => {
    const newLoan = await tx.loan.create({
      data: {
        loanNumber,
        shopId,
        customerId: parsed.customerId,
        principalAmount: parsed.principalAmount,
        interestRate: parsed.interestRate,
        ltvPercentage: parsed.ltvPercentage,
        pledgedItems: {
          create: {
            name: parsed.itemName,
            weightGrams: parsed.weightGrams,
            purity: parsed.purity,
            valuation: parsed.valuation
          }
        }
      }
    })

    // Record disbursement debit in double-entry ledger
    await tx.ledgerEntry.create({
      data: {
        shopId,
        loanId: newLoan.id,
        category: 'PRINCIPAL',
        type: 'DEBIT',
        amount: parsed.principalAmount,
        balanceAfter: parsed.principalAmount,
        performedBy: userId,
        idempotencyKey: `disburse-loan-principal-${newLoan.id}`
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

    return newLoan
  })

  revalidatePath('/dashboard/loans')
  return { success: true, loanId: loan.id }
}

export async function recordPayment(formData: FormData) {
  const { shopId, userId } = await getTenantContext()
  
  const data = {
    loanId: formData.get('loanId') as string,
    amountPaid: Number(formData.get('amountPaid')),
    principalPaid: Number(formData.get('principalPaid')),
    interestPaid: Number(formData.get('interestPaid')),
    paymentMode: formData.get('paymentMode') as 'CASH' | 'UPI' | 'BANK' | 'CHEQUE',
  }

  const parsed = paymentSchema.parse(data)

  // Verify loan belongs to shop and get current version
  const loan = await prisma.loan.findFirst({
    where: { id: parsed.loanId, shopId },
    select: { id: true, version: true }
  })
  if (!loan) throw new Error('Loan not found')

  const payment = await prisma.$transaction(async (tx) => {
    // 1. Create Payment Record
    const newPayment = await tx.payment.create({
      data: {
        loanId: parsed.loanId,
        amountPaid: parsed.amountPaid,
        principalPaid: parsed.principalPaid,
        interestPaid: parsed.interestPaid,
        paymentMode: parsed.paymentMode,
      }
    })

    // 2. Fetch the latest Principal and Interest Ledgers for balanceAfter calculations
    const lastPrincipalLedger = await tx.ledgerEntry.findFirst({
      where: { loanId: parsed.loanId, category: 'PRINCIPAL' },
      orderBy: { createdAt: 'desc' }
    })
    
    // 3. Create Principal Credit Ledger Entry if principal was paid
    if (parsed.principalPaid > 0) {
      const currentPrincipalBal = lastPrincipalLedger ? Number(lastPrincipalLedger.balanceAfter) : 0;
      await tx.ledgerEntry.create({
        data: {
          shopId,
          loanId: parsed.loanId,
          paymentId: newPayment.id,
          category: 'PRINCIPAL',
          type: 'CREDIT',
          amount: parsed.principalPaid,
          balanceAfter: currentPrincipalBal - parsed.principalPaid,
          performedBy: userId,
          idempotencyKey: `payment-prin-${newPayment.id}`
        }
      })
    }

    // 4. Create Interest Credit Ledger Entry if interest was paid
    if (parsed.interestPaid > 0) {
      await tx.ledgerEntry.create({
        data: {
          shopId,
          loanId: parsed.loanId,
          paymentId: newPayment.id,
          category: 'INTEREST',
          type: 'CREDIT',
          amount: parsed.interestPaid,
          balanceAfter: 0, // Interest usually doesn't have a rolling balance stored here unless amortized
          performedBy: userId,
          idempotencyKey: `payment-int-${newPayment.id}`
        }
      })
    }

    // 5. Optimistic locking: Increment loan version
    await tx.loan.update({
      where: { id: parsed.loanId, version: loan.version },
      data: { version: { increment: 1 } }
    })

    // 6. Audit Log
    await tx.auditLog.create({
      data: {
        shopId,
        userId,
        action: 'RECORD_PAYMENT',
        entity: 'PAYMENT',
        entityId: newPayment.id,
      }
    })

    return newPayment
  })

  revalidatePath('/dashboard/loans')
  return { success: true, paymentId: payment.id }
}

const onboardingSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  aadhaar: z.string().min(12, '12-digit Aadhaar required').max(12),
  address: z.string().min(1, 'Address is required'),
  goldItemName: z.string().min(1, 'Gold item name is required'),
  goldWeight: z.number().positive('Gold weight must be positive'),
  goldPurity: z.string().min(1, 'Purity is required'),
  valuation: z.number().positive('Valuation must be positive'),
  principalAmount: z.number().positive('Loan amount must be positive'),
})

export async function onboardCustomerWithLoan(formData: FormData) {
  const { shopId, userId } = await getTenantContext()

  // 1. Subscription Check (Standard Limit: 100 Customers)
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: {
      subscriptionPlan: true,
      _count: { select: { customers: true } }
    }
  })
  if (shop?.subscriptionPlan === 'STANDARD' && shop._count.customers >= 100) {
    throw new Error('Standard plan limit reached (100 customers max). Please upgrade to Enterprise.')
  }

  const data = {
    name: formData.get('name') as string,
    phone: formData.get('phone') as string,
    email: formData.get('email') as string,
    aadhaar: formData.get('aadhaar') as string,
    address: formData.get('address') as string,
    goldItemName: formData.get('goldItemName') as string,
    goldWeight: Number(formData.get('goldWeight')),
    goldPurity: formData.get('goldPurity') as string,
    valuation: Number(formData.get('valuation')),
    principalAmount: Number(formData.get('principalAmount')),
  }

  const parsed = onboardingSchema.parse(data)

  // 2. Validate Loan LTV (cannot exceed 75% default for safe operations)
  const maxAllowedLoan = (parsed.valuation * 75) / 100
  if (parsed.principalAmount > maxAllowedLoan) {
    throw new Error(`Loan amount (₹${parsed.principalAmount}) exceeds maximum LTV threshold of 75% (₹${maxAllowedLoan})`)
  }

  // 3. Generate Unique Loan Number
  const count = await prisma.loan.count({ where: { shopId } })
  const loanNumber = `SGL-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

  const result = await prisma.$transaction(async (tx) => {
    // A. Create Customer
    const customer = await tx.customer.create({
      data: {
        shopId,
        firstName: parsed.name,
        lastName: '',
        phone: parsed.phone,
        email: parsed.email || null,
        aadhaar: parsed.aadhaar,
        address: parsed.address,
      }
    })

    // Write initial KYC Version
    await tx.customerKYCVersion.create({
      data: {
        customerId: customer.id,
        version: 1,
        firstName: parsed.name,
        lastName: '',
        phone: parsed.phone,
        email: parsed.email || null,
        aadhaar: parsed.aadhaar,
        address: parsed.address,
        changedById: userId,
        reason: 'Initial registration via onboarding'
      }
    })

    // B. Create Loan
    const loan = await tx.loan.create({
      data: {
        loanNumber,
        shopId,
        customerId: customer.id,
        principalAmount: parsed.principalAmount,
        interestRate: 2.0, // default interest rate: 2% monthly
        ltvPercentage: 75,
        pledgedItems: {
          create: {
            name: parsed.goldItemName,
            weightGrams: parsed.goldWeight,
            purity: parsed.goldPurity,
            valuation: parsed.valuation
          }
        }
      }
    })

    // Record disbursement debit in double-entry ledger
    await tx.ledgerEntry.create({
      data: {
        shopId,
        loanId: loan.id,
        category: 'PRINCIPAL',
        type: 'DEBIT',
        amount: parsed.principalAmount,
        balanceAfter: parsed.principalAmount,
        performedBy: userId,
        idempotencyKey: `onboard-loan-principal-${loan.id}`
      }
    })

    // Log state machine status initialization
    await tx.loanStateHistory.create({
      data: {
        loanId: loan.id,
        fromStatus: 'ACTIVE',
        toStatus: 'ACTIVE',
        changedById: userId,
        details: 'Initial disburse via onboarding'
      }
    })

    // C. Write Audit Log
    await tx.auditLog.create({
      data: {
        shopId,
        userId,
        action: 'ONBOARD_CUSTOMER_WITH_LOAN',
        entity: 'CUSTOMER',
        entityId: customer.id,
        details: JSON.stringify({ loanId: loan.id, loanNumber })
      }
    })

    return { customer, loan }
  })

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/customers')
  revalidatePath('/dashboard/loans')

  return { success: true, customerId: result.customer.id, loanId: result.loan.id }
}

const staffSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  branchId: z.string().uuid().optional().or(z.literal('')),
})

export async function createStaffMember(formData: FormData) {
  const { shopId, userId, role } = await getTenantContext()

  // 1. Authorization: Only OWNER can add staff
  if (role !== 'OWNER') {
    throw new Error('Forbidden: Only shop owners can manage staff')
  }

  // 2. Plan Check: Only ENTERPRISE shops can add staff
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { subscriptionPlan: true }
  })
  if (shop?.subscriptionPlan !== 'ENTERPRISE') {
    throw new Error('Staff management is only available on Enterprise plans')
  }

  const data = {
    name: formData.get('name') as string,
    email: formData.get('email') as string,
    branchId: formData.get('branchId') as string,
  }

  const parsed = staffSchema.parse(data)

  // 3. Check duplicate email in public.User
  const existingUser = await prisma.user.findUnique({
    where: { email: parsed.email },
    select: { id: true }
  })
  if (existingUser) {
    throw new Error('A user with this email address already exists')
  }

  // 4. Create the staff member
  const staff = await prisma.user.create({
    data: {
      email: parsed.email,
      name: parsed.name,
      role: 'STAFF',
      shopId,
      branchId: parsed.branchId || null,
    }
  })

  // 5. Write Audit Log
  await prisma.auditLog.create({
    data: {
      shopId,
      userId,
      action: 'CREATE_STAFF_MEMBER',
      entity: 'USER',
      entityId: staff.id,
      details: JSON.stringify({ email: staff.email, name: staff.name, branchId: staff.branchId })
    }
  })

  revalidatePath('/dashboard/staff')
  return { success: true, staffId: staff.id }
}

export async function deleteStaffMember(staffId: string) {
  const { shopId, userId, role } = await getTenantContext()

  // 1. Authorization: Only OWNER can delete staff
  if (role !== 'OWNER') {
    throw new Error('Forbidden: Only shop owners can manage staff')
  }

  // 2. Find and verify staff belongs to same shop
  const staff = await prisma.user.findFirst({
    where: { id: staffId, shopId, role: 'STAFF' },
    select: { id: true, email: true, name: true }
  })
  if (!staff) {
    throw new Error('Staff member not found')
  }

  // 3. Delete the staff member
  await prisma.user.delete({
    where: { id: staffId }
  })

  // 4. Write Audit Log
  await prisma.auditLog.create({
    data: {
      shopId,
      userId,
      action: 'DELETE_STAFF_MEMBER',
      entity: 'USER',
      entityId: staffId,
      details: JSON.stringify({ email: staff.email, name: staff.name })
    }
  })

  revalidatePath('/dashboard/staff')
  return { success: true }
}

const branchSchema = z.object({
  name: z.string().min(1, 'Branch name is required'),
})

export async function createBranch(formData: FormData) {
  const { shopId, userId, role } = await getTenantContext()

  // 1. Authorization: Only OWNER can manage branches
  if (role !== 'OWNER') {
    throw new Error('Forbidden: Only shop owners can manage branches')
  }

  // 2. Plan Check: Only ENTERPRISE shops can manage branches
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    select: { subscriptionPlan: true }
  })
  if (shop?.subscriptionPlan !== 'ENTERPRISE') {
    throw new Error('Branch management is only available on Enterprise plans')
  }

  const data = {
    name: formData.get('name') as string,
  }

  const parsed = branchSchema.parse(data)

  // 3. Check duplicate branch name in shop
  const existingBranch = await prisma.branch.findFirst({
    where: { shopId, name: parsed.name },
    select: { id: true }
  })
  if (existingBranch) {
    throw new Error('A branch with this name already exists in your shop')
  }

  // 4. Create branch
  const branch = await prisma.branch.create({
    data: {
      name: parsed.name,
      shopId,
    }
  })

  // 5. Write Audit Log
  await prisma.auditLog.create({
    data: {
      shopId,
      userId,
      action: 'CREATE_BRANCH',
      entity: 'BRANCH',
      entityId: branch.id,
      details: JSON.stringify({ name: branch.name })
    }
  })

  revalidatePath('/dashboard/branches')
  revalidatePath('/dashboard/staff')
  return { success: true, branchId: branch.id }
}

export async function deleteBranch(branchId: string) {
  const { shopId, userId, role } = await getTenantContext()

  // 1. Authorization: Only OWNER can manage branches
  if (role !== 'OWNER') {
    throw new Error('Forbidden: Only shop owners can manage branches')
  }

  // 2. Find and verify branch belongs to same shop
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

  // 3. Safety Check: Cannot delete if it has active links (cascade protection)
  if (branch._count.users > 0) {
    throw new Error('Cannot delete branch: Active staff members are still assigned to it.')
  }
  if (branch._count.customers > 0) {
    throw new Error('Cannot delete branch: Customers are still associated with it.')
  }
  if (branch._count.loans > 0) {
    throw new Error('Cannot delete branch: Active loans are still registered at it.')
  }

  // 4. Delete branch
  await prisma.branch.delete({
    where: { id: branchId }
  })

  // 5. Write Audit Log
  await prisma.auditLog.create({
    data: {
      shopId,
      userId,
      action: 'DELETE_BRANCH',
      entity: 'BRANCH',
      entityId: branchId,
      details: JSON.stringify({ name: branch.name })
    }
  })

  revalidatePath('/dashboard/branches')
  revalidatePath('/dashboard/staff')
  return { success: true }
}

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

export async function repayLoan(formData: FormData) {
  const { shopId, userId } = await getTenantContext()
  
  const loanId = formData.get('loanId') as string
  const amountPaid = Number(formData.get('amountPaid'))
  const paymentMode = formData.get('paymentMode') as 'CASH' | 'UPI' | 'BANK' | 'CHEQUE'
  const referenceId = formData.get('referenceId') as string | null

  if (!loanId || isNaN(amountPaid) || amountPaid <= 0) {
    throw new Error('Invalid payment details')
  }

  // Execute payment recording and loan updates inside a locked interactive transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Perform a SELECT FOR UPDATE to pessimistically lock the loan row
    await tx.$queryRaw`SELECT id FROM "Loan" WHERE id = ${loanId} FOR UPDATE`

    // 2. Fetch the locked loan with all payments inside the transaction scope
    const loan = await tx.loan.findFirst({
      where: { id: loanId, shopId },
      include: { payments: true }
    })

    if (!loan) throw new Error('Loan not found or unauthorized')
    if (loan.status === 'CLOSED') throw new Error('Loan is already closed')

    // 3. Calculate current balances dynamically
    const balances = calculateLoanBalances(loan as any)
    
    // Allocate amountPaid to interest first, then principal
    const interestPaid = Math.min(amountPaid, balances.interestDue)
    const rawPrincipalPaid = Math.max(0, amountPaid - interestPaid)
    const principalPaid = Math.min(rawPrincipalPaid, balances.outstandingPrincipal)
    const actualAmountPaid = interestPaid + principalPaid

    // 4. Record the repayment transaction
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

    // 5. Update loan status and close it if fully settled
    const finalOutstandingPrincipal = balances.outstandingPrincipal - principalPaid
    const isFullyPaid = finalOutstandingPrincipal <= 0.01 // handle minor differences
    const targetStatus = isFullyPaid ? 'CLOSED' : loan.status

    if (isFullyPaid) {
      validateStateTransition(loan.status, 'CLOSED')
    }

    await tx.loan.update({
      where: { id: loanId },
      data: {
        status: targetStatus,
        endDate: isFullyPaid ? new Date() : loan.endDate
      }
    })

    // Write to double-entry ledger entries
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

    // 6. Write to Audit Trail
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
          isFullyPaid
        })
      }
    })

    return { paymentId: newPayment.id, isFullyPaid, customerId: loan.customerId }
  })

  revalidatePath('/dashboard/loans')
  revalidatePath(`/dashboard/loans/${loanId}`)
  revalidatePath(`/dashboard/customers/${result.customerId}`)
  revalidatePath('/dashboard/reports')

  return { success: true, ...result }
}

export async function updateLoanStatus(loanId: string, status: 'ACTIVE' | 'CLOSED' | 'OVERDUE' | 'AUCTION' | 'RENEWED') {
  const { shopId, userId } = await getTenantContext()

  const loan = await prisma.loan.findFirst({
    where: { id: loanId, shopId },
    select: { id: true, customerId: true, status: true }
  })
  if (!loan) throw new Error('Loan not found')

  validateStateTransition(loan.status, status)

  await prisma.$transaction(async (tx) => {
    await tx.loan.update({
      where: { id: loanId },
      data: { status }
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
        details: JSON.stringify({ status })
      }
    })
  })

  revalidatePath('/dashboard/loans')
  revalidatePath(`/dashboard/loans/${loanId}`)
  revalidatePath(`/dashboard/customers/${loan.customerId}`)
  revalidatePath('/dashboard/reports')

  return { success: true }
}


