import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { qwenChannel } from "@/inngest/channels/qwen";
import { sendBandMessage } from "@/lib/band";
import { callLLM } from "@/lib/llm";
import { renderTemplate } from "@/lib/template";

import { AGENT_NAME, MODEL } from "./constants";
export { AGENT_NAME, MODEL };

type QwenData = {
  variableName?: string;
  systemPrompt?: string;
  userPrompt?: string;
};

export const qwenExecutor: NodeExecutor<QwenData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
  bandRoomId,
}) => {
  await publish(qwenChannel().status({ nodeId, status: "loading" }));

  if (!data.variableName) {
    await publish(qwenChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Qwen node: Variable name is missing");
  }
  if (!data.userPrompt) {
    await publish(qwenChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Qwen node: User prompt is missing");
  }

  const ctx = context as Record<string, unknown>;
  const systemPrompt = data.systemPrompt
    ? decode(renderTemplate(data.systemPrompt, ctx))
    : "You are a helpful assistant.";
  const userPrompt = decode(renderTemplate(data.userPrompt, ctx));

  if (bandRoomId)
    void sendBandMessage(bandRoomId, AGENT_NAME, `Prompt:\n${userPrompt}`);

  try {
    const text = await step.run(`qwen-generate-${nodeId}`, () =>
      callLLM(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        MODEL,
      ),
    );
    if (bandRoomId)
      void sendBandMessage(bandRoomId, AGENT_NAME, `Response:\n${text}`);
    await publish(qwenChannel().status({ nodeId, status: "success" }));
    return { ...context, [data.variableName]: { text } };
  } catch (error) {
    await publish(qwenChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
