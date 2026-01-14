const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addTestPhoneNumber() {
  try {
    console.log('📱 Adding a real phone number for WhatsApp testing...\n');
    
    // Replace this with your actual phone number in international format
    const testPhone = '+1234567890'; // Change this to your real phone number
    const testName = 'Test User (Your Phone)';
    const testEmail = 'test@youremail.com';
    
    console.log('⚠️  IMPORTANT: Please edit this script first!');
    console.log('Replace +1234567890 with your actual WhatsApp phone number');
    console.log('Format: +[country code][phone number] (e.g., +919876543210 for India)\n');
    
    // Uncomment the lines below after updating the phone number
    /*
    const newLead = await prisma.lead.create({
      data: {
        name: testName,
        phone: testPhone,
        email: testEmail,
        userId: 'env-admin' // Replace with your actual user ID
      }
    });
    
    console.log('✅ Test lead added successfully!');
    console.log(`📱 Name: ${newLead.name}`);
    console.log(`📞 Phone: ${newLead.phone}`);
    console.log(`📧 Email: ${newLead.email}`);
    */
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addTestPhoneNumber();