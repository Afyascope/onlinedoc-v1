function configured(name: string, value: string | undefined, developmentFallback: string): string {
  if (value) return value.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") throw new Error(`${name} must be configured in production`);
  return developmentFallback;
}

export function siteUrl(): string {
  return configured(
    "NEXT_PUBLIC_SITE_URL",
    process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_URL || process.env.BETTER_AUTH_URL,
    "http://localhost:3000",
  );
}

export function apiUrl(): string {
  return configured("NEXT_PUBLIC_API_URL", process.env.NEXT_PUBLIC_API_URL, "http://localhost:1337");
}

export function appUrl(path = ""): string { return `${siteUrl()}${path}`; }
export function paystackCurrency(): string { return configured("PAYSTACK_CURRENCY", process.env.PAYSTACK_CURRENCY, "KES"); }
export function consultationFee(): string { return configured("CONSULTATION_FEE", process.env.CONSULTATION_FEE, "50"); }
