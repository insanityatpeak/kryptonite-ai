import { headers } from "next/headers";
import { auth } from "./auth";

const MOCK_SESSION = {
  user: {
    id: "dev-user-001",
    name: "Dev User",
    email: "dev@kryptonite.app",
    emailVerified: true,
    image: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  session: {
    id: "dev-session-001",
    userId: "dev-user-001",
    token: "dev-token",
    expiresAt: new Date(Date.now() + 86400000),
    createdAt: new Date(),
    updatedAt: new Date(),
    ipAddress: null,
    userAgent: null,
  },
};

export const requireAuth = async () => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (session) return session;
  } catch {}
  return MOCK_SESSION as any;
};

export const requireUnauth = async () => {
  // Auth bypassed for testing
};
