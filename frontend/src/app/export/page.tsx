import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ExportPageClient from "./ExportPageClient";

export default async function ExportPage() {
  const session = await auth();
  if (!session?.user?.email) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, name: true, planType: true, image: true, email: true },
  });

  if (!user) {
    redirect("/api/auth/signout?callbackUrl=/sign-in");
  }

  return <ExportPageClient user={user} />;
}
