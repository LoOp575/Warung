"use client";

import React, { useState } from "react";
import { Barang, OmzetHarian, formatRupiah, getStatus, hitungPembagian, getRekomendasiBelanja, hitungProfitBarang, RekomendasiBelanja } from "@/lib/store";

interface DashboardPageProps {
  omzetHariIni: OmzetHarian;
  stokBarang: Barang[];
  onSimpanOmzet: (jumlah: number) => void;
}

export default function DashboardPage({ omzetHariIni, stokBarang, onSimpanOmzet }: DashboardPageProps) {
  const [inputVal, setInputVal] = useState("");

  const omzet = omzetHariIni.jumlah;
  const pembagian = hitungPembagian(omzet);

  // Hitung profit estimasi dari stok terjual hari ini (simplified: margin rata-rata * omzet ratio)
  const totalModal = stokBarang.reduce((sum, b) => sum + (b.hargaModal * b.stok), 0);
  const totalJual = stokBarang.reduce((sum, b) => sum + (b.hargaJual * b.stok), 0);
  const avgMargin = totalModal > 0 ? (totalJual - totalModal) / totalModal : 0.2;
  const estimasiProfit = Math.round(omzet * (avgMargin / (1 + avgMargin)));

  let beli = 0, aman = 0;
  const alerts: Barang[] = [];

  stokBarang.forEach((b) => {
    const s = getStatus(b);
    if (s.status === "BELI") { beli++; alerts.push(b); }
    else { aman++; }
  });

  // Rekomendasi belanja
  const rekomendasi = getRekomendasiBelanja(stokBarang);
  const totalBiayaBelanja = rekomendasi.reduce((sum, r) => sum + r.estimasiBiaya, 0);

  const handleSimpan = () => {
    const val = parseInt(inputVal);
    if (!val || val <= 0) { alert("Masukkan omzet yang valid!"); return; }
    onSimpanOmzet(val);
    setInputVal("");
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Omzet Input */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 card-hover">
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Input Omzet Hari Ini</h3>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rp</span>
            <input type="number" value={inputVal} onChange={(e) => setInputVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSimpan()} placeholder="500000" className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none text-lg" />
          </div>
          <button onClick={handleSimpan} className="bg-primary-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors shadow-sm">Simpan</button>
        </div>
      </div>

      {/* Summary Cards - Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Omzet Hari Ini</p>
          <p className="text-lg font-bold text-navy-900">{formatRupiah(omzet)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Estimasi Profit</p>
          <p className="text-lg font-bold text-green-600">{formatRupiah(estimasiProfit)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Restock (70%)</p>
          <p className="text-lg font-bold text-primary-600">{formatRupiah(pembagian.restock)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Tabungan (15%)</p>
          <p className="text-lg font-bold text-green-600">{formatRupiah(pembagian.tabungan)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Growth (10%)</p>
          <p className="text-lg font-bold text-purple-600">{formatRupiah(pembagian.growth)}</p>
        </div>
      </div>

      {/* Summary Cards - Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Kas Kecil (5%)</p>
          <p className="text-lg font-bold text-orange-600">{formatRupiah(pembagian.kas)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <p className="text-xs text-gray-500">Harus Beli</p>
          </div>
          <p className="text-xl font-bold text-red-600">{beli} barang</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <p className="text-xs text-gray-500">Stok Aman</p>
          </div>
          <p className="text-xl font-bold text-green-600">{aman} barang</p>
        </div>
      </div>

      {/* 2-column: Alarm + Rekomendasi Belanja */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alert Restock */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-hover">
          <h3 className="text-lg font-semibold text-navy-900 mb-4">Alarm Restock</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <p className="text-sm text-green-700">Semua stok aman!</p>
              </div>
            ) : (
              alerts.map((b) => (
                <div key={b.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{b.nama}</p>
                      <p className="text-xs text-gray-500">{b.stok} {b.satuan} tersisa</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg">
                    {b.kategori === "gas" || b.kategori === "pulsa" ? "ISI" : "BELI"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Rekomendasi Belanja */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-hover">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-navy-900">Rekomendasi Belanja</h3>
            <span className="text-sm font-bold text-primary-600">{formatRupiah(totalBiayaBelanja)}</span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {rekomendasi.length === 0 ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <p className="text-sm text-green-700">Tidak ada belanja yang perlu dilakukan!</p>
              </div>
            ) : (
              rekomendasi.map((r) => {
                return (
                  <div key={r.barang.id} className="p-3 rounded-xl border bg-red-50 border-red-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{r.barang.nama}</p>
                        <p className="text-xs text-gray-500">Beli {r.qtyBeli} {r.barang.satuan} @ {formatRupiah(r.barang.hargaModal)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-navy-900">{formatRupiah(r.estimasiBiaya)}</p>
                        <span className="text-xs font-medium text-red-600">BELI</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {rekomendasi.length > 0 && (
            <div className="mt-4 p-3 bg-primary-50 rounded-xl">
              <p className="text-xs text-gray-600">Budget restock dari omzet hari ini:</p>
              <p className="text-sm font-bold text-primary-700">{formatRupiah(pembagian.restock)} {pembagian.restock >= totalBiayaBelanja ? "✓ Cukup" : "✗ Kurang " + formatRupiah(totalBiayaBelanja - pembagian.restock)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
