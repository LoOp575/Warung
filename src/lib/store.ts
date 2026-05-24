// WarungNeng - Types, Helpers, Constants (no DB logic here - see supabase.ts)

// === SATUAN & KONVERSI ===
export const SATUAN_OPTIONS = [
  "bungkus", "slop", "pcs", "renceng", "dus", "karung",
  "liter", "tabung", "kg", "gram", "botol", "pack",
] as const;
export type Satuan = typeof SATUAN_OPTIONS[number];

export const KATEGORI_OPTIONS = ["rokok", "snack", "kopi", "sembako", "gas", "pulsa", "lainnya"] as const;
export type Kategori = typeof KATEGORI_OPTIONS[number];

export const KATEGORI_LABEL: Record<string, string> = {
  rokok: "Rokok", kopi: "Kopi", snack: "Snack", sembako: "Sembako",
  gas: "Gas LPG", pulsa: "Pulsa/PPOB", lainnya: "Lainnya",
};

// Konversi rokok: 1 slop = 10 bungkus
export const KONVERSI_ROKOK: Record<string, number> = { bungkus: 1, slop: 10 };

export function toSatuanDasar(qty: number, satuan: string, kategori: string): number {
  if (kategori === "rokok" && KONVERSI_ROKOK[satuan]) return qty * KONVERSI_ROKOK[satuan];
  return qty;
}

export function fromSatuanDasar(qtyDasar: number, kategori: string): { slop: number; bungkus: number; formatted: string } {
  if (kategori === "rokok") {
    const slop = Math.floor(qtyDasar / 10);
    const bungkus = qtyDasar % 10;
    let formatted = "";
    if (slop > 0 && bungkus > 0) formatted = `${slop} slop ${bungkus} bungkus`;
    else if (slop > 0) formatted = `${slop} slop`;
    else formatted = `${bungkus} bungkus`;
    return { slop, bungkus, formatted };
  }
  return { slop: 0, bungkus: qtyDasar, formatted: `${qtyDasar}` };
}

// === APP INTERFACES ===
export interface Barang {
  id: string;
  nama: string;
  kategori: string;
  satuan: string;
  stok: number;
  stokNormal: number;
  minimum: number;
  hargaModal: number;
  hargaJual: number;
}

export interface SaleData {
  id: string;
  totalAmount: number;
  totalCost: number;
  totalProfit: number;
  note: string;
  createdAt: string;
  items: SaleItemData[];
}

export interface SaleItemData {
  productId: string | null;
  productName: string;
  qty: number;
  unit: string;
  buyPrice: number;
  sellPrice: number;
  subtotal: number;
  profit: number;
}

export interface RestockData {
  id: string;
  totalCost: number;
  note: string;
  createdAt: string;
  items: RestockItemData[];
}

export interface RestockItemData {
  productId: string | null;
  productName: string;
  qty: number;
  unit: string;
  buyPrice: number;
  subtotal: number;
}

export interface DailyReport {
  id: string;
  reportDate: string;
  omzet: number;
  modalTerjual: number;
  profitKotor: number;
  restockBudget: number;
  tabungan: number;
  growth: number;
  kasKecil: number;
  totalRestockSpent: number;
}

export interface PulsaTransaction {
  id: string;
  type: "deposit" | "sell";
  amount: number;
  cost: number;
  profit: number;
  note: string;
  balanceAfter: number;
  createdAt: string;
}

// === MAPPING: Supabase row <-> App interface ===
import { ProductRow, SaleRow, SaleItemRow, RestockRow, RestockItemRow, DailyReportRow, PulsaTransactionRow } from "./supabase";

export function rowToBarang(row: ProductRow): Barang {
  return {
    id: row.id,
    nama: row.name,
    kategori: row.category,
    satuan: row.unit,
    stok: row.stock,
    stokNormal: row.target_stock,
    minimum: row.restock_limit,
    hargaModal: row.buy_price,
    hargaJual: row.sell_price,
  };
}

export function barangToRow(b: Omit<Barang, "id">): Omit<ProductRow, "id" | "created_at" | "updated_at"> {
  return {
    name: b.nama,
    category: b.kategori,
    unit: b.satuan,
    stock: b.stok,
    target_stock: b.stokNormal,
    restock_limit: b.minimum,
    buy_price: b.hargaModal,
    sell_price: b.hargaJual,
  };
}

export function rowToSale(row: SaleRow, items: SaleItemRow[]): SaleData {
  return {
    id: row.id,
    totalAmount: row.total_amount,
    totalCost: row.total_cost,
    totalProfit: row.total_profit,
    note: row.note,
    createdAt: row.created_at || "",
    items: items.map((it) => ({
      productId: it.product_id,
      productName: it.product_name,
      qty: it.qty,
      unit: it.unit,
      buyPrice: it.buy_price,
      sellPrice: it.sell_price,
      subtotal: it.subtotal,
      profit: it.profit,
    })),
  };
}

export function rowToRestock(row: RestockRow, items: RestockItemRow[]): RestockData {
  return {
    id: row.id,
    totalCost: row.total_cost,
    note: row.note,
    createdAt: row.created_at || "",
    items: items.map((it) => ({
      productId: it.product_id,
      productName: it.product_name,
      qty: it.qty,
      unit: it.unit,
      buyPrice: it.buy_price,
      subtotal: it.subtotal,
    })),
  };
}

export function rowToReport(row: DailyReportRow): DailyReport {
  return {
    id: row.id,
    reportDate: row.report_date,
    omzet: row.omzet,
    modalTerjual: row.modal_terjual,
    profitKotor: row.profit_kotor,
    restockBudget: row.restock_budget,
    tabungan: row.tabungan,
    growth: row.growth,
    kasKecil: row.kas_kecil,
    totalRestockSpent: row.total_restock_spent,
  };
}

export function rowToPulsa(row: PulsaTransactionRow): PulsaTransaction {
  return {
    id: row.id,
    type: row.type,
    amount: row.amount,
    cost: row.cost,
    profit: row.profit,
    note: row.note,
    balanceAfter: row.balance_after,
    createdAt: row.created_at || "",
  };
}

// === STATUS LOGIC ===
export interface StatusInfo {
  status: "AMAN" | "BELI";
  color: "green" | "red";
  persen: number;
  qtyRekomendasi: number;
  qtyRekomFormatted: string;
}

export function getStatus(barang: Barang): StatusInfo {
  const stokDasar = toSatuanDasar(barang.stok, barang.satuan, barang.kategori);
  const targetDasar = toSatuanDasar(barang.stokNormal, barang.satuan, barang.kategori);
  const minDasar = toSatuanDasar(barang.minimum, barang.satuan, barang.kategori);

  const persen = targetDasar > 0 ? (stokDasar / targetDasar) * 100 : 0;
  const qtyRekomendasi = Math.max(0, barang.stokNormal - barang.stok);

  let qtyRekomFormatted = `${qtyRekomendasi} ${barang.satuan}`;
  if (barang.kategori === "rokok") {
    const rekomDasar = Math.max(0, targetDasar - stokDasar);
    const konversi = fromSatuanDasar(rekomDasar, barang.kategori);
    if (barang.satuan === "bungkus" && rekomDasar >= 10) {
      qtyRekomFormatted = `${rekomDasar} bungkus (${konversi.formatted})`;
    } else if (barang.satuan === "slop") {
      qtyRekomFormatted = `${qtyRekomendasi} slop (${qtyRekomendasi * 10} bungkus)`;
    }
  }

  if (stokDasar <= minDasar) {
    return { status: "BELI", color: "red", persen, qtyRekomendasi, qtyRekomFormatted };
  }
  return { status: "AMAN", color: "green", persen, qtyRekomendasi, qtyRekomFormatted };
}

export function getRekomendasi(barang: Barang, s: StatusInfo): string {
  if (s.status === "BELI") {
    if (barang.kategori === "gas") return `ISI! Beli ${s.qtyRekomFormatted}`;
    if (barang.kategori === "pulsa") return `ISI DEPOSIT!`;
    return `BELI ${s.qtyRekomFormatted}`;
  }
  return `Stok aman (${barang.stok}/${barang.stokNormal} ${barang.satuan})`;
}

// === PROFIT / PEMBAGIAN ===
export function hitungPembagian(omzet: number) {
  return { restock: Math.round(omzet * 0.7), tabungan: Math.round(omzet * 0.15), growth: Math.round(omzet * 0.1), kas: Math.round(omzet * 0.05) };
}

export function hitungMarginPersen(barang: Barang): number {
  if (barang.hargaModal === 0) return 0;
  return Math.round(((barang.hargaJual - barang.hargaModal) / barang.hargaModal) * 100);
}

export function getRekomendasiBelanja(stokBarang: Barang[]) {
  return stokBarang
    .filter((b) => b.kategori !== "pulsa" && getStatus(b).status === "BELI")
    .map((b) => {
      const s = getStatus(b);
      return { barang: b, qtyBeli: s.qtyRekomendasi, qtyBeliFormatted: s.qtyRekomFormatted, estimasiBiaya: s.qtyRekomendasi * b.hargaModal };
    });
}

// === FORMAT HELPERS ===
export function formatRupiah(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return "Rp 0";
  return "Rp " + Number(num).toLocaleString("id-ID");
}

export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function getTanggalIndo(date?: Date): string {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const d = date || new Date();
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatTanggalShort(dateStr: string): string {
  const d = new Date(dateStr);
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

// === LOCAL STORAGE (fallback/cache) ===
export function getData<T>(key: string, defaultVal: T): T {
  if (typeof window === "undefined") return defaultVal;
  try {
    const data = localStorage.getItem("warungos_" + key);
    return data ? JSON.parse(data) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
}

export function setData<T>(key: string, val: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("warungos_" + key, JSON.stringify(val));
}

// === DEFAULT DATA (used when no Supabase and no localStorage) ===
export const DEFAULT_STOK: Barang[] = [
  { id: "default-1", nama: "Pandemas", kategori: "rokok", satuan: "bungkus", stok: 20, stokNormal: 40, minimum: 4, hargaModal: 18000, hargaJual: 20000 },
  { id: "default-2", nama: "Tebu", kategori: "rokok", satuan: "bungkus", stok: 15, stokNormal: 30, minimum: 5, hargaModal: 15000, hargaJual: 17000 },
  { id: "default-3", nama: "Armor", kategori: "rokok", satuan: "slop", stok: 6, stokNormal: 10, minimum: 3, hargaModal: 130000, hargaJual: 150000 },
  { id: "default-4", nama: "76 Apel", kategori: "rokok", satuan: "slop", stok: 3, stokNormal: 8, minimum: 2, hargaModal: 140000, hargaJual: 160000 },
  { id: "default-5", nama: "Kopi Sachet", kategori: "kopi", satuan: "renceng", stok: 6, stokNormal: 15, minimum: 4, hargaModal: 12000, hargaJual: 15000 },
  { id: "default-6", nama: "Beng-beng", kategori: "snack", satuan: "pcs", stok: 20, stokNormal: 50, minimum: 15, hargaModal: 2000, hargaJual: 3000 },
  { id: "default-7", nama: "Terigu", kategori: "sembako", satuan: "karung", stok: 2, stokNormal: 5, minimum: 1, hargaModal: 75000, hargaJual: 90000 },
  { id: "default-8", nama: "LPG 3kg", kategori: "gas", satuan: "tabung", stok: 7, stokNormal: 10, minimum: 3, hargaModal: 18000, hargaJual: 23000 },
];
