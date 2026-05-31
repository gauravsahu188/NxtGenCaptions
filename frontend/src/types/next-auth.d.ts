import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"
import { PlanType } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      planType: PlanType
      audioCredits: number
      transcriptionBalance: number
      subscription?: {
        planType: PlanType
        storageLimitGb: number
        transcriptionLimitMins: number
        maxExportRes: number
        transcriptionUsedMins: number
      }
    } & DefaultSession["user"]
  }

  interface User extends DefaultUser {
    planType: PlanType
    audioCredits: number
    transcriptionBalance: number
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    planType: PlanType
    audioCredits: number
    transcriptionBalance: number
    subscription?: {
      planType: PlanType
      storageLimitGb: number
      transcriptionLimitMins: number
      maxExportRes: number
      transcriptionUsedMins: number
    }
  }
}