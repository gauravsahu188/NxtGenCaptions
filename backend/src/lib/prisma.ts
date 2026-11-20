import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from "../../generated/prisma";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load environment variables from standard deployment / local locations
const possibleEnvPaths = [
  path.join(process.cwd(), "../.env.local"),
  path.join(process.cwd(), ".env.local"),
  path.join(process.cwd(), ".env"),
  path.join(__dirname, "../../../.env.local"),
  path.join(__dirname, "../../../.env"),
  path.join(__dirname, "../../.env.local"),
  path.join(__dirname, "../../.env"),
  path.join(__dirname, "../.env"),
];

for (const envPath of possibleEnvPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
}
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    "❌ [Prisma] FATAL ERROR: DATABASE_URL is not set in environment or .env file!\n" +
    "Prisma cannot connect to the database. Please define DATABASE_URL in your .env or .env.local file."
  );
} else {
  console.log("[Prisma] Initializing with DB URL:", connectionString.substring(0, 30) + "...");
}

const pool = new Pool({ connectionString: connectionString || undefined })
const adapter = new PrismaPg(pool)
export const prisma = new PrismaClient({ adapter })
