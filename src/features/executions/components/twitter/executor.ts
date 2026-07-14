import crypto from "crypto";
import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import type { NodeExecutor } from "@/features/executions/types";
import { twitterChannel } from "@/inngest/channels/twitter";

Handlebars.registerHelper("json", (context) => {
  return new Handlebars.SafeString(JSON.stringify(context, null, 2));
});

type TwitterData = {
  variableName?: string;
  apiKey?: string;
  apiKeySecret?: string;
  accessToken?: string;
  accessTokenSecret?: string;
  text?: string;
};

function buildOAuth1Header(
  method: string,
  url: string,
  apiKey: string,
  apiKeySecret: string,
  accessToken: string,
  accessTokenSecret: string,
): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const params: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  const paramStr = Object.keys(params)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`)
    .join("&");

  const sigBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(paramStr),
  ].join("&");

  const signingKey = `${encodeURIComponent(apiKeySecret)}&${encodeURIComponent(accessTokenSecret)}`;
  const signature = crypto
    .createHmac("sha1", signingKey)
    .update(sigBase)
    .digest("base64");

  params.oauth_signature = signature;

  const headerVal = Object.keys(params)
    .filter((k) => k.startsWith("oauth_"))
    .sort()
    .map((k) => `${encodeURIComponent(k)}="${encodeURIComponent(params[k])}"`)
    .join(", ");

  return `OAuth ${headerVal}`;
}

export const twitterExecutor: NodeExecutor<TwitterData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(twitterChannel().status({ nodeId, status: "loading" }));

  const apiKey = data.apiKey || process.env.TWITTER_API_KEY;
  const apiKeySecret = data.apiKeySecret || process.env.TWITTER_API_KEY_SECRET;
  const accessToken = data.accessToken || process.env.TWITTER_ACCESS_TOKEN;
  const accessTokenSecret =
    data.accessTokenSecret || process.env.TWITTER_ACCESS_TOKEN_SECRET;

  if (!apiKey || !apiKeySecret || !accessToken || !accessTokenSecret) {
    await publish(twitterChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(
      "Twitter node: Set TWITTER_API_KEY, TWITTER_API_KEY_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET in environment variables",
    );
  }
  if (!data.text) {
    await publish(twitterChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Twitter node: Tweet text is required");
  }
  if (!data.variableName) {
    await publish(twitterChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Twitter node: Variable name is required");
  }

  const text = decode(Handlebars.compile(data.text)(context)).slice(0, 280);
  const tweetUrl = "https://api.twitter.com/2/tweets";

  try {
    const result = await step.run("twitter-post-tweet", async () => {
      const authHeader = buildOAuth1Header(
        "POST",
        tweetUrl,
        apiKey,
        apiKeySecret,
        accessToken,
        accessTokenSecret,
      );

      const res = await fetch(tweetUrl, {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new NonRetriableError(`Twitter API error ${res.status}: ${err}`);
      }

      const response = (await res.json()) as {
        data: { id: string; text: string };
      };
      return {
        ...context,
        [data.variableName!]: {
          tweetId: response.data.id,
          text: response.data.text,
        },
      };
    });

    await publish(twitterChannel().status({ nodeId, status: "success" }));
    return result;
  } catch (error) {
    await publish(twitterChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
