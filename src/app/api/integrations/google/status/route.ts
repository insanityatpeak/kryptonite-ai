import { requireAuth } from "@/lib/auth-utils";
import prisma from "@/lib/db";

export async function GET() {
  const session = await requireAuth();

  const account = await prisma.googleAccount.findUnique({
    where: { userId: session.user.id },
    select: { email: true },
  });

  return Response.json({ connected: !!account, email: account?.email ?? null });
}
