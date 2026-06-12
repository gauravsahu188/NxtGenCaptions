import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  verifyPaymentSignature,
  checkPaymentStatus,
  PLAN_PRICING_INR,
  PLAN_PRICING_USD,
} from "@/lib/payment";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    console.log("[PaymentCallback] Received:", { orderId: razorpay_order_id, paymentId: razorpay_payment_id });

    const isValid = await verifyPaymentSignature(
      razorpay_order_id || "",
      razorpay_payment_id || "",
      razorpay_signature || ""
    );

    if (!isValid) {
      return NextResponse.json({ status: "FAILURE", error: "Invalid signature" }, { status: 400 });
    }

    const orderDetails = await checkPaymentStatus(razorpay_order_id || "");
    if (!orderDetails) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const userId = orderDetails.notes?.userId;
    const planType = orderDetails.notes?.planType;

    if (!userId) {
      return NextResponse.json({ error: "User ID not found in order" }, { status: 400 });
    }

    const currency = orderDetails.currency === "USD" ? "USD" : "INR";
    const pricingMap = currency === "USD" ? PLAN_PRICING_USD : PLAN_PRICING_INR;
    const planDetails = pricingMap[planType as keyof typeof pricingMap];

    if (!planDetails) {
      return NextResponse.json({ error: "Invalid plan type" }, { status: 400 });
    }

    if (orderDetails.status === "paid") {
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
            transcriptionUsedMins: 0,
            audioCredits,
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
            transcriptionUsedMins: 0,
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
          transcriptionBalance: transcriptionBalance,
          audioCredits: audioCredits,
        },
      });

      console.log(`[PaymentCallback] Upgraded user ${userId} to ${planType}`);
      return NextResponse.json({
        status: "SUCCESS",
        message: "Payment successful and plan upgraded",
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
      });
    }

    return NextResponse.json({ status: "PENDING", message: "Payment not completed", orderId: razorpay_order_id });
  } catch (error) {
    console.error("[PaymentCallback] Error:", error);
    return NextResponse.json({ error: "Failed to process callback" }, { status: 500 });
  }
}