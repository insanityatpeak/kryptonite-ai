import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import ky from "ky";
import type { NodeExecutor } from "@/features/executions/types";
import { linkedinChannel } from "@/inngest/channels/linkedin";

Handlebars.registerHelper("json", (context) => {
  return new Handlebars.SafeString(JSON.stringify(context, null, 2));
});

type LinkedInData = {
  variableName?: string;
  accessToken?: string;
  personUrn?: string;
  text?: string;
};

export const linkedinExecutor: NodeExecutor<LinkedInData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(linkedinChannel().status({ nodeId, status: "loading" }));

  const accessToken = data.accessToken || process.env.LINKEDIN_ACCESS_TOKEN;
  const personUrn = data.personUrn || process.env.LINKEDIN_PERSON_URN;

  if (!accessToken) {
    await publish(linkedinChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(
      "LinkedIn node: Set LINKEDIN_ACCESS_TOKEN in environment variables",
    );
  }
  if (!personUrn) {
    await publish(linkedinChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(
      "LinkedIn node: Set LINKEDIN_PERSON_URN in environment variables (e.g. urn:li:person:ABC123)",
    );
  }
  if (!data.text) {
    await publish(linkedinChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("LinkedIn node: Post text is required");
  }
  if (!data.variableName) {
    await publish(linkedinChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("LinkedIn node: Variable name is required");
  }

  const text = decode(Handlebars.compile(data.text)(context)).slice(0, 3000);

  try {
    const result = await step.run("linkedin-post-update", async () => {
      const response = await ky
        .post("https://api.linkedin.com/v2/ugcPosts", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
            "X-Restli-Protocol-Version": "2.0.0",
          },
          json: {
            author: personUrn,
            lifecycleState: "PUBLISHED",
            specificContent: {
              "com.linkedin.ugc.ShareContent": {
                shareCommentary: { text },
                shareMediaCategory: "NONE",
              },
            },
            visibility: {
              "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
            },
          },
        })
        .json<{ id: string }>();

      return {
        ...context,
        [data.variableName!]: {
          postId: response.id,
          text,
        },
      };
    });

    await publish(linkedinChannel().status({ nodeId, status: "success" }));
    return result;
  } catch (error) {
    await publish(linkedinChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
