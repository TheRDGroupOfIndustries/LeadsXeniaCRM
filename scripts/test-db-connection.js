const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`✅ User count: ${userCount}`);
    
    const leadCount = await prisma.lead.count();
    console.log(`✅ Lead count: ${leadCount}`);
    
    console.log('🎉 All database operations working correctly!');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.message.includes("Can't reach database server")) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check if your Neon database is suspended (free tier auto-suspends)');
      console.log('2. Visit your Neon dashboard to wake up the database');
      console.log('3. Verify your DATABASE_URL is correct');
      console.log('4. Check your internet connection');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseConnection();