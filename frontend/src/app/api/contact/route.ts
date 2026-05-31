import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Initialize nodemailer transporter with Gmail SMTP credentials
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { email, subject, message } = await req.json();

    // Validate request inputs
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }
    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: "Please select or provide a subject." }, { status: 400 });
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ error: "Please write a message." }, { status: 400 });
    }

    // Set up the destination email address requested
    const targetEmail = "nxtgencaptions@gmail.com";

    // Send email to nxtgencaptions@gmail.com
    await transporter.sendMail({
      from: `NxtGen Captions Contact <${process.env.GMAIL_USER}>`,
      to: targetEmail,
      replyTo: email, // Extremely helpful: allows direct reply to the sender
      subject: `[Contact Form] ${subject} - from ${email}`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 40px 32px; background: #0a0a0c; border: 1px solid #222226; border-radius: 16px; color: #f3f4f6; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);">
          <!-- Branded Header -->
          <div style="text-align: center; margin-bottom: 32px; border-bottom: 1px solid #222226; padding-bottom: 24px;">
            <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%); -webkit-background-clip: text; color: #a855f7; display: inline-block;">
              NxtGen Captions
            </div>
            <p style="color: #9ca3af; font-size: 14px; margin: 8px 0 0 0; font-weight: 500;">New Message from Contact Form</p>
          </div>

          <!-- Message Overview Card -->
          <div style="background: #121216; border: 1px solid #1f1f24; border-radius: 12px; padding: 24px; margin-bottom: 28px;">
            <div style="margin-bottom: 16px;">
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #818cf8; font-weight: 700; display: block; margin-bottom: 4px;">Sender Email</span>
              <a href="mailto:${email}" style="color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; hover: text-decoration: underline;">${email}</a>
            </div>
            
            <div style="margin-bottom: 16px;">
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #818cf8; font-weight: 700; display: block; margin-bottom: 4px;">Subject / Reason</span>
              <span style="color: #ffffff; font-size: 16px; font-weight: 600;">${subject}</span>
            </div>
            
            <div>
              <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #818cf8; font-weight: 700; display: block; margin-bottom: 8px;">Written Message</span>
              <div style="color: #d1d5db; font-size: 15px; line-height: 1.6; white-space: pre-wrap; background: #1a1a22; border-radius: 8px; padding: 16px; border: 1px solid #2a2a32;">${message}</div>
            </div>
          </div>

          <!-- Quick Action -->
          <div style="text-align: center; margin-top: 32px;">
            <a href="mailto:${email}?subject=Re: ${encodeURIComponent(subject)}" style="display: inline-flex; align-items: center; justify-content: center; background: #6366f1; color: #ffffff; text-decoration: none; padding: 12px 28px; font-size: 15px; font-weight: 600; border-radius: 10px; transition: background 0.2s; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);">
              Reply Directly to User
            </a>
          </div>

          <!-- Footer -->
          <div style="text-align: center; margin-top: 40px; border-top: 1px solid #222226; padding-top: 20px; font-size: 12px; color: #4b5563;">
            This email was sent automatically from the NxtGen Captions platform contact form.
          </div>
        </div>
      `,
      text: `NxtGen Captions Contact Message:\n\nSender Email: ${email}\nSubject: ${subject}\n\nMessage:\n${message}`,
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[contact-api] error sending contact email:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to send the email. Please try again later." },
      { status: 500 }
    );
  }
}
