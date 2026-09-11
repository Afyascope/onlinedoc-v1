import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import { user, session, account, verification } from "@/db/schema";
import { appUrl, sendEmail } from "@/lib/email/send";
import { emailRateLimit } from "@/lib/email/rate-limit";
import { emailTrace, serializeEmailError } from "@/lib/email/trace";
import { appUrl as configuredAppUrl } from "@/lib/config";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),
  databaseHooks: {
    user: {
      create: {
        after: async (createdUser) => {
          emailTrace("registration.complete", {
            userId: createdUser.id,
            recipient: createdUser.email,
            emailVerified: createdUser.emailVerified,
          });
        },
      },
    },
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    autoSignIn: false,
    resetPasswordTokenExpiresIn: 3600,
    sendResetPassword: async ({ user, url }) => {
      if (!emailRateLimit(`reset:${user.email.toLowerCase()}`)) return;
      await sendEmail({ to: user.email, subject: "Reset your OnlineDoc password", template: "reset-password", props: { resetUrl: url, expiresIn: "1 hour" } });
    },
    onPasswordReset: async ({ user }) => {
      await sendEmail({ to: user.email, subject: "Your OnlineDoc password was changed", template: "password-changed", props: { name: user.name } });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    expiresIn: 3600,
    sendVerificationEmail: async ({ user, url, token }) => {
      emailTrace("verification.callback.entered", { userId: user.id, recipient: user.email });
      try {
        const parsedUrl = new URL(url);
        emailTrace("verification.token.created", {
          userId: user.id,
          tokenPresent: Boolean(token),
          storage: "signed-token-in-verification-url",
        });
        const frontendVerificationUrl = new URL("/verify-email", configuredAppUrl());
        frontendVerificationUrl.searchParams.set("token", token);
        frontendVerificationUrl.searchParams.set("callbackURL", parsedUrl.searchParams.get("callbackURL") || "/");
        const verificationUrl = frontendVerificationUrl.toString();
        emailTrace("verification.url.generated", {
          userId: user.id,
          pathname: frontendVerificationUrl.pathname,
          origin: frontendVerificationUrl.origin,
          tokenPresent: frontendVerificationUrl.searchParams.has("token"),
        });
        if (!emailRateLimit(`verify:${user.email.toLowerCase()}`)) {
          emailTrace("verification.callback.rate_limited", { userId: user.id, recipient: user.email });
          return;
        }
        emailTrace("verification.sendEmail.called", { userId: user.id, recipient: user.email });
        const result = await sendEmail({ to: user.email, subject: "Verify your OnlineDoc account", template: "verify-email", props: { name: user.name, verificationUrl, expiresIn: "1 hour" } });
        if (!result.success) {
          emailTrace("verification.callback.delivery_failed", { userId: user.id, recipient: user.email, result });
          throw new Error(result.error || "Verification email delivery failed");
        }
        emailTrace("verification.callback.completed", { userId: user.id, recipient: user.email, success: true, messageId: result.id });
      } catch (error) {
        emailTrace("verification.callback.error", { userId: user.id, recipient: user.email, error: serializeEmailError(error) });
        throw error;
      }
    },
    afterEmailVerification: async (user) => {
      await sendEmail({ to: user.email, subject: "Welcome to OnlineDoc", template: "welcome", props: { name: user.name, dashboardUrl: appUrl("/dashboard") } });
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: "patient",
        // Role changes are an administrative provisioning operation, never registration input.
        input: false,
      },
      clinicianApproved: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      clinicianStatus: {
        type: "string",
        required: false,
        defaultValue: "PENDING",
        input: false,
      },
      approvedAt: {
        type: "date",
        required: false,
        input: false,
      },
      approvedBy: {
        type: "string",
        required: false,
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

emailTrace("better-auth.email-verification.configured", {
  emailVerificationEnabled: true,
  sendOnSignUp: true,
  requireEmailVerification: true,
  callbackRegistered: true,
});
