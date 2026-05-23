import { createClient } from "@supabase/supabase-js";
import { Barang } from "@/lib/store";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

type ProductRow = {
  id: string;
  name: string;
  category: string;
  unit: string;
  stock: number;
  target_stock: number;
  restock_limit: number;
  buy_price: number;
  sell_price: number;
};

export function productToBarang(row: ProductRow, fallbackId: number): Barang {
  return {
    id: fallbackId,
    remoteId: row.id,
    nama: row.name,
    kategori: row.category,
    satuan: row.unit,
    stok: Number(row.stock) || 0,
    stokNormal: Number(row.target_stock) || 0,
    minimum: Number(row.restock_limit) || 0,
    hargaModal: Number(row.buy_price) || 0,
    hargaJual: Number(row.sell_price) || 0,
  };
}

export function barangToProduct(barang: Omit<Barang, "id"> | Barang) {
  return {
    name: barang.nama,
    category: barang.kategori,
    unit: barang.satuan,
    stock: barang.stok,
    target_stock: barang.stokNormal,
    restock_limit: barang.minimum,
    buy_price: barang.hargaModal,
    sell_price: barang.hargaJual,
  };
}

export async function fetchProducts(): Promise<Barang[] | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("products")
    .select("id,name,category,unit,stock,target_stock,restock_limit,buy_price,sell_price")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data || []).map((row, index) => productToBarang(row as ProductRow, index + 1));
}

export async function insertProduct(barang: Omit<Barang, "id">): Promise<Barang | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("products")
    .insert(barangToProduct(barang))
    .select("id,name,category,unit,stock,target_stock,restock_limit,buy_price,sell_price")
    .single();

  if (error) throw error;
  return productToBarang(data as ProductRow, Date.now());
}

export async function updateProduct(barang: Barang): Promise<void> {
  if (!supabase || !barang.remoteId) return;

  const { error } = await supabase
    .from("products")
    .update({ ...barangToProduct(barang), updated_at: new Date().toISOString() })
    .eq("id", barang.remoteId);

  if (error) throw error;
}

export async function deleteProduct(barang: Barang): Promise<void> {
  if (!supabase || !barang.remoteId) return;

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", barang.remoteId);

  if (error) throw error;
}
