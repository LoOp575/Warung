type TelegramSendMessagePayload = {
  chat_id: string | number;
  text: string;
  parse_mode?: "HTML" | "Markdown" | "MarkdownV2";
};

const TELEGRAM_API_BASE = "https://api.telegram.org";

export function getTelegramBotToken() {
  return process.env.TELEGRAM_BOT_TOKEN;
}

export function getAllowedTelegramUserId() {
  return process.env.TELEGRAM_ALLOWED_USER_ID;
}

export function isAllowedTelegramUser(userId?: number | string | null) {
  const allowedUserId = getAllowedTelegramUserId();
  if (!allowedUserId || !userId) return false;
  return String(userId) === String(allowedUserId);
}

export async function sendTelegramMessage(chatId: string | number, text: string) {
  const token = getTelegramBotToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN belum diset");

  const payload: TelegramSendMessagePayload = {
    chat_id: chatId,
    text,
  };

  const res = await fetch(`${TELEGRAM_API_BASE}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gagal kirim Telegram: ${res.status} ${body}`);
  }

  return res.json();
}

export function extractTelegramMessage(update: any) {
  const message = update?.message || update?.edited_message;
  const text = message?.text?.trim?.() || "";
  const chatId = message?.chat?.id;
  const userId = message?.from?.id;
  const firstName = message?.from?.first_name || "Neng";

  return { message, text, chatId, userId, firstName };
}
