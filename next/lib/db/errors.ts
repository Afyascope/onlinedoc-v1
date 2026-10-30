const CONNECTION_CODES = new Set([
  "ETIMEDOUT",
  "ECONNREFUSED",
  "ECONNRESET",
  "ENETUNREACH",
  "EHOSTUNREACH",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EPIPE",
  "CONNECT_TIMEOUT",
  "57P01",
  "57P02",
  "57P03",
]);

const AUTHENTICATION_CODES = new Set(["28P01", "28000"]);
const DATABASE_CODES = new Set(["3D000"]);
const SCHEMA_CODES = new Set(["42P01", "42703"]);

interface ErrorLike {
  name?: unknown;
  code?: unknown;
  errors?: unknown;
  cause?: unknown;
}

function errorCodes(error: unknown): string[] {
  if (!error || typeof error !== "object") return [];
  const value = error as ErrorLike;
  const codes = new Set<string>();

  if (typeof value.code === "string" && value.code) codes.add(value.code);
  if (value.cause) {
    for (const code of errorCodes(value.cause)) codes.add(code);
  }
  if (Array.isArray(value.errors)) {
    for (const nested of value.errors) {
      for (const code of errorCodes(nested)) codes.add(code);
    }
  }
  return Array.from(codes);
}

/**
 * Convert a database/driver failure into a safe payload for logs and HTTP
 * responses. Driver messages can contain hosts, usernames, SQL, or connection
 * strings, so only the error class and documented error codes are retained.
 */
export function sanitizeDatabaseError(error: unknown) {
  const name = error instanceof Error && error.name ? error.name : "UnknownError";
  const codes = errorCodes(error);
  const code = codes[0] ?? null;

  if (codes.some((value) => CONNECTION_CODES.has(value) || value.startsWith("08"))) {
    return { name, code, codes, message: "Database connection failed or timed out." };
  }
  if (codes.some((value) => AUTHENTICATION_CODES.has(value))) {
    return { name, code, codes, message: "Database authentication failed." };
  }
  if (codes.some((value) => DATABASE_CODES.has(value))) {
    return { name, code, codes, message: "The configured database does not exist." };
  }
  if (codes.some((value) => SCHEMA_CODES.has(value))) {
    return { name, code, codes, message: "The database schema is not ready. Apply pending migrations." };
  }

  return { name, code, codes, message: "Database operation failed." };
}

/**
 * Describe the configured target without returning the raw connection string.
 */
export function describeDatabaseTarget(raw: string | undefined) {
  if (!raw) return { present: false as const };
  try {
    const url = new URL(raw);
    return {
      present: true as const,
      protocol: url.protocol.replace(/:$/, ""),
      host: url.hostname,
      port: Number(url.port || 5432),
      database: decodeURIComponent(url.pathname.replace(/^\/+/, "")) || null,
      sslmode: url.searchParams.get("sslmode"),
      pooledEndpoint: /-pooler\./i.test(url.hostname),
      usernamePresent: Boolean(url.username),
      passwordPresent: Boolean(url.password),
    };
  } catch {
    return { present: true as const, parseError: "DATABASE_URL is not a valid URL." };
  }
}
