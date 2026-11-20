"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const prisma_1 = require("../../generated/prisma");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Load environment variables from standard deployment / local locations
const possibleEnvPaths = [
    path_1.default.join(process.cwd(), "../.env.local"),
    path_1.default.join(process.cwd(), ".env.local"),
    path_1.default.join(process.cwd(), ".env"),
    path_1.default.join(__dirname, "../../../.env.local"),
    path_1.default.join(__dirname, "../../../.env"),
    path_1.default.join(__dirname, "../../.env.local"),
    path_1.default.join(__dirname, "../../.env"),
    path_1.default.join(__dirname, "../.env"),
];
for (const envPath of possibleEnvPaths) {
    if (fs_1.default.existsSync(envPath)) {
        dotenv_1.default.config({ path: envPath });
    }
}
dotenv_1.default.config();
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error("❌ [Prisma] FATAL ERROR: DATABASE_URL is not set in environment or .env file!\n" +
        "Prisma cannot connect to the database. Please define DATABASE_URL in your .env or .env.local file.");
}
else {
    console.log("[Prisma] Initializing with DB URL:", connectionString.substring(0, 30) + "...");
}
const pool = new pg_1.Pool({ connectionString: connectionString || undefined });
const adapter = new adapter_pg_1.PrismaPg(pool);
exports.prisma = new prisma_1.PrismaClient({ adapter });
