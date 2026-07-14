import { checkout, polar, portal } from "@polar-sh/better-auth";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/db";
import { sendPasswordResetEmail } from "./notify";
import { polarClient } from "./polar";

const socialProviders: Record<
  string,
  { clientId: string; clientSecret: string }
> = {};

if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  socialProviders.github = {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
  };
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  socialProviders.google = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const plugins: any[] = [];

if (process.env.POLAR_ACCESS_TOKEN) {
  plugins.push(
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId: "f81be8a8-45e1-4e45-a1e9-b9d3fd79f814",
              slug: "pro",
            },
          ],
          successUrl: process.env.POLAR_SUCCESS_URL ?? "/workflows",
          authenticatedUsersOnly: true,
        }),
        portal(),
      ],
    }),
  );
}

export const auth = betterAuth({
  secret:
    process.env.BETTER_AUTH_SECRET ||
    "local-dev-secret-kryptonite-default-key-32bytes",
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      await sendPasswordResetEmail({ to: user.email, resetUrl: url });
    },
  },
  socialProviders,
  plugins,
});
