"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { instagramChannel } from "@/inngest/channels/instagram";
import { inngest } from "@/inngest/client";

export type InstagramToken = Realtime.Token<
  typeof instagramChannel,
  ["status"]
>;

export async function fetchInstagramToken(): Promise<InstagramToken> {
  const token = await getSubscriptionToken(inngest, {
    channel: instagramChannel(),
    topics: ["status"],
  });

  return token;
}
