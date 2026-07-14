import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { kryptoniteChannel } from "@/inngest/channels/kryptonite";
import { sendBandMessage } from "@/lib/band";
import { callLLM } from "@/lib/llm";
import { renderTemplate } from "@/lib/template";

type TextClassifierData = {
  variableName?: string;
  text?: string;
  categories?: string;
  model?: string;
};

export const textClassifierExecutor: NodeExecutor<TextClassifierData> = async ({
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
    throw new NonRetriableError("Text Classifier: Variable name required");
  }
  if (!data.text) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Text Classifier: Text required");
  }
  if (!data.categories) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Text Classifier: Categories required");
  }

  const text = decode(
    renderTemplate(data.text, context as Record<string, unknown>),
  );
  const categories = data.categories;
  const model = data.model || "openai/gpt-oss-20b:free";
  const systemPrompt = `Classify the given text into exactly one of these categories: ${categories}. Respond with JSON: {"category": "...", "confidence": 0.0-1.0, "reasoning": "..."}`;

  if (bandRoomId)
    void sendBandMessage(
      bandRoomId,
      "Text Classifier",
      `📥 Classifying into: ${categories}`,
    );

  try {
    const raw = await step.run(`text-classifier-run-${nodeId}`, () =>
      callLLM(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        model,
      ),
    );
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { category: raw };
    }
    if (bandRoomId)
      void sendBandMessage(bandRoomId, "Text Classifier", `✅ Result: ${raw}`);
    await publish(kryptoniteChannel().status({ nodeId, status: "success" }));
    return { ...context, [data.variableName!]: parsed };
  } catch (err) {
    if (bandRoomId)
      void sendBandMessage(
        bandRoomId,
        "Text Classifier",
        `❌ Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw err;
  }
};
