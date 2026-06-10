import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { PLAN_PRICING_INR, PLAN_PRICING_USD } from "@/lib/payment";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  // Respond immediately to prevent Razorpay retries
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";

  // Verify signature
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[Webhook] RAZORPAY_WEBHOOK_SECRET not set");
    return NextResponse.json({ received: true });
  }

  const generated = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const genBuf = Buffer.from(generated, "hex");
  const sigBuf = Buffer.from(signature, "hex");

  let isValid = false;
  try {
    if (genBuf.length === sigBuf.length) {
      isValid = crypto.timingSafeEqual(genBuf, sigBuf);
    }
  } catch { isValid = false; }

  if (!isValid) {
    console.warn("[Webhook] Invalid signature");
    return NextResponse.json({ received: true });
  }

  try {
    const event = JSON.parse(rawBody);
    console.log(`[Webhook] Event: ${event.event}`);

    if (event.event === "payment.captured") {
      const paymentEntity = event.payload.payment.entity;
      const notes = paymentEntity.notes || {};
      const userId = notes.userId;
      const planType = notes.planType;

      if (!userId || !planType) {
        console.error("[Webhook] Missing userId or planType in notes");
        return NextResponse.json({ received: true });
      }

      const currency = paymentEntity.currency === "USD" ? "USD" : "INR";
      const pricingMap = currency === "USD" ? PLAN_PRICING_USD : PLAN_PRICING_INR;
      const planDetails = pricingMap[planType as keyof typeof pricingMap];

      if (!planDetails) {
        console.error(`[Webhook] Invalid planType: ${planType}`);
        return NextResponse.json({ received: true });
      }

      const {
        maxExportRes, audioCredits, transcriptionBalance, storageLimitGb,
        maxVideoLengthMinutes, alphaChannelEnabled, srtRenderEnabled,
        customFontEnabled, prioritySupport,
      } = planDetails;

      const existingSub = await prisma.subscription.findUnique({ where: { userId } });

      if (existingSub) {
        await prisma.subscription.update({
          where: { userId },
          data: {
            planType: planType as any, transcriptionLimitMins: transcriptionBalance,
            maxExportRes, storageLimitGb, maxVideoLengthMinutes, alphaChannelEnabled,
            srtRenderEnabled, customFontEnabled, prioritySupport,
            billingCycleStart: new Date(),
            billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(),
          },
        });
      } else {
        await prisma.subscription.create({
          data: {
            userId, planType: planType as any, transcriptionLimitMins: transcriptionBalance,
            maxExportRes, storageLimitGb, maxVideoLengthMinutes, alphaChannelEnabled,
            srtRenderEnabled, customFontEnabled, prioritySupport, audioCredits,
            billingCycleStart: new Date(),
            billingCycleEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          },
        });
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          planType: planType as any,
          transcriptionBalance: { increment: transcriptionBalance },
          audioCredits: { increment: audioCredits },
        },
      });

      await prisma.transaction.create({
        data: {
          userId,
          amount: (paymentEntity.amount || 0) / 100,
          currency,
          status: "SUCCESS",
          planType: planType as any,
          razorpayOrderId: paymentEntity.order_id,
          razorpayPaymentId: paymentEntity.id,
        },
      });

      console.log(`[Webhook] Updated user ${userId} to ${planType}`);
    }
  } catch (error) {
    console.error("[Webhook] Error processing payload:", error);
  }

  return NextResponse.json({ received: true });
}
