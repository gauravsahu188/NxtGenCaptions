import { Router } from "express";
import { VideoController } from "../controllers/video.controller";
import { uploadMiddleware } from "../middleware/upload.middleware";
import { guardrailMiddleware } from "../middleware/guardrail.middleware";

const router = Router();
const videoController = new VideoController();

router.post("/upload", guardrailMiddleware, uploadMiddleware.single("video"), videoController.uploadAndTranscribe.bind(videoController));
router.post("/render", videoController.renderVideo.bind(videoController));
router.get("/project/:id", videoController.getProject.bind(videoController));
router.post("/enhance-audio", videoController.enhanceAudio.bind(videoController));
router.post("/isolate-subject", videoController.isolateSubject.bind(videoController));

export default router;
