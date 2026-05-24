// WarungNeng - AI Agent with Tool Calling (OpenAI)

import { TOOL_DEFINITIONS, executeTool } from "./warung-tools";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

const SYSTEM_PROMPT = `Kamu adalah asisten pribadi warung bernama "WarungNeng Bot".
Kamu membantu pemilik warung (dipanggil "Neng") mengelola warung sehari-hari.

Kepribadian:
- Ramah, santai, pakai bahasa Indonesia sehari-hari
- Kadang pakai emoji tapi jangan berlebihan
- Panggil pemilik "Neng"
- Jawab singkat dan jelas

Kemampuan:
- Catat omzet/pendapatan harian
- Catat penjualan barang (kurangi stok, hitung profit)
- Catat restock/pembelian barang (tambah stok)
- Update stok barang
- Cek stok barang
- Cek barang yang harus dibeli (stok menipis)
- Lihat laporan hari ini

Aturan:
- Jika user menyebut angka setelah reminder omzet, anggap itu omzet hari ini
- "500 ribu" = 500000, "650rb" = 650000, "1.2 juta" = 1200000, "1jt" = 1000000
- Jika perintah tidak jelas, tanya balik dengan sopan
- Jangan pernah hapus data tanpa konfirmasi
- Jangan buat data palsu, selalu gunakan tools untuk akses database
- Jika tidak perlu tools, jawab secara percakapan biasa

Format angka:
- Selalu konversi shorthand: "500rb" -> 500000, "1.5jt" -> 1500000
- "ribu" = 000, "rb" = 000, "juta" = 000000, "jt" = 000000`;

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

// Parse Indonesian number shorthand
function parseIndonesianAmount(text: string): number | null {
  const cleaned = text.toLowerCase().replace(/[.,\s]/g, "").replace(/rp/g, "");
  
  // Match patterns like "500ribu", "500rb", "1.5juta", "1jt", "650000"
  const patterns = [
    { regex: /(\d+(?:\.\d+)?)\s*(?:juta|jt)/i, multiplier: 1000000 },
    { regex: /(\d+(?:\.\d+)?)\s*(?:ribu|rb)/i, multiplier: 1000 },
    { regex: /^(\d+)$/, multiplier: 1 },
  ];

  for (const p of patterns) {
    const match = cleaned.match(p.regex);
    if (match) {
      return Math.round(parseFloat(match[1]) * p.multiplier);
    }
  }
  return null;
}

// State management for pending actions (simple in-memory, resets on deploy)
const pendingState: Record<string, string> = {};

export function setPendingAction(userId: string, action: string): void {
  pendingState[userId] = action;
}

export function getPendingAction(userId: string): string | null {
  return pendingState[userId] || null;
}

export function clearPendingAction(userId: string): void {
  delete pendingState[userId];
}

// Main AI agent function
export async function processMessage(userId: string, userMessage: string): Promise<string> {
  // Check if there's a pending action (e.g., waiting for omzet after reminder)
  const pending = getPendingAction(userId);
  
  if (pending === "menunggu_omzet_harian") {
    const amount = parseIndonesianAmount(userMessage);
    if (amount && amount >= 1000) {
      clearPendingAction(userId);
      return await executeTool("catat_omzet", { amount });
    }
    // If not a number, treat as normal message and clear pending
    clearPendingAction(userId);
  }

  // If OpenAI not configured, use simple pattern matching
  if (!OPENAI_API_KEY) {
    return handleWithoutAI(userMessage);
  }

  // Use OpenAI with tool calling
  try {
    return await handleWithAI(userMessage);
  } catch (e) {
    console.error("AI agent error:", e);
    // Fallback to simple handler
    return handleWithoutAI(userMessage);
  }
}

// AI-powered handler with OpenAI function calling
async function handleWithAI(userMessage: string): Promise<string> {
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userMessage },
  ];

  const tools = TOOL_DEFINITIONS.map((t) => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));

  // First API call
  let response = await callOpenAI(messages, tools);
  
  if (!response) return "❌ Maaf, ada gangguan. Coba lagi nanti ya Neng.";

  // Handle tool calls (up to 3 iterations)
  let iterations = 0;
  while (response.tool_calls && response.tool_calls.length > 0 && iterations < 3) {
    iterations++;

    // Add assistant message with tool calls
    messages.push({
      role: "assistant",
      content: response.content,
      tool_calls: response.tool_calls,
    });

    // Execute each tool and add results
    for (const toolCall of response.tool_calls) {
      const args = JSON.parse(toolCall.function.arguments);
      const result = await executeTool(toolCall.function.name, args);
      messages.push({
        role: "tool",
        content: result,
        tool_call_id: toolCall.id,
      });
    }

    // Get next response
    response = await callOpenAI(messages, tools);
    if (!response) return "❌ Maaf, ada gangguan saat memproses.";
  }

  return response.content || "🤔 Maaf Neng, aku bingung. Coba ulangi ya.";
}

// Call OpenAI API
async function callOpenAI(
  messages: ChatMessage[],
  tools: { type: "function"; function: { name: string; description: string; parameters: unknown } }[]
): Promise<{ content: string | null; tool_calls?: ToolCall[] } | null> {
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        tools: tools.length > 0 ? tools : undefined,
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("OpenAI API error:", res.status, err);
      return null;
    }

    const data = await res.json();
    const choice = data.choices?.[0]?.message;
    
    if (!choice) return null;

    return {
      content: choice.content || null,
      tool_calls: choice.tool_calls || undefined,
    };
  } catch (e) {
    console.error("OpenAI fetch error:", e);
    return null;
  }
}

// Fallback: Simple pattern matching without AI
async function handleWithoutAI(userMessage: string): Promise<string> {
  const msg = userMessage.toLowerCase().trim();

  // Check for amount (omzet)
  const amount = parseIndonesianAmount(userMessage);
  if (amount && amount >= 10000 && (msg.includes("omzet") || msg.includes("pendapatan") || msg.includes("hari ini"))) {
    return await executeTool("catat_omzet", { amount });
  }

  // Check for penjualan patterns
  const jualMatch = msg.match(/(.+?)\s+(?:laku|terjual|jual)\s+(\d+)/);
  if (jualMatch) {
    return await executeTool("catat_penjualan", { product_name: jualMatch[1].trim(), qty: parseInt(jualMatch[2]) });
  }
  const jualMatch2 = msg.match(/(?:jual|laku)\s+(.+?)\s+(\d+)/);
  if (jualMatch2) {
    return await executeTool("catat_penjualan", { product_name: jualMatch2[1].trim(), qty: parseInt(jualMatch2[2]) });
  }

  // Check for restock patterns
  const restockMatch = msg.match(/(?:restock|beli|isi)\s+(.+?)\s+(\d+)/);
  if (restockMatch) {
    return await executeTool("catat_restock", { product_name: restockMatch[1].trim(), qty: parseInt(restockMatch[2]) });
  }

  // Check for cek stok
  if (msg.includes("cek stok") || msg.includes("stok")) {
    const stokMatch = msg.match(/(?:cek\s+)?stok\s+(.+)/);
    if (stokMatch) {
      return await executeTool("cek_stok", { product_name: stokMatch[1].trim() });
    }
  }

  // Check for barang wajib beli
  if (msg.includes("wajib beli") || msg.includes("harus beli") || msg.includes("harus dibeli") || msg.includes("perlu beli")) {
    return await executeTool("cek_barang_wajib_beli", {});
  }

  // Check for laporan
  if (msg.includes("laporan") || msg.includes("ringkasan") || msg.includes("summary")) {
    return await executeTool("laporan_hari_ini", {});
  }

  // Check for pembagian
  if (msg.includes("bagi") || msg.includes("pembagian")) {
    if (amount) {
      return executeTool("hitung_pembagian", { amount });
    }
    return "Mau hitung pembagian berapa Neng? Contoh: \"bagi 500 ribu\"";
  }

  // If just a number, might be omzet
  if (amount && amount >= 50000) {
    return await executeTool("catat_omzet", { amount });
  }

  // Default: friendly response
  return `Halo Neng! 👋 Aku bisa bantu:
• Catat omzet: "pendapatan hari ini 500rb"
• Catat jual: "Garpit laku 2 bungkus"
• Catat restock: "beli Terigu 3 karung"
• Cek stok: "stok Pandemas"
• Barang wajib beli: "barang apa yang harus dibeli?"
• Laporan: "laporan hari ini"

Ketik aja ya Neng! 😊`;
}
