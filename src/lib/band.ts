/**
 * Thin client for the Band.ai REST API.
 *
 * Band rooms are the coordination layer for Kryptonite's AI agent nodes: every
 * workflow execution that contains at least one AI node gets its own Band
 * room, and each AI node (OpenAI / Anthropic / Gemini "agents") posts its
 * prompt + response into that room as a chat message. This gives every agent
 * shared visibility into what the other agents have said and produces a full
 * multi-agent collaboration transcript per execution.
 *
 * All calls are best-effort: if BAND_API_KEY is missing or the Band API is
 * unreachable, these helpers log a warning and return null instead of
 * throwing, so a workflow execution never fails because of Band.
 */

const BAND_API_BASE_URL =
  process.env.BAND_API_BASE_URL || "https://api.band.ai/v1";

function getApiKey(): string | undefined {
  return process.env.BAND_API_KEY;
}

async function bandFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("[band] BAND_API_KEY not set, skipping Band API call:", path);
    return null;
  }

  try {
    const res = await fetch(`${BAND_API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(init?.headers || {}),
      },
    });

    if (!res.ok) {
      console.warn(
        `[band] ${path} failed: ${res.status} ${await res.text().catch(() => "")}`,
      );
      return null;
    }

    return (await res.json()) as T;
  } catch (error) {
    console.warn(`[band] ${path} request error:`, error);
    return null;
  }
}

export interface BandRoom {
  id: string;
  name: string;
}

export interface BandMessage {
  id: string;
  roomId: string;
  agent: string;
  content: string;
  createdAt: string;
}

/**
 * Create a new Band room for a workflow execution. The room name embeds the
 * workflow name and execution id so it's easy to find in the Band dashboard.
 */
export async function createBandRoom(name: string): Promise<BandRoom | null> {
  const room = await bandFetch<BandRoom>("/rooms", {
    method: "POST",
    body: JSON.stringify({ name }),
  });

  if (!room) {
    console.warn(`[band] Failed to create room "${name}"`);
    return null;
  }

  return room;
}

/**
 * Post a message into a Band room on behalf of one of the workflow's AI
 * agent nodes (e.g. "OpenAI Agent", "Anthropic Agent", "Gemini Agent").
 */
export async function sendBandMessage(
  roomId: string,
  agent: string,
  content: string,
): Promise<BandMessage | null> {
  return bandFetch<BandMessage>(`/rooms/${roomId}/messages`, {
    method: "POST",
    body: JSON.stringify({ agent, content }),
  });
}

/**
 * Fetch the full message history for a Band room, used by the executions UI
 * to render the multi-agent conversation.
 */
export async function getBandMessages(roomId: string): Promise<BandMessage[]> {
  const messages = await bandFetch<BandMessage[]>(`/rooms/${roomId}/messages`);
  return messages ?? [];
}
