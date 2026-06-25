"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const payment_controller_1 = require("../controllers/payment.controller");
const router = (0, express_1.Router)();
// Initiate payment - requires authentication
router.post('/initiate', auth_middleware_1.authenticate, async (req, res, next) => {
    await (0, payment_controller_1.initiatePaymentHandler)(req, res, next);
});
// Payment callback/webhook - Razorpay sends POST here
router.post('/callback', async (req, res, next) => {
    await (0, payment_controller_1.handlePaymentCallback)(req, res, next);
});
// Check payment status
router.get('/status/:orderId', async (req, res, next) => {
    await (0, payment_controller_1.checkPaymentStatusHandler)(req, res, next);
});
exports.default = router;
