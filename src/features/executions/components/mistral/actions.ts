"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { mistralChannel } from "@/inngest/channels/mistral";
import { inngest } from "@/inngest/client";

export type MistralToken = Realtime.Token<typeof mistralChannel, ["status"]>;

export async function fetchMistralToken(): Promise<MistralToken> {
  const token = await getSubscriptionToken(inngest, {
    channel: mistralChannel(),
    topics: ["status"],
  });

  return token;
}
