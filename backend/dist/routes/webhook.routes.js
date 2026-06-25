"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const webhook_controller_1 = require("../controllers/webhook.controller");
const router = (0, express_1.Router)();
// POST /api/webhooks/razorpay
router.post("/razorpay", webhook_controller_1.razorpayWebhookHandler);
exports.default = router;
