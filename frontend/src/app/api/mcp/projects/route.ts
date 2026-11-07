/**
 * GET  /api/mcp/projects        — list user's projects
 * GET  /api/mcp/projects/[id]   — get a specific project
 */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateMcpKey } from "@/lib/mcp-auth";

export async function GET(request: NextRequest) {
  const auth = await validateMcpKey(request);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: { userId: auth.userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      s3Url: true,
      duration: true,
      createdAt: true,
      metadata: true,
    },
  });

  return NextResponse.json({ projects });
}
