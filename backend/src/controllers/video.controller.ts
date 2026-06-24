import { Request, Response, NextFunction } from "express";
import { FFmpegService } from "../services/ffmpeg.service";
import { DeepgramTranscriptionService } from "../services/deepgram.service";
import { AudioEnhancementService } from "../services/audio.service";
import { RemotionRenderService, CaptionStyleProps } from "../services/remotion.service";
import { S3Service } from "../services/s3.service";
import { SubjectIsolationService } from "../services/subject-isolation.service";
import { sendUploadNotification, isSqsConfigured } from "../lib/sqs";
import { ValidationError, NotFoundError, AppError } from "../utils/errors";
import { processHinglishCaptions, containsDevanagari } from "../utils/transliterate";
import { TranslationService } from "../services/translation.service";
import { SarvamTranscriptionService } from "../services/sarvam.service";
import path from "path";
import { prisma } from "../lib/prisma";
import fs from "fs";

const ffmpegService = new FFmpegService();
const transcriptionService = new DeepgramTranscriptionService();
const audioService = new AudioEnhancementService();
const remotionService = new RemotionRenderService();
const s3Service = new S3Service();
const subjectIsolationService = new SubjectIsolationService();
const translationService = new TranslationService();
const sarvamService = new SarvamTranscriptionService();

// ─── Default style fallback ───────────────────────────────────────────────────
const DEFAULT_STYLE: CaptionStyleProps = {
  template: "modern",
  layout: "bottom",
  fontSize: 52,
  primaryColor: "#38bdf8",
  secondaryColor: "#ffffff",
  backgroundColor: "rgba(0,0,0,0.55)",
  fontFamily: "'Inter', sans-serif",
  borderRadius: 12,
};

const LANGUAGE_NAMES: Record<string, string> = {
  auto: "Auto Detect International",
  en: "English",
  hinglish: "Hinglish",
  hi: "Hindi",
  ne: "Nepali",
  ur: "Urdu",
  ta: "Tamil",
  ml: "Malayalam",
  gu: "Gujarati",
  bn: "Bengali",
  pa: "Punjabi",
  te: "Telugu",
  sd: "Sindhi",
  mr: "Marathi",
  kn: "Kannada",
  ps: "Pushto",
  ms: "Malay"
};

export class VideoController {
  // ─── POST /api/video/upload ─────────────────────────────────────────────────
  async uploadAndTranscribe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.file) throw new ValidationError("No video file uploaded");

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const sendEvent = (type: string, data: any) => {
        res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`);
      };

      const videoPath = req.file.path;
      const audioFilename = `${path.basename(videoPath, path.extname(videoPath))}.mp3`;

      sendEvent("init", {
        videoId: req.file.filename,
        videoUrl: `http://localhost:3001/uploads/${req.file.filename}`,
      });

      const user = (req as any).user;
      const userId = (req as any).userId || user?.id || req.headers["x-user-id"];

      let dbUser = null;
      if (userId && typeof userId === "string") {
        dbUser = await prisma.user.findUnique({
          where: { id: userId },
        });
      }
      const isAdmin = dbUser?.email === "nxtgencaptions@gmail.com";

      // Always get duration (needed for project record & quota checks)
      let durationSeconds = 0;
      try {
        durationSeconds = await ffmpegService.getVideoDuration(videoPath);
      } catch (e) {
        console.warn("[VideoController] Could not get video duration:", e);
      }

      if (user && !isAdmin) {
        // Charge based on actual duration - fair usage
        // Charge based on actual duration exactly in minutes (as a float)
        const chargeAmount = durationSeconds / 60;

        console.log(`[VideoController] Video duration: ${durationSeconds}s (${chargeAmount.toFixed(2)} min), charging: ${chargeAmount} credit(s)`);

        // Free plan: max 5 minutes
        const freePlanMinutes = 5;
        if (user.planType === "FREE" && chargeAmount > freePlanMinutes) {
          throw new AppError("FREE_LIMIT_EXCEEDED: Free plan allows max 5 minutes. Your video is " + chargeAmount.toFixed(1) + " minutes. Upgrade to continue.", 403);
        }

        if (typeof user.transcriptionBalance === "number" && user.transcriptionBalance < chargeAmount) {
          throw new AppError("NO_CREDITS: You have " + user.transcriptionBalance + " minutes left but need " + chargeAmount + ". Upgrade to get more minutes.", 403);
        }

        try {
          await prisma.user.update({
            where: { id: userId },
            data: { transcriptionBalance: { decrement: chargeAmount } }
          });
          console.log(`[VideoController] Deducted ${chargeAmount} transcription credit(s)`);
        } catch (e) {
          console.warn("[VideoController] Could not deduct transcription balance:", e);
        }
      }

      sendEvent("status", { message: "Extracting audio..." });
      const rawAudioPath = await ffmpegService.extractAudio(videoPath, audioFilename);

      // Check if audio enhancement is requested
      const audioEnhance = req.body.audioEnhance === "true" || req.body.audioEnhance === true;
      let cleanedAudioPath = rawAudioPath;

      if (audioEnhance) {
        sendEvent("status", { message: "Enhancing audio quality..." });

        if (user && !isAdmin) {
          if (typeof user.audioCredits === "number" && user.audioCredits < 1) {
            throw new AppError("Not enough audio enhancement credits.", 403);
          }
          try {
            await prisma.user.update({
              where: { id: userId },
              data: { audioCredits: { decrement: 1 } }
            });
          } catch (e) {
            console.warn("[VideoController] Could not deduct audio credits:", e);
          }
        }

        cleanedAudioPath = await audioService.cleanAudio(rawAudioPath);
      } else {
        sendEvent("status", { message: "Using raw audio for transcription..." });
      }

      const language = (req.body.language || req.query.language || "auto") as string;
      const script = (req.body.script || req.query.script || "native") as string;
      console.log(`[VideoController] Transcribing with language: ${language}, script: ${script}`);
      const languageName = LANGUAGE_NAMES[language] || "English";
      sendEvent("status", { message: `Generating captions (${languageName})...` });

      let captions: any[] = [];
      
      if (language === "en" || language === "hi" || language === "auto" || language === "hinglish") {
        // Use Deepgram for English, Hindi, Auto, or Hinglish explicitly
        captions = await transcriptionService.transcribeAudio(
          cleanedAudioPath,
          (segment) => { },
          { language: language === "hinglish" ? "hi" : language }
        );

        // Post-process captions based on requested script or legacy language
        if (script === "romanised" || language === "hinglish") {
          console.log("[VideoController] Transliterating captions to Roman script...");
          captions = processHinglishCaptions(captions);
        } else if (script === "english") {
          console.log("[VideoController] Translating captions to English...");
          captions = await translationService.translateCaptions(captions);
        }
      } else {
        // Use Sarvam AI for regional languages
        captions = await sarvamService.transcribeAudio(
          cleanedAudioPath,
          (segment) => { },
          { language, script }
        );
      }

      // Send processed segments
      for (const segment of captions) {
        sendEvent("segment", { segment });
      }

      const srtFilename = `${path.basename(videoPath, path.extname(videoPath))}.srt`;
      ffmpegService.generateSrt(captions, srtFilename);

      try {
        if (fs.existsSync(rawAudioPath)) fs.unlinkSync(rawAudioPath);
        if (fs.existsSync(cleanedAudioPath) && cleanedAudioPath !== rawAudioPath) {
          fs.unlinkSync(cleanedAudioPath);
        }
      } catch (e) { }

      let s3SourceKey = "";
      let projectId = "";

      // S3 upload and project creation — wrapped so failure doesn't block response
      if (user && userId) {
        try {
          sendEvent("status", { message: "Uploading to secure storage..." });
          s3SourceKey = await s3Service.upload(videoPath, `${userId}/source`);

          const stat = fs.statSync(videoPath);
          await prisma.user.update({
            where: { id: userId },
            data: { storageUsed: { increment: stat.size } }
          });

          const project = await prisma.project.create({
            data: {
              userId,
              title: req.file!.originalname || "Untitled Project",
              s3Url: s3SourceKey,
              duration: Math.ceil(durationSeconds),
              metadata: {
                originalFilename: req.file!.originalname,
                transcription: captions as any,
                language
              } as any
            }
          });
          projectId = project.id;

          if (isSqsConfigured()) {
            try {
              const planType = user.planType ?? "FREE";
              const sqsMessageId = await sendUploadNotification(s3SourceKey, userId, planType);
              console.log(`[VideoController] SQS notification sent: ${sqsMessageId}`);
            } catch (sqsError) {
              console.warn("[VideoController] SQS notification failed (non-fatal):", sqsError);
            }
          }
        } catch (s3Error) {
          console.warn("[VideoController] S3/project creation failed (non-fatal):", s3Error);
        }
      }

      sendEvent("complete", { captions, s3Key: s3SourceKey, projectId });
      res.end();
    } catch (error: any) {
      res.write(`data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`);
      res.end();
    }
  }

  // ─── POST /api/video/render ─────────────────────────────────────────────────
  /**
   * Request body:
   * {
   *   videoId: string            – filename in /uploads/
   *   captions: CaptionSegment[]
   *   style?: CaptionStyleProps  – optional, defaults to "modern"
   *   durationInSeconds?: number
   *   fps?: number               – default 30
   *   width?: number             – default 1280
   *   height?: number            – default 720
   *   removeWatermark?: boolean  – whether to remove watermark
   * }
   *
   * Response:
   * { status: "success", data: { downloadUrl: string, s3Key: string } }
   */
  async renderVideo(req: Request, res: Response, next: NextFunction) {
    let renderedPath: string | null = null;

    try {
      const {
        videoId,
        captions,
        style,
        durationInSeconds,
        fps = 30,
        width = 1280,
        height = 720,
        removeWatermark = false,
      } = req.body;

      if (!videoId || !captions || !Array.isArray(captions)) {
        throw new ValidationError("videoId and an array of captions are required");
      }

      let videoUrl = "";
      const isS3Key = videoId.includes("/");

      if (isS3Key) {
        // videoId is actually the S3 key
        videoUrl = await s3Service.getSignedDownloadUrl(videoId, 3600);
      } else {
        const videoPath = path.join(process.cwd(), "uploads", videoId);
        if (!fs.existsSync(videoPath)) {
          throw new NotFoundError("Original video not found on server");
        }
        videoUrl = `http://localhost:3001/uploads/${videoId}`;
      }

      // Derive duration from last caption end if not provided
      let duration: number = durationInSeconds;
      if (!duration) {
        const last = captions[captions.length - 1];
        duration = last ? last.end + 1 : 30;
      }

      const mergedStyle = { ...DEFAULT_STYLE, ...(style ?? {}) } as CaptionStyleProps;

      // Determine if watermark should be shown (free plan unless removeWatermark is true)
      const userId = req.headers["x-user-id"] as string;
      let showWatermark = true;

      if (userId) {
        try {
          const dbUserObj = await prisma.user.findUnique({
            where: { id: userId },
            include: { subscription: true },
          });

          if (dbUserObj?.email === "nxtgencaptions@gmail.com") {
            showWatermark = !removeWatermark;
          } else {
            const subscription = dbUserObj?.subscription;
            // If user has a paid plan (EDITOR, CREATOR, BUSINESS), they can remove watermark
            if (subscription && subscription.planType !== "FREE") {
              showWatermark = !removeWatermark;
            } else {
              // Free plan - always show watermark unless explicitly requested (and they'll be redirected)
              showWatermark = true;
            }
          }
        } catch (e) {
          console.warn("[VideoController] Could not check subscription:", e);
          showWatermark = true;
        }
      } else {
        showWatermark = true;
      }

      console.log(`[VideoController] Render request received for videoId: ${videoId}`);
      console.log(`[VideoController] Resolution: ${width}x${height}, FPS: ${fps}, Duration: ${durationInSeconds}s, Watermark: ${showWatermark}`);

      // 1. Render with Remotion
      console.log(`[VideoController] Calling remotionService.render...`);
      renderedPath = await remotionService.render({
        src: videoUrl,
        durationInSeconds: duration,
        captions,
        style: mergedStyle,
        fps,
        width,
        height,
        showWatermark,
      });
      console.log(`[VideoController] Remotion render finished. Path: ${renderedPath}`);

      // 2. Try Uploading to S3, fallback to local if credentials missing
      let downloadUrl = "";
      let s3Key = "";

      const userIdForUpload = req.headers["x-user-id"] as string;
      const userPath = userIdForUpload ? `${userIdForUpload}/rendered` : "anonymous/rendered";

      try {
        console.log("[VideoController] Uploading rendered video to S3...");
        s3Key = await s3Service.upload(renderedPath, userPath);
        downloadUrl = await s3Service.getSignedDownloadUrl(s3Key);

        // Update storage used if user exists
        if (userIdForUpload) {
          const stat = fs.statSync(renderedPath);
          await prisma.user.update({
            where: { id: userIdForUpload },
            data: { storageUsed: { increment: stat.size } }
          });
        }

        // Clean up local render file if uploaded to S3
        remotionService.cleanup(renderedPath);
      } catch (s3Error) {
        console.warn("[VideoController] S3 upload failed, falling back to local serving:", s3Error);
        const uploadDir = path.join(process.cwd(), "uploads");
        const filename = path.basename(renderedPath);
        const localDest = path.join(uploadDir, filename);

        // Move file from temp to uploads
        fs.renameSync(renderedPath, localDest);
        downloadUrl = `http://localhost:3001/uploads/${filename}`;
        s3Key = `local/${filename}`;
      }
      renderedPath = null;

      return res.status(200).json({
        status: "success",
        data: { downloadUrl, s3Key },
      });
    } catch (error: any) {
      if (renderedPath) remotionService.cleanup(renderedPath);
      next(error);
    }
  }

  // ─── GET /api/video/project/:id ────────────────────────────────────────────
  async getProject(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.headers["x-user-id"];
      const userIdStr = Array.isArray(userId) ? userId[0] : userId;

      const project = await prisma.project.findUnique({
        where: { id: id as string },
        select: {
          id: true,
          userId: true,
          title: true,
          s3Url: true,
          duration: true,
          metadata: true,
          createdAt: true,
        },
      });

      if (!project) {
        return res.status(404).json({ status: "error", message: "Project not found" });
      }

      // Only the owner can load it
      if (userIdStr && project.userId !== userIdStr) {
        return res.status(403).json({ status: "error", message: "Forbidden" });
      }

      // Generate a presigned URL for the source video
      let videoUrl: string | null = null;
      if (project.s3Url) {
        try {
          videoUrl = await s3Service.getSignedDownloadUrl(project.s3Url, 7200);
        } catch (e) {
          console.warn("[VideoController] Could not generate presigned URL:", e);
        }
      }

      // Extract transcription from metadata
      const meta = project.metadata as any;
      const captions = meta?.transcription ?? [];

      return res.status(200).json({
        status: "success",
        data: {
          id: project.id,
          title: project.title,
          s3Key: project.s3Url,
          videoUrl,
          duration: project.duration,
          captions,
          language: meta?.language ?? "auto",
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  // ─── POST /api/video/enhance-audio ──────────────────────────────────────────
  async enhanceAudio(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.headers["x-user-id"] as string;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw new AppError("User not found", 404);
      }

      const isAdmin = user.email === "nxtgencaptions@gmail.com";

      if (!isAdmin && user.audioCredits < 1) {
        throw new AppError("NO_CREDITS: You do not have enough audio credits to enhance this video. Please upgrade your plan.", 403);
      }

      // Deduct 1 audio credit
      let updatedUser = user;
      if (!isAdmin) {
        updatedUser = await prisma.user.update({
          where: { id: userId },
          data: { audioCredits: { decrement: 1 } },
        });
      }

      // Pretend to enhance audio
      await new Promise((resolve) => setTimeout(resolve, 2000));

      return res.status(200).json({
        status: "success",
        data: {
          message: "Audio enhanced successfully!",
          audioCredits: updatedUser.audioCredits,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }

  // ─── POST /api/video/isolate-subject ─────────────────────────────────────────
  async isolateSubject(req: Request, res: Response, next: NextFunction) {
    try {
      const { videoUrl, s3Key } = req.body;
      if (!videoUrl) {
        throw new ValidationError("videoUrl is required");
      }

      console.log(`[VideoController] Isolate subject request received for videoUrl: ${videoUrl}`);
      const userId = (req.headers["x-user-id"] || "anonymous") as string;

      // Call SubjectIsolationService
      const cutoutVideoUrl = await subjectIsolationService.isolateSubject(s3Key || videoUrl, userId);

      return res.status(200).json({
        status: "success",
        data: {
          cutoutVideoUrl,
        },
      });
    } catch (error: any) {
      next(error);
    }
  }
}
