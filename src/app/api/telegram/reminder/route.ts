import { NextRequest, NextResponse } from "next/server";
import { getAllowedTelegramUserId, sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";

const REMINDER_TEXT = `Halo Neng, cantik, selamat malam 🌙

Gimana hari ini warungnya?
Berapa pendapatan hari ini?

Ketik contoh:
"500 ribu"
atau
"pendapatan hari ini 650 ribu"`;

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const token = req.nextUrl.searchParams.get("token") || req.headers.get("x-cron-secret");

  if (cronSecret && token !== cronSecret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const chatId = getAllowedTelegramUserId();
  if (!chatId) {
    return NextResponse.json({ ok: false, error: "TELEGRAM_ALLOWED_USER_ID belum diset" }, { status: 500 });
  }

  await sendTelegramMessage(chatId, REMINDER_TEXT);
  return NextResponse.json({ ok: true, sent: true });
}
