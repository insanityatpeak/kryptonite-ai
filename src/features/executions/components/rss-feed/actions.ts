"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { rssFeedChannel } from "@/inngest/channels/rss-feed";
import { inngest } from "@/inngest/client";

export type RssFeedToken = Realtime.Token<typeof rssFeedChannel, ["status"]>;

export async function fetchRssFeedToken(): Promise<RssFeedToken> {
  const token = await getSubscriptionToken(inngest, {
    channel: rssFeedChannel(),
    topics: ["status"],
  });

  return token;
}
