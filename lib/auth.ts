import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./db";
import { getAppSettings } from "./app-settings";
import { sendEmail, buildVerificationEmail } from "./email";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 6,
    // Only enforce email verification when an email sender is configured —
    // otherwise users would be locked out in environments without Resend.
    requireEmailVerification: !!process.env.RESEND_API_KEY,
    sendResetPassword: async ({ user, url }) => {
      const { buildResetPasswordEmail } = await import("./email");
      const { subject, html } = buildResetPasswordEmail(url, user.name);
      await sendEmail({ to: user.email, subject, html });
    },
    resetPasswordTokenExpiresIn: 60 * 60, // 1h
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60 * 24, // 24h
    sendVerificationEmail: async ({ user, url }) => {
      const { subject, html } = buildVerificationEmail(url, user.name);
      await sendEmail({ to: user.email, subject, html });
    },
  },
  socialProviders: {
    // TODO: enable when real credentials provided in env
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
  },
  user: {
    additionalFields: {
      plan: {
        type: "string",
        defaultValue: "FREE",
        input: false,
      },
      credits: {
        type: "number",
        defaultValue: 5,
        input: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // Apply admin-configured default credits + check signups gate
          try {
            const s = await getAppSettings();
            if (!s.signupsEnabled) {
              // Signups closed — auto-suspend the just-created user
              await prisma.user.update({
                where: { id: user.id },
                data: { suspended: true },
              });
              return;
            }
            if (s.defaultCredits !== 5) {
              await prisma.user.update({
                where: { id: user.id },
                data: { credits: s.defaultCredits },
              });
            }
          } catch (e) {
            console.error("[auth.databaseHooks.user.create.after] error:", e);
          }
        },
      },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  plugins: [nextCookies()],
  trustedOrigins: buildTrustedOrigins(),
});

/**
 * Build a list of trusted origins that covers:
 *   - BETTER_AUTH_URL (canonical)
 *   - The same host with the `www.` toggled on/off
 *   - All preview deployments (*.vercel.app)
 *   - Localhost for dev
 */
function buildTrustedOrigins(): string[] {
  const set = new Set<string>();
  const canonical = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  set.add(canonical);

  try {
    const u = new URL(canonical);
    if (u.hostname.startsWith("www.")) {
      set.add(`${u.protocol}//${u.hostname.slice(4)}`);
    } else {
      set.add(`${u.protocol}//www.${u.hostname}`);
    }
  } catch {
    // ignore
  }

  // Useful in production for Vercel preview URLs.
  set.add("https://estaila.com");
  set.add("https://www.estaila.com");
  set.add("http://localhost:3000");

  return Array.from(set);
}

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
