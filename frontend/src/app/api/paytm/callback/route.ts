import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    const formData = new URLSearchParams(body);
    const responseParams: Record<string, string> = {};

    for (const [key, value] of formData.entries()) {
      responseParams[key] = value;
    }

    const response = await fetch(`${BACKEND_URL}/api/paytm/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(responseParams).toString(),
    });

    if (!response.ok) {
      console.error("[PaytmCallback] Backend error:", response.status);
      return NextResponse.redirect(
        new URL('/dashboard?payment=failed', request.url)
      );
    }

    const result = await response.json();

    if (result.status === 'SUCCESS') {
      return NextResponse.redirect(
        new URL('/dashboard?payment=success&plan=' + (result.orderId || ''), request.url)
      );
    } else {
      return NextResponse.redirect(
        new URL('/dashboard?payment=failed', request.url)
      );
    }
  } catch (error) {
    console.error("[PaytmCallback] Error:", error);
    return NextResponse.redirect(
      new URL('/dashboard?payment=error', request.url)
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.redirect(
    new URL('/dashboard', request.url)
  );
}