import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

// Edge-safe: only uses authConfig which has no Node.js modules
export default NextAuth(authConfig).auth

export const config = {
  matcher: [
    /*
     * Match all paths except static files, api routes, and Next.js internals.
     */
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
}
