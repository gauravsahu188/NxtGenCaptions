import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  // Paytm payments are not supported. Use /api/payment/initiate for Razorpay.
  return NextResponse.json(
    { error: "Paytm payments are not currently supported. Please use Razorpay." },
    { status: 501 }
  );
}