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
/**
 * Fee precedence: an existing platform_settings row is authoritative. The
 * environment variable is only a migration/backward-compatibility fallback
 * when that row is absent; invalid stored values fail closed.
 */
export function validateConsultationFee(value: string): string {
  // numeric(10,2): at most eight whole-number digits and two decimal places.
  if (!/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/.test(value)) {
    throw new Error("Consultation fee must be a finite amount with at most two decimal places, between 0 and 99999999.99");
  }
  return value;
}

export function consultationFee(databaseValue?: string): string {
  // The caller supplies the platform setting when it exists. Database value
  // wins; CONSULTATION_FEE is only used when no database setting exists.
  if (databaseValue !== undefined) return validateConsultationFee(databaseValue);
  const fallback = process.env.CONSULTATION_FEE;
  if (fallback !== undefined && fallback !== "") return validateConsultationFee(fallback);
  if (process.env.NODE_ENV === "production") {
    throw new Error("Consultation fee is not configured: create platform_settings.consultation_fee or configure CONSULTATION_FEE");
  }
  throw new Error("Consultation fee is not configured: seed platform settings or configure CONSULTATION_FEE");
}
