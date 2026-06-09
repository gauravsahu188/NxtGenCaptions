import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  initiatePayment,
  generateOrderId,
  PLAN_PRICING_INR,
  PLAN_PRICING_USD,
} from "@/lib/payment";

const VALID_PLANS = ["EDITOR", "CREATOR", "BUSINESS"] as const;

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

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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