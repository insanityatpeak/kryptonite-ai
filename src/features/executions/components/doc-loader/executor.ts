import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import ky from "ky";
import type { NodeExecutor } from "@/features/executions/types";
import { kryptoniteChannel } from "@/inngest/channels/kryptonite";

Handlebars.registerHelper(
  "json",
  (ctx) => new Handlebars.SafeString(JSON.stringify(ctx, null, 2)),
);

type DocLoaderData = { variableName?: string; url?: string; selector?: string };

export const docLoaderExecutor: NodeExecutor<DocLoaderData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(kryptoniteChannel().status({ nodeId, status: "loading" }));
  if (!data.variableName) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Doc Loader: Variable name required");
  }
  if (!data.url) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Doc Loader: URL required");
  }

  const url = decode(Handlebars.compile(data.url)(context));

  try {
    const result = await step.run("doc-loader-run", async () => {
      const response = await ky.get(url, {
        headers: { "User-Agent": "Kryptonite-Bot/1.0" },
        timeout: 30000,
        throwHttpErrors: false,
      });
      const contentType = response.headers.get("content-type") || "";
      let content: string;
      if (contentType.includes("json")) {
        const json = await response.json();
        content = JSON.stringify(json, null, 2);
      } else {
        content = await response.text();
        content = content
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      }
      return {
        ...context,
        [data.variableName!]: {
          content,
          url,
          length: content.length,
          contentType,
        },
      };
    });
    await publish(kryptoniteChannel().status({ nodeId, status: "success" }));
    return result;
  } catch (err) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw err;
  }
};
