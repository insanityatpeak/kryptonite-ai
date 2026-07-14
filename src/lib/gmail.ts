export interface GmailMessage {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
}

function getHeader(
  headers: { name: string; value: string }[],
  name: string,
): string {
  return (
    headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ??
    ""
  );
}

/**
 * Searches Gmail using the Gmail search syntax (e.g. "from:adani", "subject:invoice newer_than:30d")
 * and returns metadata for the matching messages, most recent first (Gmail's default order).
 */
export async function searchGmail(
  accessToken: string,
  query: string,
  maxResults = 5,
): Promise<GmailMessage[]> {
  const listParams = new URLSearchParams({
    q: query,
    maxResults: String(maxResults),
  });
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?${listParams.toString()}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!listRes.ok) {
    const text = await listRes.text();
    throw new Error(`Gmail search failed: ${text}`);
  }

  const listJson = (await listRes.json()) as { messages?: { id: string }[] };
  const ids = listJson.messages ?? [];
  if (ids.length === 0) return [];

  const messages = await Promise.all(
    ids.map(async ({ id }) => {
      const metaParams = new URLSearchParams({ format: "metadata" });
      metaParams.append("metadataHeaders", "From");
      metaParams.append("metadataHeaders", "Subject");
      metaParams.append("metadataHeaders", "Date");

      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?${metaParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      if (!res.ok) return null;

      const json = (await res.json()) as {
        id: string;
        snippet?: string;
        payload?: { headers?: { name: string; value: string }[] };
      };
      const headers = json.payload?.headers ?? [];

      return {
        id: json.id,
        from: getHeader(headers, "From"),
        subject: getHeader(headers, "Subject"),
        date: getHeader(headers, "Date"),
        snippet: json.snippet ?? "",
      } satisfies GmailMessage;
    }),
  );

  return messages.filter((m): m is GmailMessage => m !== null);
}
