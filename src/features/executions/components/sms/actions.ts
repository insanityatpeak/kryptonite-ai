"use server";

import { getSubscriptionToken, type Realtime } from "@inngest/realtime";
import { smsChannel } from "@/inngest/channels/sms";
import { inngest } from "@/inngest/client";

export type SmsToken = Realtime.Token<typeof smsChannel, ["status"]>;

export async function fetchSmsToken(): Promise<SmsToken> {
  const token = await getSubscriptionToken(inngest, {
    channel: smsChannel(),
    topics: ["status"],
  });

  return token;
}
