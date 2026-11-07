import { Router } from "express";
import { McpController } from "../controllers/mcp.controller";
import { authenticate } from "../middleware/auth.middleware";
import { mcpAuth } from "../middleware/mcp-auth.middleware";

const router = Router();
const mcpController = new McpController();

// MCP API Key management (Requires user session auth)
router.post("/keys", authenticate, mcpController.generateApiKey.bind(mcpController));
router.get("/keys", authenticate, mcpController.listApiKeys.bind(mcpController));
router.delete("/keys/:id", authenticate, mcpController.revokeApiKey.bind(mcpController));
router.get("/usage", authenticate, mcpController.getUsageStats.bind(mcpController));

// MCP Server endpoints (Requires API Key auth from mcpAuth middleware)
router.get("/projects", mcpAuth, mcpController.listProjects.bind(mcpController));
router.get("/projects/:id", mcpAuth, mcpController.getProject.bind(mcpController));

export default router;
