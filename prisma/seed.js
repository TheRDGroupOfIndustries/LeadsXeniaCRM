/* Seed an initial admin user. Reads ADMIN_EMAIL and ADMIN_PASSWORD from env if provided. */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL || 'admin@xeniacrm.app';
  const name = process.env.ADMIN_NAME || 'Admin';
  const passwordPlain = process.env.ADMIN_PASSWORD || 'Admin@123!';

  const password = await bcrypt.hash(passwordPlain, 10);

  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    // Update existing user to ensure they have admin credentials
    await prisma.user.update({
      where: { email },
      data: { password, role: 'ADMIN' }
    });
    console.log(`✅ Admin updated (${email}).`);
    console.log('🔐 Credentials');
    console.log(`  Email: ${email}`);
    console.log(`  Password: ${passwordPlain}`);
    return;
  }

  const created = await prisma.user.create({
    data: {
      email,
      name,
      password,
      role: 'ADMIN',
      subscription: 'FREE',
    },
  });

  console.log('✅ Admin user created:', { id: created.id, email: created.email });
  console.log('🔐 Credentials');
  console.log(`  Email: ${email}`);
  console.log(`  Password: ${passwordPlain}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
