/**
 * Quick lookup: find user by email and generate API key.
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../../.env.local");
try {
  const envLines = readFileSync(envPath, "utf8").split("\n");
  for (const line of envLines) {
    const eqIdx = line.indexOf("=");
    if (eqIdx === -1 || line.trim().startsWith("#")) continue;
    const key = line.slice(0, eqIdx).trim();
    const val = line.slice(eqIdx + 1).trim();
    if (key && !process.env[key]) process.env[key] = val;
  }
} catch {}

const { PrismaClient } = await import("../generated/prisma/index.js");
const { Pool }         = await import("pg");
const { PrismaPg }     = await import("@prisma/adapter-pg");

const pool    = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });

async function main() {
  const email = process.argv[2];
  if (!email) {
    // Print all users
    const users = await prisma.user.findMany({ select: { id: true, email: true, planType: true }, take: 10, orderBy: { createdAt: "asc" } });
    console.log("\nAll users:");
    users.forEach(u => console.log(`  ${u.email} (${u.planType}) — ${u.id}`));
    await pool.end();
    return;
  }

  const user = await prisma.user.findFirst({ where: { email }, select: { id: true, email: true, planType: true } });
  if (!user) {
    console.error(`\n❌ No user found with email: ${email}`);
    await pool.end();
    return;
  }

  console.log(`\n✅ Found user: ${user.email} (${user.planType}) — ${user.id}`);

  // Delete old Claude MCP keys
  await prisma.apiKey.deleteMany({ where: { userId: user.id, name: "Claude MCP Key" } });

  const rawKey = `ngc_${crypto.randomBytes(24).toString("hex")}`;
  const prefix = rawKey.slice(0, 12);

  await prisma.apiKey.create({
    data: { userId: user.id, name: "Claude MCP Key", key: rawKey, keyPrefix: prefix, status: "active", rateLimit: 1000 },
  });

  console.log(`\n   🔑 NEW API KEY:\n   ${rawKey}\n`);
  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
