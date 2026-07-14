import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import ky from "ky";
import type { NodeExecutor } from "@/features/executions/types";
import { kryptoniteChannel } from "@/inngest/channels/kryptonite";
import { getApp, getOperation } from "@/lib/app-catalog";

Handlebars.registerHelper(
  "json",
  (ctx) => new Handlebars.SafeString(JSON.stringify(ctx, null, 2)),
);

type UniversalData = {
  variableName?: string;
  appId?: string;
  operationId?: string;
  apiKey?: string;
  bearerToken?: string;
  username?: string;
  password?: string;
  [key: string]: unknown;
};

export const universalExecutor: NodeExecutor<UniversalData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
}) => {
  await publish(kryptoniteChannel().status({ nodeId, status: "loading" }));

  if (!data.appId) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Universal node: App is required");
  }
  if (!data.operationId) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Universal node: Operation is required");
  }
  if (!data.variableName) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Universal node: Variable name is required");
  }

  const app = getApp(data.appId);
  const operation = getOperation(data.appId, data.operationId);
  if (!app || !operation) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(
      `Unknown app/operation: ${data.appId}/${data.operationId}`,
    );
  }

  const mergedCtx = { ...context, ...data };
  const compiledUrl = decode(
    Handlebars.compile(`${app.baseUrl}${operation.urlTemplate}`)(mergedCtx),
  );

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (app.authType === "bearer" && data.bearerToken) {
    headers["Authorization"] = `Bearer ${data.bearerToken}`;
  } else if (app.authType === "apiKey" && data.apiKey && app.authHeader) {
    headers[app.authHeader] = data.apiKey;
  } else if (app.authType === "apiKey" && data.apiKey) {
    headers["Authorization"] = `Bearer ${data.apiKey}`;
  } else if (app.authType === "basic" && data.username && data.password) {
    headers["Authorization"] =
      `Basic ${Buffer.from(`${data.username}:${data.password}`).toString("base64")}`;
  }

  try {
    const result = await step.run(
      `universal-${data.appId}-${data.operationId}`,
      async () => {
        const isBodyMethod = ["POST", "PUT", "PATCH"].includes(
          operation.method,
        );
        // Fields consumed by the URL template (e.g. Airtable's baseId/tableName,
        // Jira's domain) must not leak into the JSON body — APIs like Airtable
        // reject unknown body keys with a 422.
        const urlPlaceholders = new Set(
          [
            ...`${app.baseUrl}${operation.urlTemplate}`.matchAll(
              /\{\{(\w+)\}\}/g,
            ),
          ].map((m) => m[1]),
        );
        const bodyData: Record<string, unknown> = {};
        for (const field of operation.fields) {
          if (urlPlaceholders.has(field.key)) continue;
          if (data[field.key] !== undefined && data[field.key] !== "") {
            const raw = String(data[field.key]);
            try {
              bodyData[field.key] = JSON.parse(raw);
            } catch {
              bodyData[field.key] = decode(Handlebars.compile(raw)(mergedCtx));
            }
          }
        }

        // GraphQL-only APIs (Linear, Monday) reject plain JSON bodies — the
        // operation's fields must be sent as variables alongside the query.
        const json = operation.graphqlQuery
          ? { query: operation.graphqlQuery, variables: bodyData }
          : bodyData;

        const response = await ky(compiledUrl, {
          method: operation.method,
          headers,
          ...(isBodyMethod ? { json } : {}),
          throwHttpErrors: false,
          timeout: 30000,
        });

        let responseData: unknown;
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }

        // GraphQL errors come back with HTTP 200 — treat them as failures
        const graphqlErrors =
          operation.graphqlQuery &&
          responseData &&
          typeof responseData === "object"
            ? (responseData as { errors?: { message: string }[] }).errors
            : undefined;

        return {
          ...context,
          [data.variableName!]: {
            status: response.status,
            ok: response.ok && !graphqlErrors?.length,
            ...(graphqlErrors?.length
              ? { error: graphqlErrors.map((e) => e.message).join("; ") }
              : {}),
            data: responseData,
            app: data.appId,
            operation: data.operationId,
          },
        };
      },
    );

    await publish(kryptoniteChannel().status({ nodeId, status: "success" }));
    return result;
  } catch (error) {
    await publish(kryptoniteChannel().status({ nodeId, status: "error" }));
    throw error;
  }
};
