import { channel, topic } from "@inngest/realtime";

export const TWITTER_CHANNEL_NAME = "twitter-execution";

export const twitterChannel = channel(TWITTER_CHANNEL_NAME).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
