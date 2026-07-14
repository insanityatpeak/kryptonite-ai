import { channel, topic } from "@inngest/realtime";

export const KRYPTONITE_CHANNEL_NAME = "kryptonite-execution";

export const kryptoniteChannel = channel(KRYPTONITE_CHANNEL_NAME).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
