import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  initiatePayment,
  generateOrderId,
  PLAN_PRICING_INR,
  PLAN_PRICING_USD,
} from "@/lib/payment";

const VALID_PLANS = ["EDITOR", "CREATOR", "BUSINESS", "TRIAL_1_INR", "TRIAL_9_INR"] as const;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = session.user.id;

    const { planType, currency = "INR" } = await request.json();

    if (!planType || !VALID_PLANS.includes(planType)) {
      return NextResponse.json(
        { error: "Invalid plan type. Must be EDITOR, CREATOR, or BUSINESS" },
        { status: 400 }
      );
    }

    const pricingMap = currency === "USD" ? PLAN_PRICING_USD : PLAN_PRICING_INR;
    const planDetails = pricingMap[planType];

    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: { subscription: true }
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (planType === 'TRIAL_1_INR' && user.subscription?.hasUsed1RupeeTrial) {
      return NextResponse.json({ error: "You have already used the 1 Rupee Trial" }, { status: 403 });
    }
    if (planType === 'TRIAL_9_INR' && user.subscription?.hasUsed9RupeeTrial) {
      return NextResponse.json({ error: "You have already used the 9 Rupee Trial" }, { status: 403 });
    }

    const orderId = generateOrderId(userId);

    const result = await initiatePayment({
      userId,
      orderId,
      amount: planDetails.amount,
      planType,
      email: user.email || undefined,
      currency,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to initiate payment" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      paymentPayload: result.paymentPayload,
      planDetails: {
        planType,
        amount: planDetails.amount,
        transcriptionBalance: planDetails.transcriptionBalance,
        audioCredits: planDetails.audioCredits,
      },
    });
  } catch (error) {
    console.error("[PaymentInitiate] Error:", error);
    return NextResponse.json({ error: "Failed to initiate payment" }, { status: 500 });
  }
}