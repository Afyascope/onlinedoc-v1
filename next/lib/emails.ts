import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.ethereal.email",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

const from = process.env.SMTP_FROM || "noreply@onlinedoc.healthcare";

export async function sendVerificationEmail(email: string, token: string) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/verify-email?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0F2A43;">OnlineDoc</h1>
      </div>
      <h2 style="color: #0F2A43;">Verify your email address</h2>
      <p style="color: #64748B; line-height: 1.6;">
        Thank you for creating an account. Please verify your email address by clicking the button below.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}"
           style="background-color: #2CB1BC; color: white; padding: 12px 32px;
                  text-decoration: none; border-radius: 8px; font-weight: bold;
                  display: inline-block;">
          Verify Email
        </a>
      </div>
      <p style="color: #64748B; font-size: 14px;">
        This link expires in 24 hours. If you did not create an account, you can ignore this email.
      </p>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from,
    to: email,
    subject: "Verify your OnlineDoc account",
    html,
  });
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const url = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/reset-password?token=${token}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #0F2A43;">OnlineDoc</h1>
      </div>
      <h2 style="color: #0F2A43;">Reset your password</h2>
      <p style="color: #64748B; line-height: 1.6;">
        You requested a password reset. Click the button below to set a new password.
      </p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${url}"
           style="background-color: #2CB1BC; color: white; padding: 12px 32px;
                  text-decoration: none; border-radius: 8px; font-weight: bold;
                  display: inline-block;">
          Reset Password
        </a>
      </div>
      <p style="color: #64748B; font-size: 14px;">
        This link expires in 1 hour. If you did not request this, you can ignore this email.
      </p>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from,
    to: email,
    subject: "Reset your OnlineDoc password",
    html,
  });
}
