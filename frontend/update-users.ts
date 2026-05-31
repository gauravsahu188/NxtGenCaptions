import { config } from 'dotenv';
config({ path: '.env' });
const { PrismaClient } = require('./generated/prisma/index.js');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.user.updateMany({
    where: { planType: 'FREE' },
    data: { transcriptionBalance: 5, audioCredits: 3 }
  });
  console.log("Updated existing users.");
}
main().catch(console.error).finally(() => prisma.$disconnect());
