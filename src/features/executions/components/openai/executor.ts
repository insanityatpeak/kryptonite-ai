import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { openAiChannel } from "@/inngest/channels/openai";
import { sendBandMessage } from "@/lib/band";
import { callLLM } from "@/lib/llm";
import { renderTemplate } from "@/lib/template";

import { AGENT_NAME, MODEL } from "./constants";
export { AGENT_NAME, MODEL };

type OpenAiData = {
  variableName?: string;
  systemPrompt?: string;
  userPrompt?: string;
};

export const openAiExecutor: NodeExecutor<OpenAiData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
  bandRoomId,
}) => {
  await publish(openAiChannel().status({ nodeId, status: "loading" }));

  if (!data.variableName) {
    await publish(openAiChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("OpenAI node: Variable name is missing");
  }
  if (!data.userPrompt) {
    await publish(openAiChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("OpenAI node: User prompt is missing");
  }

  const ctx = context as Record<string, unknown>;
  const systemPrompt = data.systemPrompt
    ? decode(renderTemplate(data.systemPrompt, ctx))
    : "You are a helpful assistant.";
  const userPrompt = decode(renderTemplate(data.userPrompt, ctx));

  if (bandRoomId)
    void sendBandMessage(bandRoomId, AGENT_NAME, `Prompt:\n${userPrompt}`);

  try {
    const text = await step.run(`openai-generate-${nodeId}`, () =>
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
    await publish(openAiChannel().status({ nodeId, status: "success" }));
    return { ...context, [data.variableName]: { text } };
  } catch (error) {
    await publish(openAiChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
