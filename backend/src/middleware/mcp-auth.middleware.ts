import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";

// Middleware to authenticate internal requests from the MCP Server using API Key
export async function mcpAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized: No API key provided" });
      return;
    }

    const key = authHeader.substring(7);

    // Skip validation if it's the internal dev key (optional bypass for testing)
    // if (key === process.env.INTERNAL_MCP_DEV_KEY) { ... }

    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
    });

    if (!apiKey || apiKey.status !== "active") {
      res.status(401).json({ error: "Unauthorized: Invalid or inactive API key" });
      return;
    }

    // Set x-user-id header so downstream controllers (video, etc) know the user
    req.headers["x-user-id"] = apiKey.userId;
    (req as any).userId = apiKey.userId;
    
    // Update last used at
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    next();
  } catch (error) {
    console.error("[McpAuthMiddleware] Error validating API key:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
