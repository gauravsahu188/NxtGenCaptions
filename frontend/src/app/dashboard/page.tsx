import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
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
    }
  });

  // Serialization
  const serializedUser = {
    ...user,
    storageUsed: Number(user.storageUsed),
  };

  const serializedProjects = projects.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
  }));

  return <DashboardClient user={serializedUser} projects={serializedProjects} />;
}
