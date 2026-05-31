import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/errors";

const PLAN_LIMITS: Record<string, number> = {
  FREE: 5 * 1024 * 1024 * 1024,
  EDITOR: 20 * 1024 * 1024 * 1024,
  CREATOR: 60 * 1024 * 1024 * 1024,
  BUSINESS: 150 * 1024 * 1024 * 1024,
};

export const guardrailMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    console.log("[Guardrail] Received x-user-id:", userId);

    // No userId — allow through (e.g. unauthenticated dev requests)
    if (!userId) {
      return next();
    }

    let user: { planType: string; storageUsed: bigint; transcriptionBalance: number; audioCredits: number } | null = null;

    try {
      user = await prisma.user.findUnique({
        where: { id: userId },
        select: { planType: true, storageUsed: true, transcriptionBalance: true, audioCredits: true }
      });
    } catch (dbErr: any) {
      // DB unreachable — log but don't block the request
      console.warn("[Guardrail] DB lookup failed (non-fatal), skipping quota check:", dbErr.message);
      (req as any).userId = userId;
      return next();
    }

    if (!user) {
      // User not in DB yet (e.g. first login race) — allow through gracefully
      console.warn("[Guardrail] User not found in DB:", userId, "— allowing through");
      (req as any).userId = userId;
      return next();
    }

    const planLimit = PLAN_LIMITS[user.planType] || PLAN_LIMITS.FREE;
    const incomingSize = parseInt(req.headers["content-length"] || "0", 10);
    const totalProjected = Number(user.storageUsed) + incomingSize;

    if (totalProjected > planLimit) {
      throw new AppError(`Storage limit exceeded. Your ${user.planType} plan allows up to ${formatBytes(planLimit)}.`, 403);
    }

    // Attach full user to req for downstream use
    (req as any).user = user;
    (req as any).userId = userId;

    next();
  } catch (error) {
    next(error);
  }
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
