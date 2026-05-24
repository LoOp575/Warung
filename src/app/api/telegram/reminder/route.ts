// WarungNeng - Daily Reminder Endpoint (Cron)
// GET /api/telegram/reminder?secret=CRON_SECRET
// Schedule: every day at 20:00 WIB (13:00 UTC)
// Vercel cron config in vercel.json: { "crons": [{ "path": "/api/telegram/reminder?secret=YOUR_SECRET", "schedule": "0 13 * * *" }] }

import { NextRequest, NextResponse } from "next/server";
import { sendMessageToOwner, isBotConfigured } from "@/lib/telegram";
import { setPendingAction } from "@/lib/ai-agent";

const CRON_SECRET = process.env.CRON_SECRET || "";
const ALLOWED_USER_ID = process.env.TELEGRAM_ALLOWED_USER_ID || "";

export async function GET(req: NextRequest) {
  // Verify cron secret
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!isBotConfigured()) {
    return NextResponse.json({ ok: false, error: "Bot not configured" }, { status: 500 });
  }

  // Send reminder message
  const reminderMessage = `Halo Neng, cantik, selamat malam 🌙

Gimana hari ini warungnya?
Berapa pendapatan hari ini?

Ketik contoh: *500 ribu* atau *pendapatan hari ini 650 ribu*`;

  const sent = await sendMessageToOwner(reminderMessage);

  if (!sent) {
    return NextResponse.json({ ok: false, error: "Failed to send reminder" }, { status: 500 });
  }

  // Set pending action so next message from user is treated as omzet
  if (ALLOWED_USER_ID) {
    setPendingAction(ALLOWED_USER_ID, "menunggu_omzet_harian");
  }

  return NextResponse.json({
    ok: true,
    message: "Reminder sent",
    pending_action: "menunggu_omzet_harian",
  });
}
