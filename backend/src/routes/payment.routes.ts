import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
import {
  initiatePaymentHandler,
  handlePaymentCallback,
  checkPaymentStatusHandler,
} from '../controllers/payment.controller';

const router = Router();

// Initiate payment - requires authentication
router.post(
  '/initiate',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    await initiatePaymentHandler(req, res, next);
  }
);

// Payment callback/webhook - Razorpay sends POST here
router.post(
  '/callback',
  async (req: Request, res: Response, next: NextFunction) => {
    await handlePaymentCallback(req, res, next);
  }
);

// Check payment status
router.get(
  '/status/:orderId',
  async (req: Request, res: Response, next: NextFunction) => {
    await checkPaymentStatusHandler(req, res, next);
  }
);

export default router;