import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SubscriptionClient from "./SubscriptionClient";

export default async function SubscriptionPage() {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/sign-in");
  }

  // Fetch full user and subscription details
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      subscription: true,
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!user) {
    redirect("/api/auth/signout?callbackUrl=/sign-in");
  }

  // Serialization for Client Components
  const serializedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    planType: user.planType,
    transcriptionBalance: user.transcriptionBalance,
    audioCredits: user.audioCredits,
    storageUsed: Number(user.storageUsed),
  };

  const serializedSubscription = user.subscription
    ? {
        ...user.subscription,
        storageUsedBytes: Number(user.subscription.storageUsedBytes),
        billingCycleStart: user.subscription.billingCycleStart.toISOString(),
        billingCycleEnd: user.subscription.billingCycleEnd?.toISOString() || null,
        createdAt: user.subscription.createdAt.toISOString(),
        updatedAt: user.subscription.updatedAt.toISOString(),
      }
    : null;

  const serializedTransactions = user.transactions.map((tx) => ({
    id: tx.id,
    amount: tx.amount,
    currency: tx.currency,
    status: tx.status,
    planType: tx.planType,
    razorpayOrderId: tx.razorpayOrderId,
    createdAt: tx.createdAt.toISOString(),
  }));

  return (
    <SubscriptionClient
      user={serializedUser}
      subscription={serializedSubscription}
      transactions={serializedTransactions}
    />
  );
}
