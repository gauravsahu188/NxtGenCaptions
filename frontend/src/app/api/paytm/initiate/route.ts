import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

interface InitiatePaymentRequest {
  planType: 'EDITOR' | 'CREATOR' | 'BUSINESS';
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: InitiatePaymentRequest = await request.json();
    const { planType } = body;

    if (!planType) {
      return NextResponse.json(
        { error: "Missing required field: planType" },
        { status: 400 }
      );
    }

    const validPlans = ['EDITOR', 'CREATOR', 'BUSINESS'];
    if (!validPlans.includes(planType)) {
      return NextResponse.json(
        { error: "Invalid plan type. Must be EDITOR, CREATOR, or BUSINESS" },
        { status: 400 }
      );
    }

    const response = await fetch(`${BACKEND_URL}/api/paytm/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': session.user.id,
      },
      body: JSON.stringify({ planType }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || "Failed to initiate payment" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[PaytmInitiate] Error:", error);
    return NextResponse.json(
      { error: "Failed to initiate payment" },
      { status: 500 }
    );
  }
}