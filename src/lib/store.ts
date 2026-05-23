// WarungOS - Data Store

export interface Barang {
  id: number;
  nama: string;
  kategori: string;
  satuan: string;
  stok: number;
  stokNormal: number;
  minimum: number;
}

export interface OmzetHarian {
  tanggal: string;
  jumlah: number;
}

export interface ModalData {
  awal: number;
  target: number;
  berjalan: number;
  history: { tanggal: string; jumlah: number }[];
}

export const DEFAULT_STOK: Barang[] = [
  { id: 1, nama: "Pandemas", kategori: "rokok", satuan: "slop", stok: 5, stokNormal: 10, minimum: 3 },
  { id: 2, nama: "Tebu", kategori: "rokok", satuan: "slop", stok: 4, stokNormal: 10, minimum: 3 },
  { id: 3, nama: "Armor", kategori: "rokok", satuan: "slop", stok: 6, stokNormal: 10, minimum: 3 },
  { id: 4, nama: "76 Apel", kategori: "rokok", satuan: "slop", stok: 3, stokNormal: 8, minimum: 2 },
  { id: 5, nama: "Kopi Sachet", kategori: "kopi", satuan: "renceng", stok: 6, stokNormal: 15, minimum: 4 },
  { id: 6, nama: "Beng-beng", kategori: "snack", satuan: "pcs", stok: 20, stokNormal: 50, minimum: 15 },
  { id: 7, nama: "Coklatos", kategori: "snack", satuan: "pcs", stok: 25, stokNormal: 50, minimum: 15 },
  { id: 8, nama: "Snack Lain", kategori: "snack", satuan: "pcs", stok: 40, stokNormal: 60, minimum: 18 },
  { id: 9, nama: "Terigu", kategori: "sembako", satuan: "karung", stok: 2, stokNormal: 5, minimum: 1 },
  { id: 10, nama: "Minyak Goreng", kategori: "sembako", satuan: "liter", stok: 10, stokNormal: 20, minimum: 10 },
  { id: 11, nama: "Gula", kategori: "sembako", satuan: "sak", stok: 2, stokNormal: 5, minimum: 1 },
  { id: 12, nama: "Masako", kategori: "sembako", satuan: "renceng", stok: 8, stokNormal: 20, minimum: 5 },
  { id: 13, nama: "Gas LPG 3kg", kategori: "gas", satuan: "tabung kosong", stok: 3, stokNormal: 10, minimum: 5 },
  { id: 14, nama: "Deposit Pulsa", kategori: "pulsa", satuan: "% saldo", stok: 40, stokNormal: 100, minimum: 30 },
];

export function formatRupiah(num: number): string {
  if (num === null || num === undefined) return "Rp 0";
  return "Rp " + Number(num).toLocaleString("id-ID");
}

export function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

export function getTanggalIndo(): string {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const d = new Date();
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export function getData<T>(key: string, defaultVal: T): T {
  if (typeof window === "undefined") return defaultVal;
  try {
    const data = localStorage.getItem("warungos_" + key);
    return data ? JSON.parse(data) : defaultVal;
  } catch {
    return defaultVal;
  }
}

export function setData<T>(key: string, val: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("warungos_" + key, JSON.stringify(val));
}

export interface StatusInfo {
  status: "AMAN" | "WASPADA" | "BELI";
  color: "green" | "orange" | "red";
  persen: number;
}

export function getStatus(barang: Barang): StatusInfo {
  const persen = (barang.stok / barang.stokNormal) * 100;
  if (barang.stok <= barang.minimum) {
    return { status: "BELI", color: "red", persen };
  } else if (persen <= 50) {
    return { status: "WASPADA", color: "orange", persen };
  } else {
    return { status: "AMAN", color: "green", persen };
  }
}

export function getRekomendasi(barang: Barang, statusInfo: StatusInfo): string {
  if (statusInfo.status === "BELI") {
    if (barang.kategori === "gas") return `ISI! Sudah ${barang.stok} tabung kosong`;
    if (barang.kategori === "pulsa") return `ISI DEPOSIT! Saldo tinggal ${barang.stok}%`;
    return `BELI! Stok tinggal ${barang.stok} ${barang.satuan}`;
  }
  if (statusInfo.status === "WASPADA") {
    return `Perhatikan. Stok ${barang.stok}/${barang.stokNormal} ${barang.satuan}`;
  }
  return `Stok cukup (${barang.stok}/${barang.stokNormal} ${barang.satuan})`;
}

export function hitungPembagian(omzet: number) {
  return {
    restock: Math.round(omzet * 0.7),
    tabungan: Math.round(omzet * 0.15),
    growth: Math.round(omzet * 0.1),
    kas: Math.round(omzet * 0.05),
  };
}

export const KATEGORI_LABEL: Record<string, string> = {
  rokok: "Rokok",
  kopi: "Kopi",
  snack: "Snack",
  sembako: "Sembako",
  gas: "Gas LPG",
  pulsa: "Pulsa/PPOB",
};
