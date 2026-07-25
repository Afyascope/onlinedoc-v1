import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    // 1. Setup the "Transporter" (The connection to your Webmail)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true, // Use true for port 465, false for 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // 2. Configure the Email
    const mailOptions = {
      from: `"AfyaScope Website" <${process.env.SMTP_USER}>`, // Must be your webmail address
      to: 'info@afyascope.co.ke', // Where YOU want to receive the alerts
      replyTo: email, // So you can hit "Reply" and it goes to the patient
      subject: `New Inquiry from ${name}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>New Message from AfyaScope</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone}</p>
          <br/>
          <p><strong>Message:</strong></p>
          <blockquote style="background: #f0f0f0; padding: 15px; border-left: 4px solid #0070f3;">
            ${message}
          </blockquote>
        </div>
      `,
    };

    // 3. Send it
    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email Error:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}