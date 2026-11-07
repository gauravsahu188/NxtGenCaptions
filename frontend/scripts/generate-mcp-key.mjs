/**
 * Script: generate-mcp-key.mjs
 * Run: node scripts/generate-mcp-key.mjs [userId]
 *
 * Generates a NxtGen MCP API key for a user and prints it.
 * Uses the same pg adapter setup as src/lib/prisma.ts
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

// ── Load .env.local ──────────────────────────────────────────────────────────
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
} catch {
  // env already set in environment (CI/production)
}

// ── Prisma + pg adapter (same as src/lib/prisma.ts) ─────────────────────────
const { PrismaClient } = await import("../generated/prisma/index.js");
const { Pool }         = await import("pg");
const { PrismaPg }     = await import("@prisma/adapter-pg");

const pool    = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma  = new PrismaClient({ adapter });

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const userId = process.argv[2];

  let user;
  if (userId) {
    user = await prisma.user.findUnique({ where: { id: userId } });
  } else {
    user = await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  }

  if (!user) {
    console.error("❌ No user found. Pass a userId as the first argument.");
    process.exit(1);
  }

  // Check for existing active Claude MCP key
  const existing = await prisma.apiKey.findFirst({
    where: { userId: user.id, status: "active", name: "Claude MCP Key" },
  });

  if (existing) {
    console.log("\n⚠️  An active Claude MCP Key already exists for this user.");
    console.log(`   Key prefix: ${existing.keyPrefix}...`);
    console.log("   Delete it from the DB first to regenerate.\n");
    await pool.end();
    return;
  }

  // Generate: ngc_<48 hex chars>
  const rawKey = `ngc_${crypto.randomBytes(24).toString("hex")}`;
  const prefix = rawKey.slice(0, 12);

  const apiKey = await prisma.apiKey.create({
    data: {
      userId: user.id,
      name: "Claude MCP Key",
      key: rawKey,
      keyPrefix: prefix,
      status: "active",
      rateLimit: 1000,
    },
  });

  console.log("\n✅ API Key generated!\n");
  console.log(`   User:   ${user.email} (${user.id})`);
  console.log(`   Key ID: ${apiKey.id}`);
  console.log(`\n   🔑 YOUR API KEY (copy this now — it won't be shown again):\n`);
  console.log(`   ${rawKey}\n`);
  console.log("   ─────────────────────────────────────────────────────");
  console.log("   Add to ~/Library/Application Support/Claude/claude_desktop_config.json:");
  console.log(`   \"NXTGEN_API_KEY\": \"${rawKey}\"\n`);

  await pool.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
