import { Router } from "express";
import { renderController } from "../controllers/render.controller";

const router = Router();

// POST /api/render - Trigger Lambda render
router.post("/", renderController.renderVideo.bind(renderController));

// GET /api/render/status - Check render progress
router.get("/status", renderController.getRenderStatus.bind(renderController));

export default router;