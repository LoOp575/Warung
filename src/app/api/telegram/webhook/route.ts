// WarungNeng - Telegram Webhook Endpoint
// POST /api/telegram/webhook
// Set webhook URL: https://your-domain.vercel.app/api/telegram/webhook

import { NextRequest, NextResponse } from "next/server";
import { parseUpdate, isAllowedUser, sendMessage, isBotConfigured } from "@/lib/telegram";
import { processMessage } from "@/lib/ai-agent";

export async function POST(req: NextRequest) {
  // Verify bot is configured
  if (!isBotConfigured()) {
    return NextResponse.json({ ok: false, error: "Bot not configured" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const update = parseUpdate(body);

    if (!update || !update.message) {
      return NextResponse.json({ ok: true });
    }

    const message = update.message;
    if (!message.from || !message.chat) {
      return NextResponse.json({ ok: true });
    }

    const userId = message.from.id;
    const chatId = message.chat.id;
    const text = (message.text || "").trim();

    if (!text) {
      return NextResponse.json({ ok: true });
    }

    // Check if user is allowed
    if (!isAllowedUser(userId)) {
      await sendMessage(chatId, "Maaf, nomor/user tidak terdaftar. Bot ini hanya untuk pemilik warung.");
      return NextResponse.json({ ok: true });
    }

    // Skip commands like /start
    if (text === "/start") {
      await sendMessage(
        chatId,
        `Halo Neng! 👋 Aku *WarungNeng Bot*, asisten warung kamu.\n\nAku bisa bantu:\n• Catat omzet harian\n• Catat penjualan\n• Catat restock\n• Cek stok\n• Cek barang wajib beli\n• Lihat laporan hari ini\n\nKetik aja perintahnya ya! 😊`
      );
      return NextResponse.json({ ok: true });
    }

    if (text === "/help") {
      await sendMessage(
        chatId,
        `📋 *Perintah WarungNeng Bot:*\n\n💵 *Omzet:*\n"pendapatan hari ini 500rb"\n"omzet 650 ribu"\n\n🛒 *Jual:*\n"Garpit laku 2 bungkus"\n"jual Pandemas 3"\n\n📦 *Restock:*\n"beli Terigu 3 karung"\n"restock Armor 5"\n\n📊 *Info:*\n"stok Pandemas"\n"barang apa yang harus dibeli?"\n"laporan hari ini"\n\nAtau chat aja bebas, aku ngerti kok! 😊`
      );
      return NextResponse.json({ ok: true });
    }

    // Process message through AI agent
    const reply = await processMessage(String(userId), text);

    // Send reply
    await sendMessage(chatId, reply);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}

// GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({ status: "WarungNeng Telegram Bot webhook active" });
}
