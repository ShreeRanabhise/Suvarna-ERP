import { PrismaClient } from '@prisma/client'
import { CustomerService } from '../src/services/customer.service'
import { LoanService } from '../src/services/loan.service'

const prisma = new PrismaClient()

async function main() {
  console.log('--- STARTING COMPREHENSIVE ENTITY TESTS ---')

  // Cleanup testing artifacts if they exist
  await prisma.payment.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
  await prisma.pledgedItem.deleteMany({ where: { loan: { shop: { name: 'Test Entity Shop' } } } })
  await prisma.ledgerEntry.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
  await prisma.loanStateHistory.deleteMany({ where: { loan: { shop: { name: 'Test Entity Shop' } } } })
  await prisma.loan.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
  await prisma.customerKYCVersion.deleteMany({ where: { customer: { shop: { name: 'Test Entity Shop' } } } })
  await prisma.customer.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
  await prisma.auditLog.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
  await prisma.user.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
  await prisma.branch.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
  await prisma.shop.deleteMany({ where: { name: 'Test Entity Shop' } })

  // 1. Create Test Shop & Owner
  console.log('1. Creating Tenant Shop (ENTERPRISE)...')
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
  console.log(`✅ Shop Created: ${shop.id} | Owner: ${owner.id}`)

  // 2. Onboard Customer & Loan via Service (Test LTV limits)
  console.log('\n2. Testing Customer Onboarding & LTV Limits...')
  
  try {
    console.log('   -> Attempting over-limit loan (80% LTV, max is 75%)...')
    await CustomerService.onboardCustomerWithLoan(
      shop.id,
      owner.id,
      {
        firstName: 'Test',
        phone: '9999999999',
        email: null,
        aadhaar: '111122223333',
        address: 'Test Address',
        branchId: shop.branches[0].id
      },
      {
        principalAmount: 80000, // 80k
        goldItemName: 'Ring',
        goldWeight: 10,
        goldPurity: '22K',
        valuation: 100000 // 100k
      }
    )
    throw new Error('❌ Test Failed: Allowed an over-limit loan!')
  } catch (error: any) {
    if (error.message.includes('exceeds maximum LTV threshold')) {
      console.log('✅ Successfully caught LTV violation!')
    } else {
      throw error
    }
  }

  console.log('   -> Attempting valid loan...')
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
  console.log(`✅ Valid Customer Onboarded: ${onboardResult.customerId} | Loan: ${onboardResult.loanId}`)

  // 3. Test Optimistic Concurrency Control (OCC) during Loan Repayment
  console.log('\n3. Testing Loan Repayment & Concurrency Control (OCC)...')
  
  // First payment should succeed
  console.log('   -> First repayment (10,000)...')
  await LoanService.repayLoan(
    shop.id,
    owner.id,
    onboardResult.loanId,
    10000,
    'CASH',
    null,
    1 // Current version is 1
  )
  console.log('✅ First payment succeeded.')

  // Stale payment should fail (OCC check)
  console.log('   -> Stale repayment (attempting to use version 1 again)...')
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
      console.log('✅ Successfully caught OCC concurrency violation!')
    } else {
      throw error
    }
  }

  // Double entry verification
  const ledger = await prisma.ledgerEntry.findMany({
    where: { loanId: onboardResult.loanId },
    orderBy: { createdAt: 'asc' }
  })
  const totalDebits = ledger.filter(l => l.type === 'DEBIT').reduce((acc, l) => acc + Number(l.amount), 0)
  const totalCredits = ledger.filter(l => l.type === 'CREDIT').reduce((acc, l) => acc + Number(l.amount), 0)
  
  console.log(`\n4. Verifying Ledger Double-Entry Mathematics...`)
  console.log(`   -> Total Debits (Principal): ₹${totalDebits}`)
  console.log(`   -> Total Credits (Repayments): ₹${totalCredits}`)
  console.log(`   -> Current Outstanding: ₹${totalDebits - totalCredits}`)

  if (totalDebits - totalCredits === 40000) {
    console.log('✅ Ledger Mathematics strictly balance.')
  } else {
    throw new Error('❌ Test Failed: Ledger mathematics corrupted.')
  }

  // Cleanup
  console.log('\nCleaning up tests...')
  await prisma.payment.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
  await prisma.pledgedItem.deleteMany({ where: { loan: { shop: { name: 'Test Entity Shop' } } } })
  await prisma.ledgerEntry.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
  await prisma.loanStateHistory.deleteMany({ where: { loan: { shop: { name: 'Test Entity Shop' } } } })
  await prisma.loan.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
  await prisma.customerKYCVersion.deleteMany({ where: { customer: { shop: { name: 'Test Entity Shop' } } } })
  await prisma.customer.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
  await prisma.auditLog.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
  await prisma.user.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
  await prisma.branch.deleteMany({ where: { shop: { name: 'Test Entity Shop' } } })
  await prisma.shop.deleteMany({ where: { name: 'Test Entity Shop' } })
  console.log('✅ Tests Completed Successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
