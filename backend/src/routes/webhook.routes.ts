import { Router } from "express";
import { razorpayWebhookHandler } from "../controllers/webhook.controller";

const router = Router();

// POST /api/webhooks/razorpay
router.post("/razorpay", razorpayWebhookHandler);

export default router;
