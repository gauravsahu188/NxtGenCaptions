import { PrismaClient } from "../../generated/prisma"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const globalForPrisma = globalThis as unknown as { prisma_v2: PrismaClient }

export const prisma = globalForPrisma.prisma_v2 || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma_v2 = prisma
