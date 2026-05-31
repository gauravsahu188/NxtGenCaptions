import { auth } from "@/auth";
import { redirect } from "next/navigation";
import EditorPageClient from "./EditorPageClient";
import { prisma } from "@/lib/prisma";

export default async function EditorPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/sign-in");

  const { projectId } = await searchParams;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, email: true, image: true, planType: true, transcriptionBalance: true, audioCredits: true },
  });

  if (!user) {
    redirect("/api/auth/signout?callbackUrl=/sign-in");
  }

  return <EditorPageClient user={user} projectId={projectId} />;
}
