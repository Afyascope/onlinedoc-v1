import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import type { EmailMessage, EmailProvider, EmailProviderResult } from "./provider";
import { emailTrace, serializeEmailError } from "./trace";

let transporter: Transporter | undefined;

function smtpConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const portValue = process.env.SMTP_PORT;
  const secureValue = process.env.SMTP_SECURE;

  emailTrace("smtp.credentials.inspected", {
    host: Boolean(host),
    port: Boolean(portValue),
    secure: secureValue !== undefined,
    user: Boolean(user),
    pass: Boolean(pass),
  });

  if (!host || !user || !pass || !portValue || secureValue === undefined) {
    throw new Error("SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, and SMTP_PASS are required");
  }

  const port = Number(portValue);
  if (!Number.isInteger(port) || port <= 0) throw new Error("SMTP_PORT must be a valid port number");

  emailTrace("smtp.credentials.loaded", {
    host: Boolean(host),
    port: Boolean(portValue),
    secure: Boolean(secureValue),
    user: Boolean(user),
    pass: Boolean(pass),
    portNumber: port,
  });
  return { host, port, secure: secureValue.toLowerCase() === "true", auth: { user, pass } };
}

export function getSmtpTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport(smtpConfig());
    emailTrace("smtp.transporter.created");
  }
  return transporter;
}

function isTransient(error: unknown): boolean {
  const issue = error && typeof error === "object" ? error as { code?: string; responseCode?: number } : {};
  const code = issue.code || "";
  return ["ETIMEDOUT", "ECONNECTION", "ECONNRESET", "ECONNREFUSED", "EAI_AGAIN", "ENETUNREACH", "ESOCKET"].includes(code)
    || [421, 450, 451, 452].includes(issue.responseCode || 0);
}

function failure(error: unknown): EmailProviderResult {
  const issue = error && typeof error === "object" ? error as { message?: string; code?: string; response?: string; responseCode?: number } : {};
  return {
    success: false,
    error: issue.message || "SMTP delivery failed",
    code: issue.code || (issue.responseCode ? String(issue.responseCode) : undefined),
    response: issue.response,
    retryable: isTransient(error),
  };
}

export const smtpProvider: EmailProvider = {
  async send(message: EmailMessage): Promise<EmailProviderResult> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        emailTrace("smtp.send.started", { attempt: attempt + 1, recipient: message.to, subject: message.subject });
        emailTrace("smtp.sendMail.called", { attempt: attempt + 1, recipient: message.to, subject: message.subject });
        const result = await getSmtpTransporter().sendMail({
          from: message.from,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          replyTo: message.replyTo,
        });
        emailTrace("smtp.send.completed", { attempt: attempt + 1, recipient: message.to, messageId: result.messageId, accepted: result.accepted, rejected: result.rejected });
        return { success: true, id: result.messageId };
      } catch (error) {
        const result = failure(error);
        emailTrace("smtp.sendMail.error", { attempt: attempt + 1, recipient: message.to, result, nodemailerError: serializeEmailError(error) });
        if (!result.retryable || attempt === 1) return result;
      }
    }
    return { success: false, error: "SMTP delivery failed" };
  },

  async verify(): Promise<EmailProviderResult> {
    try {
      await getSmtpTransporter().verify();
      emailTrace("smtp.connection.established", { host: process.env.SMTP_HOST, port: process.env.SMTP_PORT });
      return { success: true };
    } catch (error) {
      const result = failure(error);
      emailTrace("smtp.connection.error", { result, nodemailerError: serializeEmailError(error) });
      return result;
    }
  },
};
