import Handlebars from "handlebars";
import { decode } from "html-entities";
import { NonRetriableError } from "inngest";
import ky from "ky";
import type { NodeExecutor } from "@/features/executions/types";
import { googleSheetsChannel } from "@/inngest/channels/google-sheets";
import { getValidGoogleAccessToken } from "@/lib/google-oauth";

Handlebars.registerHelper("json", (context) => {
  return new Handlebars.SafeString(JSON.stringify(context, null, 2));
});

type GoogleSheetsData = {
  variableName?: string;
  spreadsheetId?: string;
  range?: string;
  values?: string;
};

export const googleSheetsExecutor: NodeExecutor<GoogleSheetsData> = async ({
  data,
  nodeId,
  context,
  step,
  publish,
  userId,
}) => {
  await publish(googleSheetsChannel().status({ nodeId, status: "loading" }));

  if (!data.spreadsheetId) {
    await publish(googleSheetsChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(
      "Google Sheets node: Spreadsheet ID is required",
    );
  }
  if (!data.range) {
    await publish(googleSheetsChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Google Sheets node: Range is required");
  }
  if (!data.values) {
    await publish(googleSheetsChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError("Google Sheets node: Values are required");
  }
  if (!data.variableName) {
    await publish(googleSheetsChannel().status({ nodeId, status: "error" }));
    throw new NonRetriableError(
      "Google Sheets node: Variable name is required",
    );
  }

  const valuesStr = decode(Handlebars.compile(data.values)(context));
  let parsedValues: string[][];
  try {
    parsedValues = JSON.parse(valuesStr);
  } catch {
    parsedValues = [[valuesStr]];
  }

  try {
    const accessToken = await step.run(`sheets-auth-${nodeId}`, () =>
      getValidGoogleAccessToken(userId),
    );

    const result = await step.run("sheets-append", async () => {
      const response = await ky
        .post(
          `https://sheets.googleapis.com/v4/spreadsheets/${data.spreadsheetId}/values/${encodeURIComponent(
            data.range!,
          )}:append?valueInputOption=USER_ENTERED`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            json: {
              range: data.range,
              majorDimension: "ROWS",
              values: parsedValues,
            },
          },
        )
        .json<{ updates: { updatedRange: string; updatedRows: number } }>();

      return {
        ...context,
        [data.variableName!]: {
          updatedRange: response.updates.updatedRange,
          updatedRows: response.updates.updatedRows,
        },
      };
    });

    await publish(googleSheetsChannel().status({ nodeId, status: "success" }));
    return result;
  } catch (error) {
    await publish(googleSheetsChannel().status({ nodeId, status: "error" }));
    throw error instanceof Error &&
      /Connect your Google account|Reconnect your Google account/.test(
        error.message,
      )
      ? new NonRetriableError(error.message)
      : error;
  }
};
