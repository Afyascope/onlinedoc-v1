import "server-only";

export type EmailMessage = {
  from: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export type EmailProviderResult = {
  success: boolean;
  id?: string;
  error?: string;
  code?: string;
  response?: string;
  retryable?: boolean;
};

export interface EmailProvider {
  send(message: EmailMessage): Promise<EmailProviderResult>;
  verify?(): Promise<EmailProviderResult>;
}

export function configuredEmailProvider(): string {
  return (process.env.EMAIL_PROVIDER || "smtp").trim().toLowerCase();
}

export function emailFrom(): string {
  const name = process.env.EMAIL_FROM_NAME || "OnlineDoc";
  const address = process.env.EMAIL_FROM_ADDRESS;
  if (!address) throw new Error("EMAIL_FROM_ADDRESS is not configured");
  return `${name} <${address}>`;
}

export function emailReplyTo(): string {
  return process.env.EMAIL_REPLY_TO || "support@onlinedoc.co.ke";
}
