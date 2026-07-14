import { requireAuth } from "@/lib/auth-utils";
import { getGoogleAuthUrl } from "@/lib/google-oauth";

export async function GET(req: Request) {
  const session = await requireAuth();
  const { searchParams } = new URL(req.url);
  const returnTo = searchParams.get("returnTo") ?? "/workflows";

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return Response.json(
      {
        error:
          "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
      },
      { status: 500 },
    );
  }

  const url = getGoogleAuthUrl(session.user.id, returnTo);
  return Response.redirect(url);
}
