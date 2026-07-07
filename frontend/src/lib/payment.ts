import Razorpay from "razorpay";
import crypto from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PlanFeatures {
  amount: string;
  transcriptionBalance: number;
  audioCredits: number;
  maxExportRes: number;
  storageLimitGb: number;
  maxVideoLengthMinutes: number;
  alphaChannelEnabled: boolean;
  srtRenderEnabled: boolean;
  customFontEnabled: boolean;
  prioritySupport: boolean;
}

interface InitiateTransactionParams {
  userId: string;
  orderId: string;
  amount: string;
  planType: string;
  email?: string;
  currency?: string;
}

// ─── Plan Pricing ─────────────────────────────────────────────────────────────

export const PLAN_PRICING_INR: Record<string, PlanFeatures> = {
  EDITOR: {
    amount: "199.00",
    transcriptionBalance: 90,
    audioCredits: 50,
    maxExportRes: 1080,
    storageLimitGb: 20,
    maxVideoLengthMinutes: 5,
    alphaChannelEnabled: false,
    srtRenderEnabled: false,
    customFontEnabled: true,
    prioritySupport: false,
  },
  CREATOR: {
    amount: "349.00",
    transcriptionBalance: 200,
    audioCredits: 150,
    maxExportRes: 2160,
    storageLimitGb: 60,
    maxVideoLengthMinutes: 10,
    alphaChannelEnabled: true,
    srtRenderEnabled: true,
    customFontEnabled: true,
    prioritySupport: false,
  },
  BUSINESS: {
    amount: "749.00",
    transcriptionBalance: 500,
    audioCredits: 500,
    maxExportRes: 2160,
    storageLimitGb: 150,
    maxVideoLengthMinutes: 30,
    alphaChannelEnabled: true,
    srtRenderEnabled: true,
    customFontEnabled: true,
    prioritySupport: true,
  },
  TRIAL_1_INR: {
    amount: "1.00",
    transcriptionBalance: 1,
    audioCredits: 3,
    maxExportRes: 1080,
    storageLimitGb: 5,
    maxVideoLengthMinutes: 2,
    alphaChannelEnabled: false,
    srtRenderEnabled: false,
    customFontEnabled: false,
    prioritySupport: false,
  },
  TRIAL_9_INR: {
    amount: "9.00",
    transcriptionBalance: 9,
    audioCredits: 5,
    maxExportRes: 1080,
    storageLimitGb: 5,
    maxVideoLengthMinutes: 5,
    alphaChannelEnabled: false,
    srtRenderEnabled: false,
    customFontEnabled: false,
    prioritySupport: false,
  },
};

export const PLAN_PRICING_USD: Record<string, PlanFeatures> = {
  EDITOR: {
    amount: "9.00",
    transcriptionBalance: 90,
    audioCredits: 50,
    maxExportRes: 1080,
    storageLimitGb: 20,
    maxVideoLengthMinutes: 5,
    alphaChannelEnabled: false,
    srtRenderEnabled: false,
    customFontEnabled: true,
    prioritySupport: false,
  },
  CREATOR: {
    amount: "15.00",
    transcriptionBalance: 200,
    audioCredits: 150,
    maxExportRes: 2160,
    storageLimitGb: 60,
    maxVideoLengthMinutes: 10,
    alphaChannelEnabled: true,
    srtRenderEnabled: true,
    customFontEnabled: true,
    prioritySupport: false,
  },
  BUSINESS: {
    amount: "75.00",
    transcriptionBalance: 500,
    audioCredits: 500,
    maxExportRes: 2160,
    storageLimitGb: 150,
    maxVideoLengthMinutes: 30,
    alphaChannelEnabled: true,
    srtRenderEnabled: true,
    customFontEnabled: true,
    prioritySupport: true,
  },
  TRIAL_1_INR: {
    amount: "0.29",
    transcriptionBalance: 1,
    audioCredits: 3,
    maxExportRes: 1080,
    storageLimitGb: 5,
    maxVideoLengthMinutes: 2,
    alphaChannelEnabled: false,
    srtRenderEnabled: false,
    customFontEnabled: false,
    prioritySupport: false,
  },
  TRIAL_9_INR: {
    amount: "0.99",
    transcriptionBalance: 9,
    audioCredits: 5,
    maxExportRes: 1080,
    storageLimitGb: 5,
    maxVideoLengthMinutes: 5,
    alphaChannelEnabled: false,
    srtRenderEnabled: false,
    customFontEnabled: false,
    prioritySupport: false,
  },
};

// ─── Razorpay Instance ────────────────────────────────────────────────────────

let razorpayInstance: Razorpay | null = null;

function getRazorpayInstance(): Razorpay {
  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });
  }
  return razorpayInstance;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function generateOrderId(userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `NXT${timestamp}${random}`;
}

export async function initiatePayment(params: InitiateTransactionParams) {
  const { userId, orderId, amount, planType, email, currency = "INR" } = params;

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return { success: false, orderId, error: "Razorpay credentials not configured" };
  }

  try {
    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: Math.round(parseFloat(amount) * 100),
      currency,
      receipt: orderId,
      notes: { userId, planType, email: email || "" },
    });

    return {
      success: true,
      orderId,
      razorpayOrderId: order.id,
      paymentPayload: {
        razorpayOrderId: order.id,
        keyId,
        amount,
        planType,
        currency,
      },
    };
  } catch (error: any) {
    console.error("[PaymentService] Error:", error);
    return {
      success: false,
      orderId,
      error: error.error?.description || error.message || "Failed to create order",
    };
  }
}

export async function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
): Promise<boolean> {
  const keySecret = process.env.RAZORPAY_KEY_SECRET || "";
  try {
    const expected = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");
    return expected === signature;
  } catch {
    return false;
  }
}

export async function checkPaymentStatus(razorpayOrderId: string): Promise<any> {
  try {
    const razorpay = getRazorpayInstance();
    return await razorpay.orders.fetch(razorpayOrderId);
  } catch (error) {
    console.error("[PaymentService] Error checking status:", error);
    return null;
  }
}
