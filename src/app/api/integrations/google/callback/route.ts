import { requireAuth } from "@/lib/auth-utils";
import {
  decodeState,
  exchangeCodeForTokens,
  saveGoogleAccount,
} from "@/lib/google-oauth";

export async function GET(req: Request) {
  const session = await requireAuth();
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  const fallbackReturnTo = "/workflows";

  if (error) {
    return Response.redirect(
      `${fallbackReturnTo}?google_error=${encodeURIComponent(error)}`,
    );
  }
  if (!code || !state) {
    return Response.redirect(`${fallbackReturnTo}?google_error=missing_code`);
  }

  let returnTo = fallbackReturnTo;
  try {
    const decoded = decodeState(state);
    returnTo = decoded.returnTo || fallbackReturnTo;

    if (decoded.userId !== session.user.id) {
      return Response.redirect(
        `${fallbackReturnTo}?google_error=session_mismatch`,
      );
    }

    const tokens = await exchangeCodeForTokens(code);
    await saveGoogleAccount(session.user.id, tokens);

    const url = new URL(
      returnTo,
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    );
    url.searchParams.set("google_connected", "1");
    return Response.redirect(url.toString());
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    console.error("[google-oauth-callback] failed:", err);
    const url = new URL(
      returnTo,
      process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    );
    url.searchParams.set("google_error", message);
    return Response.redirect(url.toString());
  }
}
