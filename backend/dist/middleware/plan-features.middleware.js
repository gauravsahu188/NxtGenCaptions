"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadSubscription = loadSubscription;
exports.requireAlphaChannel = requireAlphaChannel;
exports.requireSrtRender = requireSrtRender;
exports.requireCustomFont = requireCustomFont;
exports.checkVideoLength = checkVideoLength;
exports.checkExportRes = checkExportRes;
exports.checkAudioCredits = checkAudioCredits;
exports.checkTranscriptionLimit = checkTranscriptionLimit;
const prisma_1 = require("../lib/prisma");
// Middleware to load user subscription and plan features
async function loadSubscription(req, res, next) {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }
        const subscription = await prisma_1.prisma.subscription.findUnique({
            where: { userId },
        });
        const userRecord = await prisma_1.prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });
        if (userRecord?.email === "nxtgencaptions@gmail.com") {
            req.subscription = {
                planType: "BUSINESS",
                maxVideoLengthMinutes: 999999,
                alphaChannelEnabled: true,
                srtRenderEnabled: true,
                customFontEnabled: true,
                prioritySupport: true,
                transcriptionLimitMins: 999999,
                audioCredits: 999999,
                maxExportRes: 2160,
                storageLimitGb: 999999,
            };
        }
        else if (subscription) {
            req.subscription = {
                planType: subscription.planType,
                maxVideoLengthMinutes: subscription.maxVideoLengthMinutes,
                alphaChannelEnabled: subscription.alphaChannelEnabled,
                srtRenderEnabled: subscription.srtRenderEnabled,
                customFontEnabled: subscription.customFontEnabled,
                prioritySupport: subscription.prioritySupport,
                transcriptionLimitMins: subscription.transcriptionLimitMins,
                audioCredits: subscription.audioCredits,
                maxExportRes: subscription.maxExportRes,
                storageLimitGb: subscription.storageLimitGb,
            };
        }
        next();
    }
    catch (error) {
        console.error('[LoadSubscription] Error:', error);
        next(error);
    }
}
// Check if user can use Alpha Channel render
function requireAlphaChannel(req, res, next) {
    if (!req.subscription?.alphaChannelEnabled) {
        res.status(403).json({
            error: 'Alpha Channel render is only available on Creator and Business plans. Please upgrade to access this feature.'
        });
        return;
    }
    next();
}
// Check if user can use SRT render
function requireSrtRender(req, res, next) {
    if (!req.subscription?.srtRenderEnabled) {
        res.status(403).json({
            error: 'SRT render is only available on Creator and Business plans. Please upgrade to access this feature.'
        });
        return;
    }
    next();
}
// Check if user can use custom fonts
function requireCustomFont(req, res, next) {
    if (!req.subscription?.customFontEnabled) {
        res.status(403).json({
            error: 'Custom Font Upload is only available on Editor, Creator, and Business plans. Please upgrade to access this feature.'
        });
        return;
    }
    next();
}
// Check video length limit
function checkVideoLength(maxMinutes) {
    return (req, res, next) => {
        const videoDuration = parseFloat(req.body.duration || req.query.duration || '0');
        if (!req.subscription) {
            // Free plan - default 2 minutes
            if (videoDuration > 120) {
                res.status(403).json({
                    error: 'Free plan allows maximum 2 minutes video. Please upgrade to process longer videos.'
                });
                return;
            }
            next();
            return;
        }
        const limitSeconds = req.subscription.maxVideoLengthMinutes * 60;
        if (videoDuration > limitSeconds) {
            res.status(403).json({
                error: `Your ${req.subscription.planType} plan allows maximum ${req.subscription.maxVideoLengthMinutes} minutes video. Your video is ${Math.round(videoDuration / 60)} minutes. Please upgrade to process longer videos.`
            });
            return;
        }
        next();
    };
}
// Check export resolution limit
function checkExportRes(req, res, next) {
    const requestedRes = parseInt(req.body.requestedRes || req.query.resolution || '720');
    if (!req.subscription) {
        // Free plan - 720p max
        if (requestedRes > 720) {
            res.status(403).json({
                error: 'Free plan allows maximum 720p export. Please upgrade to access higher resolutions.'
            });
            return;
        }
        next();
        return;
    }
    if (requestedRes > req.subscription.maxExportRes) {
        res.status(403).json({
            error: `Your ${req.subscription.planType} plan allows maximum ${req.subscription.maxExportRes}p export. Please upgrade to access ${requestedRes}p.`
        });
        return;
    }
    next();
}
// Check audio credits
function checkAudioCredits(req, res, next) {
    if (!req.subscription || req.subscription.audioCredits < 1) {
        res.status(403).json({
            error: 'No audio enhancement credits left. Please upgrade to get more credits.'
        });
        return;
    }
    next();
}
// Check transcription minutes
function checkTranscriptionLimit(req, res, next) {
    const durationMinutes = parseFloat(req.body.duration || '0') / 60;
    if (!req.subscription) {
        // Free plan - 5 minutes max
        if (durationMinutes > 5) {
            res.status(403).json({
                error: 'Free plan allows maximum 5 minutes transcription. Please upgrade.'
            });
            return;
        }
        next();
        return;
    }
    if (req.subscription.transcriptionLimitMins < durationMinutes) {
        res.status(403).json({
            error: `Your plan has ${req.subscription.transcriptionLimitMins} minutes transcription limit. Your video is ${Math.ceil(durationMinutes)} minutes. Please upgrade.`
        });
        return;
    }
    next();
}
