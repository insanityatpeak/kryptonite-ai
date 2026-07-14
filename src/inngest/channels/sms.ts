import { channel, topic } from "@inngest/realtime";

export const SMS_CHANNEL_NAME = "sms-execution";

export const smsChannel = channel(SMS_CHANNEL_NAME).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
