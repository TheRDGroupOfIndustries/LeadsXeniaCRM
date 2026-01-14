const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function exportData() {
  try {
    console.log('🚀 Starting data export...');
    
    // Export all data
    const users = await prisma.user.findMany();
    const leads = await prisma.lead.findMany();
    const campaigns = await prisma.whatsappCampaign.findMany();
    const tokens = await prisma.whatsappToken.findMany();
    const reminders = await prisma.reminder.findMany();
    const integrations = await prisma.whatsAppIntegration.findMany();

    const exportData = {
      users,
      leads,
      campaigns,
      tokens,
      reminders,
      integrations,
      exportedAt: new Date().toISOString()
    };

    // Create export directory
    const exportDir = path.join(__dirname, '../data-export');
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    // Save as JSON
    const exportPath = path.join(exportDir, `colortouch-export-${Date.now()}.json`);
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2));

    console.log('✅ Data exported successfully!');
    console.log(`📁 Export saved to: ${exportPath}`);
    console.log('\n📊 Export Summary:');
    console.log(`- Users: ${users.length}`);
    console.log(`- Leads: ${leads.length}`);
    console.log(`- Campaigns: ${campaigns.length}`);
    console.log(`- Tokens: ${tokens.length}`);
    console.log(`- Reminders: ${reminders.length}`);
    console.log(`- Integrations: ${integrations.length}`);

  } catch (error) {
    console.error('❌ Export failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

exportData();