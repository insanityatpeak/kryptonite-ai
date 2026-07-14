"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { kryptoniteChannel } from "@/inngest/channels/kryptonite";
import { inngest } from "@/inngest/client";

export type KryptoniteToken = Realtime.Token<
  typeof kryptoniteChannel,
  ["status"]
>;

export async function fetchKryptoniteToken(): Promise<KryptoniteToken> {
  return getSubscriptionToken(inngest, {
    channel: kryptoniteChannel(),
    topics: ["status"],
  });
}
