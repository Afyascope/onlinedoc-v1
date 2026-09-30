import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import type { EmailMessage, EmailProvider, EmailProviderResult } from "./provider";
import { emailTrace, serializeEmailError } from "./trace";

let transporter: Transporter | undefined;

function smtpConfig() {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const portValue = process.env.SMTP_PORT?.trim();
  const secureValue = process.env.SMTP_SECURE?.trim();

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

  const secure = secureValue.toLowerCase() === "true";
  emailTrace("smtp.credentials.loaded", {
    hostPresent: Boolean(host),
    portNumber: port,
    secureParsed: secure,
    secureRawPresent: Boolean(secureValue),
    userPresent: Boolean(user),
    passPresent: Boolean(pass),
  });
  emailTrace("smtp.config.detected", {
    host,
    port,
    secure,
    userPresent: Boolean(user),
  });
  return {
    host,
    port,
    secure,
    // Port 587 uses STARTTLS (secure=false + upgrade). Enforce the upgrade so
    // credentials are never sent in plaintext if the server offers STARTTLS.
    // Port 465 uses implicit TLS (secure=true) and needs no extra flag.
    requireTLS: !secure && port === 587,
    auth: { user, pass },
  };
}

export function getSmtpTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      ...smtpConfig(),
      // Fail fast when the SMTP server is unreachable so email delivery can
      // never block a request for minutes (Nodemailer defaults are far longer).
      connectionTimeout: 10000,
      socketTimeout: 10000,
      greetingTimeout: 10000,
    });
    emailTrace("smtp.transporter.created");
  }
  return transporter;
}

function isAuthFailure(error: unknown): boolean {
  const issue = error && typeof error === "object" ? error as { code?: string; responseCode?: number } : {};
  const code = (issue.code || "").toUpperCase();
  return code === "EAUTH" || code === "EAUTHENTICATION"
    || [535, 534, 530].includes(issue.responseCode || 0);
}

function isConnectionFailure(error: unknown): boolean {
  const issue = error && typeof error === "object" ? error as { code?: string } : {};
  const code = (issue.code || "").toUpperCase();
  if (["ESOCKET", "ETIMEDOUT", "ECONNECTION", "ECONNRESET", "ECONNREFUSED", "EAI_AGAIN", "ENETUNREACH", "EDNS", "CERT_HAS_EXPIRED", "UNABLE_TO_VERIFY_LEAF_SIGNATURE", "DEPTH_ZERO_SELF_SIGNED_CERT", "SELF_SIGNED_CERT_IN_CHAIN", "ERR_TLS_CERT_ALTNAME_INVALID", "HOSTNAME_MISMATCH"].includes(code)) return true;
  const message = error instanceof Error ? error.message.toLowerCase() : "";
  return message.includes("certificate") || message.includes("self signed") || message.includes("tls") || message.includes("greeting never received") || message.includes("connection timeout") || message.includes("socket timeout");
}

/** Truncated SMTP server reply. Safe to log: contains no credentials, tokens, or URLs. */
function smtpResponsePreview(error: unknown): string | undefined {
  const issue = error && typeof error === "object" ? error as { response?: unknown } : {};
  if (typeof issue.response !== "string" || issue.response.length === 0) return undefined;
  return issue.response.slice(0, 300);
}

function resetTransporter(): void {
  try {
    transporter?.close();
  } catch {
    // Best effort: a broken socket must never poison the cached transporter.
  }
  transporter = undefined;
}
function isTransient(error: unknown): boolean {
  const transientIssue = error && typeof error === "object" ? error as { code?: string; responseCode?: number } : {};
  const transientCode = transientIssue.code || "";
  return ["ETIMEDOUT", "ECONNECTION", "ECONNRESET", "ECONNREFUSED", "EAI_AGAIN", "ENETUNREACH", "ESOCKET"].includes(transientCode)
    || [421, 450, 451, 452].includes(transientIssue.responseCode || 0);
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
        const activeConfig = { host: process.env.SMTP_HOST?.trim(), port: process.env.SMTP_PORT?.trim(), secure: process.env.SMTP_SECURE?.trim() };
        emailTrace("smtp.send.started", { attempt: attempt + 1, recipient: message.to, subject: message.subject, ...activeConfig });
        emailTrace("smtp.sendMail.called", { attempt: attempt + 1, recipient: message.to, subject: message.subject });
        emailTrace("smtp.message.send.attempted", { attempt: attempt + 1, recipient: message.to });
        const result = await getSmtpTransporter().sendMail({
          from: message.from,
          to: message.to,
          subject: message.subject,
          html: message.html,
          text: message.text,
          replyTo: message.replyTo,
        });
        emailTrace("smtp.authentication.succeeded", { attempt: attempt + 1, recipient: message.to });
        emailTrace("smtp.send.completed", { attempt: attempt + 1, recipient: message.to, messageId: result.messageId, accepted: result.accepted, rejected: result.rejected });
        emailTrace("smtp.message.send.succeeded", { attempt: attempt + 1, recipient: message.to, messageId: result.messageId, accepted: result.accepted, rejected: result.rejected });
        return { success: true, id: result.messageId };
      } catch (error) {
        const result = failure(error);
        const smtpResponse = smtpResponsePreview(error);
        const serialized = serializeEmailError(error);
        delete serialized.response;
        emailTrace("smtp.sendMail.error", { attempt: attempt + 1, recipient: message.to, result, smtpResponse, nodemailerError: serialized });
        if (isAuthFailure(error)) {
          emailTrace("smtp.authentication.failed", { attempt: attempt + 1, recipient: message.to, code: result.code, smtpResponse });
          // Drop the poisoned connection so the next attempt reconnects.
          resetTransporter();
          return result;
        }
        if (isConnectionFailure(error)) {
          emailTrace("smtp.connection.failed", { attempt: attempt + 1, recipient: message.to, code: result.code, smtpResponse });
          resetTransporter();
          if (attempt === 1) return result;
          continue;
        }
        emailTrace("smtp.message.send.failed", { attempt: attempt + 1, recipient: message.to, code: result.code, smtpResponse });
        if (!result.retryable || attempt === 1) return result;
      }
    }
    return { success: false, error: "SMTP delivery failed" };
  },

  async verify(): Promise<EmailProviderResult> {
    try {
      await getSmtpTransporter().verify();
      emailTrace("smtp.connection.established", { host: process.env.SMTP_HOST?.trim(), port: process.env.SMTP_PORT?.trim(), secure: process.env.SMTP_SECURE?.trim() });
      emailTrace("smtp.authentication.succeeded", {});
      return { success: true };
    } catch (error) {
      const result = failure(error);
      const smtpResponse = smtpResponsePreview(error);
      const serialized = serializeEmailError(error);
      delete serialized.response;
      if (isAuthFailure(error)) {
        emailTrace("smtp.authentication.failed", { code: result.code, smtpResponse });
      } else {
        emailTrace("smtp.connection.failed", { code: result.code, smtpResponse });
      }
      emailTrace("smtp.connection.error", { result, smtpResponse, nodemailerError: serialized });
      resetTransporter();
      return result;
    }
  },
};
