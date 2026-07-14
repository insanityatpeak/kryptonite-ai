import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { kryptoniteChannel } from "@/inngest/channels/kryptonite";
import { type GmailMessage, searchGmail } from "@/lib/gmail";
import { getValidGoogleAccessToken } from "@/lib/google-oauth";
import { callLLM } from "@/lib/llm";
import { renderTemplate } from "@/lib/template";

const AGENT_NAME = "Gmail Search";

type GmailSearchData = {
  variableName?: string;
  prompt?: string;
  maxResults?: number;
};

function buildQueryPrompt(prompt: string): { role: string; content: string }[] {
  return [
    {
      role: "system",
      content: `Convert the user's request into a single Gmail search query using Gmail's search operators
(from:, to:, subject:, after:YYYY/MM/DD, before:YYYY/MM/DD, newer_than:Nd, older_than:Nd, has:attachment, is:unread, etc).
Respond with ONLY the raw query string on one line — no explanation, no quotes, no markdown.`,
    },
    { role: "user", content: prompt },
  ];
}

function summarizePrompt(
  userPrompt: string,
  messages: GmailMessage[],
): { role: string; content: string }[] {
  const listing = messages
    .map(
      (m, i) =>
        `${i + 1}. From: ${m.from} | Subject: ${m.subject} | Date: ${m.date}\n   ${m.snippet}`,
    )
    .join("\n");

  return [
    {
      role: "system",
      content: `You summarize real Gmail search results for the user. Only use the data given below — never invent
emails, senders, dates, or amounts that are not present in the list. If the list is empty, say no matching emails were found.`,
    },
    {
      role: "user",
      content: `Original request: ${userPrompt}\n\nMatching emails:\n${listing || "(none found)"}\n\nWrite a short, direct summary answering the request using only this data.`,
    },
  ];
}

export const gmailSearchExecutor: NodeExecutor<GmailSearchData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
  userId,
}) => {
  await publish(kryptoniteChannel().status({ nodeId, status: "loading" }));

  if (!data.variableName) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Gmail Search: Variable name is required");
  }
  if (!data.prompt) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Gmail Search: Prompt is required");
  }

  const prompt = renderTemplate(data.prompt, context);
  const maxResults = Math.min(Math.max(Number(data.maxResults) || 5, 1), 20);

  try {
    const accessToken = await step.run(`gmail-search-auth-${nodeId}`, () =>
      getValidGoogleAccessToken(userId),
    );

    const query = (
      await step.run(`gmail-search-query-${nodeId}`, () =>
        callLLM(buildQueryPrompt(prompt), undefined, 60),
      )
    )
      .trim()
      .replace(/^["'`]+|["'`]+$/g, "");

    const messages = await step.run(`gmail-search-fetch-${nodeId}`, () =>
      searchGmail(accessToken, query, maxResults),
    );

    const summary = await step.run(`gmail-search-summarize-${nodeId}`, () =>
      callLLM(summarizePrompt(prompt, messages), undefined, 500),
    );

    await publish(kryptoniteChannel().status({ nodeId, status: "success" }));

    return {
      ...context,
      [data.variableName]: {
        text: summary,
        query,
        count: messages.length,
        emails: messages,
      },
    };
  } catch (error) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw error instanceof Error &&
      /Connect your Google account|Reconnect your Google account/.test(
        error.message,
      )
      ? new NonRetriableError(error.message)
      : error;
  }
};
