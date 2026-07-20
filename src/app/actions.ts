'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { CustomerService } from '@/services/customer.service'
import { LoanService } from '@/services/loan.service'
import { z } from 'zod'

export type ActionResult<T = void> = 
  | { success: true; data?: T } 
  | { success: false; error: string }

// Validation Schemas
const customerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').regex(/^[a-zA-Z\s]+$/, 'Only letters and spaces allowed in name'),
  lastName: z.string().min(1, 'Last name is required').regex(/^[a-zA-Z\s]*$/, 'Only letters and spaces allowed in name'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Must be a valid 10-digit Indian phone number'),
  aadhaar: z.string().regex(/^[0-9]{12}$/, 'Must be a valid 12-digit Aadhaar number'),
  address: z.string().min(5, 'Please provide a complete address'),
})

const loanSchema = z.object({
  customerId: z.string().uuid(),
  principalAmount: z.number().min(0.01, 'Principal amount must be greater than 0'),
  interestRate: z.number().min(0.1, 'Interest rate must be at least 0.1%'),
  ltvPercentage: z.number().min(0.1, 'LTV must be > 0').max(100, 'LTV cannot exceed 100%'),
  itemName: z.string().min(1, 'Item name is required'),
  weightGrams: z.number().min(0.01, 'Weight must be greater than 0'),
  purity: z.string().min(1, 'Purity is required'),
  valuation: z.number().min(0.01, 'Valuation must be greater than 0'),
})


// We define a local helper since the imported one might cause cyclic dependencies or different semantics.
async function getTenantContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { id: true, shopId: true, role: true }
  })
  if (!dbUser || !dbUser.shopId) throw new Error('No tenant associated')

  return { userId: dbUser.id, shopId: dbUser.shopId, role: dbUser.role }
}

export async function createCustomer(formData: FormData): Promise<ActionResult<{ customerId: string }>> {
  try {
    const { shopId, userId } = await getTenantContext()
    
    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      phone: formData.get('phone') as string,
      aadhaar: formData.get('aadhaar') as string,
      address: formData.get('address') as string,
    }

    const parsed = customerSchema.parse(data)

    const customer = await prisma.$transaction(async (tx) => {
      // Pessimistically lock the shop row to prevent concurrent subscription limit bypass
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
      
      await tx.auditLog.create({
        data: {
          shopId,
          userId,
          action: 'CREATE_CUSTOMER',
          entity: 'CUSTOMER',
          entityId: newCustomer.id,
        }
      })

      return newCustomer
    })

    revalidatePath('/dashboard/customers')
    return { success: true, data: { customerId: customer.id } }
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' }
  }
}

export async function createLoan(formData: FormData): Promise<ActionResult<{ loanId: string }>> {
  try {
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
    
    const idempotencyKey = (formData.get('idempotencyKey') as string) || crypto.randomUUID()

    const parsed = loanSchema.parse(data)

    // Validate LTV
    const maxAllowedLoan = (parsed.valuation * parsed.ltvPercentage) / 100
    if (parsed.principalAmount > maxAllowedLoan) {
      throw new Error('Loan amount exceeds allowed LTV')
    }

    const loan = await prisma.$transaction(async (tx) => {
      // Pessimistically lock the shop row to guarantee sequential loan numbers
      await tx.$queryRaw`SELECT id FROM "Shop" WHERE id = ${shopId} FOR UPDATE`
      
      // Generate Loan Number SGL-{YEAR}-{COUNT} inside the lock
      const count = await tx.loan.count({ where: { shopId } })
      const loanNumber = `SGL-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`

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
          idempotencyKey: `disburse-loan-principal-${idempotencyKey}` // Secure client idempotency
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
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' }
  }
}


const onboardingSchema = z.object({
  name: z.string().min(1, 'Name is required').regex(/^[a-zA-Z\s]+$/, 'Only letters and spaces allowed in name'),
  phone: z.string().regex(/^[0-9]{10}$/, 'Must be a valid 10-digit Indian phone number'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  aadhaar: z.string().regex(/^[0-9]{12}$/, 'Must be a valid 12-digit Aadhaar number'),
  address: z.string().min(5, 'Please provide a complete address'),
  goldItemName: z.string().min(1, 'Gold item name is required'),
  goldWeight: z.number().min(0.01, 'Weight must be greater than 0'),
  goldPurity: z.string().min(1, 'Purity is required'),
  valuation: z.number().min(0.01, 'Valuation must be greater than 0'),
  principalAmount: z.number().min(0.01, 'Principal amount must be greater than 0'),
})

export async function onboardCustomerWithLoan(formData: FormData): Promise<ActionResult<{ customerId: string, loanId: string }>> {
  try {
    const { shopId, userId } = await getTenantContext()

    const customerData = {
      firstName: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      aadhaar: formData.get('aadhaar') as string,
      address: formData.get('address') as string,
    }

    const loanData = {
      principalAmount: Number(formData.get('principalAmount')),
      goldItemName: formData.get('goldItemName') as string,
      goldWeight: Number(formData.get('goldWeight')),
      goldPurity: formData.get('goldPurity') as string,
      valuation: Number(formData.get('valuation')),
    }
    
    const idempotencyKey = (formData.get('idempotencyKey') as string) || undefined

    const result = await CustomerService.onboardCustomerWithLoan(
      shopId,
      userId,
      customerData,
      loanData,
      idempotencyKey
    )

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/customers')
    revalidatePath('/dashboard/loans')
    return { success: true, data: result }
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' }
  }
}

const staffSchema = z.object({
  name: z.string().min(1, 'Name is required').regex(/^[a-zA-Z\s]+$/, 'Only letters and spaces allowed in name'),
  email: z.string().email('Invalid email address'),
  branchId: z.string().uuid().optional().or(z.literal('')),
})

export async function createStaffMember(formData: FormData): Promise<ActionResult<{ staffId: string }>> {
  try {
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

    // 4. Create User in Supabase Auth via Admin API
    const adminAuth = createAdminClient()
    const { data: authData, error: authError } = await adminAuth.auth.admin.createUser({
      email: parsed.email,
      password: 'Welcome@123',
      email_confirm: true,
    })
    if (authError || !authData.user) {
      throw new Error(authError?.message || 'Failed to create auth user')
    }

    const authId = authData.user.id

    // 5. Create the staff member and audit log transactionally
    const staff = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          authId,
          email: parsed.email,
          name: parsed.name,
          role: 'STAFF',
          shopId,
          branchId: parsed.branchId || null,
        }
      })

      await tx.auditLog.create({
        data: {
          shopId,
          userId,
          action: 'CREATE_STAFF_MEMBER',
          entity: 'USER',
          entityId: newUser.id,
          details: JSON.stringify({ email: newUser.email, name: newUser.name, branchId: newUser.branchId })
        }
      })

      return newUser
    })

    revalidatePath('/dashboard/staff')
    return { success: true, data: { staffId: staff.id } }
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' }
  }
}

export async function deleteStaffMember(staffId: string): Promise<ActionResult> {
  try {
    const { shopId, userId, role } = await getTenantContext()

    if (role !== 'OWNER') {
      throw new Error('Forbidden: Only shop owners can manage staff')
    }

    const staff = await prisma.user.findFirst({
      where: { id: staffId, shopId, role: 'STAFF' },
      select: { id: true, authId: true, email: true, name: true }
    })
    if (!staff) {
      throw new Error('Staff member not found')
    }

    const adminAuth = createAdminClient()

    await prisma.$transaction(async (tx) => {
      const deletedStaff = await tx.user.delete({
        where: { id: staffId }
      })

      // Delete from Supabase Auth if authId exists
      if (deletedStaff.authId) {
        await adminAuth.auth.admin.deleteUser(deletedStaff.authId)
      }

      await tx.auditLog.create({
        data: {
          shopId,
          userId,
          action: 'DELETE_STAFF_MEMBER',
          entity: 'USER',
          entityId: staffId,
          details: JSON.stringify({ email: staff.email, name: staff.name })
        }
      })
    })

    revalidatePath('/dashboard/staff')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' }
  }
}

const branchSchema = z.object({
  name: z.string().min(3, 'Branch name must be at least 3 characters long'),
})

export async function createBranch(formData: FormData): Promise<ActionResult<{ branchId: string }>> {
  try {
    const { shopId, userId, role } = await getTenantContext()

    if (role !== 'OWNER') {
      throw new Error('Forbidden: Only shop owners can manage branches')
    }

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

    const existingBranch = await prisma.branch.findFirst({
      where: { shopId, name: parsed.name },
      select: { id: true }
    })
    if (existingBranch) {
      throw new Error('A branch with this name already exists in your shop')
    }

    const branch = await prisma.$transaction(async (tx) => {
      const newBranch = await tx.branch.create({
        data: {
          name: parsed.name,
          shopId,
        }
      })

      await tx.auditLog.create({
        data: {
          shopId,
          userId,
          action: 'CREATE_BRANCH',
          entity: 'BRANCH',
          entityId: newBranch.id,
          details: JSON.stringify({ name: newBranch.name })
        }
      })

      return newBranch
    })

    revalidatePath('/dashboard/branches')
    revalidatePath('/dashboard/staff')
    return { success: true, data: { branchId: branch.id } }
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' }
  }
}

export async function deleteBranch(branchId: string): Promise<ActionResult> {
  try {
    const { shopId, userId, role } = await getTenantContext()

    if (role !== 'OWNER') {
      throw new Error('Forbidden: Only shop owners can manage branches')
    }

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

    if (branch._count.users > 0) {
      throw new Error('Cannot delete branch: Active staff members are still assigned to it.')
    }
    if (branch._count.customers > 0) {
      throw new Error('Cannot delete branch: Customers are still associated with it.')
    }
    if (branch._count.loans > 0) {
      throw new Error('Cannot delete branch: Active loans are still registered at it.')
    }

    await prisma.$transaction(async (tx) => {
      await tx.branch.delete({
        where: { id: branchId }
      })

      await tx.auditLog.create({
        data: {
          shopId,
          userId,
          action: 'DELETE_BRANCH',
          entity: 'BRANCH',
          entityId: branchId,
          details: JSON.stringify({ name: branch.name })
        }
      })
    })

    revalidatePath('/dashboard/branches')
    revalidatePath('/dashboard/staff')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' }
  }
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

export async function repayLoan(formData: FormData): Promise<ActionResult<{ paymentId: string }>> {
  try {
    const { shopId, userId } = await getTenantContext()
    
    const loanId = formData.get('loanId') as string
    const amountPaid = Number(formData.get('amountPaid'))
    const paymentMode = formData.get('paymentMode') as 'CASH' | 'UPI' | 'BANK' | 'CHEQUE'
    const referenceId = formData.get('referenceId') as string | null
    const currentVersion = Number(formData.get('currentVersion') || 0)

    if (!loanId || isNaN(amountPaid) || amountPaid <= 0) {
      throw new Error('Invalid payment details')
    }

    const result = await LoanService.repayLoan(
      shopId,
      userId,
      loanId,
      amountPaid,
      paymentMode,
      referenceId,
      currentVersion
    )

    revalidatePath('/dashboard/loans')
    revalidatePath(`/dashboard/loans/${loanId}`)
    revalidatePath(`/dashboard/customers/${result.customerId}`)
    revalidatePath('/dashboard/reports')

    return { success: true, data: { paymentId: result.paymentId } }
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' }
  }
}

export async function updateLoanStatus(loanId: string, status: 'ACTIVE' | 'CLOSED' | 'OVERDUE' | 'AUCTION' | 'RENEWED', currentVersion: number = 0): Promise<ActionResult> {
  try {
    const { shopId, userId } = await getTenantContext()

    const result = await LoanService.updateStatus(shopId, userId, loanId, status, currentVersion)

    revalidatePath('/dashboard/loans')
    revalidatePath(`/dashboard/loans/${loanId}`)
    revalidatePath(`/dashboard/customers/${result.customerId}`)
    revalidatePath('/dashboard/reports')

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message || 'An unexpected error occurred' }
  }
}


