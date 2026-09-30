#!/usr/bin/env node
import { pathToFileURL } from "node:url";

const usage = "Usage: node scripts/promote-admin.mjs --environment production --expected-host <database-host> --email <exact-email> --confirm-production";

class SafeCliError extends Error {}

export async function promoteVerifiedUser(transaction, email) {
  if (typeof email !== "string" || email.length === 0 || email !== email.trim() || /\s/.test(email)) {
    throw new SafeCliError("An exact target email address is required");
  }

  return transaction(async (tx) => {
    const users = await tx.unsafe(
      'SELECT id, email, role, email_verified FROM "user" WHERE email = $1 FOR UPDATE',
      [email],
    );
    const user = users[0];
    if (!user) throw new SafeCliError("No user exists for the exact target email");
    if (user.email_verified !== true) throw new SafeCliError("Target user email is not verified");
    if (user.role === "admin") throw new SafeCliError("Target user is already admin");

    const promoted = await tx.unsafe(
      'UPDATE "user" SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND email_verified = TRUE AND role <> $1 RETURNING id, email, role, email_verified',
      ["admin", user.id],
    );
    if (promoted.length !== 1) throw new SafeCliError("User promotion did not update exactly one verified account");
    const { id, email: promotedEmail, role, email_verified: emailVerified } = promoted[0];
    return { id, email: promotedEmail, role, email_verified: emailVerified };
  });
}

function parseArgs(args) {
  const parsed = {};
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (flag === "--confirm-production") {
      if (parsed.confirmProduction) throw new SafeCliError(usage);
      parsed.confirmProduction = true;
    } else if (["--environment", "--expected-host", "--email"].includes(flag)) {
      const value = args[index + 1];
      if (!value || value.startsWith("--") || parsed[flag]) throw new SafeCliError(usage);
      parsed[flag] = value;
      index += 1;
    } else {
      throw new SafeCliError(usage);
    }
  }
  if (parsed["--environment"] !== "production" || !parsed.confirmProduction || !parsed["--expected-host"] || !parsed["--email"]) {
    throw new SafeCliError(usage);
  }
  return {
    expectedHost: parsed["--expected-host"],
    email: parsed["--email"],
  };
}

async function main() {
  const { expectedHost, email } = parseArgs(process.argv.slice(2));
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new SafeCliError("DATABASE_URL is required in the process environment");

  let actualHost;
  try {
    actualHost = new URL(databaseUrl).hostname;
  } catch {
    throw new SafeCliError("DATABASE_URL is not a valid URL");
  }
  if (actualHost !== expectedHost) throw new SafeCliError("Database host does not match --expected-host; no changes were made");

  const { default: postgres } = await import("postgres");
  const sql = postgres(databaseUrl, { ssl: "require", max: 1, connect_timeout: 10 });
  try {
    const result = await promoteVerifiedUser((callback) => sql.begin(callback), email);
    // Deliberately emit only the four requested, non-secret user fields.
    process.stdout.write(`${JSON.stringify(result)}\n`);
  } finally {
    await sql.end();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    // Database-library errors can contain connection details; print a safe
    // message only and never dump the error object or environment.
    const message = error instanceof SafeCliError
      ? error.message
      : "Admin promotion failed. Review database connectivity without printing credentials.";
    process.stderr.write(`${message}\n`);
    process.exitCode = 1;
  });
}
