"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.razorpayWebhookHandler = razorpayWebhookHandler;
const crypto_1 = __importDefault(require("crypto"));
const prisma_1 = require("../lib/prisma");
const payment_service_1 = require("../services/payment.service");
async function razorpayWebhookHandler(req, res, next) {
    // Send 200 OK rapidly to prevent retries
    res.status(200).json({ received: true });
    try {
        const signatureHeader = req.headers["x-razorpay-signature"];
        if (!signatureHeader) {
            console.warn("[Webhook] Missing x-razorpay-signature header");
            return;
        }
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
            console.error("[Webhook] RAZORPAY_WEBHOOK_SECRET is not configured");
            return;
        }
        const rawBody = req.rawBody;
        if (!rawBody) {
            console.error("[Webhook] Raw request body is missing. Verify middleware configuration.");
            return;
        }
        // Generate HMAC SHA256 hash using the raw request body Buffer
        const generatedSignature = crypto_1.default
            .createHmac("sha256", secret)
            .update(rawBody)
            .digest("hex");
        // Timing-safe comparison of signatures
        const generatedBuffer = Buffer.from(generatedSignature, "hex");
        const headerBuffer = Buffer.from(signatureHeader, "hex");
        let isSignatureValid = false;
        try {
            if (generatedBuffer.length === headerBuffer.length) {
                isSignatureValid = crypto_1.default.timingSafeEqual(generatedBuffer, headerBuffer);
            }
        }
        catch (err) {
            isSignatureValid = false;
        }
        if (!isSignatureValid) {
            console.warn("[Webhook] Invalid signature comparison");
            return;
        }
        // Parse the event
        const event = typeof rawBody === "string" ? JSON.parse(rawBody) : JSON.parse(rawBody.toString());
        console.log(`[Webhook] Signature verified. Event: ${event.event}`);
        if (event.event === "payment.captured") {
            const paymentEntity = event.payload.payment.entity;
            const notes = paymentEntity.notes || {};
            const userId = notes.userId;
            const planType = notes.planType;
            if (!userId || !planType) {
                console.error("[Webhook] Missing userId or planType in payment notes", notes);
                return;
            }
            const currency = paymentEntity.currency === "USD" ? "USD" : "INR";
            const pricingMap = currency === "USD" ? payment_service_1.PLAN_PRICING_USD : payment_service_1.PLAN_PRICING_INR;
            const planDetails = pricingMap[planType];
            if (!planDetails) {
                console.error(`[Webhook] Invalid planType: ${planType} for currency: ${currency}`);
                return;
            }
            console.log(`[Webhook] Processing payment.captured for User: ${userId}, Plan: ${planType}`);
            const { maxExportRes, audioCredits, transcriptionBalance, storageLimitGb, maxVideoLengthMinutes, alphaChannelEnabled, srtRenderEnabled, customFontEnabled, prioritySupport, } = planDetails;
            // Update or create subscription in DB
            const existingSubscription = await prisma_1.prisma.subscription.findUnique({
                where: { userId },
            });
            if (existingSubscription) {
                await prisma_1.prisma.subscription.update({
                    where: { userId },
                    data: {
                        planType: planType,
                        transcriptionLimitMins: transcriptionBalance,
                        transcriptionUsedMins: 0,
                        audioCredits,
                        maxExportRes,
                        storageLimitGb,
                        maxVideoLengthMinutes,
                        alphaChannelEnabled,
                        srtRenderEnabled,
                        customFontEnabled,
                        prioritySupport,
                        billingCycleStart: new Date(),
                        billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                        updatedAt: new Date(),
                    },
                });
            }
            else {
                await prisma_1.prisma.subscription.create({
                    data: {
                        userId,
                        planType: planType,
                        transcriptionLimitMins: transcriptionBalance,
                        transcriptionUsedMins: 0,
                        maxExportRes,
                        storageLimitGb,
                        maxVideoLengthMinutes,
                        alphaChannelEnabled,
                        srtRenderEnabled,
                        customFontEnabled,
                        prioritySupport,
                        audioCredits,
                        billingCycleStart: new Date(),
                        billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    },
                });
            }
            // Update user credits
            await prisma_1.prisma.user.update({
                where: { id: userId },
                data: {
                    planType: planType,
                    transcriptionBalance: transcriptionBalance,
                    audioCredits: audioCredits,
                },
            });
            console.log(`[Webhook] Successfully updated user ${userId} credits and subscription for plan ${planType}`);
        }
    }
    catch (error) {
        console.error("[Webhook] Error handling webhook payload:", error);
    }
}
