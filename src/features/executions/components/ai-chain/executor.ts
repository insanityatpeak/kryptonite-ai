import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { kryptoniteChannel } from "@/inngest/channels/kryptonite";
import { sendBandMessage } from "@/lib/band";
import { callLLM } from "@/lib/llm";
import { renderTemplate } from "@/lib/template";

type AiChainData = {
  variableName?: string;
  prompt?: string;
  model?: string;
  name?: string;
};

export const aiChainExecutor: NodeExecutor<AiChainData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
  bandRoomId,
}) => {
  await publish(kryptoniteChannel().status({ nodeId, status: "loading" }));
  if (!data.variableName) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("AI Chain: Variable name required");
  }
  if (!data.prompt) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("AI Chain: Prompt required");
  }

  const prompt = decode(
    renderTemplate(data.prompt, context as Record<string, unknown>),
  );
  const model = data.model || "openai/gpt-oss-20b:free";
  const agentName = data.name || "AI Chain";

  if (bandRoomId)
    void sendBandMessage(bandRoomId, agentName, `📥 Processing:\n${prompt}`);

  try {
    const text = await step.run(`ai-chain-run-${nodeId}`, () =>
      callLLM(
        [{ role: "user", content: prompt }],
        model,
        800,
        ((data as Record<string, unknown>).apiKey as string | undefined) ||
          ((context as Record<string, unknown>).__apiKey as string | undefined),
      ),
    );
    if (bandRoomId)
      void sendBandMessage(bandRoomId, agentName, `✅ Response:\n${text}`);
    await publish(kryptoniteChannel().status({ nodeId, status: "success" }));
    return { ...context, [data.variableName!]: { text, model } };
  } catch (err) {
    if (bandRoomId)
      void sendBandMessage(
        bandRoomId,
        agentName,
        `❌ Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw err;
  }
};
