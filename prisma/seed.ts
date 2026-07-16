import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // 1. Create Super Admin
  // Note: In a real app with Supabase Auth, you'd also create the user in auth.users
  // or sync them via triggers. For this seed, we just populate the public.User table.
  
  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@suvarna.com' },
    update: {},
    create: {
      email: 'superadmin@suvarna.com',
      name: 'System Admin',
      role: 'SUPER_ADMIN',
    },
  })

  // 2. Create Standard Shop & Owner
  const standardShop = await prisma.shop.create({
    data: {
      name: 'Shree Gold Loans (Standard)',
      subscriptionPlan: 'STANDARD',
      subscriptionEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // +1 year
      users: {
        create: {
          email: 'owner@standard.com',
          name: 'Standard Owner',
          role: 'OWNER',
        }
      }
    }
  })

  // 3. Create Enterprise Shop & Owner & Branch
  const enterpriseShop = await prisma.shop.create({
    data: {
      name: 'Mega Finance (Enterprise)',
      subscriptionPlan: 'ENTERPRISE',
      subscriptionEnd: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      whatsappAddon: true,
      users: {
        create: {
          email: 'owner@enterprise.com',
          name: 'Enterprise Owner',
          role: 'OWNER',
        }
      },
      branches: {
        create: {
          name: 'Main Branch'
        }
      }
    },
    include: {
      branches: true
    }
  })

  const mainBranchId = enterpriseShop.branches[0].id

  // 4. Create Staff for Enterprise Branch
  const staff = await prisma.user.create({
    data: {
      email: 'staff@enterprise.com',
      name: 'Branch Manager',
      role: 'STAFF',
      shopId: enterpriseShop.id,
      branchId: mainBranchId
    }
  })

  // 5. Create Sample Customers for Standard Shop
  const customer1 = await prisma.customer.create({
    data: {
      shopId: standardShop.id,
      firstName: 'Ramesh',
      lastName: 'Kumar',
      phone: '9876543210',
      address: '123 Market St, Mumbai'
    }
  })

  // 6. Create Sample Loan for Customer 1
  const loan1 = await prisma.loan.create({
    data: {
      loanNumber: 'SGL-2024-001',
      shopId: standardShop.id,
      customerId: customer1.id,
      principalAmount: 50000,
      interestRate: 2.0, // 2% per month
      ltvPercentage: 75,
      status: 'ACTIVE',
      pledgedItems: {
        create: {
          name: 'Gold Chain',
          weightGrams: 15.5,
          purity: '22K',
          valuation: 66600
        }
      }
    }
  })

  console.log('Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
