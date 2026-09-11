import "server-only";
import type { EmailProvider, EmailProviderResult } from "./provider";

export const mockProvider: EmailProvider = {
  async send(message): Promise<EmailProviderResult> {
  console.info("[email:mock]", JSON.stringify({ subject: message.subject }));
    return { success: true, id: `mock-${Date.now()}` };
  },
  async verify(): Promise<EmailProviderResult> {
    console.info("✓ Mock email provider ready");
    return { success: true };
  },
};
