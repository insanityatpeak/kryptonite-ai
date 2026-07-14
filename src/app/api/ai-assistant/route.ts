const SYSTEM = `You are Kryptonite AI, an expert at building AI workflow automations inside the Kryptonite app.

When a user asks you to BUILD, CREATE, or SET UP a workflow, you MUST output a workflow JSON block using this exact format AFTER your explanation:

\`\`\`workflow
{
  "nodes": [
    { "type": "MANUAL_TRIGGER", "label": "Start", "data": {} },
    { "type": "RSS_FEED", "label": "Fetch News", "data": { "variableName": "feed", "url": "https://feeds.example.com/rss", "limit": "10" } },
    { "type": "AI_CHAIN", "label": "Summarize", "data": { "variableName": "summary", "prompt": "Summarize this article in 3 bullet points: {{feed.items}}" } },
    { "type": "EMAIL", "label": "Send Digest", "data": { "variableName": "emailResult", "to": "user@example.com", "subject": "Daily Digest", "body": "{{summary.text}}" } }
  ],
  "edges": [
    { "from": 0, "to": 1 },
    { "from": 1, "to": 2 },
    { "from": 2, "to": 3 }
  ]
}
\`\`\`

Valid node types: MANUAL_TRIGGER, WEBHOOK_TRIGGER, SCHEDULE_TRIGGER, HTTP_REQUEST, AI_AGENT, AI_CHAIN, SUMMARIZER, TEXT_CLASSIFIER, INFO_EXTRACTOR, OUTPUT_PARSER, DOC_LOADER, TEXT_SPLITTER, AI_MEMORY, EMBEDDINGS, VECTOR_STORE, GEMINI, OPENAI, ANTHROPIC, MISTRAL, QWEN, DISCORD, SLACK, TELEGRAM, WHATSAPP, EMAIL, SMS, TWITTER, LINKEDIN, INSTAGRAM, NOTION, GOOGLE_SHEETS, GITHUB, RSS_FEED.

Always use real Handlebars variable references like {{variableName.field}} to connect node outputs to the next node's inputs. Keep explanations brief and always end with the workflow block when building.`;

const MODELS = [
  "openai/gpt-oss-20b:free",
  "openai/gpt-oss-120b:free",
  "liquid/lfm-2.5-1.2b-instruct:free",
  "google/gemma-4-26b-a4b-it:free",
  "nex-agi/nex-n2-pro:free",
];

export async function POST(req: Request) {
  try {
    const { messages, apiKey } = await req.json();
    const effectiveKey = apiKey || process.env.OPENROUTER_API_KEY;

    // Helper for streaming simulated text directly when no API key or offline
    const streamSimulation = (text: string) => {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        async start(controller) {
          const chunks = text.split(/(?<=\s|\n)/);
          for (const chunk of chunks) {
            controller.enqueue(encoder.encode(chunk));
            await new Promise((r) => setTimeout(r, 15));
          }
          controller.close();
        },
      });
      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    };

    if (
      !effectiveKey ||
      effectiveKey.trim() === "" ||
      effectiveKey === "placeholder"
    ) {
      const lastMsg = (
        messages[messages.length - 1]?.content || ""
      ).toLowerCase();
      const isBuilding =
        lastMsg.includes("build") ||
        lastMsg.includes("create") ||
        lastMsg.includes("workflow") ||
        lastMsg.includes("make");
      if (isBuilding) {
        return streamSimulation(`I can certainly help you build that workflow locally in Kryptonite! Here is a sample automated workflow configuration:

\`\`\`workflow
{
  "nodes": [
    { "type": "MANUAL_TRIGGER", "label": "Start", "data": {} },
    { "type": "AI_AGENT", "label": "Process Data", "data": { "variableName": "output", "systemPrompt": "You are a helpful assistant.", "userPrompt": "Process input locally: {{context}}" } }
  ],
  "edges": [
    { "from": 0, "to": 1 }
  ]
}
\`\`\`

💡 You are currently running in **Local Kryptonite Simulation Mode** without an external API key. To enable live streaming from cloud AI models, set \`OPENROUTER_API_KEY\` in your \`.env.local\` or enter your API key in settings.`);
      }
      return streamSimulation(
        `Hello from Kryptonite AI Assistant! I am currently running locally without an external API key. You can build, configure, and test all your visual workflows directly right here.\n\n💡 If you want to connect live AI models, add \`OPENROUTER_API_KEY\` to your \`.env.local\` or input your custom API preference.`,
      );
    }

    let upstreamRes: Response | null = null;
    for (const model of MODELS) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${effectiveKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer":
            process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
          "X-Title": "Kryptonite AI",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "system", content: SYSTEM }, ...messages],
          stream: true,
        }),
      });
      if (res.ok && res.body) {
        upstreamRes = res;
        break;
      }
      const errText = await res.text();
      console.error(
        `[ai-assistant] model ${model} failed (${res.status}):`,
        errText,
      );
    }

    if (!upstreamRes || !upstreamRes.body) {
      if (process.env.NODE_ENV !== "production") {
        return streamSimulation(
          `[Local Kryptonite Simulation — API Fallback]\nCould not reach external AI models (or invalid API key/rate limited). Running in local fallback mode.`,
        );
      }
      return new Response("AI unavailable", { status: 502 });
    }

    // Parse OpenRouter SSE and forward as plain text stream
    const encoder = new TextEncoder();
    const { readable, writable } = new TransformStream<
      Uint8Array,
      Uint8Array
    >();
    const writer = writable.getWriter();

    const reader = upstreamRes.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    (async () => {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const jsonStr = trimmed.slice(5).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr) as {
                choices?: { delta?: { content?: string } }[];
              };
              const chunk = parsed.choices?.[0]?.delta?.content;
              if (chunk) await writer.write(encoder.encode(chunk));
            } catch {
              /* skip malformed */
            }
          }
        }
      } finally {
        await writer.close().catch(() => {});
      }
    })();

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("[ai-assistant]", error);
    return new Response("Internal error", { status: 500 });
  }
}
