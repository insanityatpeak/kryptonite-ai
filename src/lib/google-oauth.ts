import prisma from "@/lib/db";
import { decrypt, encrypt } from "@/lib/encryption";

const GMAIL_READONLY_SCOPE = "https://www.googleapis.com/auth/gmail.readonly";
const USERINFO_EMAIL_SCOPE = "https://www.googleapis.com/auth/userinfo.email";
const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";

function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")
  );
}

export function getGoogleRedirectUri() {
  return `${getAppUrl()}/api/integrations/google/callback`;
}

/**
 * Builds the Google consent screen URL for the Gmail-readonly scope.
 * `state` should be opaque and verified on callback (we encrypt the userId into it).
 */
export function getGoogleAuthUrl(userId: string, returnTo: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("GOOGLE_CLIENT_ID is not configured");

  const state = encrypt(JSON.stringify({ userId, returnTo }));

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGoogleRedirectUri(),
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope: `${GMAIL_READONLY_SCOPE} ${USERINFO_EMAIL_SCOPE} ${SHEETS_SCOPE}`,
    state,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function decodeState(state: string): {
  userId: string;
  returnTo: string;
} {
  return JSON.parse(decrypt(state));
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export async function exchangeCodeForTokens(
  code: string,
): Promise<TokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret)
    throw new Error("Google OAuth is not configured");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: getGoogleRedirectUri(),
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token exchange failed: ${text}`);
  }

  return res.json();
}

async function refreshAccessToken(
  refreshToken: string,
): Promise<TokenResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret)
    throw new Error("Google OAuth is not configured");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google token refresh failed: ${text}`);
  }

  return res.json();
}

export async function fetchGoogleEmail(accessToken: string): Promise<string> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error("Failed to fetch Google account info");
  const json = (await res.json()) as { email: string };
  return json.email;
}

export async function saveGoogleAccount(userId: string, tokens: TokenResponse) {
  const email = await fetchGoogleEmail(tokens.access_token);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

  return prisma.googleAccount.upsert({
    where: { userId },
    create: {
      userId,
      email,
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token ?? ""),
      scope: tokens.scope,
      expiresAt,
    },
    update: {
      email,
      accessToken: encrypt(tokens.access_token),
      ...(tokens.refresh_token
        ? { refreshToken: encrypt(tokens.refresh_token) }
        : {}),
      scope: tokens.scope,
      expiresAt,
    },
  });
}

/**
 * Returns a valid (non-expired) access token for the user's connected Google account,
 * refreshing it first if needed. Throws if the user hasn't connected Google.
 */
export async function getValidGoogleAccessToken(
  userId: string,
): Promise<string> {
  const account = await prisma.googleAccount.findUnique({ where: { userId } });
  if (!account) {
    throw new Error(
      "No Google account connected. Connect your Google account in the node settings first.",
    );
  }

  const expiresInMs = account.expiresAt.getTime() - Date.now();
  if (expiresInMs > 60_000) {
    return decrypt(account.accessToken);
  }

  const refreshToken = decrypt(account.refreshToken);
  if (!refreshToken) {
    throw new Error(
      "Google account connection expired. Reconnect your Google account in the node settings.",
    );
  }

  const tokens = await refreshAccessToken(refreshToken);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
  await prisma.googleAccount.update({
    where: { userId },
    data: { accessToken: encrypt(tokens.access_token), expiresAt },
  });

  return tokens.access_token;
}
