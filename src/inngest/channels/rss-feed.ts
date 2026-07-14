import { channel, topic } from "@inngest/realtime";

export const RSS_FEED_CHANNEL_NAME = "rss-feed-execution";

export const rssFeedChannel = channel(RSS_FEED_CHANNEL_NAME).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
