import Razorpay from 'razorpay';
import crypto from 'crypto';

interface InitiateTransactionParams {
  userId: string;
  orderId: string;
  amount: string;
  planType: string;
  email?: string;
  mobile?: string;
}

interface InitiateTransactionResult {
  success: boolean;
  orderId: string;
  razorpayOrderId?: string;
  paymentPayload?: Record<string, string>;
  error?: string;
}

interface PaymentConfig {
  keyId: string;
  keySecret: string;
}

function getPaymentConfig(): PaymentConfig {
  const path = require('path');
  const fs = require('fs');
  const envPath = path.join(__dirname, '../../.env');
  let envVars: Record<string, string> = {};

  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    });
  }

  return {
    keyId: envVars.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '',
    keySecret: envVars.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || '',
  };
}

let razorpayInstance: Razorpay | null = null;

function getRazorpayInstance(): Razorpay {
  if (!razorpayInstance) {
    const config = getPaymentConfig();
    razorpayInstance = new Razorpay({
      key_id: config.keyId,
      key_secret: config.keySecret,
    });
  }
  return razorpayInstance;
}

export async function initiatePayment(
  params: InitiateTransactionParams
): Promise<InitiateTransactionResult> {
  const config = getPaymentConfig();
  const { userId, amount, planType, email } = params;

  console.log('[PaymentService] === INITIATING RAZORPAY ===');
  console.log('[PaymentService] Config:', {
    hasKeyId: !!config.keyId,
    hasKeySecret: !!config.keySecret,
  });

  if (!config.keyId || !config.keySecret) {
    return {
      success: false,
      orderId: params.orderId,
      error: 'Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env',
    };
  }

  try {
    const razorpay = getRazorpayInstance();

    // Create order in Razorpay
    const order = await razorpay.orders.create({
      amount: Math.round(parseFloat(amount) * 100), // Convert to paise
      currency: 'INR',
      receipt: params.orderId,
      notes: {
        userId,
        planType,
        email: email || '',
      },
    });

    console.log('[PaymentService] Razorpay order created:', order.id);

    return {
      success: true,
      orderId: params.orderId,
      razorpayOrderId: order.id,
      paymentPayload: {
        razorpayOrderId: order.id,
        keyId: config.keyId,
        amount: amount,
        planType,
      },
    };

  } catch (error: any) {
    console.error('[PaymentService] Error:', error);
    return {
      success: false,
      orderId: params.orderId,
      error: error.error?.description || error.message || 'Failed to create order',
    };
  }
}

export async function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string
): Promise<boolean> {
  const config = getPaymentConfig();

  try {
    const expectedSignature = crypto
      .createHmac('sha256', config.keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex');

    return expectedSignature === signature;
  } catch (error) {
    console.error('[PaymentService] Signature verification error:', error);
    return false;
  }
}

export function generateOrderId(userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `NXT${timestamp}${random}`;
}

export const PLAN_PRICING: Record<string, PlanFeatures> = {
  EDITOR: {
    amount: '599.00',
    transcriptionBalance: 120, // 2 hours
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
    amount: '999.00',
    transcriptionBalance: 300, // 5 hours
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
    amount: '4999.00',
    transcriptionBalance: 1800, // 30 hours
    audioCredits: 500,
    maxExportRes: 2160,
    storageLimitGb: 150,
    maxVideoLengthMinutes: 30,
    alphaChannelEnabled: true,
    srtRenderEnabled: true,
    customFontEnabled: true,
    prioritySupport: true,
  },
};

interface PlanFeatures {
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

export async function checkPaymentStatus(razorpayOrderId: string): Promise<any> {
  try {
    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.fetch(razorpayOrderId);
    return order;
  } catch (error) {
    console.error('[PaymentService] Error checking payment status:', error);
    return null;
  }
}