const SLACK_API = "https://slack.com/api";

function token(): string {
  const t = process.env.SLACK_ACCESS_TOKEN;
  if (!t) throw new Error("SLACK_ACCESS_TOKEN is not set");
  return t;
}

async function slackCall<T>(method: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${SLACK_API}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Slack ${method} failed: ${data.error}${data.needed ? ` (needs scope: ${data.needed})` : ""}`);
  }
  return data;
}

export async function getSelfUserId(): Promise<string> {
  const data = await slackCall<{ user_id: string }>("auth.test", {});
  return data.user_id;
}

// This demo runs against a single-person Slack workspace, so every nudge is sent
// as a self-DM addressed by name — in a real team workspace this would resolve
// the actual teammate via users.list and DM them directly.
export async function openSelfDm(): Promise<string> {
  const userId = await getSelfUserId();
  const data = await slackCall<{ channel: { id: string } }>("conversations.open", {
    users: userId,
  });
  return data.channel.id;
}

export async function postMessage(channel: string, text: string): Promise<{ ts: string }> {
  const data = await slackCall<{ ts: string }>("chat.postMessage", { channel, text });
  return { ts: data.ts };
}

export interface SlackMessage {
  ts: string;
  text: string;
  user?: string;
  bot_id?: string;
}

export async function getRepliesAfter(channel: string, afterTs: string): Promise<SlackMessage[]> {
  const data = await slackCall<{ messages: SlackMessage[] }>("conversations.history", {
    channel,
    oldest: afterTs,
    inclusive: false,
    limit: 20,
  });
  // Slack returns newest-first; drop anything the bot/self posted (the nudge itself).
  return data.messages.filter((m) => !m.bot_id).reverse();
}
