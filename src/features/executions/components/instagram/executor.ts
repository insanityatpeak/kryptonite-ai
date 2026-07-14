import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import ky from "ky";
import type { NodeExecutor } from "@/features/executions/types";
import { instagramChannel } from "@/inngest/channels/instagram";

Handlebars.registerHelper("json", (context) => {
  return new Handlebars.SafeString(JSON.stringify(context, null, 2));
});

type InstagramData = {
  variableName?: string;
  accessToken?: string;
  userId?: string;
  imageUrl?: string;
  caption?: string;
};

export const instagramExecutor: NodeExecutor<InstagramData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(instagramChannel().status({ nodeId, status: "loading" }));

  const accessToken = data.accessToken || process.env.INSTAGRAM_ACCESS_TOKEN;
  const userId = data.userId || process.env.INSTAGRAM_USER_ID;

  if (!accessToken || !userId) {
    await publish(instagramChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(
      "Instagram node: Access Token and Instagram User ID are required (from Meta Business → Instagram Graph API)",
    );
  }
  if (!data.imageUrl) {
    await publish(instagramChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Instagram node: Image URL is required");
  }
  if (!data.variableName) {
    await publish(instagramChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Instagram node: Variable name is required");
  }

  const caption = data.caption
    ? decode(Handlebars.compile(data.caption)(context))
    : "";
  const imageUrl = decode(Handlebars.compile(data.imageUrl)(context));

  // Validate that imageUrl is a public HTTP(S) URL — Instagram requires publicly accessible images
  if (!imageUrl.startsWith("http://") && !imageUrl.startsWith("https://")) {
    await publish(instagramChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(
      "Instagram node: Image URL must be a public HTTP/HTTPS URL accessible by Instagram's servers. Local or private URLs will not work.",
    );
  }

  try {
    const result = await step.run("instagram-post-media", async () => {
      try {
        const mediaRes = await ky
          .post(`https://graph.facebook.com/v21.0/${userId}/media`, {
            json: { image_url: imageUrl, caption, access_token: accessToken },
            timeout: 30000,
          })
          .json<{ id: string }>();

        const publishRes = await ky
          .post(`https://graph.facebook.com/v21.0/${userId}/media_publish`, {
            json: { creation_id: mediaRes.id, access_token: accessToken },
            timeout: 30000,
          })
          .json<{ id: string }>();

        return {
          ...context,
          [data.variableName!]: { mediaId: publishRes.id, caption },
        };
      } catch (igError: unknown) {
        const status = (igError as { response?: { status?: number } })?.response
          ?.status;
        if (status === 403) {
          throw new NonRetriableError(
            "Instagram 403 Forbidden: Your access token has expired or lacks the required permissions. Go to Meta Developer Console → Instagram → Generate a new long-lived access token with instagram_basic and instagram_content_publish permissions.",
          );
        }
        if (status === 400) {
          throw new NonRetriableError(
            `Instagram 400 Bad Request: The image URL may not be publicly accessible, or the account is not a Business/Creator account. Ensure the image is at a public URL. Error: ${String(igError)}`,
          );
        }
        throw igError;
      }
    });

    await publish(instagramChannel().status({ nodeId, status: "success" }));
    return result;
  } catch (error) {
    await publish(instagramChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
