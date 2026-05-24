// WarungNeng - Telegram Bot Client Helper

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const ALLOWED_USER_ID = process.env.TELEGRAM_ALLOWED_USER_ID || "";

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export function isAllowedUser(userId: number | string): boolean {
  if (!ALLOWED_USER_ID) return false;
  return String(userId) === String(ALLOWED_USER_ID);
}

export function isBotConfigured(): boolean {
  return !!BOT_TOKEN && !!ALLOWED_USER_ID;
}

export async function sendMessage(chatId: number | string, text: string, options?: { parse_mode?: string }): Promise<boolean> {
  if (!BOT_TOKEN) return false;
  try {
    const res = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options?.parse_mode || "Markdown",
      }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("Telegram sendMessage error:", data);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Telegram sendMessage exception:", e);
    return false;
  }
}

export async function sendMessageToOwner(text: string): Promise<boolean> {
  if (!ALLOWED_USER_ID) return false;
  return sendMessage(ALLOWED_USER_ID, text);
}

// Parse incoming Telegram update
export interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text?: string;
  };
}

export function parseUpdate(body: unknown): TelegramUpdate | null {
  if (!body || typeof body !== "object") return null;
  return body as TelegramUpdate;
}
