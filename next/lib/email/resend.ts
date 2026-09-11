import "server-only";

export type ResendEmail = {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

export type ResendResult = { id?: string; error?: string };

/** Small Resend API adapter. Keeping the provider here makes replacement/testing easy. */
export async function sendWithResend(email: ResendEmail): Promise<ResendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { error: "RESEND_API_KEY is not configured" };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: email.from,
        to: email.to,
        subject: email.subject,
        html: email.html,
        text: email.text,
        reply_to: email.replyTo,
      }),
      cache: "no-store",
    });

    const body = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!response.ok) return { error: body.message || `Resend returned ${response.status}` };
    return { id: body.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Unable to reach Resend" };
  }
}
