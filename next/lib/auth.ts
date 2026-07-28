import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { user, session, account, verification } from "@/db/schema";

const queryClient = postgres(process.env.DATABASE_URL!);
const db = drizzle(queryClient, { schema: { user, session, account, verification } });

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendEmailVerificationOnSignUp: true,
    autoSignIn: false,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "patient",
        input: true,
      },
      clinicianApproved: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },
  rateLimit: {
    window: 60,
    max: 20,
  },
  advanced: {
    defaultSessionExpiresIn: 604800,
    secureCookies: process.env.NODE_ENV === "production",
    useSecureCookies: process.env.NODE_ENV === "production",
    crossSubDomainCookies: {
      enabled: false,
    },
  },
});
