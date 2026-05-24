import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { prisma } from "./db";
import { getAppSettings } from "./app-settings";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "sqlite",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 6,
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
  trustedOrigins: [
    process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  ],
});

export type Auth = typeof auth;
export type Session = typeof auth.$Infer.Session;
