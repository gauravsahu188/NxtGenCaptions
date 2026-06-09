/**
 * Edge-safe auth config — NO Prisma, NO pg, NO Node.js modules.
 * Used only by middleware.ts which runs in the Edge Runtime.
 * The `authorized` callback here handles route protection.
 */
import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"
import Apple from "next-auth/providers/apple"

export const authConfig: NextAuthConfig = {
  trustHost: true,
  pages: {
    signIn: "/sign-in",
    error: "/sign-in",
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID ? [Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })] : []),
    ...(process.env.APPLE_ID ? [Apple({ clientId: process.env.APPLE_ID, clientSecret: process.env.APPLE_SECRET })] : []),
  ],
  callbacks: {
    // `authorized` is ONLY called by middleware — do not spread this into auth.ts
    authorized({ auth, request: { nextUrl } }) {
      const isSignedIn = !!auth?.user
      const PROTECTED = ["/editor", "/dashboard"]
      const GUEST_ONLY = ["/sign-in"]
      const { pathname } = nextUrl

      // Signed-in user on guest-only page → redirect to dashboard
      if (GUEST_ONLY.some((p) => pathname.startsWith(p)) && isSignedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl))
      }

      // Guest on protected page → redirect to sign-in
      if (PROTECTED.some((p) => pathname.startsWith(p)) && !isSignedIn) {
        const url = new URL("/sign-in", nextUrl)
        url.searchParams.set("callbackUrl", pathname)
        return Response.redirect(url)
      }

      return true
    },
  },
}
