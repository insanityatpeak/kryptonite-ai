import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { mistralChannel } from "@/inngest/channels/mistral";
import { sendBandMessage } from "@/lib/band";
import { callLLM } from "@/lib/llm";
import { renderTemplate } from "@/lib/template";

// Mistral AI doesn't publish a working free model on OpenRouter directly —
// this is a community fine-tune of Mistral's open-weight base model.
import { AGENT_NAME, MODEL } from "./constants";
export { AGENT_NAME, MODEL };

type MistralData = {
  variableName?: string;
  systemPrompt?: string;
  userPrompt?: string;
};

export const mistralExecutor: NodeExecutor<MistralData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
  bandRoomId,
}) => {
  await publish(mistralChannel().status({ nodeId, status: "loading" }));

  if (!data.variableName) {
    await publish(mistralChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Mistral node: Variable name is missing");
  }
  if (!data.userPrompt) {
    await publish(mistralChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Mistral node: User prompt is missing");
  }

  const ctx = context as Record<string, unknown>;
  const systemPrompt = data.systemPrompt
    ? decode(renderTemplate(data.systemPrompt, ctx))
    : "You are a helpful assistant.";
  const userPrompt = decode(renderTemplate(data.userPrompt, ctx));

  if (bandRoomId)
    void sendBandMessage(bandRoomId, AGENT_NAME, `Prompt:\n${userPrompt}`);

  try {
    const text = await step.run(`mistral-generate-${nodeId}`, () =>
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
    await publish(mistralChannel().status({ nodeId, status: "success" }));
    return { ...context, [data.variableName]: { text } };
  } catch (error) {
    await publish(mistralChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
