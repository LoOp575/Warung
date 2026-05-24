import { createClient, SupabaseClient } from "@supabase/supabase-js";

// === CLIENT SETUP ===
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null;

export function isSupabaseEnabled(): boolean {
  return supabase !== null;
}

// === TYPES (DB rows) ===
export interface ProductRow {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  target_stock: number;
  restock_limit: number;
  buy_price: number;
  sell_price: number;
  created_at?: string;
  updated_at?: string;
}

export interface SaleRow {
  id: string;
  total_amount: number;
  total_cost: number;
  total_profit: number;
  note: string;
  created_at?: string;
}

export interface SaleItemRow {
  id: string;
  sale_id: string;
  product_id: string | null;
  product_name: string;
  qty: number;
  unit: string;
  buy_price: number;
  sell_price: number;
  subtotal: number;
  profit: number;
  created_at?: string;
}

export interface RestockRow {
  id: string;
  total_cost: number;
  note: string;
  created_at?: string;
}

export interface RestockItemRow {
  id: string;
  restock_id: string;
  product_id: string | null;
  product_name: string;
  qty: number;
  unit: string;
  buy_price: number;
  subtotal: number;
  created_at?: string;
}

export interface DailyReportRow {
  id: string;
  report_date: string;
  omzet: number;
  modal_terjual: number;
  profit_kotor: number;
  restock_budget: number;
  tabungan: number;
  growth: number;
  kas_kecil: number;
  total_restock_spent: number;
  created_at?: string;
  updated_at?: string;
}

export interface PulsaTransactionRow {
  id: string;
  type: "deposit" | "sell";
  amount: number;
  cost: number;
  profit: number;
  note: string;
  balance_after: number;
  created_at?: string;
}

// === PRODUCTS CRUD ===
export async function dbFetchProducts(): Promise<ProductRow[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: true });
  if (error) { console.error("dbFetchProducts:", error); return null; }
  return data as ProductRow[];
}

export async function dbInsertProduct(p: Omit<ProductRow, "id" | "created_at" | "updated_at">): Promise<ProductRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("products").insert(p).select().single();
  if (error) { console.error("dbInsertProduct:", error); return null; }
  return data as ProductRow;
}

export async function dbUpdateProduct(id: string, updates: Partial<Omit<ProductRow, "id" | "created_at">>): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("products").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id);
  if (error) { console.error("dbUpdateProduct:", error); return false; }
  return true;
}

export async function dbDeleteProduct(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) { console.error("dbDeleteProduct:", error); return false; }
  return true;
}

// === SALES CRUD ===
export async function dbCreateSale(sale: Omit<SaleRow, "id" | "created_at">, items: Omit<SaleItemRow, "id" | "sale_id" | "created_at">[]): Promise<SaleRow | null> {
  if (!supabase) return null;
  const { data: saleData, error: saleErr } = await supabase.from("sales").insert(sale).select().single();
  if (saleErr || !saleData) { console.error("dbCreateSale:", saleErr); return null; }
  const saleRow = saleData as SaleRow;
  if (items.length > 0) {
    const itemsWithSaleId = items.map((it) => ({ ...it, sale_id: saleRow.id }));
    const { error: itemErr } = await supabase.from("sale_items").insert(itemsWithSaleId);
    if (itemErr) console.error("dbCreateSale items:", itemErr);
  }
  return saleRow;
}

export async function dbFetchSalesToday(): Promise<SaleRow[] | null> {
  if (!supabase) return null;
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase.from("sales").select("*").gte("created_at", today + "T00:00:00").order("created_at", { ascending: false });
  if (error) { console.error("dbFetchSalesToday:", error); return null; }
  return data as SaleRow[];
}

export async function dbFetchSaleItems(saleId: string): Promise<SaleItemRow[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("sale_items").select("*").eq("sale_id", saleId);
  if (error) { console.error("dbFetchSaleItems:", error); return null; }
  return data as SaleItemRow[];
}

export async function dbFetchSaleItemsToday(): Promise<SaleItemRow[] | null> {
  if (!supabase) return null;
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase.from("sale_items").select("*").gte("created_at", today + "T00:00:00");
  if (error) { console.error("dbFetchSaleItemsToday:", error); return null; }
  return data as SaleItemRow[];
}

// === RESTOCKS CRUD ===
export async function dbCreateRestock(restock: Omit<RestockRow, "id" | "created_at">, items: Omit<RestockItemRow, "id" | "restock_id" | "created_at">[]): Promise<RestockRow | null> {
  if (!supabase) return null;
  const { data: restockData, error: restockErr } = await supabase.from("restocks").insert(restock).select().single();
  if (restockErr || !restockData) { console.error("dbCreateRestock:", restockErr); return null; }
  const restockRow = restockData as RestockRow;
  if (items.length > 0) {
    const itemsWithId = items.map((it) => ({ ...it, restock_id: restockRow.id }));
    const { error: itemErr } = await supabase.from("restock_items").insert(itemsWithId);
    if (itemErr) console.error("dbCreateRestock items:", itemErr);
  }
  return restockRow;
}

export async function dbFetchRestocksToday(): Promise<RestockRow[] | null> {
  if (!supabase) return null;
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase.from("restocks").select("*").gte("created_at", today + "T00:00:00").order("created_at", { ascending: false });
  if (error) { console.error("dbFetchRestocksToday:", error); return null; }
  return data as RestockRow[];
}

// === DAILY REPORTS CRUD ===
export async function dbUpsertDailyReport(report: Omit<DailyReportRow, "id" | "created_at" | "updated_at">): Promise<DailyReportRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("daily_reports").upsert({ ...report, updated_at: new Date().toISOString() }, { onConflict: "report_date" }).select().single();
  if (error) { console.error("dbUpsertDailyReport:", error); return null; }
  return data as DailyReportRow;
}

export async function dbFetchDailyReports(days: number = 30): Promise<DailyReportRow[] | null> {
  if (!supabase) return null;
  const since = new Date();
  since.setDate(since.getDate() - days);
  const { data, error } = await supabase.from("daily_reports").select("*").gte("report_date", since.toISOString().split("T")[0]).order("report_date", { ascending: false });
  if (error) { console.error("dbFetchDailyReports:", error); return null; }
  return data as DailyReportRow[];
}

export async function dbFetchTodayReport(): Promise<DailyReportRow | null> {
  if (!supabase) return null;
  const today = new Date().toISOString().split("T")[0];
  const { data, error } = await supabase.from("daily_reports").select("*").eq("report_date", today).single();
  if (error && error.code !== "PGRST116") { console.error("dbFetchTodayReport:", error); return null; }
  return (data as DailyReportRow) || null;
}

// === PULSA TRANSACTIONS CRUD ===
export async function dbInsertPulsaTransaction(tx: Omit<PulsaTransactionRow, "id" | "created_at">): Promise<PulsaTransactionRow | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("pulsa_transactions").insert(tx).select().single();
  if (error) { console.error("dbInsertPulsaTx:", error); return null; }
  return data as PulsaTransactionRow;
}

export async function dbFetchPulsaTransactions(limit: number = 50): Promise<PulsaTransactionRow[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("pulsa_transactions").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) { console.error("dbFetchPulsaTx:", error); return null; }
  return data as PulsaTransactionRow[];
}

export async function dbFetchPulsaBalance(): Promise<number | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("pulsa_transactions").select("balance_after").order("created_at", { ascending: false }).limit(1);
  if (error) { console.error("dbFetchPulsaBalance:", error); return null; }
  if (data && data.length > 0) return (data[0] as { balance_after: number }).balance_after;
  return 0;
}

// === BACKUP / EXPORT ===
export async function dbExportAll(): Promise<Record<string, unknown[]> | null> {
  if (!supabase) return null;
  const [products, sales, saleItems, restocks, restockItems, reports, pulsa] = await Promise.all([
    supabase.from("products").select("*"),
    supabase.from("sales").select("*"),
    supabase.from("sale_items").select("*"),
    supabase.from("restocks").select("*"),
    supabase.from("restock_items").select("*"),
    supabase.from("daily_reports").select("*"),
    supabase.from("pulsa_transactions").select("*"),
  ]);
  return {
    products: products.data || [],
    sales: sales.data || [],
    sale_items: saleItems.data || [],
    restocks: restocks.data || [],
    restock_items: restockItems.data || [],
    daily_reports: reports.data || [],
    pulsa_transactions: pulsa.data || [],
  };
}

export async function dbResetAll(): Promise<boolean> {
  if (!supabase) return false;
  const tables = ["sale_items", "sale", "restock_items", "restocks", "pulsa_transactions", "daily_reports", "products"];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error && error.code !== "PGRST116") console.error(`Reset ${table}:`, error);
  }
  return true;
}
