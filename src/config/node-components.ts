import type { NodeTypes } from "@xyflow/react";
import { InitialNode } from "@/components/initial-node";
import { AiAgentNode } from "@/features/executions/components/ai-agent/node";
import { AiChainNode } from "@/features/executions/components/ai-chain/node";
import { AiMemoryNode } from "@/features/executions/components/ai-memory/node";
import { AnthropicNode } from "@/features/executions/components/anthropic/node";
import { AutonomousSearchAgentNode } from "@/features/executions/components/autonomous-search-agent/node";
import { DiscordNode } from "@/features/executions/components/discord/node";
import { DocLoaderNode } from "@/features/executions/components/doc-loader/node";
import { EmailNode } from "@/features/executions/components/email/node";
import { EmbeddingsNode } from "@/features/executions/components/embeddings/node";
import { GeminiNode } from "@/features/executions/components/gemini/node";
import { GitHubNode } from "@/features/executions/components/github/node";
import { GmailSearchNode } from "@/features/executions/components/gmail-search/node";
import { GoogleSheetsNode } from "@/features/executions/components/google-sheets/node";
import { HttpRequestNode } from "@/features/executions/components/http-request/node";
import { InfoExtractorNode } from "@/features/executions/components/info-extractor/node";
import { InstagramNode } from "@/features/executions/components/instagram/node";
import { LinkedInNode } from "@/features/executions/components/linkedin/node";
import { MistralNode } from "@/features/executions/components/mistral/node";
import { NotionNode } from "@/features/executions/components/notion/node";
import { OpenAiNode } from "@/features/executions/components/openai/node";
import { OutputParserNode } from "@/features/executions/components/output-parser/node";
import { QwenNode } from "@/features/executions/components/qwen/node";
import { RssFeedNode } from "@/features/executions/components/rss-feed/node";
import { SlackNode } from "@/features/executions/components/slack/node";
import { SmsNode } from "@/features/executions/components/sms/node";
import { SummarizerNode } from "@/features/executions/components/summarizer/node";
import { TelegramNode } from "@/features/executions/components/telegram/node";
import { TextClassifierNode } from "@/features/executions/components/text-classifier/node";
import { TextSplitterNode } from "@/features/executions/components/text-splitter/node";
import { TwitterNode } from "@/features/executions/components/twitter/node";
import { UniversalNode } from "@/features/executions/components/universal/node";
import { VectorStoreNode } from "@/features/executions/components/vector-store/node";
import { WhatsAppNode } from "@/features/executions/components/whatsapp/node";
import { GoogleFormTrigger } from "@/features/triggers/components/google-form-trigger/node";
import { ManualTriggerNode } from "@/features/triggers/components/manual-trigger/node";
import { ScheduleTriggerNode } from "@/features/triggers/components/schedule-trigger/node";
import { StripeTriggerNode } from "@/features/triggers/components/stripe-trigger/node";
import { WebhookTriggerNode } from "@/features/triggers/components/webhook-trigger/node";
import { NodeType } from "@/generated/prisma";

export const nodeComponents = {
  [NodeType.INITIAL]: InitialNode,
  [NodeType.HTTP_REQUEST]: HttpRequestNode,
  [NodeType.MANUAL_TRIGGER]: ManualTriggerNode,
  [NodeType.GOOGLE_FORM_TRIGGER]: GoogleFormTrigger,
  [NodeType.STRIPE_TRIGGER]: StripeTriggerNode,
  [NodeType.GEMINI]: GeminiNode,
  [NodeType.OPENAI]: OpenAiNode,
  [NodeType.ANTHROPIC]: AnthropicNode,
  [NodeType.DISCORD]: DiscordNode,
  [NodeType.SLACK]: SlackNode,
  [NodeType.TWITTER]: TwitterNode,
  [NodeType.TELEGRAM]: TelegramNode,
  [NodeType.LINKEDIN]: LinkedInNode,
  [NodeType.INSTAGRAM]: InstagramNode,
  [NodeType.WHATSAPP]: WhatsAppNode,
  [NodeType.MISTRAL]: MistralNode,
  [NodeType.QWEN]: QwenNode,
  [NodeType.EMAIL]: EmailNode,
  [NodeType.NOTION]: NotionNode,
  [NodeType.GOOGLE_SHEETS]: GoogleSheetsNode,
  [NodeType.GITHUB]: GitHubNode,
  [NodeType.RSS_FEED]: RssFeedNode,
  [NodeType.SMS]: SmsNode,
  [NodeType.UNIVERSAL]: UniversalNode,
  [NodeType.AI_AGENT]: AiAgentNode,
  [NodeType.AI_CHAIN]: AiChainNode,
  [NodeType.SUMMARIZER]: SummarizerNode,
  [NodeType.TEXT_CLASSIFIER]: TextClassifierNode,
  [NodeType.INFO_EXTRACTOR]: InfoExtractorNode,
  [NodeType.OUTPUT_PARSER]: OutputParserNode,
  [NodeType.DOC_LOADER]: DocLoaderNode,
  [NodeType.TEXT_SPLITTER]: TextSplitterNode,
  [NodeType.AI_MEMORY]: AiMemoryNode,
  [NodeType.EMBEDDINGS]: EmbeddingsNode,
  [NodeType.VECTOR_STORE]: VectorStoreNode,
  [NodeType.WEBHOOK_TRIGGER]: WebhookTriggerNode,
  [NodeType.SCHEDULE_TRIGGER]: ScheduleTriggerNode,
  [NodeType.AUTONOMOUS_SEARCH_AGENT]: AutonomousSearchAgentNode,
  [NodeType.GMAIL_SEARCH]: GmailSearchNode,
} as const satisfies NodeTypes;

export type RegisteredNodeType = keyof typeof nodeComponents;
