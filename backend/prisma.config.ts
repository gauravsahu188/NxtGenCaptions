import { defineConfig } from '@prisma/config';

export default defineConfig({
  earlyAccess: true,
  migrate: {
    url: process.env.DATABASE_URL,
  },
});
