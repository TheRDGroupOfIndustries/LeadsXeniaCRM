const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkWhatsAppConfig() {
  try {
    console.log('🔍 Checking WhatsApp configuration...\n');
    
    const tokens = await prisma.whatsappToken.findMany({
      select: { token: true, userId: true, createdAt: true }
    });
    
    if (tokens.length === 0) {
      console.log('❌ No WhatsApp tokens found!');
      console.log('💡 You need to configure WhatsApp Business API in the Integrations page.');
    } else {
      tokens.forEach((token, index) => {
        const tokenPreview = token.token.substring(0, 30) + '...';
        
        console.log(`📱 Token ${index + 1}:`);
        console.log(`   User: ${token.userId}`);
        console.log(`   Token: ${tokenPreview}`);
        console.log(`   Created: ${token.createdAt}`);
        
        // Check token format
        if (token.token.includes(':whatsapp-business-api')) {
          console.log('   ✅ WhatsApp Business API format detected');
          const parts = token.token.split(':');
          console.log(`   📱 Phone Number ID: ${parts[1] || 'Missing'}`);
        } else if (token.token.includes(':twilio')) {
          console.log('   📞 Twilio format detected');
        } else {
          console.log('   ❓ Unknown token format');
        }
        console.log('');
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkWhatsAppConfig();