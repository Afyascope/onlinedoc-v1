export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { getConfiguredEmailProvider } = await import("@/lib/email/send");
    const provider = getConfiguredEmailProvider();
    if (provider.verify) await provider.verify();
  } catch (error) {
    console.error(`✗ Email provider startup check failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
