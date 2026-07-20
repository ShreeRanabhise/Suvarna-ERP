import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { CustomerService } from '@/services/customer.service'
import { LoanService } from '@/services/loan.service'

export async function GET() {
  const results: any[] = []
  
  try {
    results.push('--- STARTING COMPREHENSIVE ENTITY TESTS ---')

    // Cleanup testing artifacts if they exist
    await prisma.payment.deleteMany({ where: { loan: { shop: { name: 'Test Entity Shop' } } } })
    await prisma.pledgedItem.deleteMany({ where: { loan: { shop: { name: 'Test Entity Shop' } } } })
    await prisma.ledgerEntry.deleteMany({ where: { loan: { shop: { name: 'Test Entity Shop' } } } })
    await prisma.loanStateHistory.deleteMany({ where: { loan: { shop: { name: 'Test Entity Shop' } } } })
    await prisma.loan.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
    await prisma.customerKYCVersion.deleteMany({ where: { customer: { shop: { name: 'Test Entity Shop' } } } })
    await prisma.customer.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
    await prisma.auditLog.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
    await prisma.user.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
    await prisma.branch.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
    await prisma.shop.deleteMany({ where: { name: 'Test Entity Shop' } })

    // 1. Create Test Shop & Owner
    results.push('1. Creating Tenant Shop (ENTERPRISE)...')
    const shop = await prisma.shop.create({
      data: {
        name: 'Test Entity Shop',
        subscriptionPlan: 'ENTERPRISE',
        subscriptionEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        users: {
          create: {
            email: 'testowner@entity.com',
            name: 'Entity Tester',
            role: 'OWNER',
          }
        },
        branches: {
          create: { name: 'Main Branch' }
        }
      },
      include: { users: true, branches: true }
    })
    
    const owner = shop.users[0]
    results.push(`✅ Shop Created: ${shop.id} | Owner: ${owner.id}`)

    // 2. Onboard Customer & Loan via Service (Test LTV limits)
    results.push('2. Testing Customer Onboarding & LTV Limits...')
    
    try {
      results.push('   -> Attempting over-limit loan (80% LTV, max is 75%)...')
      await CustomerService.onboardCustomerWithLoan(
        shop.id,
        owner.id,
        {
          firstName: 'Test',
          phone: '9999999999',
          email: null,
          aadhaar: '111122223333',
          address: 'Test Address'
        },
        {
          principalAmount: 80000,
          goldItemName: 'Ring',
          goldWeight: 10,
          goldPurity: '22K',
          valuation: 100000
        }
      )
      throw new Error('❌ Test Failed: Allowed an over-limit loan!')
    } catch (error: any) {
      if (error.message.includes('exceeds maximum LTV threshold')) {
        results.push('✅ Successfully caught LTV violation!')
      } else {
        throw error
      }
    }

    results.push('   -> Attempting valid loan...')
    const onboardResult = await CustomerService.onboardCustomerWithLoan(
      shop.id,
      owner.id,
      {
        firstName: 'Valid',
        phone: '8888888888',
        email: null,
        aadhaar: '444455556666',
        address: 'Test Address 2'
      },
      {
        principalAmount: 50000, // 50% LTV
        goldItemName: 'Chain',
        goldWeight: 15,
        goldPurity: '24K',
        valuation: 100000
      }
    )
    results.push(`✅ Valid Customer Onboarded: ${onboardResult.customerId} | Loan: ${onboardResult.loanId}`)

    // 3. Test Optimistic Concurrency Control (OCC) during Loan Repayment
    results.push('3. Testing Loan Repayment & Concurrency Control (OCC)...')
    
    results.push('   -> First repayment (10,000)...')
    await LoanService.repayLoan(
      shop.id,
      owner.id,
      onboardResult.loanId,
      10000,
      'CASH',
      null,
      1 // Current version is 1
    )
    results.push('✅ First payment succeeded.')

    results.push('   -> Stale repayment (attempting to use version 1 again)...')
    try {
      await LoanService.repayLoan(
        shop.id,
        owner.id,
        onboardResult.loanId,
        5000,
        'UPI',
        'REF123',
        1 // Stale version!
      )
      throw new Error('❌ Test Failed: Allowed stale update (OCC bypassed)!')
    } catch (error: any) {
      if (error.message.includes('The loan has been updated by another process')) {
        results.push('✅ Successfully caught OCC concurrency violation!')
      } else {
        throw error
      }
    }

    // 4. Double entry verification
    const ledger = await prisma.ledgerEntry.findMany({
      where: { loanId: onboardResult.loanId },
      orderBy: { createdAt: 'asc' }
    })
    const totalDebits = ledger.filter(l => l.type === 'DEBIT').reduce((acc, l) => acc + Number(l.amount), 0)
    const totalCredits = ledger.filter(l => l.type === 'CREDIT').reduce((acc, l) => acc + Number(l.amount), 0)
    
    results.push(`4. Verifying Ledger Double-Entry Mathematics...`)
    results.push(`   -> Total Debits (Principal): ₹${totalDebits}`)
    results.push(`   -> Total Credits (Repayments): ₹${totalCredits}`)
    results.push(`   -> Current Outstanding: ₹${totalDebits - totalCredits}`)

    if (totalDebits - totalCredits === 40000) {
      results.push('✅ Ledger Mathematics strictly balance.')
    } else {
      throw new Error('❌ Test Failed: Ledger mathematics corrupted.')
    }

    // Cleanup
    results.push('Cleaning up tests...')
    await prisma.payment.deleteMany({ where: { loan: { shop: { name: 'Test Entity Shop' } } } })
    await prisma.pledgedItem.deleteMany({ where: { loan: { shop: { name: 'Test Entity Shop' } } } })
    await prisma.ledgerEntry.deleteMany({ where: { loan: { shop: { name: 'Test Entity Shop' } } } })
    await prisma.loanStateHistory.deleteMany({ where: { loan: { shop: { name: 'Test Entity Shop' } } } })
    await prisma.loan.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
    await prisma.customerKYCVersion.deleteMany({ where: { customer: { shop: { name: 'Test Entity Shop' } } } })
    await prisma.customer.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
    await prisma.auditLog.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
    await prisma.user.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
    await prisma.branch.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
    await prisma.shop.deleteMany({ where: { name: 'Test Entity Shop' } })

    results.push('✅ Tests Completed Successfully!')

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, results }, { status: 500 })
  }
}
