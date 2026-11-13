const DEFAULT_AUTH_REDIRECT = "/dashboard/patient";

export function safeAuthRedirect(value, fallback = DEFAULT_AUTH_REDIRECT) {
  if (typeof value !== "string") return fallback;

  const candidate = value.trim();
  if (!candidate.startsWith("/") || candidate.startsWith("//") || candidate.startsWith("/\\")) {
    return fallback;
  }
  if (/[\\\r\n]/.test(candidate)) return fallback;

  try {
    const url = new URL(candidate, "https://onlinedoc.local");
    if (url.origin !== "https://onlinedoc.local") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export { DEFAULT_AUTH_REDIRECT };
