import "server-only";
import { mockProvider } from "./mock";
import { smtpProvider } from "./smtp";
import type { EmailMessage, EmailProvider, EmailProviderResult } from "./provider";
import { configuredEmailProvider, emailFrom, emailReplyTo } from "./provider";
import { renderEmail, type EmailProps, type EmailTemplate } from "./renderer";
import { emailTrace, serializeEmailError } from "./trace";
import { appUrl as configuredAppUrl } from "@/lib/config";

export type { EmailProps, EmailTemplate } from "./renderer";
export type SendEmailInput = { to: string; subject: string; template: EmailTemplate; props: EmailProps; replyTo?: string };
export type SendEmailResult = EmailProviderResult;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getProvider(): EmailProvider {
  const providerName = configuredEmailProvider();
  emailTrace("provider.selected", { provider: providerName, emailProviderConfigured: Boolean(process.env.EMAIL_PROVIDER) });
  switch (providerName) {
    case "mock": return mockProvider;
    case "smtp": return smtpProvider;
    default: throw new Error(`Unsupported EMAIL_PROVIDER: ${configuredEmailProvider()}`);
  }
}

export function getConfiguredEmailProvider(): EmailProvider { return getProvider(); }

/** The only application entry point for transactional email delivery. It never throws. */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const timestamp = new Date().toISOString();
  emailTrace("sendEmail.called", {
    recipient: input.to,
    template: input.template,
    subject: input.subject,
  });
  if (!emailPattern.test(input.to)) {
    const error = "Invalid recipient email";
    console.error(JSON.stringify({ template: input.template, timestamp, success: false, error }));
    return { success: false, error };
  }

  try {
    const message: EmailMessage = {
      from: emailFrom(),
      to: input.to,
      subject: input.subject,
      html: renderEmail(input.template, input.props),
      replyTo: input.replyTo || emailReplyTo(),
    };
    emailTrace("email.rendered", { recipient: input.to, template: input.template, subject: input.subject, htmlBytes: Buffer.byteLength(message.html) });
    const result = await getProvider().send(message);
    console.info(JSON.stringify({ template: input.template, timestamp, success: result.success, deliveryId: result.id, error: result.error, code: result.code }));
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Email delivery failed";
    emailTrace("sendEmail.error.swallowed", { recipient: input.to, template: input.template, success: false, error: serializeEmailError(error) });
    return { success: false, error: message };
  }
}

export function appUrl(path = "") { return configuredAppUrl(path); }
