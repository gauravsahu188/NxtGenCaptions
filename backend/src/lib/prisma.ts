import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from "../../generated/prisma";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), "../.env.local") });

const connectionString = process.env.DATABASE_URL || '';

console.log("[Prisma] Initializing with DB URL:", connectionString.substring(0, 30) + "...");

const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
export const prisma = new PrismaClient({ adapter })
