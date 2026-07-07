"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_PRICING = exports.PLAN_PRICING_USD = exports.PLAN_PRICING_INR = void 0;
exports.initiatePayment = initiatePayment;
exports.verifyPaymentSignature = verifyPaymentSignature;
exports.generateOrderId = generateOrderId;
exports.checkPaymentStatus = checkPaymentStatus;
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
function getPaymentConfig() {
    const path = require('path');
    const fs = require('fs');
    const envPath = path.join(__dirname, '../../.env');
    let envVars = {};
    if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        content.split('\n').forEach((line) => {
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
let razorpayInstance = null;
function getRazorpayInstance() {
    if (!razorpayInstance) {
        const config = getPaymentConfig();
        razorpayInstance = new razorpay_1.default({
            key_id: config.keyId,
            key_secret: config.keySecret,
        });
    }
    return razorpayInstance;
}
async function initiatePayment(params) {
    const config = getPaymentConfig();
    const { userId, amount, planType, email, currency } = params;
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
            amount: Math.round(parseFloat(amount) * 100), // Convert to paise / cents
            currency: currency || 'INR',
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
                currency: currency || 'INR',
            },
        };
    }
    catch (error) {
        console.error('[PaymentService] Error:', error);
        return {
            success: false,
            orderId: params.orderId,
            error: error.error?.description || error.message || 'Failed to create order',
        };
    }
}
async function verifyPaymentSignature(razorpayOrderId, razorpayPaymentId, signature) {
    const config = getPaymentConfig();
    try {
        const expectedSignature = crypto_1.default
            .createHmac('sha256', config.keySecret)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');
        return expectedSignature === signature;
    }
    catch (error) {
        console.error('[PaymentService] Signature verification error:', error);
        return false;
    }
}
function generateOrderId(userId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `NXT${timestamp}${random}`;
}
exports.PLAN_PRICING_INR = {
    EDITOR: {
        amount: '199.00',
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
        amount: '349.00',
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
        amount: '749.00',
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
        amount: '1.00',
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
        amount: '9.00',
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
exports.PLAN_PRICING_USD = {
    EDITOR: {
        amount: '9.00',
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
        amount: '15.00',
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
        amount: '75.00',
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
        amount: '0.29',
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
        amount: '0.99',
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
exports.PLAN_PRICING = exports.PLAN_PRICING_INR;
async function checkPaymentStatus(razorpayOrderId) {
    try {
        const razorpay = getRazorpayInstance();
        const order = await razorpay.orders.fetch(razorpayOrderId);
        return order;
    }
    catch (error) {
        console.error('[PaymentService] Error checking payment status:', error);
        return null;
    }
}
