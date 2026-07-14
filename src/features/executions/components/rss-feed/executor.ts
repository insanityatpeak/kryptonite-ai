import { NonRetriableError } from "inngest";
import ky from "ky";
import type { NodeExecutor } from "@/features/executions/types";
import { rssFeedChannel } from "@/inngest/channels/rss-feed";

type RssFeedData = {
  variableName?: string;
  url?: string;
  limit?: number;
};

function parseRssItems(
  xml: string,
  limit: number,
): Array<{
  title: string;
  link: string;
  description: string;
  pubDate: string;
}> {
  const items: Array<{
    title: string;
    link: string;
    description: string;
    pubDate: string;
  }> = [];
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
    const block = match[1];
    const getTag = (tag: string) => {
      const m = new RegExp(
        `<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`,
        "i",
      ).exec(block);
      return m ? (m[1] ?? m[2] ?? "").trim() : "";
    };
    items.push({
      title: getTag("title"),
      link: getTag("link"),
      description: getTag("description").slice(0, 500),
      pubDate: getTag("pubDate"),
    });
  }
  return items;
}

export const rssFeedExecutor: NodeExecutor<RssFeedData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(rssFeedChannel().status({ nodeId, status: "loading" }));

  if (!data.url) {
    await publish(rssFeedChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("RSS Feed node: URL is required");
  }
  if (!data.variableName) {
    await publish(rssFeedChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("RSS Feed node: Variable name is required");
  }

  const limit = data.limit ?? 5;

  try {
    const result = await step.run("rss-fetch", async () => {
      const xml = await ky.get(data.url!).text();
      const items = parseRssItems(xml, limit);

      return {
        ...context,
        [data.variableName!]: { items, count: items.length },
      };
    });

    await publish(rssFeedChannel().status({ nodeId, status: "success" }));
    return result;
  } catch (error) {
    await publish(rssFeedChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
