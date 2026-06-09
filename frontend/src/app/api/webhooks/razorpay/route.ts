import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-razorpay-signature") || "";

    // Forward the webhook to Express backend
    const response = await fetch(`${BACKEND_URL}/api/webhooks/razorpay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-razorpay-signature": signature,
      },
      body: rawBody,
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[WebhookProxy] Error forwarding Razorpay webhook:", error);
    return NextResponse.json(
      { error: "Failed to forward webhook" },
      { status: 500 }
    );
  }
}
export const dynamic = "force-dynamic";
