import {
  formatCashSplit,
  getLowStockItems,
  getStock,
  parseAmountFromText,
  recordDailyIncome,
  recordRestock,
  recordSale,
  updateStock,
} from "@/lib/warung-tools";

const DEFAULT_MODEL = "gpt-5-mini";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

function getAiConfig() {
  const apiKey = process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.AI_MODEL || DEFAULT_MODEL;
  return { apiKey, baseUrl, model };
}

function extractProductName(text: string) {
  const lowered = text.toLowerCase();
  const withoutKnownWords = lowered
    .replace(/bro|neng|stok|cek|berapa|laku|terjual|jual|beli|restock|tambah|modal|harga|tinggal|sekarang|barang|yang|harus|dibeli/g, " ")
    .replace(/\d+[\d\s.,]*(ribu|rb|k|juta|jt)?/g, " ")
    .replace(/bungkus|slop|pcs|renceng|dus|karung|liter|tabung/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return withoutKnownWords.split(" ").filter(Boolean).slice(0, 3).join(" ");
}

function extractQty(text: string) {
  const match = text.match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return null;
  const qty = Number(match[1].replace(",", "."));
  return Number.isNaN(qty) ? null : qty;
}

function isIncomeIntent(text: string) {
  const lowered = text.toLowerCase();
  return /omzet|pendapatan|hasil|uang masuk|dapat|dapet|income/.test(lowered);
}

function isLowStockIntent(text: string) {
  const lowered = text.toLowerCase();
  return /wajib beli|harus beli|barang.*beli|stok.*menipis|restock apa|belanja apa/.test(lowered);
}

function isStockCheckIntent(text: string) {
  const lowered = text.toLowerCase();
  return /cek stok|stok .*berapa|berapa stok|stok/.test(lowered) && !/tinggal|update|ubah|jadi/.test(lowered);
}

function isSaleIntent(text: string) {
  const lowered = text.toLowerCase();
  return /laku|terjual|jual/.test(lowered);
}

function isRestockIntent(text: string) {
  const lowered = text.toLowerCase();
  return /restock|beli|kulakan|tambah stok/.test(lowered) && !/wajib beli|harus beli/.test(lowered);
}

function isUpdateStockIntent(text: string) {
  const lowered = text.toLowerCase();
  return /stok/.test(lowered) && /tinggal|jadi|update|ubah|sekarang/.test(lowered);
}

async function handleRuleBased(text: string) {
  const amount = parseAmountFromText(text);

  if (isIncomeIntent(text) && amount) {
    const result = await recordDailyIncome(amount);
    return `Siap Neng, pendapatan hari ini sudah dicatat.\n\n${result}`;
  }

  if (isLowStockIntent(text)) {
    return await getLowStockItems();
  }

  if (isSaleIntent(text)) {
    const qty = extractQty(text);
    const productName = extractProductName(text);
    if (qty && productName) return await recordSale(productName, qty);
  }

  if (isRestockIntent(text)) {
    const qty = extractQty(text);
    const productName = extractProductName(text);
    const buyPrice = /modal|harga/.test(text.toLowerCase()) ? amount || undefined : undefined;
    if (qty && productName) return await recordRestock(productName, qty, buyPrice);
  }

  if (isUpdateStockIntent(text)) {
    const qty = extractQty(text);
    const productName = extractProductName(text);
    if (qty !== null && productName) return await updateStock(productName, qty);
  }

  if (isStockCheckIntent(text)) {
    const productName = extractProductName(text);
    if (productName) return await getStock(productName);
  }

  if (amount && /^[\s\d.,]+\s*(ribu|rb|k|juta|jt)?\s*$/i.test(text.trim())) {
    return `Kalau ini pendapatan hari ini, balas: pendapatan ${amount}.\n\nSimulasi pembagian:\n${formatCashSplit(amount)}`;
  }

  return null;
}

async function callAi(messages: ChatMessage[]) {
  const { apiKey, baseUrl, model } = getAiConfig();
  if (!apiKey) {
    return "AI belum aktif bro. Isi AI_API_KEY atau OPENAI_API_KEY di Vercel env dulu.";
  }

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI request gagal: ${res.status} ${body}`);
  }

  const data = await res.json();
  return data?.choices?.[0]?.message?.content || "Maaf bro, AI belum kasih jawaban.";
}

export async function handleAgentMessage(text: string, firstName = "Neng") {
  const lower = text.toLowerCase().trim();

  if (lower === "/start" || lower === "start" || lower === "tes") {
    return "WarungNeng Agent aktif bro. Coba chat: pendapatan hari ini 500 ribu, cek barang wajib beli, atau Garpit laku 2 bungkus.";
  }

  try {
    const ruleBased = await handleRuleBased(text);
    if (ruleBased) return ruleBased;
  } catch (error: any) {
    return `Ada error saat akses data WarungNeng: ${error.message || error}`;
  }

  return callAi([
    {
      role: "system",
      content: `Kamu adalah Neng Agent, asisten pribadi WarungNeng. Jawab santai, singkat, dan praktis dalam bahasa Indonesia. User bernama ${firstName}. Kalau user ingin mencatat omzet, penjualan, stok, atau restock tapi formatnya belum jelas, tanyakan detail yang kurang. Jangan mengaku sudah menyimpan data jika kamu tidak menjalankan tool.`,
    },
    { role: "user", content: text },
  ]);
}
