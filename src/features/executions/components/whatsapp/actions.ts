"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { whatsappChannel } from "@/inngest/channels/whatsapp";
import { inngest } from "@/inngest/client";

export type WhatsappToken = Realtime.Token<typeof whatsappChannel, ["status"]>;

export async function fetchWhatsappToken(): Promise<WhatsappToken> {
  const token = await getSubscriptionToken(inngest, {
    channel: whatsappChannel(),
    topics: ["status"],
  });

  return token;
}
