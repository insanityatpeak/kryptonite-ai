import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import ky from "ky";
import type { NodeExecutor } from "@/features/executions/types";
import { whatsappChannel } from "@/inngest/channels/whatsapp";

Handlebars.registerHelper("json", (context) => {
  return new Handlebars.SafeString(JSON.stringify(context, null, 2));
});

type WhatsAppData = {
  variableName?: string;
  accessToken?: string;
  phoneNumberId?: string;
  to?: string;
  message?: string;
};

export const whatsappExecutor: NodeExecutor<WhatsAppData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(whatsappChannel().status({ nodeId, status: "loading" }));

  const accessToken = data.accessToken || process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId =
    data.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!accessToken || !phoneNumberId) {
    await publish(whatsappChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(
      "WhatsApp node: Access Token and Phone Number ID are required (from Meta Business → WhatsApp Cloud API)",
    );
  }
  if (!data.to) {
    await publish(whatsappChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(
      "WhatsApp node: Recipient phone number is required",
    );
  }
  if (!data.message) {
    await publish(whatsappChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("WhatsApp node: Message is required");
  }
  if (!data.variableName) {
    await publish(whatsappChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("WhatsApp node: Variable name is required");
  }

  const message = decode(Handlebars.compile(data.message)(context));
  // Strip non-digits from recipient number — WhatsApp API requires digits only
  const toNum = (data.to ?? "").replace(/\D/g, "");

  if (!toNum) {
    await publish(whatsappChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(
      "WhatsApp node: Recipient phone number contains no digits",
    );
  }

  try {
    const result = await step.run("whatsapp-send-message", async () => {
      // First try sending a text message
      try {
        const response = await ky
          .post(`https://graph.facebook.com/v21.0/${phoneNumberId}/messages`, {
            headers: { Authorization: `Bearer ${accessToken}` },
            json: {
              messaging_product: "whatsapp",
              to: toNum,
              type: "text",
              text: { body: message },
            },
            timeout: 30000,
          })
          .json<{ messages: Array<{ id: string }> }>();

        return {
          ...context,
          [data.variableName!]: {
            messageId: response.messages[0]?.id,
            to: toNum,
            message,
          },
        };
      } catch (textError: unknown) {
        // If text message fails (e.g. recipient not a test number), fall back to hello_world template
        const status = (textError as { response?: { status?: number } })
          ?.response?.status;
        if (status === 400 || status === 403) {
          const templateResponse = await ky
            .post(
              `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
              {
                headers: { Authorization: `Bearer ${accessToken}` },
                json: {
                  messaging_product: "whatsapp",
                  to: toNum,
                  type: "template",
                  template: {
                    name: "hello_world",
                    language: { code: "en_US" },
                  },
                },
                timeout: 30000,
              },
            )
            .json<{ messages: Array<{ id: string }> }>();

          return {
            ...context,
            [data.variableName!]: {
              messageId: templateResponse.messages[0]?.id,
              to: toNum,
              message:
                "[hello_world template sent — recipient must be added as test number in Meta Developer Console → WhatsApp → API Setup for text messages]",
            },
          };
        }
        throw new NonRetriableError(
          `WhatsApp: +${toNum} is not in your allowed recipients list. Fix: Go to developers.facebook.com → your app → WhatsApp → API Setup → click the "To" dropdown → "Manage phone number list" → add and verify +${toNum} via OTP. This is a one-time setup per number.`,
        );
      }
    });

    await publish(whatsappChannel().status({ nodeId, status: "success" }));
    return result;
  } catch (error) {
    await publish(whatsappChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
