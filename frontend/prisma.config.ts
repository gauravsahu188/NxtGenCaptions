import { defineConfig } from "@prisma/config"
import dotenv from "dotenv"
import path from "path"

// Load from root .env.local
dotenv.config({ path: path.join(__dirname, "../.env.local") })

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
  migrations: {
    seed: "tsx prisma/seed.ts"
  },
})
