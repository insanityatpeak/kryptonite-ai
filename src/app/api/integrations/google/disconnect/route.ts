import { requireAuth } from "@/lib/auth-utils";
import prisma from "@/lib/db";

export async function POST() {
  const session = await requireAuth();

  await prisma.googleAccount.deleteMany({ where: { userId: session.user.id } });

  return Response.json({ ok: true });
}
