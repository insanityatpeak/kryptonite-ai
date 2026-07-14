import { type NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { getBandMessages } from "@/lib/band";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  await requireAuth();
  const { roomId } = await params;
  const messages = await getBandMessages(roomId);
  return NextResponse.json({ messages });
}
