'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { CustomerService } from '@/services/customer.service'
import { LoanService } from '@/services/loan.service'
import { BranchService } from '@/services/branch.service'
import { UserService } from '@/services/user.service'
import { enforceRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'
import { requirePermission } from '@/lib/permissions'

export type ActionResult<T = void> = 
  | { success: true; data?: T } 
  | { success: false; error: string }

// Validation Schemas
const customerSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50).regex(/^[a-zA-Z\s]+$/, 'Only letters and spaces allowed in name').trim(),
  lastName: z.string().min(1, 'Last name is required').max(50).regex(/^[a-zA-Z\s]*$/, 'Only letters and spaces allowed in name').trim(),
  phone: z.string().regex(/^[0-9]{10}$/, 'Must be a valid 10-digit Indian phone number'),
  aadhaar: z.string().regex(/^[0-9]{12}$/, 'Must be a valid 12-digit Aadhaar number'),
  address: z.string().min(5, 'Please provide a complete address').max(250).trim(),
  aadhaarPhotoUrl: z.string().url().max(500).optional().nullable(),
  customerPhotoUrl: z.string().url().max(500).optional().nullable(),
})

const loanSchema = z.object({
  customerId: z.string().uuid(),
  principalAmount: z.number().min(0.01, 'Principal amount must be greater than 0').max(10000000),
  interestRate: z.number().min(0.1, 'Interest rate must be at least 0.1%').max(100),
  ltvPercentage: z.number().min(0.1, 'LTV must be > 0').max(100, 'LTV cannot exceed 100%'),
  itemName: z.string().min(1, 'Item name is required').max(100).trim(),
  weightGrams: z.number().min(0.01, 'Weight must be greater than 0').max(10000),
  purity: z.string().min(1, 'Purity is required').max(20).trim(),
  valuation: z.number().min(0.01, 'Valuation must be greater than 0').max(20000000),
  itemImageUrl: z.string().url().optional().nullable(),
})


// We define a local helper since the imported one might cause cyclic dependencies or different semantics.
export async function getTenantContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const dbUser = await prisma.user.findUnique({
    where: { authId: user.id },
    select: { id: true, shopId: true, role: true, branchId: true }
  })
  if (!dbUser || !dbUser.shopId) throw new Error('No tenant associated')

  const headersList = await headers()
  const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown'
  const userAgent = headersList.get('user-agent') || 'unknown'
  const auditMeta = { ipAddress, userAgent }

  return { userId: dbUser.id, shopId: dbUser.shopId, role: dbUser.role, branchId: dbUser.branchId, auditMeta }
}

export async function createCustomer(formData: FormData): Promise<ActionResult<{ customerId: string }>> {
  try {
    const { shopId, userId, role, branchId, auditMeta } = await getTenantContext()
    requirePermission(role, 'customer.create')
    await enforceRateLimit('createCustomer', userId)
    
    const data = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      phone: formData.get('phone') as string,
      aadhaar: formData.get('aadhaar') as string,
      address: formData.get('address') as string,
      aadhaarPhotoUrl: formData.get('aadhaarPhotoUrl') as string | undefined,
      customerPhotoUrl: formData.get('customerPhotoUrl') as string | undefined,
    }

    const parsed = customerSchema.parse(data)
    
    const idempotencyKey = (formData.get('idempotencyKey') as string) || undefined

    const customer = await CustomerService.createCustomer(
      shopId,
      userId,
      {
        ...parsed,
        branchId: role === 'STAFF' ? branchId : null,
      },
      idempotencyKey,
      auditMeta
    )

    revalidatePath('/dashboard/customers')
    return { success: true, data: { customerId: customer.customerId } }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function createLoan(formData: FormData): Promise<ActionResult<{ loanId: string }>> {
  try {
    const { shopId, userId, role, branchId, auditMeta } = await getTenantContext()
    requirePermission(role, 'loan.create')
    await enforceRateLimit('createLoan', userId)
    
    const data = {
      customerId: formData.get('customerId') as string,
      principalAmount: Number(formData.get('principalAmount')),
      interestRate: Number(formData.get('interestRate')),
      ltvPercentage: Number(formData.get('ltvPercentage')),
      itemName: formData.get('itemName') as string,
      weightGrams: Number(formData.get('weightGrams')),
      purity: formData.get('purity') as string,
      valuation: Number(formData.get('valuation')),
      itemImageUrl: formData.get('itemImageUrl') as string | undefined,
    }
    const idempotencyKey = formData.get('idempotencyKey') as string | undefined

    const parsed = loanSchema.parse(data)

    // Validate LTV
    const maxAllowedLoan = (parsed.valuation * parsed.ltvPercentage) / 100
    if (parsed.principalAmount > maxAllowedLoan) {
      throw new Error('Loan amount exceeds allowed LTV')
    }

    const result = await LoanService.createLoan(
      shopId,
      userId,
      parsed,
      role === 'STAFF' ? branchId : null,
      idempotencyKey,
      auditMeta
    )

    revalidatePath('/dashboard/loans')
    return { success: true, data: { loanId: result.loanId } }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}


const onboardingSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).regex(/^[a-zA-Z\s]+$/, 'Only letters and spaces allowed in name').trim(),
  phone: z.string().regex(/^[0-9]{10}$/, 'Must be a valid 10-digit Indian phone number'),
  email: z.string().email('Invalid email').max(100).optional().or(z.literal('')),
  aadhaar: z.string().regex(/^[0-9]{12}$/, 'Must be a valid 12-digit Aadhaar number'),
  address: z.string().min(5, 'Please provide a complete address').max(250).trim(),
  documentUrl: z.string().url().max(500).optional().nullable(),
  goldItemName: z.string().min(1, 'Gold item name is required').max(100).trim(),
  goldWeight: z.number().min(0.01, 'Weight must be greater than 0').max(10000),
  goldPurity: z.string().min(1, 'Purity is required').max(20).trim(),
  valuation: z.number().min(0.01, 'Valuation must be greater than 0').max(20000000),
  principalAmount: z.number().min(0.01, 'Principal amount must be greater than 0').max(10000000),
})

export async function onboardCustomerWithLoan(formData: FormData): Promise<ActionResult<{ customerId: string, loanId: string }>> {
  try {
    const { shopId, userId, role, branchId, auditMeta } = await getTenantContext()
    requirePermission(role, 'customer.create')
    requirePermission(role, 'loan.create')
    await enforceRateLimit('onboardCustomerWithLoan', userId)

    const customerData = {
      firstName: formData.get('name') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      aadhaar: formData.get('aadhaar') as string,
      address: formData.get('address') as string,
      documentUrl: formData.get('documentUrl') as string | undefined,
      branchId: role === 'STAFF' ? branchId : null,
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
      idempotencyKey,
      auditMeta
    )

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/customers')
    revalidatePath('/dashboard/loans')
    return { success: true, data: result }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

const staffSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100).regex(/^[a-zA-Z\s]+$/, 'Only letters and spaces allowed in name').trim(),
  email: z.string().email('Invalid email address').max(100),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  branchId: z.string().uuid().optional().or(z.literal('')),
})

export async function createStaffMember(formData: FormData): Promise<ActionResult<{ staffId: string }>> {
  try {
    const { shopId, userId, role, auditMeta } = await getTenantContext()
    requirePermission(role, 'users.manage')

    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      branchId: formData.get('branchId') as string,
    }

    const parsed = staffSchema.parse(data)

    const staff = await UserService.createStaffMember(
      shopId,
      userId,
      parsed.name,
      parsed.email,
      parsed.branchId || null,
      parsed.password,
      auditMeta
    )

    revalidatePath('/dashboard/staff')
    return { success: true, data: { staffId: staff.id } }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function deleteStaffMember(staffId: string): Promise<ActionResult> {
  try {
    const { shopId, userId, role, auditMeta } = await getTenantContext()
    requirePermission(role, 'users.manage')

    await UserService.deleteStaffMember(shopId, userId, staffId, auditMeta)

    revalidatePath('/dashboard/staff')
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

const branchSchema = z.object({
  name: z.string().min(3, 'Branch name must be at least 3 characters long').max(50).trim(),
})

export async function createBranch(formData: FormData): Promise<ActionResult<{ branchId: string }>> {
  try {
    const { shopId, userId, role, auditMeta } = await getTenantContext()
    requirePermission(role, 'branches.manage')

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

    const branch = await BranchService.createBranch(shopId, userId, parsed.name, auditMeta)

    revalidatePath('/dashboard/branches')
    revalidatePath('/dashboard/staff')
    return { success: true, data: { branchId: branch.id } }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function deleteBranch(branchId: string): Promise<ActionResult> {
  try {
    const { shopId, userId, role, auditMeta } = await getTenantContext()
    requirePermission(role, 'branches.manage')

    await BranchService.deleteBranch(shopId, userId, branchId, auditMeta)

    revalidatePath('/dashboard/branches')
    revalidatePath('/dashboard/staff')
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
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
    const { shopId, userId, role, auditMeta } = await getTenantContext()
    requirePermission(role, 'loan.repay')
    await enforceRateLimit('repayLoan', userId)
    
    const loanId = formData.get('loanId') as string
    const amountPaid = Number(formData.get('amountPaid'))
    const paymentMode = formData.get('paymentMode') as 'CASH' | 'UPI' | 'BANK' | 'CHEQUE'
    const referenceId = formData.get('referenceId') as string | null
    const currentVersion = Number(formData.get('currentVersion') || 0)
    const idempotencyKey = formData.get('idempotencyKey') as string | undefined

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
      currentVersion,
      idempotencyKey,
      auditMeta
    )

    revalidatePath('/dashboard/loans')
    revalidatePath(`/dashboard/loans/${loanId}`)
    revalidatePath(`/dashboard/customers/${result.customerId}`)
    revalidatePath('/dashboard/reports')

    return { success: true, data: { paymentId: result.paymentId } }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function updateLoanStatus(loanId: string, status: 'ACTIVE' | 'CLOSED' | 'OVERDUE' | 'AUCTION' | 'RENEWED', currentVersion: number = 0): Promise<ActionResult> {
  try {
    const { shopId, userId, role, auditMeta } = await getTenantContext()
    requirePermission(role, 'loan.update')

    const result = await LoanService.updateStatus(shopId, userId, loanId, status, currentVersion, auditMeta)

    revalidatePath('/dashboard/loans')
    revalidatePath(`/dashboard/loans/${loanId}`)
    revalidatePath(`/dashboard/customers/${result.customerId}`)
    revalidatePath('/dashboard/reports')

    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function rollbackPayment(paymentId: string): Promise<ActionResult> {
  try {
    const { shopId, userId, role, auditMeta } = await getTenantContext()
    requirePermission(role, 'users.manage') // Assuming OWNER / SUPER_ADMIN can rollback

    const result = await LoanService.rollbackPayment(shopId, userId, paymentId, auditMeta)

    revalidatePath('/dashboard/loans')
    revalidatePath(`/dashboard/loans/${result.loanId}`)
    revalidatePath('/dashboard/reports')

    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}

export async function verifyLoanLedger(loanId: string): Promise<ActionResult<{ isConsistent: boolean, diff: number }>> {
  try {
    const { shopId } = await getTenantContext()
    const result = await LoanService.reconcileLoan(shopId, loanId)
    return { success: true, data: result }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}


export async function deleteCustomer(customerId: string): Promise<ActionResult> {
  try {
    const { shopId, userId, role, auditMeta } = await getTenantContext()
    requirePermission(role, 'customer.delete')

    await CustomerService.deleteCustomer(shopId, userId, customerId, auditMeta)

    revalidatePath('/dashboard/customers')
    return { success: true }
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'An unexpected error occurred' }
  }
}
