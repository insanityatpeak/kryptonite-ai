import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import ky from "ky";
import type { NodeExecutor } from "@/features/executions/types";
import { telegramChannel } from "@/inngest/channels/telegram";

Handlebars.registerHelper("json", (context) => {
  return new Handlebars.SafeString(JSON.stringify(context, null, 2));
});

type TelegramData = {
  variableName?: string;
  botToken?: string;
  chatId?: string;
  text?: string;
};

export const telegramExecutor: NodeExecutor<TelegramData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(telegramChannel().status({ nodeId, status: "loading" }));

  const botToken = data.botToken || process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    await publish(telegramChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(
      "Telegram node: Bot token is required — set TELEGRAM_BOT_TOKEN in environment variables",
    );
  }
  if (!data.chatId) {
    await publish(telegramChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Telegram node: Chat ID is required");
  }
  if (!data.text) {
    await publish(telegramChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Telegram node: Message text is required");
  }
  if (!data.variableName) {
    await publish(telegramChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Telegram node: Variable name is required");
  }

  const text = decode(Handlebars.compile(data.text)(context)).slice(0, 4096);

  try {
    const result = await step.run("telegram-send-message", async () => {
      const response = await ky
        .post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          json: { chat_id: data.chatId, text, parse_mode: "HTML" },
        })
        .json<{ result: { message_id: number } }>();

      return {
        ...context,
        [data.variableName!]: {
          messageId: response.result.message_id,
          text,
        },
      };
    });

    await publish(telegramChannel().status({ nodeId, status: "success" }));
    return result;
  } catch (error) {
    await publish(telegramChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
