import { NextRequest, NextResponse } from "next/server";
import { handleAgentMessage } from "@/lib/ai-agent";
import { extractTelegramMessage, isAllowedTelegramUser, sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const update = await req.json();
    const { text, chatId, userId, firstName } = extractTelegramMessage(update);

    if (!chatId || !userId || !text) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    if (!isAllowedTelegramUser(userId)) {
      await sendTelegramMessage(chatId, "Maaf, user ini tidak terdaftar untuk WarungNeng Agent.");
      return NextResponse.json({ ok: true, unauthorized: true });
    }

    const reply = await handleAgentMessage(text, firstName);
    await sendTelegramMessage(chatId, reply);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Telegram webhook error:", error);
    return NextResponse.json({ ok: false, error: error.message || "unknown error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "WarungNeng Telegram webhook aktif" });
}
