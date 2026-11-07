/**
 * MCP Auth Helpers
 * All /api/mcp/* routes call validateMcpKey() to authenticate incoming requests
 * from the MCP server. The key is matched against ApiKey records in the DB.
 */
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";

export interface McpAuthResult {
  userId: string;
  apiKeyId: string;
  planType: string;
}

/**
 * Validate the Bearer token from the Authorization header.
 * Returns userId + apiKeyId on success, or null on failure.
 */
export async function validateMcpKey(
  request: NextRequest
): Promise<McpAuthResult | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const key = authHeader.slice(7).trim();
  if (!key) return null;

  try {
    const apiKey = await prisma.apiKey.findUnique({
      where: { key },
      include: { user: { select: { id: true, planType: true } } },
    });

    if (!apiKey) return null;
    if (apiKey.status !== "active") return null;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

    // Update last used timestamp (fire and forget)
    prisma.apiKey
      .update({ where: { id: apiKey.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    return {
      userId: apiKey.userId,
      apiKeyId: apiKey.id,
      planType: apiKey.user.planType,
    };
  } catch {
    return null;
  }
}

/**
 * Log a tool call for rate-limiting / analytics.
 */
export async function logToolCall(
  apiKeyId: string,
  tool: string,
  status: "success" | "error" | "rate_limited",
  latencyMs: number
) {
  await prisma.apiUsageLog
    .create({ data: { apiKeyId, tool, status, latencyMs } })
    .catch(() => {});
}
