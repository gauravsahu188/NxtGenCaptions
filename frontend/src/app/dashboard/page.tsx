import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { generateDownloadUrl } from "@/lib/s3";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/sign-in");
  }

  // Fetch full user from DB
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      planType: true,
      transcriptionBalance: true,
      audioCredits: true,
      storageUsed: true,
    },
  });

  if (!user) {
    redirect("/api/auth/signout?callbackUrl=/sign-in");
  }

  // Fetch recent projects
  const projects = await prisma.project.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      s3Url: true,
      duration: true,
      createdAt: true,
      metadata: true,
    }
  });

  // Serialization
  const serializedUser = {
    ...user,
    storageUsed: Number(user.storageUsed),
  };

  const serializedProjects = await Promise.all(
    projects.map(async (p) => {
      let thumbnailUrl: string | null = null;
      let signedVideoUrl: string | null = null;

      const meta = p.metadata as any;
      if (meta?.thumbnailKey) {
        try {
          thumbnailUrl = await generateDownloadUrl(meta.thumbnailKey, 7200);
        } catch (e) {
          console.error("[Dashboard] Error generating signed URL for thumbnail:", e);
        }
      }

      if (p.s3Url) {
        try {
          signedVideoUrl = await generateDownloadUrl(p.s3Url, 7200);
        } catch (e) {
          console.error("[Dashboard] Error generating signed URL for video:", e);
        }
      }

      return {
        id: p.id,
        title: p.title,
        s3Url: signedVideoUrl,
        duration: p.duration,
        createdAt: p.createdAt.toISOString(),
        thumbnailUrl,
      };
    })
  );

  return <DashboardClient user={serializedUser} projects={serializedProjects} />;
}
