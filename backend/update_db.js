const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgres://def72998d7457f6f121fdcca849b6886143fbe91f2f949751f74734fc8d7a095:sk_k-Obppa7JY_JEMrQ2nK6W@db.prisma.io:5432/postgres?sslmode=verify-full'
});

async function main() {
  await client.connect();
  console.log("Connected to DB");
  await client.query('ALTER TABLE "User" ALTER COLUMN "transcriptionBalance" TYPE double precision;');
  await client.query('ALTER TABLE "Subscription" ALTER COLUMN "transcriptionLimitMins" TYPE double precision;');
  await client.query('ALTER TABLE "Subscription" ALTER COLUMN "transcriptionUsedMins" TYPE double precision;');
  console.log("Altered columns to double precision");
  await client.end();
}

main().catch(e => console.error(e));
