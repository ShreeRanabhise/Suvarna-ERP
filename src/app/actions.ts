'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const prisma = new PrismaClient()

// Validation Schemas
const customerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  address: z.string().optional(),
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
  const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
  if (!dbUser || !dbUser.shopId) throw new Error('No tenant associated')

  return { userId: dbUser.id, shopId: dbUser.shopId, role: dbUser.role }
}

export async function createCustomer(formData: FormData) {
  const { shopId, userId } = await getTenantContext()
  
  // Check subscription limits (max 100 customers for Standard)
  const shop = await prisma.shop.findUnique({
    where: { id: shopId },
    include: { _count: { select: { customers: true } } }
  })

  if (shop?.subscriptionPlan === 'STANDARD' && shop._count.customers >= 100) {
    throw new Error('Standard plan limit reached (100 customers max). Please upgrade to Enterprise.')
  }

  const data = {
    firstName: formData.get('firstName') as string,
    lastName: formData.get('lastName') as string,
    phone: formData.get('phone') as string,
    address: formData.get('address') as string,
  }

  const parsed = customerSchema.parse(data)

  const customer = await prisma.customer.create({
    data: {
      ...parsed,
      shopId,
    }
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
  return { success: true, customer }
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
  return { success: true, loan }
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

  // Verify loan belongs to shop
  const loan = await prisma.loan.findFirst({
    where: { id: parsed.loanId, shopId }
  })
  if (!loan) throw new Error('Loan not found')

  const payment = await prisma.$transaction(async (tx) => {
    const newPayment = await tx.payment.create({
      data: {
        loanId: parsed.loanId,
        amountPaid: parsed.amountPaid,
        principalPaid: parsed.principalPaid,
        interestPaid: parsed.interestPaid,
        paymentMode: parsed.paymentMode,
      }
    })

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
  return { success: true, payment }
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
    include: { _count: { select: { customers: true } } }
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

  return { success: true, ...result }
}

