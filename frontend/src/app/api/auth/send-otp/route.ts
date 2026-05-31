import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { prisma } from "@/lib/prisma"

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Delete any existing OTPs for this email
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    })

    // Store new OTP
    await prisma.verificationToken.create({
      data: { identifier: email, token: otp, expires },
    })

    // Send OTP email
    await transporter.sendMail({
      from: `NxtGen Captions <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your NxtGen Captions sign-in code",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#0a0a0a;border-radius:12px;color:#fff">
          <h2 style="margin-bottom:4px">Your sign-in code</h2>
          <p style="color:#aaa;margin-bottom:28px;font-size:14px">Enter this code on the sign-in page. It expires in 10 minutes.</p>
          <div style="letter-spacing:16px;font-size:40px;font-weight:700;color:#6c63ff;background:#1a1a2e;padding:24px 32px;border-radius:10px;text-align:center;margin-bottom:28px">
            ${otp}
          </div>
          <p style="color:#555;font-size:12px">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `,
      text: `Your NxtGen Captions sign-in code is: ${otp}\nThis code expires in 10 minutes.`,
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[send-otp] error:", err)
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 })
  }
}
