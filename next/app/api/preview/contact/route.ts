import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/send";

export async function POST(request: Request) {
  try {
    const { name, email, phone, message } = await request.json();
    const result = await sendEmail({
      to: process.env.EMAIL_REPLY_TO || "support@onlinedoc.co.ke",
      replyTo: email,
      subject: `New inquiry from ${name}`,
      template: "contact-message",
      props: { name, email, phone, message },
    });
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 502 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact email error:", error);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}
