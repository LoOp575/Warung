// WarungOS v2 - Data Store (Multi-Satuan)

// === SATUAN & KONVERSI ===
export const SATUAN_OPTIONS = ["bungkus", "slop", "renceng", "dus", "pcs", "karung", "liter", "tabung"] as const;
export type Satuan = typeof SATUAN_OPTIONS[number];

// Konversi ke satuan dasar (untuk rokok: bungkus)
export const KONVERSI_ROKOK: Record<string, number> = {
  bungkus: 1,
  slop: 10, // 1 slop = 10 bungkus
};

export function toSatuanDasar(qty: number, satuan: string, kategori: string): number {
  if (kategori === "rokok" && KONVERSI_ROKOK[satuan]) {
    return qty * KONVERSI_ROKOK[satuan];
  }
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

// === INTERFACES ===
export interface Barang {
  id: number;
  remoteId?: string;
  nama: string;
  kategori: string;
  satuan: string;
  stok: number;
  stokNormal: number;
  minimum: number;
  hargaModal: number;
  hargaJual: number;
}

export interface OmzetHarian { tanggal: string; jumlah: number; }
export interface RiwayatHarian { tanggal: string; omzet: number; profit: number; pengeluaran: number; barangDibeli: { nama: string; qty: number; total: number }[]; }
export interface ModalData { awal: number; target: number; berjalan: number; history: { tanggal: string; jumlah: number; sumber: string }[]; }
export interface GasData { tabungIsi: number; tabungKosong: number; hargaBeli: number; hargaJual: number; riwayat: { tanggal: string; aksi: "isi" | "jual"; qty: number }[]; }
export interface PulsaData { saldo: number; saldoMax: number; riwayat: { tanggal: string; aksi: "deposit" | "jual"; jumlah: number; keterangan: string }[]; }
export interface RekomendasiBelanja { barang: Barang; qtyBeli: number; qtyBeliFormatted: string; estimasiBiaya: number; }

export const DEFAULT_STOK: Barang[] = [
  { id: 1, nama: "Pandemas", kategori: "rokok", satuan: "bungkus", stok: 20, stokNormal: 40, minimum: 4, hargaModal: 18000, hargaJual: 20000 },
  { id: 2, nama: "Tebu", kategori: "rokok", satuan: "bungkus", stok: 15, stokNormal: 30, minimum: 5, hargaModal: 15000, hargaJual: 17000 },
  { id: 3, nama: "Armor", kategori: "rokok", satuan: "slop", stok: 6, stokNormal: 10, minimum: 3, hargaModal: 130000, hargaJual: 150000 },
  { id: 4, nama: "76 Apel", kategori: "rokok", satuan: "slop", stok: 3, stokNormal: 8, minimum: 2, hargaModal: 140000, hargaJual: 160000 },
  { id: 5, nama: "Kopi Sachet", kategori: "kopi", satuan: "renceng", stok: 6, stokNormal: 15, minimum: 4, hargaModal: 12000, hargaJual: 15000 },
  { id: 6, nama: "Beng-beng", kategori: "snack", satuan: "pcs", stok: 20, stokNormal: 50, minimum: 15, hargaModal: 2000, hargaJual: 3000 },
  { id: 7, nama: "Coklatos", kategori: "snack", satuan: "pcs", stok: 25, stokNormal: 50, minimum: 15, hargaModal: 1500, hargaJual: 2500 },
  { id: 8, nama: "Snack Lain", kategori: "snack", satuan: "pcs", stok: 40, stokNormal: 60, minimum: 18, hargaModal: 1000, hargaJual: 2000 },
  { id: 9, nama: "Terigu", kategori: "sembako", satuan: "karung", stok: 2, stokNormal: 5, minimum: 1, hargaModal: 75000, hargaJual: 90000 },
  { id: 10, nama: "Minyak Goreng", kategori: "sembako", satuan: "liter", stok: 10, stokNormal: 20, minimum: 10, hargaModal: 15000, hargaJual: 18000 },
  { id: 11, nama: "Gula", kategori: "sembako", satuan: "karung", stok: 2, stokNormal: 5, minimum: 1, hargaModal: 65000, hargaJual: 78000 },
  { id: 12, nama: "Masako", kategori: "sembako", satuan: "renceng", stok: 8, stokNormal: 20, minimum: 5, hargaModal: 10000, hargaJual: 13000 },
  { id: 13, nama: "Gas LPG 3kg", kategori: "gas", satuan: "tabung", stok: 7, stokNormal: 10, minimum: 3, hargaModal: 18000, hargaJual: 23000 },
  { id: 14, nama: "Deposit Pulsa", kategori: "pulsa", satuan: "pcs", stok: 40, stokNormal: 100, minimum: 30, hargaModal: 0, hargaJual: 0 },
];

export const DEFAULT_GAS: GasData = { tabungIsi: 7, tabungKosong: 3, hargaBeli: 18000, hargaJual: 23000, riwayat: [] };
export const DEFAULT_PULSA: PulsaData = { saldo: 500000, saldoMax: 1500000, riwayat: [] };

// === HELPERS ===
export function formatRupiah(num: number): string {
  if (num === null || num === undefined || isNaN(num)) return "Rp 0";
  return "Rp " + Number(num).toLocaleString("id-ID");
}
export function getToday(): string { return new Date().toISOString().split("T")[0]; }
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

// === LOCAL STORAGE ===
export function getData<T>(key: string, defaultVal: T): T {
  if (typeof window === "undefined") return defaultVal;
  try { const data = localStorage.getItem("warungos_" + key); return data ? JSON.parse(data) : defaultVal; } catch (e) { return defaultVal; }
}
export function setData<T>(key: string, val: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("warungos_" + key, JSON.stringify(val));
}

// === STATUS (Multi-Satuan + Konversi) ===
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

  // Format rekomendasi dengan konversi
  let qtyRekomFormatted = `${qtyRekomendasi} ${barang.satuan}`;
  if (barang.kategori === "rokok") {
    const rekomDasar = Math.max(0, targetDasar - stokDasar);
    const konversi = fromSatuanDasar(rekomDasar, barang.kategori);
    if (barang.satuan === "bungkus" && rekomDasar >= 10) {
      qtyRekomFormatted = `${rekomDasar} bungkus (${konversi.formatted})`;
    } else if (barang.satuan === "slop" && qtyRekomendasi > 0) {
      qtyRekomFormatted = `${qtyRekomendasi} slop (${qtyRekomendasi * 10} bungkus)`;
    } else {
      qtyRekomFormatted = `${qtyRekomendasi} ${barang.satuan}`;
    }
  }

  if (stokDasar <= minDasar) {
    return { status: "BELI", color: "red", persen, qtyRekomendasi, qtyRekomFormatted };
  } else {
    return { status: "AMAN", color: "green", persen, qtyRekomendasi, qtyRekomFormatted };
  }
}

export function getRekomendasi(barang: Barang, statusInfo: StatusInfo): string {
  if (statusInfo.status === "BELI") {
    if (barang.kategori === "gas") return `ISI! Beli ${statusInfo.qtyRekomFormatted}`;
    if (barang.kategori === "pulsa") return `ISI DEPOSIT! Saldo tinggal ${barang.stok}%`;
    return `BELI ${statusInfo.qtyRekomFormatted}`;
  }
  return `Stok aman (${barang.stok}/${barang.stokNormal} ${barang.satuan})`;
}

// === PROFIT ===
export function hitungPembagian(omzet: number) { return { restock: Math.round(omzet * 0.7), tabungan: Math.round(omzet * 0.15), growth: Math.round(omzet * 0.1), kas: Math.round(omzet * 0.05) }; }
export function hitungProfitBarang(barang: Barang): number { return barang.hargaJual - barang.hargaModal; }
export function hitungMarginPersen(barang: Barang): number {
  if (barang.hargaModal === 0) return 0;
  return Math.round(((barang.hargaJual - barang.hargaModal) / barang.hargaModal) * 100);
}

// === REKOMENDASI BELANJA ===
export function getRekomendasiBelanja(stokBarang: Barang[]): RekomendasiBelanja[] {
  const rekom: RekomendasiBelanja[] = [];
  stokBarang.forEach((b) => {
    if (b.kategori === "pulsa") return;
    const status = getStatus(b);
    if (status.status === "BELI") {
      const qtyBeli = status.qtyRekomendasi;
      const estimasiBiaya = qtyBeli * b.hargaModal;
      rekom.push({ barang: b, qtyBeli, qtyBeliFormatted: status.qtyRekomFormatted, estimasiBiaya });
    }
  });
  return rekom;
}

export const KATEGORI_LABEL: Record<string, string> = { rokok: "Rokok", kopi: "Kopi", snack: "Snack", sembako: "Sembako", gas: "Gas LPG", pulsa: "Pulsa/PPOB" };
