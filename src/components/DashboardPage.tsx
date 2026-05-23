"use client";

import React, { useState } from "react";
import {
  Barang,
  OmzetHarian,
  formatRupiah,
  getStatus,
  hitungPembagian,
} from "@/lib/store";

interface DashboardPageProps {
  omzetHariIni: OmzetHarian;
  stokBarang: Barang[];
  onSimpanOmzet: (jumlah: number) => void;
}

export default function DashboardPage({
  omzetHariIni,
  stokBarang,
  onSimpanOmzet,
}: DashboardPageProps) {
  const [inputVal, setInputVal] = useState("");

  const omzet = omzetHariIni.jumlah;
  const pembagian = hitungPembagian(omzet);

  let beli = 0,
    aman = 0,
    waspada = 0;
  const alerts: Barang[] = [];

  stokBarang.forEach((b) => {
    const s = getStatus(b);
    if (s.status === "BELI") {
      beli++;
      alerts.push(b);
    } else if (s.status === "WASPADA") {
      waspada++;
    } else {
      aman++;
    }
  });

  const handleSimpan = () => {
    const val = parseInt(inputVal);
    if (!val || val <= 0) {
      alert("Masukkan omzet yang valid!");
      return;
    }
    onSimpanOmzet(val);
    setInputVal("");
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Omzet Input */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 card-hover">
        <h3 className="text-lg font-semibold text-navy-900 mb-4">
          Input Omzet Hari Ini
        </h3>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
              Rp
            </span>
            <input
              type="number"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSimpan()}
              placeholder="500000"
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none text-lg"
            />
          </div>
          <button
            onClick={handleSimpan}
            className="bg-primary-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors shadow-sm"
          >
            Simpan
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Omzet Hari Ini</p>
          <p className="text-lg lg:text-xl font-bold text-navy-900">
            {formatRupiah(omzet)}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Restock (70%)</p>
          <p className="text-lg lg:text-xl font-bold text-primary-600">
            {formatRupiah(pembagian.restock)}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Tabungan (15%)</p>
          <p className="text-lg lg:text-xl font-bold text-green-600">
            {formatRupiah(pembagian.tabungan)}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Growth (10%)</p>
          <p className="text-lg lg:text-xl font-bold text-purple-600">
            {formatRupiah(pembagian.growth)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Kas Kecil (5%)</p>
          <p className="text-xl font-bold text-orange-600">
            {formatRupiah(pembagian.kas)}
          </p>
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

      {/* Alert Restock */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-hover">
        <h3 className="text-lg font-semibold text-navy-900 mb-4">
          Alarm Restock
        </h3>
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <p className="text-sm text-green-700">
                Semua stok aman! Tidak ada yang perlu dibeli.
              </p>
            </div>
          ) : (
            alerts.map((b) => {
              const actionText =
                b.kategori === "gas" || b.kategori === "pulsa" ? "ISI" : "BELI";
              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {b.nama}
                      </p>
                      <p className="text-xs text-gray-500">
                        {b.stok} {b.satuan} tersisa
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded-lg">
                    {actionText}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
