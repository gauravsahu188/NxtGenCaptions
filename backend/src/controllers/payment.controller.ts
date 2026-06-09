import { Request, Response, NextFunction } from 'express';
import {
  initiatePayment,
  verifyPaymentSignature,
  generateOrderId,
  PLAN_PRICING_INR,
  PLAN_PRICING_USD,
  checkPaymentStatus,
} from '../services/payment.service';
import { prisma } from '../lib/prisma';

interface InitiatePaymentRequest {
  planType: 'EDITOR' | 'CREATOR' | 'BUSINESS';
  currency?: 'INR' | 'USD';
}

interface PaymentCallbackBody {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  [key: string]: string | undefined;
}

export async function initiatePaymentHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized: User ID not found' });
      return;
    }

    const { planType, currency = 'INR' }: InitiatePaymentRequest = req.body;

    const pricingMap = currency === 'USD' ? PLAN_PRICING_USD : PLAN_PRICING_INR;

    if (!planType || !pricingMap[planType]) {
      res.status(400).json({
        error: 'Invalid plan type. Must be EDITOR, CREATOR, or BUSINESS',
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const orderId = generateOrderId(userId);
    const planDetails = pricingMap[planType];

    const result = await initiatePayment({
      userId,
      orderId,
      amount: planDetails.amount,
      planType,
      email: user.email || undefined,
      mobile: undefined,
      currency,
    });

    if (!result.success) {
      console.error('[PaymentController] Payment initiation failed:', result.error);
      res.status(500).json({
        error: 'Failed to initiate payment',
        details: result.error || 'Unknown error',
      });
      return;
    }

    console.log('[PaymentController] Payment initiated successfully:', {
      orderId,
      razorpayOrderId: result.razorpayOrderId,
    });

    res.json({
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
    console.error('[PaymentController] Error initiating payment:', error);
    next(error);
  }
}

export async function handlePaymentCallback(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const body: PaymentCallbackBody = req.body;
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    console.log('[PaymentCallback] Received callback:', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });

    // Verify signature
    const isValid = await verifyPaymentSignature(
      razorpay_order_id || '',
      razorpay_payment_id || '',
      razorpay_signature || ''
    );

    if (!isValid) {
      console.error('[PaymentCallback] Invalid signature');
      res.status(400).json({
        status: 'FAILURE',
        error: 'Invalid signature',
      });
      return;
    }

    // Get order details to find user and plan
    const orderDetails = await checkPaymentStatus(razorpay_order_id || '');

    if (!orderDetails) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const userId = orderDetails.notes?.userId;
    const planType = orderDetails.notes?.planType;

    if (!userId) {
      console.error('[PaymentCallback] User ID not found in order notes');
      res.status(400).json({ error: 'User ID not found' });
      return;
    }

    const currency = orderDetails.currency === 'USD' ? 'USD' : 'INR';
    const pricingMap = currency === 'USD' ? PLAN_PRICING_USD : PLAN_PRICING_INR;
    const planDetails = pricingMap[planType as keyof typeof pricingMap];

    if (!planDetails) {
      console.error(`[PaymentCallback] Invalid plan type: ${planType} for currency: ${currency}`);
      res.status(400).json({ error: 'Invalid plan type' });
      return;
    }

    // Check if payment is successful
    if (orderDetails.status === 'paid') {
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

      // Check if subscription exists
      const existingSubscription = await prisma.subscription.findUnique({
        where: { userId },
      });

      if (existingSubscription) {
        await prisma.subscription.update({
          where: { userId },
          data: {
            planType: planType as any,
            transcriptionLimitMins: transcriptionBalance,
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
      } else {
        await prisma.subscription.create({
          data: {
            userId,
            planType: planType as any,
            transcriptionLimitMins: transcriptionBalance,
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

      // Update user
      await prisma.user.update({
        where: { id: userId },
        data: {
          planType: planType as any,
          transcriptionBalance: { increment: transcriptionBalance },
          audioCredits: { increment: audioCredits },
        },
      });

      console.log(`[PaymentCallback] Successfully upgraded user ${userId} to ${planType}`);
      console.log(`[PaymentCallback] Features enabled:`, {
        transcriptionLimitMins: transcriptionBalance,
        storageLimitGb,
        maxVideoLengthMinutes,
        alphaChannelEnabled,
        srtRenderEnabled,
        customFontEnabled,
        prioritySupport,
      });

      res.json({
        status: 'SUCCESS',
        message: 'Payment successful and plan upgraded',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        features: {
          transcriptionLimitMins: transcriptionBalance,
          storageLimitGb,
          maxVideoLengthMinutes,
          alphaChannelEnabled,
          srtRenderEnabled,
          customFontEnabled,
          prioritySupport,
        },
      });
    } else {
      console.log(`[PaymentCallback] Payment not completed for order ${razorpay_order_id}`);
      res.json({
        status: 'PENDING',
        message: 'Payment not completed',
        orderId: razorpay_order_id,
      });
    }
  } catch (error) {
    console.error('[PaymentCallback] Error processing callback:', error);
    next(error);
  }
}

export async function checkPaymentStatusHandler(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      res.status(400).json({ error: 'Order ID is required' });
      return;
    }

    const status = await checkPaymentStatus(orderId as string);

    if (!status) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({
      orderId: status.id,
      status: status.status,
      amount: status.amount / 100,
    });
  } catch (error) {
    console.error('[PaymentController] Error checking payment status:', error);
    next(error);
  }
}