import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import ky from "ky";
import type { NodeExecutor } from "@/features/executions/types";
import { notionChannel } from "@/inngest/channels/notion";

Handlebars.registerHelper("json", (context) => {
  return new Handlebars.SafeString(JSON.stringify(context, null, 2));
});

type NotionData = {
  variableName?: string;
  apiKey?: string;
  databaseId?: string;
  title?: string;
  content?: string;
};

export const notionExecutor: NodeExecutor<NotionData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(notionChannel().status({ nodeId, status: "loading" }));

  if (!data.apiKey) {
    await publish(notionChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Notion node: API key is required");
  }
  if (!data.databaseId) {
    await publish(notionChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Notion node: Database ID is required");
  }
  if (!data.title) {
    await publish(notionChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Notion node: Title is required");
  }
  if (!data.variableName) {
    await publish(notionChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Notion node: Variable name is required");
  }

  const title = decode(Handlebars.compile(data.title)(context));
  const content = data.content
    ? decode(Handlebars.compile(data.content)(context))
    : "";

  try {
    const result = await step.run("notion-create-page", async () => {
      const page = await ky
        .post("https://api.notion.com/v1/pages", {
          headers: {
            Authorization: `Bearer ${data.apiKey}`,
            "Notion-Version": "2022-06-28",
            "Content-Type": "application/json",
          },
          json: {
            parent: { database_id: data.databaseId },
            properties: {
              Name: { title: [{ text: { content: title } }] },
            },
            children: content
              ? [
                  {
                    object: "block",
                    type: "paragraph",
                    paragraph: {
                      rich_text: [{ type: "text", text: { content } }],
                    },
                  },
                ]
              : [],
          },
        })
        .json<{ id: string; url: string }>();

      return {
        ...context,
        [data.variableName!]: { pageId: page.id, url: page.url, title },
      };
    });

    await publish(notionChannel().status({ nodeId, status: "success" }));
    return result;
  } catch (error) {
    await publish(notionChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
