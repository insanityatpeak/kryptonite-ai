import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import ky from "ky";
import type { NodeExecutor } from "@/features/executions/types";
import { githubChannel } from "@/inngest/channels/github";

Handlebars.registerHelper("json", (context) => {
  return new Handlebars.SafeString(JSON.stringify(context, null, 2));
});

type GitHubData = {
  variableName?: string;
  token?: string;
  owner?: string;
  repo?: string;
  title?: string;
  body?: string;
};

export const githubExecutor: NodeExecutor<GitHubData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(githubChannel().status({ nodeId, status: "loading" }));

  if (!data.token) {
    await publish(githubChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(
      "GitHub node: Personal access token is required",
    );
  }
  if (!data.owner) {
    await publish(githubChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("GitHub node: Owner is required");
  }
  if (!data.repo) {
    await publish(githubChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("GitHub node: Repository name is required");
  }
  if (!data.title) {
    await publish(githubChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("GitHub node: Issue title is required");
  }
  if (!data.variableName) {
    await publish(githubChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("GitHub node: Variable name is required");
  }

  const title = decode(Handlebars.compile(data.title)(context));
  const body = data.body ? decode(Handlebars.compile(data.body)(context)) : "";

  try {
    const result = await step.run("github-create-issue", async () => {
      const issue = await ky
        .post(
          `https://api.github.com/repos/${data.owner}/${data.repo}/issues`,
          {
            headers: {
              Authorization: `Bearer ${data.token}`,
              Accept: "application/vnd.github+json",
              "X-GitHub-Api-Version": "2022-11-28",
            },
            json: { title, body },
          },
        )
        .json<{ number: number; html_url: string; title: string }>();

      return {
        ...context,
        [data.variableName!]: {
          issueNumber: issue.number,
          url: issue.html_url,
          title: issue.title,
        },
      };
    });

    await publish(githubChannel().status({ nodeId, status: "success" }));
    return result;
  } catch (error) {
    await publish(githubChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
