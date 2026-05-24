// WarungNeng - Warung Tools (Supabase-backed functions for Telegram AI Agent)
// Uses SUPABASE_SERVICE_ROLE_KEY for server-side operations

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function getServiceClient() {
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey);
}

// === HELPERS ===
function formatRupiah(num: number): string {
  if (!num || isNaN(num)) return "Rp 0";
  return "Rp " + Number(num).toLocaleString("id-ID");
}

function getToday(): string {
  // WIB = UTC+7
  const now = new Date();
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().split("T")[0];
}

// === TOOL: catat_omzet ===
export async function catatOmzet(amount: number): Promise<string> {
  const supabase = getServiceClient();
  if (!supabase) return "❌ Supabase belum dikonfigurasi.";

  const today = getToday();
  const restock = Math.round(amount * 0.7);
  const tabungan = Math.round(amount * 0.15);
  const growth = Math.round(amount * 0.1);
  const kasKecil = Math.round(amount * 0.05);

  // Upsert daily report
  const { error } = await supabase.from("daily_reports").upsert(
    {
      report_date: today,
      omzet: amount,
      restock_budget: restock,
      tabungan: tabungan,
      growth: growth,
      kas_kecil: kasKecil,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "report_date" }
  );

  if (error) {
    console.error("catatOmzet error:", error);
    return "❌ Gagal menyimpan omzet: " + error.message;
  }

  return `✅ *Omzet hari ini dicatat: ${formatRupiah(amount)}*

💰 Pembagian uang:
• Restock 70%: ${formatRupiah(restock)}
• Tabungan 15%: ${formatRupiah(tabungan)}
• Growth 10%: ${formatRupiah(growth)}
• Kas kecil 5%: ${formatRupiah(kasKecil)}

Semangat ya Neng! 💪`;
}

// === TOOL: hitung_pembagian ===
export function hitungPembagian(amount: number): string {
  const restock = Math.round(amount * 0.7);
  const tabungan = Math.round(amount * 0.15);
  const growth = Math.round(amount * 0.1);
  const kasKecil = Math.round(amount * 0.05);

  return `💰 *Pembagian ${formatRupiah(amount)}:*
• Restock 70%: ${formatRupiah(restock)}
• Tabungan 15%: ${formatRupiah(tabungan)}
• Growth 10%: ${formatRupiah(growth)}
• Kas kecil 5%: ${formatRupiah(kasKecil)}`;
}

// === TOOL: catat_penjualan ===
export async function catatPenjualan(productName: string, qty: number): Promise<string> {
  const supabase = getServiceClient();
  if (!supabase) return "❌ Supabase belum dikonfigurasi.";

  // Find product (case-insensitive partial match)
  const { data: products, error: findErr } = await supabase
    .from("products")
    .select("*")
    .ilike("name", `%${productName}%`)
    .limit(1);

  if (findErr || !products || products.length === 0) {
    return `❌ Barang "${productName}" tidak ditemukan di database.`;
  }

  const product = products[0];

  if (product.stock < qty) {
    return `⚠️ Stok ${product.name} tidak cukup! Stok sekarang: ${product.stock} ${product.unit}.`;
  }

  const newStock = product.stock - qty;
  const subtotal = qty * product.sell_price;
  const modalTerjual = qty * product.buy_price;
  const profit = subtotal - modalTerjual;

  // Update stock
  const { error: updateErr } = await supabase
    .from("products")
    .update({ stock: newStock, updated_at: new Date().toISOString() })
    .eq("id", product.id);

  if (updateErr) {
    return "❌ Gagal update stok: " + updateErr.message;
  }

  // Try to record sale
  try {
    const { data: saleData } = await supabase
      .from("sales")
      .insert({ total_amount: subtotal, total_cost: modalTerjual, total_profit: profit, note: `Telegram: ${product.name} x${qty}` })
      .select()
      .single();

    if (saleData) {
      await supabase.from("sale_items").insert({
        sale_id: saleData.id,
        product_id: product.id,
        product_name: product.name,
        qty,
        unit: product.unit,
        buy_price: product.buy_price,
        sell_price: product.sell_price,
        subtotal,
        profit,
      });
    }
  } catch (e) {
    // Sale recording is optional, stock already updated
    console.error("Sale record error:", e);
  }

  // Update daily report omzet
  const today = getToday();
  const { data: report } = await supabase
    .from("daily_reports")
    .select("*")
    .eq("report_date", today)
    .single();

  if (report) {
    await supabase.from("daily_reports").update({
      omzet: report.omzet + subtotal,
      modal_terjual: report.modal_terjual + modalTerjual,
      profit_kotor: report.profit_kotor + profit,
      updated_at: new Date().toISOString(),
    }).eq("id", report.id);
  } else {
    await supabase.from("daily_reports").insert({
      report_date: today,
      omzet: subtotal,
      modal_terjual: modalTerjual,
      profit_kotor: profit,
      restock_budget: Math.round(subtotal * 0.7),
      tabungan: Math.round(subtotal * 0.15),
      growth: Math.round(subtotal * 0.1),
      kas_kecil: Math.round(subtotal * 0.05),
      total_restock_spent: 0,
    });
  }

  return `✅ *${product.name}* terjual ${qty} ${product.unit}.
• Omzet: +${formatRupiah(subtotal)}
• Profit: +${formatRupiah(profit)}
• Stok sisa: ${newStock} ${product.unit}${newStock <= product.restock_limit ? "\n⚠️ *Stok sudah di batas restock!*" : ""}`;
}

// === TOOL: catat_restock ===
export async function catatRestock(productName: string, qty: number, buyPrice?: number): Promise<string> {
  const supabase = getServiceClient();
  if (!supabase) return "❌ Supabase belum dikonfigurasi.";

  const { data: products, error: findErr } = await supabase
    .from("products")
    .select("*")
    .ilike("name", `%${productName}%`)
    .limit(1);

  if (findErr || !products || products.length === 0) {
    return `❌ Barang "${productName}" tidak ditemukan di database.`;
  }

  const product = products[0];
  const newStock = product.stock + qty;
  const actualBuyPrice = buyPrice || product.buy_price;
  const totalCost = qty * actualBuyPrice;

  // Update stock and buy price
  const updates: Record<string, unknown> = { stock: newStock, updated_at: new Date().toISOString() };
  if (buyPrice) updates.buy_price = buyPrice;

  const { error: updateErr } = await supabase
    .from("products")
    .update(updates)
    .eq("id", product.id);

  if (updateErr) {
    return "❌ Gagal update stok: " + updateErr.message;
  }

  // Try to record restock
  try {
    const { data: restockData } = await supabase
      .from("restocks")
      .insert({ total_cost: totalCost, note: `Telegram: ${product.name} x${qty}` })
      .select()
      .single();

    if (restockData) {
      await supabase.from("restock_items").insert({
        restock_id: restockData.id,
        product_id: product.id,
        product_name: product.name,
        qty,
        unit: product.unit,
        buy_price: actualBuyPrice,
        subtotal: totalCost,
      });
    }
  } catch (e) {
    console.error("Restock record error:", e);
  }

  // Update daily report
  const today = getToday();
  const { data: report } = await supabase
    .from("daily_reports")
    .select("*")
    .eq("report_date", today)
    .single();

  if (report) {
    await supabase.from("daily_reports").update({
      total_restock_spent: report.total_restock_spent + totalCost,
      updated_at: new Date().toISOString(),
    }).eq("id", report.id);
  }

  return `✅ Restock *${product.name}* +${qty} ${product.unit}.
• Biaya: ${formatRupiah(totalCost)}
• Stok baru: ${newStock} ${product.unit}${buyPrice ? `\n• Harga modal diupdate: ${formatRupiah(buyPrice)}` : ""}`;
}

// === TOOL: update_stok ===
export async function updateStok(productName: string, stock: number): Promise<string> {
  const supabase = getServiceClient();
  if (!supabase) return "❌ Supabase belum dikonfigurasi.";

  const { data: products, error: findErr } = await supabase
    .from("products")
    .select("*")
    .ilike("name", `%${productName}%`)
    .limit(1);

  if (findErr || !products || products.length === 0) {
    return `❌ Barang "${productName}" tidak ditemukan.`;
  }

  const product = products[0];
  const { error: updateErr } = await supabase
    .from("products")
    .update({ stock, updated_at: new Date().toISOString() })
    .eq("id", product.id);

  if (updateErr) {
    return "❌ Gagal update stok: " + updateErr.message;
  }

  return `✅ Stok *${product.name}* diupdate jadi ${stock} ${product.unit}.${stock <= product.restock_limit ? "\n⚠️ *Sudah di batas restock!*" : ""}`;
}

// === TOOL: cek_stok ===
export async function cekStok(productName: string): Promise<string> {
  const supabase = getServiceClient();
  if (!supabase) return "❌ Supabase belum dikonfigurasi.";

  const { data: products, error: findErr } = await supabase
    .from("products")
    .select("*")
    .ilike("name", `%${productName}%`)
    .limit(5);

  if (findErr || !products || products.length === 0) {
    return `❌ Barang "${productName}" tidak ditemukan.`;
  }

  const lines = products.map((p) => {
    const status = p.stock <= p.restock_limit ? "🔴 BELI" : "🟢 AMAN";
    return `• *${p.name}*: ${p.stock}/${p.target_stock} ${p.unit} ${status}\n  Modal: ${formatRupiah(p.buy_price)} | Jual: ${formatRupiah(p.sell_price)}`;
  });

  return `📦 *Hasil cek stok "${productName}":*\n\n${lines.join("\n\n")}`;
}

// === TOOL: cek_barang_wajib_beli ===
export async function cekBarangWajibBeli(): Promise<string> {
  const supabase = getServiceClient();
  if (!supabase) return "❌ Supabase belum dikonfigurasi.";

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("stock", { ascending: true });

  if (error || !products) {
    return "❌ Gagal ambil data produk.";
  }

  const wajibBeli = products.filter((p) => p.stock <= p.restock_limit);

  if (wajibBeli.length === 0) {
    return "✅ *Semua stok aman!* Tidak ada barang yang perlu dibeli saat ini.";
  }

  let totalEstimasi = 0;
  const lines = wajibBeli.map((p) => {
    const qtyBeli = p.target_stock - p.stock;
    const biaya = qtyBeli * p.buy_price;
    totalEstimasi += biaya;
    return `• *${p.name}*: ${p.stock}/${p.target_stock} ${p.unit}\n  Beli ${qtyBeli} ${p.unit} ≈ ${formatRupiah(biaya)}`;
  });

  return `🛒 *Barang wajib beli (${wajibBeli.length} item):*\n\n${lines.join("\n\n")}\n\n💰 *Estimasi total: ${formatRupiah(totalEstimasi)}*`;
}

// === TOOL: laporan_hari_ini ===
export async function laporanHariIni(): Promise<string> {
  const supabase = getServiceClient();
  if (!supabase) return "❌ Supabase belum dikonfigurasi.";

  const today = getToday();

  const { data: report } = await supabase
    .from("daily_reports")
    .select("*")
    .eq("report_date", today)
    .single();

  if (!report) {
    return "📊 Belum ada laporan hari ini. Belum ada transaksi tercatat.";
  }

  const pembagian = {
    restock: Math.round(report.omzet * 0.7),
    tabungan: Math.round(report.omzet * 0.15),
    growth: Math.round(report.omzet * 0.1),
    kas: Math.round(report.omzet * 0.05),
  };

  return `📊 *Laporan Hari Ini (${today}):*

💵 Omzet: ${formatRupiah(report.omzet)}
📈 Profit Kotor: ${formatRupiah(report.profit_kotor)}
💳 Modal Terjual: ${formatRupiah(report.modal_terjual)}
🛒 Restock Keluar: ${formatRupiah(report.total_restock_spent)}

💰 *Pembagian Uang:*
• Restock 70%: ${formatRupiah(pembagian.restock)}
• Tabungan 15%: ${formatRupiah(pembagian.tabungan)}
• Growth 10%: ${formatRupiah(pembagian.growth)}
• Kas kecil 5%: ${formatRupiah(pembagian.kas)}`;
}

// === TOOL REGISTRY (for AI agent) ===
export const TOOL_DEFINITIONS = [
  {
    name: "catat_omzet",
    description: "Catat omzet/pendapatan harian warung dan hitung pembagian uang 70/15/10/5. Gunakan jika user menyebut pendapatan/omzet hari ini.",
    parameters: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Jumlah omzet dalam Rupiah (angka saja tanpa 'Rp')" },
      },
      required: ["amount"],
    },
  },
  {
    name: "hitung_pembagian",
    description: "Hitung pembagian uang 70% restock, 15% tabungan, 10% growth, 5% kas kecil dari suatu nominal. Gunakan jika user hanya ingin tahu pembagian tanpa menyimpan.",
    parameters: {
      type: "object",
      properties: {
        amount: { type: "number", description: "Nominal uang dalam Rupiah" },
      },
      required: ["amount"],
    },
  },
  {
    name: "catat_penjualan",
    description: "Catat penjualan barang. Kurangi stok, hitung profit. Gunakan jika user bilang barang terjual/laku.",
    parameters: {
      type: "object",
      properties: {
        product_name: { type: "string", description: "Nama barang yang terjual" },
        qty: { type: "number", description: "Jumlah yang terjual" },
      },
      required: ["product_name", "qty"],
    },
  },
  {
    name: "catat_restock",
    description: "Catat restock/pembelian barang untuk warung. Tambah stok. Gunakan jika user bilang beli/restock barang.",
    parameters: {
      type: "object",
      properties: {
        product_name: { type: "string", description: "Nama barang yang dibeli/restock" },
        qty: { type: "number", description: "Jumlah yang dibeli" },
        buy_price: { type: "number", description: "Harga modal per satuan (opsional, kosongkan jika tidak disebutkan)" },
      },
      required: ["product_name", "qty"],
    },
  },
  {
    name: "update_stok",
    description: "Update/set stok barang ke angka tertentu. Gunakan jika user ingin langsung set stok ke nilai tertentu.",
    parameters: {
      type: "object",
      properties: {
        product_name: { type: "string", description: "Nama barang" },
        stock: { type: "number", description: "Stok baru yang diinginkan" },
      },
      required: ["product_name", "stock"],
    },
  },
  {
    name: "cek_stok",
    description: "Cek stok suatu barang termasuk harga dan status. Gunakan jika user tanya stok barang tertentu.",
    parameters: {
      type: "object",
      properties: {
        product_name: { type: "string", description: "Nama barang yang dicek" },
      },
      required: ["product_name"],
    },
  },
  {
    name: "cek_barang_wajib_beli",
    description: "Tampilkan semua barang yang stoknya sudah di batas restock dan harus dibeli. Gunakan jika user tanya barang apa yang harus dibeli/restock.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "laporan_hari_ini",
    description: "Tampilkan laporan ringkasan hari ini (omzet, profit, restock, pembagian uang). Gunakan jika user tanya laporan/ringkasan hari ini.",
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

// Execute a tool by name
export async function executeTool(name: string, args: Record<string, unknown>): Promise<string> {
  switch (name) {
    case "catat_omzet":
      return catatOmzet(args.amount as number);
    case "hitung_pembagian":
      return hitungPembagian(args.amount as number);
    case "catat_penjualan":
      return catatPenjualan(args.product_name as string, args.qty as number);
    case "catat_restock":
      return catatRestock(args.product_name as string, args.qty as number, args.buy_price as number | undefined);
    case "update_stok":
      return updateStok(args.product_name as string, args.stock as number);
    case "cek_stok":
      return cekStok(args.product_name as string);
    case "cek_barang_wajib_beli":
      return cekBarangWajibBeli();
    case "laporan_hari_ini":
      return laporanHariIni();
    default:
      return `❌ Tool "${name}" tidak dikenal.`;
  }
}
