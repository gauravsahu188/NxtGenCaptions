/**
 * Script: generate-mcp-key.ts
 * Run: npx ts-node --esm scripts/generate-mcp-key.ts [userId]
 * 
 * Generates a NxtGen MCP API key for a user and prints it.
 * The key is stored in the ApiKey table.
 */
import { PrismaClient } from "../generated/prisma/index.js";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  // Get userId from args or find the first user
  const userId = process.argv[2];

  let user;
  if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } });
  } else {
    user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  }

  if (!user) {
    console.error("❌ No user found. Please provide a userId as argument.");
    process.exit(1);
  }

  // Generate a secure random key: ngc_<32 hex chars>
  const rawKey = `ngc_${crypto.randomBytes(24).toString("hex")}`;
  const prefix = rawKey.slice(0, 12); // ngc_xxxx (display prefix)

  // Check for existing active key
  const existing = await prisma.apiKey.findFirst({
    where: { userId: user.id, status: "active", name: "Claude MCP Key" },
  });

  if (existing) {
    console.log("\n⚠️  An active Claude MCP Key already exists for this user.");
    console.log("   To regenerate, revoke the old key first.\n");
    console.log(`   Existing key prefix: ${existing.keyPrefix}...`);
    console.log(`   Key ID: ${existing.id}\n`);
    return;
  }

  const apiKey = await prisma.apiKey.create({
    data: {
      userId: user.id,
      name: "Claude MCP Key",
      key: rawKey,
      keyPrefix: prefix,
      status: "active",
      rateLimit: 1000,
      expiresAt: null, // never expires
    },
  });

  console.log("\n✅ API Key generated successfully!\n");
  console.log(`   User:    ${user.email} (${user.id})`);
  console.log(`   Key ID:  ${apiKey.id}`);
  console.log(`   Prefix:  ${prefix}...`);
  console.log(`\n   🔑 YOUR API KEY (copy this — it won't be shown again):\n`);
  console.log(`   ${rawKey}\n`);
  console.log("   Add this to your Claude Desktop config as NXTGEN_API_KEY\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
