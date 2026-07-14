import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { kryptoniteChannel } from "@/inngest/channels/kryptonite";
import { sendBandMessage } from "@/lib/band";
import { callLLM } from "@/lib/llm";
import { renderTemplate } from "@/lib/template";
import { SEARCH_INTEGRATIONS } from "./integrations";

const AGENT_NAME = "Autonomous Search Agent";

type AutonomousSearchAgentData = {
  variableName?: string;
  prompt?: string;
  integrations?: string[];
  integrationKeys?: Record<string, string>;
  dateFrom?: string;
  dateTo?: string;
  outputFormat?: string;
  allowAgentActions?: boolean;
};

type ReasoningStep = { step: string; detail: string };

type AgentResult = {
  integrationsSearched: {
    id: string;
    label: string;
    status: "connected" | "no_key_provided";
  }[];
  reasoningSteps: ReasoningStep[];
  findingsSummary: string;
  suggestedActions: string[];
  confidenceScore: number;
};

function safeParseJson(text: string): AgentResult | null {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

export const autonomousSearchAgentExecutor: NodeExecutor<
  AutonomousSearchAgentData
> = async ({ data, nodeId, context, step, publish, bandRoomId }) => {
  await publish(kryptoniteChannel().status({ nodeId, status: "loading" }));

  if (!data.variableName) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(
      "Autonomous Search Agent: Variable name is required",
    );
  }
  if (!data.prompt) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Autonomous Search Agent: Prompt is required");
  }

  const prompt = renderTemplate(data.prompt, context);
  const selectedIntegrations = data.integrations ?? [];
  const integrationKeys = data.integrationKeys ?? {};
  const connectedIntegrations = SEARCH_INTEGRATIONS.filter((i) =>
    selectedIntegrations.includes(i.id),
  );

  if (bandRoomId) {
    void sendBandMessage(
      bandRoomId,
      AGENT_NAME,
      `📥 Investigating:\n${prompt}`,
    );
  }

  const integrationsList =
    connectedIntegrations.length > 0
      ? connectedIntegrations
          .map(
            (i) =>
              `- ${i.label}${integrationKeys[i.id] ? " (key provided)" : " (no key provided)"}`,
          )
          .join("\n")
      : "- None selected";

  const systemPrompt = `You are the planning brain of an autonomous search agent inside a workflow automation tool called Kryptonite.
Given a user's natural-language request and a list of connected integrations, decide which integrations are relevant,
what data should be retrieved, what filters apply, and how results should be combined.
You do NOT have live API access to these integrations in this environment — never invent specific real records (no fake email subjects, names, or amounts).
Instead, describe the plan you would execute and produce a clearly labeled demonstration-style summary of what the final output would look like once connected.
Respond ONLY with strict JSON matching this shape:
{
  "integrationsSearched": [{"id": string, "label": string, "status": "connected" | "no_key_provided"}],
  "reasoningSteps": [{"step": string, "detail": string}],
  "findingsSummary": string,
  "suggestedActions": string[],
  "confidenceScore": number
}
confidenceScore is 0-100 and should be low (under 40) when no integration keys were provided, since no real data could be retrieved.`;

  const userPrompt = `Request: ${prompt}
${data.dateFrom || data.dateTo ? `Date range: ${data.dateFrom || "any"} to ${data.dateTo || "any"}` : ""}
Output format requested: ${data.outputFormat || "summary"}
Agent actions allowed: ${data.allowAgentActions ? "yes" : "no"}
Connected integrations:
${integrationsList}`;

  try {
    const text = await step.run(`autonomous-search-agent-${nodeId}`, () =>
      callLLM(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        undefined,
        900,
      ),
    );

    const parsed = safeParseJson(text);
    const result: AgentResult = parsed ?? {
      integrationsSearched: connectedIntegrations.map((i) => ({
        id: i.id,
        label: i.label,
        status: integrationKeys[i.id] ? "connected" : "no_key_provided",
      })),
      reasoningSteps: [{ step: "Plan", detail: text.slice(0, 600) }],
      findingsSummary: text.slice(0, 1200),
      suggestedActions: [],
      confidenceScore: connectedIntegrations.some((i) => integrationKeys[i.id])
        ? 35
        : 10,
    };

    if (bandRoomId) {
      void sendBandMessage(
        bandRoomId,
        AGENT_NAME,
        `✅ Plan ready (confidence ${result.confidenceScore}%):\n${result.findingsSummary.slice(0, 400)}`,
      );
    }

    await publish(kryptoniteChannel().status({ nodeId, status: "success" }));

    return {
      ...context,
      [data.variableName]: {
        text: result.findingsSummary,
        json: result,
        searchResults: result.findingsSummary,
        summary: result.findingsSummary,
        structuredJson: result,
        suggestedActions: result.suggestedActions,
        report: result.findingsSummary,
        confidenceScore: result.confidenceScore,
      },
    };
  } catch (error) {
    if (bandRoomId)
      void sendBandMessage(
        bandRoomId,
        AGENT_NAME,
        `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
      );
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
