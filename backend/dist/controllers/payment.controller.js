"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initiatePaymentHandler = initiatePaymentHandler;
exports.handlePaymentCallback = handlePaymentCallback;
exports.checkPaymentStatusHandler = checkPaymentStatusHandler;
const payment_service_1 = require("../services/payment.service");
const prisma_1 = require("../lib/prisma");
async function initiatePaymentHandler(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized: User ID not found' });
            return;
        }
        const { planType, currency = 'INR' } = req.body;
        const pricingMap = currency === 'USD' ? payment_service_1.PLAN_PRICING_USD : payment_service_1.PLAN_PRICING_INR;
        if (!planType || !pricingMap[planType]) {
            res.status(400).json({
                error: 'Invalid plan type',
            });
            return;
        }
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            include: { subscription: true }
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        if (planType === 'TRIAL_1_INR' && user.subscription?.hasUsed1RupeeTrial) {
            res.status(403).json({ error: 'You have already used the 1 Rupee Trial' });
            return;
        }
        if (planType === 'TRIAL_9_INR' && user.subscription?.hasUsed9RupeeTrial) {
            res.status(403).json({ error: 'You have already used the 9 Rupee Trial' });
            return;
        }
        const orderId = (0, payment_service_1.generateOrderId)(userId);
        const planDetails = pricingMap[planType];
        const result = await (0, payment_service_1.initiatePayment)({
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
    }
    catch (error) {
        console.error('[PaymentController] Error initiating payment:', error);
        next(error);
    }
}
async function handlePaymentCallback(req, res, next) {
    try {
        const body = req.body;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;
        console.log('[PaymentCallback] Received callback:', {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
        });
        // Verify signature
        const isValid = await (0, payment_service_1.verifyPaymentSignature)(razorpay_order_id || '', razorpay_payment_id || '', razorpay_signature || '');
        if (!isValid) {
            console.error('[PaymentCallback] Invalid signature');
            res.status(400).json({
                status: 'FAILURE',
                error: 'Invalid signature',
            });
            return;
        }
        // Get order details to find user and plan
        const orderDetails = await (0, payment_service_1.checkPaymentStatus)(razorpay_order_id || '');
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
        const pricingMap = currency === 'USD' ? payment_service_1.PLAN_PRICING_USD : payment_service_1.PLAN_PRICING_INR;
        const planDetails = pricingMap[planType];
        if (!planDetails) {
            console.error(`[PaymentCallback] Invalid plan type: ${planType} for currency: ${currency}`);
            res.status(400).json({ error: 'Invalid plan type' });
            return;
        }
        // Check if payment is successful
        if (orderDetails.status === 'paid') {
            const { maxExportRes, audioCredits, transcriptionBalance, storageLimitGb, maxVideoLengthMinutes, alphaChannelEnabled, srtRenderEnabled, customFontEnabled, prioritySupport, } = planDetails;
            let billingCycleEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            let extraUpdates = {};
            if (planType === 'TRIAL_1_INR') {
                billingCycleEnd = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
                extraUpdates.hasUsed1RupeeTrial = true;
            }
            else if (planType === 'TRIAL_9_INR') {
                billingCycleEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                extraUpdates.hasUsed9RupeeTrial = true;
            }
            // Check if subscription exists
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
                        billingCycleEnd,
                        updatedAt: new Date(),
                        ...extraUpdates
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
                        billingCycleEnd,
                        ...extraUpdates
                    },
                });
            }
            // Update user
            await prisma_1.prisma.user.update({
                where: { id: userId },
                data: {
                    planType: planType,
                    transcriptionBalance: transcriptionBalance,
                    audioCredits: audioCredits,
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
        }
        else {
            console.log(`[PaymentCallback] Payment not completed for order ${razorpay_order_id}`);
            res.json({
                status: 'PENDING',
                message: 'Payment not completed',
                orderId: razorpay_order_id,
            });
        }
    }
    catch (error) {
        console.error('[PaymentCallback] Error processing callback:', error);
        next(error);
    }
}
async function checkPaymentStatusHandler(req, res, next) {
    try {
        const { orderId } = req.params;
        if (!orderId) {
            res.status(400).json({ error: 'Order ID is required' });
            return;
        }
        const status = await (0, payment_service_1.checkPaymentStatus)(orderId);
        if (!status) {
            res.status(404).json({ error: 'Order not found' });
            return;
        }
        res.json({
            orderId: status.id,
            status: status.status,
            amount: status.amount / 100,
        });
    }
    catch (error) {
        console.error('[PaymentController] Error checking payment status:', error);
        next(error);
    }
}
