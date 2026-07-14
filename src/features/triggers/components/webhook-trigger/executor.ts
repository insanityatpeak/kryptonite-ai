import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { kryptoniteChannel } from "@/inngest/channels/kryptonite";

type WebhookData = { variableName?: string; path?: string };

export const webhookTriggerExecutor: NodeExecutor<WebhookData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(kryptoniteChannel().status({ nodeId, status: "loading" }));
  if (!data.variableName) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Webhook: Variable name required");
  }
  const result = await step.run("webhook-trigger", async () => {
    return {
      ...context,
      [data.variableName!]: {
        triggered: true,
        path: data.path || "/webhook",
        receivedAt: new Date().toISOString(),
        payload: context,
      },
    };
  });
  await publish(kryptoniteChannel().status({ nodeId, status: "success" }));
  return result;
};
