import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import crypto from "crypto";
import { AppError } from "../utils/errors";

export class McpController {
  // POST /api/mcp/keys
  async generateApiKey(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const { name = "Default Key" } = req.body;

      // Generate a secure random key
      const randomBytes = crypto.randomBytes(32).toString("hex");
      const keyPrefix = "ngc_" + randomBytes.substring(0, 8);
      const fullKey = "ngc_" + randomBytes;

      const apiKey = await prisma.apiKey.create({
        data: {
          userId,
          name,
          key: fullKey,
          keyPrefix,
          rateLimit: 100, // Default for free dev phase
        },
      });

      return res.status(201).json({
        status: "success",
        data: {
          id: apiKey.id,
          name: apiKey.name,
          key: apiKey.key, // Send full key ONLY ONCE
          keyPrefix: apiKey.keyPrefix,
          rateLimit: apiKey.rateLimit,
          createdAt: apiKey.createdAt,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/mcp/keys
  async listApiKeys(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const apiKeys = await prisma.apiKey.findMany({
        where: { userId, status: "active" },
        select: {
          id: true,
          name: true,
          keyPrefix: true, // Never return full key
          status: true,
          rateLimit: true,
          createdAt: true,
          lastUsedAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return res.status(200).json({
        status: "success",
        data: apiKeys,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/mcp/keys/:id
  async revokeApiKey(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const { id } = req.params;

      const apiKey = await prisma.apiKey.findUnique({
        where: { id },
      });

      if (!apiKey || apiKey.userId !== userId) {
        throw new AppError("API Key not found", 404);
      }

      await prisma.apiKey.update({
        where: { id },
        data: { status: "revoked" },
      });

      return res.status(200).json({
        status: "success",
        message: "API Key revoked successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/mcp/usage
  async getUsageStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      // Get usage logs for all keys owned by user
      const apiKeys = await prisma.apiKey.findMany({
        where: { userId },
        select: { id: true },
      });

      const apiKeyIds = apiKeys.map((k) => k.id);

      const usage = await prisma.apiUsageLog.groupBy({
        by: ["tool", "status"],
        where: { apiKeyId: { in: apiKeyIds } },
        _count: { id: true },
        _sum: { inputTokens: true, latencyMs: true },
      });

      return res.status(200).json({
        status: "success",
        data: usage,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/mcp/projects
  async listProjects(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const projects = await prisma.project.findMany({
        where: { userId },
        select: {
          id: true,
          title: true,
          s3Url: true,
          duration: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 20, // Limit to 20 for MCP performance
      });

      return res.status(200).json({
        status: "success",
        data: projects,
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/mcp/projects/:id
  async getProject(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      if (!userId) {
        throw new AppError("Unauthorized", 401);
      }

      const { id } = req.params;

      const project = await prisma.project.findUnique({
        where: { id },
      });

      if (!project || project.userId !== userId) {
        throw new AppError("Project not found", 404);
      }

      return res.status(200).json({
        status: "success",
        data: project,
      });
    } catch (error) {
      next(error);
    }
  }
}
