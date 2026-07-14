import { channel, topic } from "@inngest/realtime";

export const LINKEDIN_CHANNEL_NAME = "linkedin-execution";

export const linkedinChannel = channel(LINKEDIN_CHANNEL_NAME).addTopic(
  topic("status").type<{
    nodeId: string;
    status: "loading" | "success" | "error";
  }>(),
);
