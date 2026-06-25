"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.guardrailMiddleware = void 0;
const prisma_1 = require("../lib/prisma");
const errors_1 = require("../utils/errors");
const PLAN_LIMITS = {
    FREE: 5 * 1024 * 1024 * 1024,
    EDITOR: 20 * 1024 * 1024 * 1024,
    CREATOR: 60 * 1024 * 1024 * 1024,
    BUSINESS: 150 * 1024 * 1024 * 1024,
};
const guardrailMiddleware = async (req, res, next) => {
    try {
        const userId = req.headers["x-user-id"];
        console.log("[Guardrail] Received x-user-id:", userId);
        // No userId — allow through (e.g. unauthenticated dev requests)
        if (!userId) {
            return next();
        }
        let user = null;
        try {
            user = await prisma_1.prisma.user.findUnique({
                where: { id: userId },
                select: { planType: true, storageUsed: true, transcriptionBalance: true, audioCredits: true }
            });
        }
        catch (dbErr) {
            // DB unreachable — log but don't block the request
            console.warn("[Guardrail] DB lookup failed (non-fatal), skipping quota check:", dbErr.message);
            req.userId = userId;
            return next();
        }
        if (!user) {
            // User not in DB yet (e.g. first login race) — allow through gracefully
            console.warn("[Guardrail] User not found in DB:", userId, "— allowing through");
            req.userId = userId;
            return next();
        }
        const planLimit = PLAN_LIMITS[user.planType] || PLAN_LIMITS.FREE;
        const incomingSize = parseInt(req.headers["content-length"] || "0", 10);
        const totalProjected = Number(user.storageUsed) + incomingSize;
        if (totalProjected > planLimit) {
            throw new errors_1.AppError(`Storage limit exceeded. Your ${user.planType} plan allows up to ${formatBytes(planLimit)}.`, 403);
        }
        // Attach full user to req for downstream use
        req.user = user;
        req.userId = userId;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.guardrailMiddleware = guardrailMiddleware;
function formatBytes(bytes) {
    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
