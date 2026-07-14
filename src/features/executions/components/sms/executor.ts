import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import ky from "ky";
import type { NodeExecutor } from "@/features/executions/types";
import { smsChannel } from "@/inngest/channels/sms";

Handlebars.registerHelper("json", (context) => {
  return new Handlebars.SafeString(JSON.stringify(context, null, 2));
});

type SmsData = {
  variableName?: string;
  accountSid?: string;
  authToken?: string;
  from?: string;
  to?: string;
  body?: string;
};

export const smsExecutor: NodeExecutor<SmsData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(smsChannel().status({ nodeId, status: "loading" }));

  const accountSid = data.accountSid || process.env.TWILIO_ACCOUNT_SID;
  const authToken = data.authToken || process.env.TWILIO_AUTH_TOKEN;
  const from = data.from || process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !from) {
    await publish(smsChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(
      "SMS node: Twilio Account SID, Auth Token, and From Number are required (from twilio.com/console)",
    );
  }
  if (!data.to) {
    await publish(smsChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("SMS node: Recipient phone number is required");
  }
  if (!data.body) {
    await publish(smsChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("SMS node: Message body is required");
  }
  if (!data.variableName) {
    await publish(smsChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("SMS node: Variable name is required");
  }

  const body = decode(Handlebars.compile(data.body)(context));

  // Ensure phone numbers have + prefix for Twilio (E.164 format)
  const normalizeTwilioNumber = (num: string) => {
    const digits = num.replace(/\D/g, "");
    return num.trim().startsWith("+") ? `+${digits}` : `+${digits}`;
  };
  const toNum = normalizeTwilioNumber(data.to!);
  const fromNum = normalizeTwilioNumber(from);

  try {
    const result = await step.run("sms-send", async () => {
      const credentials = Buffer.from(`${accountSid}:${authToken}`).toString(
        "base64",
      );
      const params = new URLSearchParams({
        To: toNum,
        From: fromNum,
        Body: body,
      });

      const response = await ky
        .post(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            headers: {
              Authorization: `Basic ${credentials}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
            timeout: 30000,
          },
        )
        .json<{ sid: string; status: string }>();

      return {
        ...context,
        [data.variableName!]: {
          messageSid: response.sid,
          status: response.status,
          to: toNum,
          body,
        },
      };
    });

    await publish(smsChannel().status({ nodeId, status: "success" }));
    return result;
  } catch (error) {
    await publish(smsChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
