const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const query = "test"
    const loans = await prisma.loan.findMany({
      where: {
        isDeleted: false,
        OR: query
          ? [
              { loanNumber: { contains: query, mode: 'insensitive' } },
              {
                customer: {
                  OR: [
                    { firstName: { contains: query, mode: 'insensitive' } },
                    { lastName: { contains: query, mode: 'insensitive' } },
                    { phone: { contains: query, mode: 'insensitive' } },
                  ]
                }
              }
            ]
          : undefined,
      }
    })
    console.log("Success! Found", loans.length)
  } catch(e) {
    console.error("Prisma Error:", e)
  } finally {
    await prisma.$disconnect()
  }
}
main()
