import "server-only";

export function emailTrace(event: string, fields: Record<string, unknown> = {}): void {
  const safeFields = { ...fields };
  if (typeof safeFields.recipient === "string") {
    const [local, domain] = safeFields.recipient.split("@");
    safeFields.recipient = `${local?.slice(0, 1) || ""}***@${domain || "redacted"}`;
  }
  delete safeFields.verificationUrl;
  delete safeFields.token;
  delete safeFields.response;
  // NOTE: `smtpResponse` (truncated SMTP server reply, e.g. "535 Incorrect
  // authentication data") is intentionally kept: it contains no credentials,
  // tokens, or URLs and is required to diagnose delivery failures in Vercel
  // logs, where Better Auth otherwise returns HTTP 200 for sign-up even when
  // the verification email fails (see runInBackgroundOrAwait).
  console.info(JSON.stringify({
    scope: "email-verification-debug",
    event,
    timestamp: new Date().toISOString(),
    ...safeFields,
  }));
}

export function serializeEmailError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
      ...Object.fromEntries(Object.entries(error)),
    };
  }
  if (error && typeof error === "object") return { ...error as Record<string, unknown> };
  return { value: error };
}
