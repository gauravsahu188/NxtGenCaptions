import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/sign-in");

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
      createdAt: true,
    },
  });

  if (!user) {
    redirect("/api/auth/signout?callbackUrl=/sign-in");
  }

  return <ProfileClient user={{ ...user, storageUsed: Number(user.storageUsed), createdAt: user.createdAt.toISOString() }} />;
}
