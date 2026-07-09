import { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { prisma } from "../lib/prisma";
import { PLAN_PRICING_INR, PLAN_PRICING_USD } from "../services/payment.service";

export async function razorpayWebhookHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Send 200 OK rapidly to prevent retries
  res.status(200).json({ received: true });

  try {
    const signatureHeader = req.headers["x-razorpay-signature"] as string;
    if (!signatureHeader) {
      console.warn("[Webhook] Missing x-razorpay-signature header");
      return;
    }

    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      console.error("[Webhook] RAZORPAY_WEBHOOK_SECRET is not configured");
      return;
    }

    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      console.error("[Webhook] Raw request body is missing. Verify middleware configuration.");
      return;
    }

    // Generate HMAC SHA256 hash using the raw request body Buffer
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    // Timing-safe comparison of signatures
    const generatedBuffer = Buffer.from(generatedSignature, "hex");
    const headerBuffer = Buffer.from(signatureHeader, "hex");

    let isSignatureValid = false;
    try {
      if (generatedBuffer.length === headerBuffer.length) {
        isSignatureValid = crypto.timingSafeEqual(generatedBuffer, headerBuffer);
      }
    } catch (err) {
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
      const pricingMap = currency === "USD" ? PLAN_PRICING_USD : PLAN_PRICING_INR;
      const planDetails = pricingMap[planType as keyof typeof pricingMap];

      if (!planDetails) {
        console.error(`[Webhook] Invalid planType: ${planType} for currency: ${currency}`);
        return;
      }

      console.log(`[Webhook] Processing payment.captured for User: ${userId}, Plan: ${planType}`);

      const {
        maxExportRes,
        audioCredits,
        transcriptionBalance,
        storageLimitGb,
        maxVideoLengthMinutes,
        alphaChannelEnabled,
        srtRenderEnabled,
        customFontEnabled,
        prioritySupport,
      } = planDetails;

      let billingCycleEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      let extraUpdates: any = {};
      
      if (planType === 'TRIAL_1_INR') {
        billingCycleEnd = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
        extraUpdates.hasUsed1RupeeTrial = true;
      } else if (planType === 'TRIAL_9_INR') {
        billingCycleEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        extraUpdates.hasUsed9RupeeTrial = true;
      }

      // Update or create subscription in DB
      const existingSubscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (existingSubscription) {
        await prisma.subscription.update({
          where: { userId },
          data: {
            planType: planType as any,
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
            billingCycleEnd,
            updatedAt: new Date(),
            ...extraUpdates
          },
        });
      } else {
        await prisma.subscription.create({
          data: {
            userId,
            planType: planType as any,
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
            billingCycleEnd,
            ...extraUpdates
          },
        });
      }

      // Update user credits
      await prisma.user.update({
        where: { id: userId },
        data: {
          planType: planType as any,
          transcriptionBalance: transcriptionBalance,
          audioCredits: audioCredits,
        },
      });

      console.log(`[Webhook] Successfully updated user ${userId} credits and subscription for plan ${planType}`);
    }
  } catch (error) {
    console.error("[Webhook] Error handling webhook payload:", error);
  }
}
