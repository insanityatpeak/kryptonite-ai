"use client";

import { createId } from "@paralleldrive/cuid2";
import { useReactFlow } from "@xyflow/react";
import {
  BotIcon,
  GlobeIcon,
  MailIcon,
  MousePointerIcon,
  SearchIcon,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NodeType } from "@/generated/prisma";
import { APP_CATALOG } from "@/lib/app-catalog";
import { Separator } from "./ui/separator";

export type NodeTypeOption = {
  type: NodeType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }> | string;
  appId?: string;
};

const triggerNodes: NodeTypeOption[] = [
  {
    type: NodeType.MANUAL_TRIGGER,
    label: "Trigger manually",
    description: "Run on button click — great for testing",
    icon: MousePointerIcon,
  },
  {
    type: NodeType.WEBHOOK_TRIGGER,
    label: "Webhook Trigger",
    description: "Trigger via incoming HTTP request",
    icon: "🪝",
  },
  {
    type: NodeType.SCHEDULE_TRIGGER,
    label: "Schedule / Cron",
    description: "Run on a time schedule (daily, weekly, etc)",
    icon: "⏰",
  },
  {
    type: NodeType.GOOGLE_FORM_TRIGGER,
    label: "Google Form",
    description: "Run when a Google Form is submitted",
    icon: "/logos/googleform.svg",
  },
  {
    type: NodeType.STRIPE_TRIGGER,
    label: "Stripe Event",
    description: "Run when a Stripe event is captured",
    icon: "/logos/stripe.svg",
  },
];

const actionNodes: NodeTypeOption[] = [
  {
    type: NodeType.HTTP_REQUEST,
    label: "HTTP Request",
    description: "Make any HTTP request",
    icon: GlobeIcon,
  },
];

const aiNodes: NodeTypeOption[] = [
  {
    type: NodeType.GMAIL_SEARCH,
    label: "Gmail Search",
    description:
      "Connect your real Gmail account and search it in plain language",
    icon: MailIcon,
  },
  {
    type: NodeType.AUTONOMOUS_SEARCH_AGENT,
    label: "Autonomous Search Agent",
    description: "One prompt — searches and reasons across every connected app",
    icon: "🛰️",
  },
  {
    type: NodeType.AI_AGENT,
    label: "AI Agent",
    description: "Autonomous AI that reasons and completes tasks",
    icon: "🤖",
  },
  {
    type: NodeType.AI_CHAIN,
    label: "Basic LLM Chain",
    description: "Simple prompt → LLM → output chain",
    icon: "⛓️",
  },
  {
    type: NodeType.SUMMARIZER,
    label: "Summarization Chain",
    description: "Summarize text with AI",
    icon: "📝",
  },
  {
    type: NodeType.TEXT_CLASSIFIER,
    label: "Text Classifier",
    description: "Classify text into categories using AI",
    icon: "🏷️",
  },
  {
    type: NodeType.INFO_EXTRACTOR,
    label: "Information Extractor",
    description: "Extract structured data from text",
    icon: "🔍",
  },
  {
    type: NodeType.OUTPUT_PARSER,
    label: "Output Parser",
    description: "Parse AI output into JSON, list, or CSV",
    icon: "🔧",
  },
  {
    type: NodeType.DOC_LOADER,
    label: "Document Loader",
    description: "Load content from URLs or web pages",
    icon: "📄",
  },
  {
    type: NodeType.TEXT_SPLITTER,
    label: "Text Splitter",
    description: "Split long text into chunks for AI",
    icon: "✂️",
  },
  {
    type: NodeType.AI_MEMORY,
    label: "Memory Buffer",
    description: "Store and retrieve conversation memory",
    icon: "🧠",
  },
  {
    type: NodeType.EMBEDDINGS,
    label: "Embeddings",
    description: "Convert text to vector embeddings",
    icon: "🔢",
  },
  {
    type: NodeType.VECTOR_STORE,
    label: "Vector Store",
    description: "Store & query vectors (Pinecone)",
    icon: "🌲",
  },
  {
    type: NodeType.GEMINI,
    label: "Gemma",
    description: "Google Gemma (free) text generation",
    icon: "/logos/gemini.svg",
  },
  {
    type: NodeType.OPENAI,
    label: "OpenAI",
    description: "OpenAI GPT-OSS (free) text generation",
    icon: "/logos/openai.svg",
  },
  {
    type: NodeType.ANTHROPIC,
    label: "Llama",
    description: "Meta Llama (free) text generation",
    icon: BotIcon,
  },
  {
    type: NodeType.MISTRAL,
    label: "Mistral",
    description: "Community Mistral fine-tune (free) text generation",
    icon: "/logos/mistral.svg",
  },
  {
    type: NodeType.QWEN,
    label: "Qwen",
    description: "Qwen AI text generation",
    icon: "/logos/qwen.svg",
  },
];

const messagingNodes: NodeTypeOption[] = [
  {
    type: NodeType.DISCORD,
    label: "Discord",
    description: "Send a message to Discord",
    icon: "/logos/discord.svg",
  },
  {
    type: NodeType.SLACK,
    label: "Slack",
    description: "Send a message to Slack",
    icon: "/logos/slack.svg",
  },
  {
    type: NodeType.TELEGRAM,
    label: "Telegram",
    description: "Send a Telegram bot message",
    icon: "/logos/telegram.svg",
  },
  {
    type: NodeType.WHATSAPP,
    label: "WhatsApp",
    description: "Send a WhatsApp Business message",
    icon: "/logos/whatsapp.svg",
  },
  {
    type: NodeType.EMAIL,
    label: "Email",
    description: "Send an email via SMTP/SendGrid",
    icon: "/logos/email.svg",
  },
  {
    type: NodeType.SMS,
    label: "SMS",
    description: "Send an SMS via Twilio",
    icon: "/logos/sms.svg",
  },
];

const socialNodes: NodeTypeOption[] = [
  {
    type: NodeType.TWITTER,
    label: "Twitter / X",
    description: "Post a tweet",
    icon: "/logos/twitter.svg",
  },
  {
    type: NodeType.LINKEDIN,
    label: "LinkedIn",
    description: "Post to LinkedIn",
    icon: "/logos/linkedin.svg",
  },
  {
    type: NodeType.INSTAGRAM,
    label: "Instagram",
    description: "Post to Instagram Business",
    icon: "/logos/instagram.svg",
  },
];

const productivityNodes: NodeTypeOption[] = [
  {
    type: NodeType.NOTION,
    label: "Notion",
    description: "Create a Notion page",
    icon: "/logos/notion.svg",
  },
  {
    type: NodeType.GOOGLE_SHEETS,
    label: "Google Sheets",
    description: "Append data to a sheet",
    icon: "/logos/google-sheets.svg",
  },
  {
    type: NodeType.GITHUB,
    label: "GitHub",
    description: "Create a GitHub issue or PR",
    icon: "/logos/github.svg",
  },
  {
    type: NodeType.RSS_FEED,
    label: "RSS Feed",
    description: "Fetch and parse RSS/Atom feed",
    icon: "/logos/rss.svg",
  },
];

const appNodes: NodeTypeOption[] = APP_CATALOG.map((app) => ({
  type: NodeType.UNIVERSAL,
  label: app.name,
  description: `${app.category} · ${app.operations.length} operations`,
  icon: app.icon,
  appId: app.id,
}));

interface NodeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function NodeSelector({
  open,
  onOpenChange,
  children,
}: NodeSelectorProps) {
  const { setNodes, getNodes, screenToFlowPosition } = useReactFlow();
  const [search, setSearch] = useState("");

  const handleNodeSelect = useCallback(
    (selection: NodeTypeOption) => {
      if (selection.type === NodeType.MANUAL_TRIGGER) {
        const nodes = getNodes();
        if (nodes.some((n) => n.type === NodeType.MANUAL_TRIGGER)) {
          toast.error("Only one manual trigger is allowed per workflow");
          return;
        }
      }

      setNodes((nodes) => {
        const hasInitialTrigger = nodes.some(
          (n) => n.type === NodeType.INITIAL,
        );
        const flowPosition = screenToFlowPosition({
          x: window.innerWidth / 2 + (Math.random() - 0.5) * 200,
          y: window.innerHeight / 2 + (Math.random() - 0.5) * 200,
        });
        const newNode = {
          id: createId(),
          data: selection.appId ? { appId: selection.appId } : {},
          position: flowPosition,
          type: selection.type,
        };
        return [...nodes, newNode];
      });

      onOpenChange(false);
      setSearch("");
    },
    [setNodes, getNodes, onOpenChange, screenToFlowPosition],
  );

  const allNodes = [
    ...triggerNodes,
    ...actionNodes,
    ...aiNodes,
    ...messagingNodes,
    ...socialNodes,
    ...productivityNodes,
    ...appNodes,
  ];
  const filtered = search
    ? allNodes.filter(
        (n) =>
          n.label.toLowerCase().includes(search.toLowerCase()) ||
          n.description.toLowerCase().includes(search.toLowerCase()),
      )
    : null;

  const renderNode = (node: NodeTypeOption, idx: number) => {
    const Icon = node.icon;
    return (
      <div
        key={`${node.type}-${node.appId || ""}-${idx}`}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer border-l-2 border-transparent hover:border-l-indigo-500 hover:bg-zinc-50 transition-all duration-150 group"
        onClick={() => handleNodeSelect(node)}
      >
        <div className="shrink-0 size-9 rounded-xl bg-zinc-50 border border-zinc-200 shadow-sm flex items-center justify-center text-base group-hover:shadow-md transition-shadow">
          {typeof Icon === "string" ? (
            Icon.startsWith("/") ? (
              <img
                src={Icon}
                alt={node.label}
                className="size-5 object-contain rounded-sm"
              />
            ) : (
              <span>{Icon}</span>
            )
          ) : (
            <Icon className="size-5" />
          )}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-medium text-sm text-zinc-900 truncate">
            {node.label}
          </span>
          <span className="text-xs text-zinc-500 truncate">
            {node.description}
          </span>
        </div>
      </div>
    );
  };

  const renderGroup = (label: string, nodes: NodeTypeOption[]) => (
    <div key={label}>
      <div className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest sticky top-0 bg-white/95 backdrop-blur-sm">
        {label}
      </div>
      {nodes.map((n, i) => renderNode(n, i))}
      <Separator />
    </div>
  );

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setSearch("");
      }}
    >
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:w-[420px] sm:max-w-none flex flex-col p-0 bg-white/95 backdrop-blur-xl border-l border-zinc-200 shadow-2xl"
      >
        <div className="p-6 pb-3 border-b border-zinc-200">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold text-zinc-900">
              Add a Step
            </SheetTitle>
            <SheetDescription className="text-sm text-zinc-600">
              Pick what your workflow should do next
            </SheetDescription>
          </SheetHeader>
          <div className="relative mt-3">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-400" />
            <Input
              placeholder="Search HubSpot, Airtable, Summarize..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400 focus-visible:ring-indigo-500"
              autoFocus
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-transparent">
          {filtered ? (
            filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-500">
                No nodes found for "{search}"
              </div>
            ) : (
              <div>
                <div className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Results ({filtered.length})
                </div>
                {filtered.map((n, i) => renderNode(n, i))}
              </div>
            )
          ) : (
            <>
              {renderGroup("Triggers", triggerNodes)}
              {renderGroup("Actions", actionNodes)}
              {renderGroup("AI Pipeline", aiNodes)}
              {renderGroup("Messaging", messagingNodes)}
              {renderGroup("Social Media", socialNodes)}
              {renderGroup("Productivity", productivityNodes)}
              <div>
                <div className="px-4 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest sticky top-0 bg-white/95 backdrop-blur-sm">
                  App Integrations{" "}
                  <span className="text-indigo-500 font-bold">
                    {APP_CATALOG.length}+ apps
                  </span>
                </div>
                {appNodes.map((n, i) => renderNode(n, i))}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
