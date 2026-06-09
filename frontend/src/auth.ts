/**
 * Full server-side auth config — extends authConfig with Prisma adapter.
 * Only used from Server Components, API Routes, Server Actions.
 * NEVER import this in middleware.ts (edge-incompatible).
 */
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./lib/prisma"

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  // @ts-ignore – prisma from adapter-pg is compatible at runtime
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID ? [Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })] : []),
    Credentials({
      id: "credentials",
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string
        const password = credentials?.password as string

        if (!email || !password) return null

        // Find user
        const user = await prisma.user.findUnique({ where: { email } })
        
        if (!user || !user.password) {
          // No user found, or user signed up via OAuth without a password
          return null
        }

        const bcrypt = await import("bcryptjs")
        const isValid = await bcrypt.compare(password, user.password)

        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          planType: user.planType,
          audioCredits: user.audioCredits,
          transcriptionBalance: user.transcriptionBalance,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const finalToken = token || {}
      const userId = (user?.id || token?.id) as string | undefined
      if (userId) {
        finalToken.id = userId
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            subscription: true,
          },
        })
        if (dbUser) {
          if (dbUser.email === "nxtgencaptions@gmail.com") {
            dbUser.planType = "BUSINESS";
            dbUser.audioCredits = 999999;
            dbUser.transcriptionBalance = 999999;
            dbUser.subscription = (dbUser.subscription || {
              id: "admin-sub",
              userId: dbUser.id,
              createdAt: new Date(),
              updatedAt: new Date(),
              storageUsedBytes: BigInt(0),
              audioCredits: 999999,
              maxVideoLengthMinutes: 999999,
              alphaChannelEnabled: true,
              srtRenderEnabled: true,
              customFontEnabled: true,
              prioritySupport: true,
              billingCycleStart: new Date(),
              billingCycleEnd: null,
            }) as any;
            dbUser.subscription!.planType = "BUSINESS";
            dbUser.subscription!.storageLimitGb = 999999;
            dbUser.subscription!.transcriptionLimitMins = 999999;
            dbUser.subscription!.maxExportRes = 2160;
            dbUser.subscription!.transcriptionUsedMins = 0;
          }
          finalToken.planType = dbUser.planType
          finalToken.audioCredits = dbUser.audioCredits
          finalToken.transcriptionBalance = dbUser.transcriptionBalance
          // Include subscription details if present
          if (dbUser.subscription) {
            finalToken.subscription = {
              planType: dbUser.subscription.planType,
              storageLimitGb: dbUser.subscription.storageLimitGb,
              transcriptionLimitMins: dbUser.subscription.transcriptionLimitMins,
              maxExportRes: dbUser.subscription.maxExportRes,
              transcriptionUsedMins: dbUser.subscription.transcriptionUsedMins,
            }
          }
        }
      }
      return finalToken
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        // @ts-ignore
        session.user.planType = token.planType
        // @ts-ignore
        session.user.audioCredits = token.audioCredits
        // @ts-ignore
        session.user.transcriptionBalance = token.transcriptionBalance
        // @ts-ignore
        session.user.subscription = token.subscription
      }
      return session
    },
  },
})
