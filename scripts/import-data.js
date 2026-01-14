const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function importData() {
  try {
    // Find the latest export file
    const exportDir = path.join(__dirname, '../data-export');
    const files = fs.readdirSync(exportDir)
      .filter(file => file.startsWith('colortouch-export-') && file.endsWith('.json'))
      .sort()
      .reverse();
    
    if (files.length === 0) {
      throw new Error('No export file found! Run export-data.js first.');
    }

    const latestFile = path.join(exportDir, files[0]);
    console.log(`📂 Loading data from: ${latestFile}`);
    
    const exportData = JSON.parse(fs.readFileSync(latestFile, 'utf8'));

    console.log('🚀 Starting data import...');

    // Import in dependency order (users first, then related data)
    
    // 1. Import Users
    console.log('👤 Importing users...');
    for (const user of exportData.users) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      });
    }

    // 2. Import Leads
    console.log('📋 Importing leads...');
    for (const lead of exportData.leads) {
      await prisma.lead.upsert({
        where: { id: lead.id },
        update: lead,
        create: lead
      });
    }

    // 3. Import Campaigns
    console.log('📢 Importing campaigns...');
    for (const campaign of exportData.campaigns) {
      await prisma.whatsappCampaign.upsert({
        where: { id: campaign.id },
        update: campaign,
        create: campaign
      });
    }

    // 4. Import Tokens
    console.log('🔑 Importing tokens...');
    for (const token of exportData.tokens) {
      await prisma.whatsappToken.upsert({
        where: { id: token.id },
        update: token,
        create: token
      });
    }

    // 5. Import Reminders
    console.log('⏰ Importing reminders...');
    for (const reminder of exportData.reminders) {
      await prisma.reminder.upsert({
        where: { id: reminder.id },
        update: reminder,
        create: reminder
      });
    }

    // 6. Import Integrations
    console.log('🔗 Importing integrations...');
    for (const integration of exportData.integrations) {
      await prisma.whatsAppIntegration.upsert({
        where: { id: integration.id },
        update: integration,
        create: integration
      });
    }

    console.log('✅ Data imported successfully!');
    console.log('\n📊 Import Summary:');
    console.log(`- Users: ${exportData.users.length}`);
    console.log(`- Leads: ${exportData.leads.length}`);
    console.log(`- Campaigns: ${exportData.campaigns.length}`);
    console.log(`- Tokens: ${exportData.tokens.length}`);
    console.log(`- Reminders: ${exportData.reminders.length}`);
    console.log(`- Integrations: ${exportData.integrations.length}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importData();