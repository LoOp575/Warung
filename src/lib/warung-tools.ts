import { createClient } from "@supabase/supabase-js";
import { formatRupiah, hitungPembagian } from "@/lib/store";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabaseServer = supabaseUrl && (serviceRoleKey || anonKey)
  ? createClient(supabaseUrl, (serviceRoleKey || anonKey) as string)
  : null;

function ensureSupabase() {
  if (!supabaseServer) {
    throw new Error("Supabase server belum dikonfigurasi. Isi NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY di Vercel env.");
  }
  return supabaseServer;
}

export function parseAmountFromText(text: string): number | null {
  const cleaned = text.toLowerCase().replace(/rp|rupiah|\./g, " ").replace(/,/g, ".");
  const match = cleaned.match(/(\d+(?:\.\d+)?)\s*(juta|jt|ribu|rb|k)?/i);
  if (!match) return null;

  const value = Number(match[1]);
  if (Number.isNaN(value)) return null;

  const unit = match[2]?.toLowerCase();
  if (unit === "juta" || unit === "jt") return Math.round(value * 1_000_000);
  if (unit === "ribu" || unit === "rb" || unit === "k") return Math.round(value * 1_000);
  return Math.round(value);
}

export function formatCashSplit(amount: number) {
  const split = hitungPembagian(amount);
  return [
    `Omzet: ${formatRupiah(amount)}`,
    `Restock 70%: ${formatRupiah(split.restock)}`,
    `Tabungan 15%: ${formatRupiah(split.tabungan)}`,
    `Growth 10%: ${formatRupiah(split.growth)}`,
    `Kas kecil 5%: ${formatRupiah(split.kas)}`,
  ].join("\n");
}

export async function recordDailyIncome(amount: number) {
  const db = ensureSupabase();
  const today = new Date().toISOString().slice(0, 10);
  const split = hitungPembagian(amount);

  const payload = {
    report_date: today,
    omzet: amount,
    restock_budget: split.restock,
    tabungan: split.tabungan,
    growth: split.growth,
    kas_kecil: split.kas,
    updated_at: new Date().toISOString(),
  };

  const { error } = await db
    .from("daily_reports")
    .upsert(payload, { onConflict: "report_date" });

  if (error) throw error;
  return formatCashSplit(amount);
}

export async function getLowStockItems() {
  const db = ensureSupabase();
  const { data, error } = await db
    .from("products")
    .select("name,category,unit,stock,target_stock,restock_limit")
    .order("category", { ascending: true });

  if (error) throw error;

  const low = (data || []).filter((item: any) => Number(item.stock) <= Number(item.restock_limit));
  if (low.length === 0) return "Semua stok masih aman bro.";

  return [
    "Barang yang wajib dibeli:",
    ...low.map((item: any) => `- ${item.name}: stok ${item.stock}/${item.target_stock} ${item.unit}, batas ${item.restock_limit}`),
  ].join("\n");
}

export async function getStock(productName: string) {
  const db = ensureSupabase();
  const { data, error } = await db
    .from("products")
    .select("name,category,unit,stock,target_stock,restock_limit,buy_price,sell_price")
    .ilike("name", `%${productName}%`)
    .limit(5);

  if (error) throw error;
  if (!data || data.length === 0) return `Barang "${productName}" belum ketemu di stok.`;

  return data.map((item: any) => {
    const status = Number(item.stock) <= Number(item.restock_limit) ? "BELI" : "AMAN";
    return `${item.name}: ${item.stock}/${item.target_stock} ${item.unit} (${status}) | modal ${formatRupiah(Number(item.buy_price || 0))} | jual ${formatRupiah(Number(item.sell_price || 0))}`;
  }).join("\n");
}

export async function updateStock(productName: string, stock: number) {
  const db = ensureSupabase();
  const { data, error } = await db
    .from("products")
    .select("id,name,unit")
    .ilike("name", `%${productName}%`)
    .limit(1)
    .single();

  if (error) throw error;
  if (!data) return `Barang "${productName}" belum ketemu.`;

  const { error: updateError } = await db
    .from("products")
    .update({ stock, updated_at: new Date().toISOString() })
    .eq("id", data.id);

  if (updateError) throw updateError;
  return `Siap, stok ${data.name} sekarang ${stock} ${data.unit}.`;
}

export async function recordRestock(productName: string, qty: number, buyPrice?: number) {
  const db = ensureSupabase();
  const { data, error } = await db
    .from("products")
    .select("id,name,unit,stock,buy_price")
    .ilike("name", `%${productName}%`)
    .limit(1)
    .single();

  if (error) throw error;
  if (!data) return `Barang "${productName}" belum ketemu.`;

  const nextStock = Number(data.stock || 0) + qty;
  const nextBuyPrice = buyPrice ?? Number(data.buy_price || 0);
  const { error: updateError } = await db
    .from("products")
    .update({ stock: nextStock, buy_price: nextBuyPrice, updated_at: new Date().toISOString() })
    .eq("id", data.id);

  if (updateError) throw updateError;
  return `Siap, restock ${data.name} +${qty} ${data.unit}. Stok sekarang ${nextStock} ${data.unit}.`;
}

export async function recordSale(productName: string, qty: number) {
  const db = ensureSupabase();
  const { data, error } = await db
    .from("products")
    .select("id,name,unit,stock,buy_price,sell_price")
    .ilike("name", `%${productName}%`)
    .limit(1)
    .single();

  if (error) throw error;
  if (!data) return `Barang "${productName}" belum ketemu.`;

  const currentStock = Number(data.stock || 0);
  if (currentStock < qty) return `Stok ${data.name} tidak cukup. Stok sekarang ${currentStock} ${data.unit}.`;

  const nextStock = currentStock - qty;
  const subtotal = qty * Number(data.sell_price || 0);
  const modal = qty * Number(data.buy_price || 0);
  const profit = subtotal - modal;

  const { error: updateError } = await db
    .from("products")
    .update({ stock: nextStock, updated_at: new Date().toISOString() })
    .eq("id", data.id);

  if (updateError) throw updateError;

  return [
    `Siap, ${data.name} laku ${qty} ${data.unit}.`,
    `Stok sekarang: ${nextStock} ${data.unit}`,
    `Omzet: ${formatRupiah(subtotal)}`,
    `Profit: ${formatRupiah(profit)}`,
  ].join("\n");
}
