const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkLeadsPhones() {
  try {
    console.log('📱 Checking leads and phone numbers...\n');
    
    const leads = await prisma.lead.findMany({
      select: { 
        id: true, 
        name: true, 
        phone: true,
        email: true 
      },
      orderBy: { name: 'asc' }
    });
    
    console.log(`Total leads: ${leads.length}\n`);
    
    if (leads.length === 0) {
      console.log('❌ No leads found! You need to add leads to send campaigns to.');
      console.log('💡 Go to Lead Management in your CRM to add contacts first.');
    } else {
      console.log('📋 Your leads (campaign recipients):');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      
      leads.forEach((lead, index) => {
        const name = lead.name || 'Unknown';
        const phone = lead.phone || 'No phone';
        const email = lead.email || 'No email';
        
        console.log(`${index + 1}. ${name}`);
        console.log(`   📱 Phone: ${phone}`);
        console.log(`   📧 Email: ${email}`);
        console.log('   ──────────────────────────────────────────────────');
      });
      
      const leadsWithPhones = leads.filter(lead => lead.phone && lead.phone.trim());
      console.log(`\n✅ Leads with phone numbers: ${leadsWithPhones.length}`);
      console.log(`❌ Leads without phone numbers: ${leads.length - leadsWithPhones.length}`);
      
      if (leadsWithPhones.length === 0) {
        console.log('\n⚠️  WARNING: No leads have phone numbers!');
        console.log('💡 Add phone numbers to your leads to contact them via campaigns.');
      } else {
        console.log(`\n🎯 Your campaign will be sent to ${leadsWithPhones.length} contacts.`);
      }
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkLeadsPhones();