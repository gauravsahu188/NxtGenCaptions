import { PlanType } from "../../generated/prisma"
import { prisma } from "./prisma"

export interface SubscriptionTier {
  planType: PlanType
  name: string
  storageLimitGb: number
  transcriptionLimitMins: number
  maxExportRes: number
}

export const SUBSCRIPTION_TIERS: Record<PlanType, SubscriptionTier> = {
  FREE: {
    planType: PlanType.FREE,
    name: "Free",
    storageLimitGb: 1,
    transcriptionLimitMins: 5,
    maxExportRes: 720,
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

export async function getOrCreateSubscription(userId: string) {
  let subscription = await prisma.subscription.findUnique({
    where: { userId },
  })

  if (!subscription) {
    subscription = await prisma.subscription.create({
      data: {
        userId,
        planType: PlanType.FREE,
        storageLimitGb: 1,
        transcriptionLimitMins: 5,
        maxExportRes: 720,
      },
    })
  }

  return subscription
}

export async function upgradeSubscription(userId: string, planType: PlanType) {
  const tier = SUBSCRIPTION_TIERS[planType]

  return prisma.subscription.upsert({
    where: { userId },
    update: {
      planType,
      storageLimitGb: tier.storageLimitGb,
      transcriptionLimitMins: tier.transcriptionLimitMins,
      maxExportRes: tier.maxExportRes,
    },
    create: {
      userId,
      planType,
      storageLimitGb: tier.storageLimitGb,
      transcriptionLimitMins: tier.transcriptionLimitMins,
      maxExportRes: tier.maxExportRes,
    },
  })
}

export function canExportAtRes(subscription: { planType: PlanType; maxExportRes: number }, requestedRes: number): boolean {
  return requestedRes <= subscription.maxExportRes
}

export function hasStorageSpace(
  subscription: { storageUsedBytes: bigint; storageLimitGb: number },
  additionalBytes: bigint
): boolean {
  const limitBytes = BigInt(subscription.storageLimitGb * 1024 * 1024 * 1024)
  return (subscription.storageUsedBytes + additionalBytes) <= limitBytes
}

export function hasTranscriptionMinutes(subscription: { transcriptionUsedMins: number; transcriptionLimitMins: number }, requestedMins: number): boolean {
  const remaining = subscription.transcriptionLimitMins - subscription.transcriptionUsedMins
  return requestedMins <= remaining
}

export async function consumeTranscriptionMinutes(userId: string, minutes: number) {
  return prisma.subscription.update({
    where: { userId },
    data: {
      transcriptionUsedMins: { increment: minutes },
    },
  })
}

export async function updateStorageUsage(userId: string, additionalBytes: bigint) {
  return prisma.subscription.update({
    where: { userId },
    data: {
      storageUsedBytes: { increment: additionalBytes },
    },
  })
}

export async function resetMonthlyUsage(userId: string) {
  return prisma.subscription.update({
    where: { userId },
    data: {
      transcriptionUsedMins: 0,
      storageUsedBytes: 0,
      billingCycleStart: new Date(),
    },
  })
}