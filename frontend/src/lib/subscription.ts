import { PlanType } from "@prisma/client"

export interface SubscriptionTier {
  planType: PlanType
  name: string
  storageLimitGb: number
  transcriptionLimitMins: number
  maxExportRes: number
  monthlyPrice?: number
}

export const SUBSCRIPTION_TIERS: Record<PlanType, SubscriptionTier> = {
  FREE: {
    planType: PlanType.FREE,
    name: "Free",
    storageLimitGb: 1,
    transcriptionLimitMins: 5,
    maxExportRes: 720,
    monthlyPrice: 0,
  },
  EDITOR: {
    planType: PlanType.EDITOR,
    name: "Editor",
    storageLimitGb: 20,
    transcriptionLimitMins: 120,
    maxExportRes: 1080,
  },
  CREATOR: {
    planType: PlanType.CREATOR,
    name: "Creator",
    storageLimitGb: 60,
    transcriptionLimitMins: 300,
    maxExportRes: 2160,
  },
  BUSINESS: {
    planType: PlanType.BUSINESS,
    name: "Business",
    storageLimitGb: 150,
    transcriptionLimitMins: 720,
    maxExportRes: 2160,
  },
}

export function getTierForPlan(planType: PlanType): SubscriptionTier {
  return SUBSCRIPTION_TIERS[planType]
}

export function canExportAtRes(currentPlan: PlanType, requestedRes: number): boolean {
  const tier = SUBSCRIPTION_TIERS[currentPlan]
  return requestedRes <= tier.maxExportRes
}

export function hasStorageSpace(currentUsageBytes: bigint, requestedBytes: bigint, planType: PlanType): boolean {
  const tier = SUBSCRIPTION_TIERS[planType]
  const limitBytes = BigInt(tier.storageLimitGb * 1024 * 1024 * 1024)
  const projectedUsage = currentUsageBytes + requestedBytes
  return projectedUsage <= limitBytes
}

export function hasTranscriptionMinutes(usedMins: number, requestedMins: number, planType: PlanType): boolean {
  const tier = SUBSCRIPTION_TIERS[planType]
  const remaining = tier.transcriptionLimitMins - usedMins
  return requestedMins <= remaining
}