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
