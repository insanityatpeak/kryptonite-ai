import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { kryptoniteChannel } from "@/inngest/channels/kryptonite";

Handlebars.registerHelper(
  "json",
  (ctx) => new Handlebars.SafeString(JSON.stringify(ctx, null, 2)),
);

type AiMemoryData = {
  variableName?: string;
  operation?: string;
  key?: string;
  value?: string;
  memoryKey?: string;
};

export const aiMemoryExecutor: NodeExecutor<AiMemoryData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(kryptoniteChannel().status({ nodeId, status: "loading" }));
  if (!data.variableName) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("AI Memory: Variable name required");
  }

  const operation = data.operation || "get";
  const key = decode(Handlebars.compile(data.key || "memory")(context));
  const memoryStore = (context.__memory as Record<string, unknown>) || {};

  try {
    const result = await step.run("ai-memory-run", async () => {
      if (operation === "set") {
        const value = decode(Handlebars.compile(data.value || "")(context));
        const updatedMemory = { ...memoryStore, [key]: value };
        return {
          ...context,
          __memory: updatedMemory,
          [data.variableName!]: { operation: "set", key, value },
        };
      } else if (operation === "append") {
        const existing = Array.isArray(memoryStore[key])
          ? (memoryStore[key] as unknown[])
          : [];
        const value = decode(Handlebars.compile(data.value || "")(context));
        const updatedMemory = { ...memoryStore, [key]: [...existing, value] };
        return {
          ...context,
          __memory: updatedMemory,
          [data.variableName!]: {
            operation: "append",
            key,
            memory: updatedMemory[key],
          },
        };
      } else if (operation === "clear") {
        const updatedMemory = { ...memoryStore };
        delete updatedMemory[key];
        return {
          ...context,
          __memory: updatedMemory,
          [data.variableName!]: { operation: "clear", key },
        };
      } else {
        return {
          ...context,
          [data.variableName!]: {
            operation: "get",
            key,
            value: memoryStore[key] ?? null,
          },
        };
      }
    });
    await publish(kryptoniteChannel().status({ nodeId, status: "success" }));
    return result;
  } catch (err) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw err;
  }
};
