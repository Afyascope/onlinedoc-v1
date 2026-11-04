function configured(name: string, value: string | undefined, developmentFallback: string, browserFallback?: string): string {
  if (value) return value.replace(/\/$/, "");
  if (process.env.NODE_ENV === "production") {
    // Server-only variables such as BETTER_AUTH_URL are not inlined into the
    // client bundle. Fall back to the origin the app is actually served from
    // instead of crashing every page that imports the auth client.
    if (browserFallback) return browserFallback.replace(/\/$/, "");
    throw new Error(`${name} must be configured in production`);
  }
  return developmentFallback;
}

/**
 * Canonical public origin used for SEO URLs only (canonical, hreflang, sitemap,
 * robots, Open Graph and JSON-LD).
 */
export function siteUrl(): string {
  const browserFallback = typeof window !== "undefined" ? window.location.origin : undefined;
  const value = configured(
    "NEXT_PUBLIC_SITE_URL",
    process.env.NEXT_PUBLIC_SITE_URL,
    "http://localhost:3000",
    browserFallback,
  );
  const parsed = new URL(value);
  if (parsed.pathname !== "/" || parsed.search || parsed.hash) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an origin without a path, query, or fragment");
  }
  if (process.env.NODE_ENV === "production" && parsed.origin !== "https://www.onlinedoc.co.ke") {
    throw new Error("NEXT_PUBLIC_SITE_URL must be https://www.onlinedoc.co.ke in production");
  }
  return parsed.origin;
}

/**
 * Origin of the running application. Kept separate from `siteUrl()` so a local
 * build can verify production canonicals without sending auth, payment or
 * email callbacks to the production site.
 */
export function appOrigin(): string {
  const browserFallback = typeof window !== "undefined" ? window.location.origin : undefined;
  const serverValue =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.BETTER_AUTH_URL ||
    (typeof window === "undefined" ? process.env.NEXT_PUBLIC_SITE_URL : undefined);

  return configured(
    "NEXT_PUBLIC_APP_URL",
    serverValue,
    "http://localhost:3000",
    browserFallback,
  );
}

export function apiUrl(): string {
  return configured("NEXT_PUBLIC_API_URL", process.env.NEXT_PUBLIC_API_URL, "http://localhost:1337");
}

export function appUrl(path = ""): string { return `${appOrigin()}${path}`; }
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
