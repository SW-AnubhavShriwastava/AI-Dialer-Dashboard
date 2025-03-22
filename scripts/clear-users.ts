const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function clearDatabase() {
  try {
    // Delete in order of dependencies
    console.log('Clearing database...')

    // Delete appointments first
    await prisma.appointment.deleteMany()
    console.log('✓ Cleared appointments')

    // Delete call logs
    await prisma.callLog.deleteMany()
    console.log('✓ Cleared call logs')

    // Delete campaign contacts
    await prisma.campaignContact.deleteMany()
    console.log('✓ Cleared campaign contacts')

    // Delete campaign employees
    await prisma.campaignEmployee.deleteMany()
    console.log('✓ Cleared campaign employees')

    // Delete campaigns
    await prisma.campaign.deleteMany()
    console.log('✓ Cleared campaigns')

    // Delete contacts
    await prisma.contact.deleteMany()
    console.log('✓ Cleared contacts')

    // Delete employees
    await prisma.employee.deleteMany()
    console.log('✓ Cleared employees')

    // Delete admin settings
    await prisma.adminSettings.deleteMany()
    console.log('✓ Cleared admin settings')

    // Finally, delete users
    await prisma.user.deleteMany()
    console.log('✓ Cleared users')

    console.log('Database cleared successfully!')
  } catch (error) {
    console.error('Error clearing database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearDatabase() 