import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { kryptoniteChannel } from "@/inngest/channels/kryptonite";
import { sendBandMessage } from "@/lib/band";
import { callLLM } from "@/lib/llm";
import { renderTemplate } from "@/lib/template";

type InfoExtractorData = {
  variableName?: string;
  text?: string;
  schema?: string;
  model?: string;
};

export const infoExtractorExecutor: NodeExecutor<InfoExtractorData> = async ({
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
    throw new NonRetriableError("Info Extractor: Variable name required");
  }
  if (!data.text) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Info Extractor: Text required");
  }

  const text = decode(
    renderTemplate(data.text, context as Record<string, unknown>),
  );
  const schema = data.schema || "{ name, email, phone, company }";
  const model = data.model || "openai/gpt-oss-20b:free";
  const systemPrompt = `Extract structured information from the text. Return a JSON object matching this schema: ${schema}. Use null for missing fields.`;

  if (bandRoomId)
    void sendBandMessage(
      bandRoomId,
      "Info Extractor",
      `📥 Extracting schema: ${schema}`,
    );

  try {
    const raw = await step.run(`info-extractor-run-${nodeId}`, () =>
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
      parsed = { raw };
    }
    if (bandRoomId)
      void sendBandMessage(
        bandRoomId,
        "Info Extractor",
        `✅ Extracted:\n${raw}`,
      );
    await publish(kryptoniteChannel().status({ nodeId, status: "success" }));
    return { ...context, [data.variableName!]: parsed };
  } catch (err) {
    if (bandRoomId)
      void sendBandMessage(
        bandRoomId,
        "Info Extractor",
        `❌ Error: ${err instanceof Error ? err.message : String(err)}`,
      );
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw err;
  }
};
