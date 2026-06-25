"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const render_controller_1 = require("../controllers/render.controller");
const router = (0, express_1.Router)();
// POST /api/render - Trigger Lambda render
router.post("/", render_controller_1.renderController.renderVideo.bind(render_controller_1.renderController));
// GET /api/render/status - Check render progress
router.get("/status", render_controller_1.renderController.getRenderStatus.bind(render_controller_1.renderController));
exports.default = router;
