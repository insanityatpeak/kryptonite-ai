import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { kryptoniteChannel } from "@/inngest/channels/kryptonite";

Handlebars.registerHelper(
  "json",
  (ctx) => new Handlebars.SafeString(JSON.stringify(ctx, null, 2)),
);

type OutputParserData = {
  variableName?: string;
  input?: string;
  format?: string;
};

export const outputParserExecutor: NodeExecutor<OutputParserData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(kryptoniteChannel().status({ nodeId, status: "loading" }));
  if (!data.variableName) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Output Parser: Variable name required");
  }
  if (!data.input) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Output Parser: Input required");
  }

  const input = decode(Handlebars.compile(data.input)(context));
  const format = data.format || "json";

  try {
    const result = await step.run("output-parser-run", async () => {
      let parsed: unknown;
      if (format === "json") {
        try {
          const jsonMatch =
            input.match(/```json\n?([\s\S]*?)\n?```/) ||
            input.match(/\{[\s\S]*\}/) ||
            input.match(/\[[\s\S]*\]/);
          parsed = JSON.parse(jsonMatch ? jsonMatch[1] || jsonMatch[0] : input);
        } catch {
          parsed = { raw: input, error: "Could not parse as JSON" };
        }
      } else if (format === "list") {
        parsed = input
          .split("\n")
          .map((l) => l.replace(/^[-*•]\s*/, "").trim())
          .filter(Boolean);
      } else if (format === "csv") {
        const lines = input.trim().split("\n");
        const headers = lines[0]?.split(",").map((h) => h.trim()) || [];
        parsed = lines.slice(1).map((line) => {
          const vals = line.split(",");
          return Object.fromEntries(
            headers.map((h, i) => [h, vals[i]?.trim()]),
          );
        });
      } else {
        parsed = { text: input };
      }
      return { ...context, [data.variableName!]: parsed };
    });
    await publish(kryptoniteChannel().status({ nodeId, status: "success" }));
    return result;
  } catch (err) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw err;
  }
};
