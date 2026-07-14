import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import ky from "ky";
import type { NodeExecutor } from "@/features/executions/types";
import { emailChannel } from "@/inngest/channels/email";
import { renderTemplate } from "@/lib/template";

type EmailData = {
  variableName?: string;
  to?: string;
  subject?: string;
  body?: string;
  apiKey?: string;
  fromEmail?: string;
};

export const emailExecutor: NodeExecutor<EmailData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(emailChannel().status({ nodeId, status: "loading" }));

  const apiKey = data.apiKey || process.env.RESEND_API_KEY;
  const fromEmail =
    data.fromEmail ||
    process.env.RESEND_FROM_EMAIL ||
    "Kryptonite AI <onboarding@resend.dev>";

  if (!apiKey) {
    await publish(emailChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Email node: RESEND_API_KEY not configured");
  }
  if (!data.to) {
    await publish(emailChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Email node: Recipient address is required");
  }
  if (!data.subject) {
    await publish(emailChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Email node: Subject is required");
  }
  if (!data.body) {
    await publish(emailChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Email node: Body is required");
  }
  if (!data.variableName) {
    await publish(emailChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Email node: Variable name is required");
  }

  const subject = decode(
    renderTemplate(data.subject, context as Record<string, unknown>),
  );
  const body = decode(
    renderTemplate(data.body, context as Record<string, unknown>),
  );

  try {
    const result = await step.run("email-send", async () => {
      await ky.post("https://api.resend.com/emails", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        json: {
          from: fromEmail,
          to: [data.to],
          subject,
          html: `<p>${body.replace(/\n/g, "<br/>")}</p>`,
          text: body,
        },
      });

      return {
        ...context,
        [data.variableName!]: { to: data.to, subject, sent: true },
      };
    });

    await publish(emailChannel().status({ nodeId, status: "success" }));
    return result;
  } catch (error) {
    await publish(emailChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
