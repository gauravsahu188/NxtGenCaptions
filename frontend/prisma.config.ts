import { defineConfig } from "@prisma/config"
import dotenv from "dotenv"
import path from "path"
import fs from "fs"

// Load from root .env.local only if it exists (local dev only)
// On Amplify, DATABASE_URL is set via environment variables in the console
const envPath = path.join(__dirname, "../.env.local")
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts"
  },
})
