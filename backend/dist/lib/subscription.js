"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SUBSCRIPTION_TIERS = void 0;
exports.getTierForPlan = getTierForPlan;
exports.getOrCreateSubscription = getOrCreateSubscription;
exports.upgradeSubscription = upgradeSubscription;
exports.canExportAtRes = canExportAtRes;
exports.hasStorageSpace = hasStorageSpace;
exports.hasTranscriptionMinutes = hasTranscriptionMinutes;
exports.consumeTranscriptionMinutes = consumeTranscriptionMinutes;
exports.updateStorageUsage = updateStorageUsage;
exports.resetMonthlyUsage = resetMonthlyUsage;
const prisma_1 = require("../../generated/prisma");
const prisma_2 = require("./prisma");
exports.SUBSCRIPTION_TIERS = {
    FREE: {
        planType: prisma_1.PlanType.FREE,
        name: "Free",
        storageLimitGb: 1,
        transcriptionLimitMins: 2,
        maxExportRes: 720,
    },
    EDITOR: {
        planType: prisma_1.PlanType.EDITOR,
        name: "Editor",
        storageLimitGb: 20,
        transcriptionLimitMins: 90,
        maxExportRes: 1080,
    },
    CREATOR: {
        planType: prisma_1.PlanType.CREATOR,
        name: "Creator",
        storageLimitGb: 60,
        transcriptionLimitMins: 200,
        maxExportRes: 2160,
    },
    BUSINESS: {
        planType: prisma_1.PlanType.BUSINESS,
        name: "Business",
        storageLimitGb: 150,
        transcriptionLimitMins: 500,
        maxExportRes: 2160,
    },
    TRIAL_1_INR: {
        planType: prisma_1.PlanType.TRIAL_1_INR,
        name: "1 Rupee Trial",
        storageLimitGb: 5,
        transcriptionLimitMins: 1,
        maxExportRes: 1080,
    },
    TRIAL_9_INR: {
        planType: prisma_1.PlanType.TRIAL_9_INR,
        name: "9 Rupee Trial",
        storageLimitGb: 5,
        transcriptionLimitMins: 9,
        maxExportRes: 1080,
    },
};
function getTierForPlan(planType) {
    return exports.SUBSCRIPTION_TIERS[planType];
}
async function getOrCreateSubscription(userId) {
    let subscription = await prisma_2.prisma.subscription.findUnique({
        where: { userId },
    });
    if (!subscription) {
        subscription = await prisma_2.prisma.subscription.create({
            data: {
                userId,
                planType: prisma_1.PlanType.FREE,
                storageLimitGb: 1,
                transcriptionLimitMins: 5,
                maxExportRes: 720,
            },
        });
    }
    return subscription;
}
async function upgradeSubscription(userId, planType) {
    const tier = exports.SUBSCRIPTION_TIERS[planType];
    const extraUpdates = {};
    if (planType === prisma_1.PlanType.TRIAL_1_INR) {
        extraUpdates.hasUsed1RupeeTrial = true;
        extraUpdates.billingCycleEnd = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
    }
    else if (planType === prisma_1.PlanType.TRIAL_9_INR) {
        extraUpdates.hasUsed9RupeeTrial = true;
        extraUpdates.billingCycleEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    return prisma_2.prisma.subscription.upsert({
        where: { userId },
        update: {
            planType,
            storageLimitGb: tier.storageLimitGb,
            transcriptionLimitMins: tier.transcriptionLimitMins,
            maxExportRes: tier.maxExportRes,
            ...extraUpdates
        },
        create: {
            userId,
            planType,
            storageLimitGb: tier.storageLimitGb,
            transcriptionLimitMins: tier.transcriptionLimitMins,
            maxExportRes: tier.maxExportRes,
            ...extraUpdates
        },
    });
}
function canExportAtRes(subscription, requestedRes) {
    return requestedRes <= subscription.maxExportRes;
}
function hasStorageSpace(subscription, additionalBytes) {
    const limitBytes = BigInt(subscription.storageLimitGb * 1024 * 1024 * 1024);
    return (subscription.storageUsedBytes + additionalBytes) <= limitBytes;
}
function hasTranscriptionMinutes(subscription, requestedMins) {
    const remaining = subscription.transcriptionLimitMins - subscription.transcriptionUsedMins;
    return requestedMins <= remaining;
}
async function consumeTranscriptionMinutes(userId, minutes) {
    return prisma_2.prisma.subscription.update({
        where: { userId },
        data: {
            transcriptionUsedMins: { increment: minutes },
        },
    });
}
async function updateStorageUsage(userId, additionalBytes) {
    return prisma_2.prisma.subscription.update({
        where: { userId },
        data: {
            storageUsedBytes: { increment: additionalBytes },
        },
    });
}
async function resetMonthlyUsage(userId) {
    return prisma_2.prisma.subscription.update({
        where: { userId },
        data: {
            transcriptionUsedMins: 0,
            storageUsedBytes: 0,
            billingCycleStart: new Date(),
        },
    });
}
