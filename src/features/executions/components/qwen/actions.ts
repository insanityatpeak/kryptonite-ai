"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { qwenChannel } from "@/inngest/channels/qwen";
import { inngest } from "@/inngest/client";

export type QwenToken = Realtime.Token<typeof qwenChannel, ["status"]>;

export async function fetchQwenToken(): Promise<QwenToken> {
  const token = await getSubscriptionToken(inngest, {
    channel: qwenChannel(),
    topics: ["status"],
  });

  return token;
}
