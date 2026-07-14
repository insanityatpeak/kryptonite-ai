import { channel, topic } from "@inngest/realtime";

export const QWEN_CHANNEL_NAME = "qwen-execution";

export const qwenChannel = channel(QWEN_CHANNEL_NAME).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
