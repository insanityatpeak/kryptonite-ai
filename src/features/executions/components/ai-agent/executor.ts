import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { kryptoniteChannel } from "@/inngest/channels/kryptonite";
import { sendBandMessage } from "@/lib/band";
import { callLLM } from "@/lib/llm";

Handlebars.registerHelper(
  "json",
  (ctx) => new Handlebars.SafeString(JSON.stringify(ctx, null, 2)),
);

type AiAgentData = {
  variableName?: string;
  systemPrompt?: string;
  userPrompt?: string;
  model?: string;
  tools?: string;
  maxIterations?: number;
};

export const aiAgentExecutor: NodeExecutor<AiAgentData> = async ({
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
    throw new NonRetriableError("AI Agent: Variable name is required");
  }
  if (!data.userPrompt) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("AI Agent: Prompt is required");
  }

  const model = data.model || "openai/gpt-oss-20b:free";
  const agentName =
    ((data as Record<string, unknown>).name as string) || "AI Agent";
  const systemPrompt = decode(
    Handlebars.compile(
      data.systemPrompt ||
        "You are a helpful AI agent. Complete the task given to you.",
    )(context),
  );
  const userPrompt = decode(Handlebars.compile(data.userPrompt)(context));

  if (bandRoomId)
    void sendBandMessage(
      bandRoomId,
      agentName,
      `📥 Task received:\n${userPrompt}`,
    );

  try {
    const result = await step.run("ai-agent-run", async () => {
      // Tries `model` first, but falls through the shared free-model pool on
      // a dead model (404) or rate limit (429) instead of hard-failing.
      const text = await callLLM(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        model,
        1200,
        ((data as Record<string, unknown>).apiKey as string | undefined) ||
          ((context as Record<string, unknown>).__apiKey as string | undefined),
      );
      if (bandRoomId)
        void sendBandMessage(bandRoomId, agentName, `✅ Response:\n${text}`);
      return {
        ...context,
        [data.variableName!]: { text, model, role: "agent" },
      };
    });

    await publish(kryptoniteChannel().status({ nodeId, status: "success" }));
    return result;
  } catch (error) {
    if (bandRoomId)
      void sendBandMessage(
        bandRoomId,
        agentName,
        `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
