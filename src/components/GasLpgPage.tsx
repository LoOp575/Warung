"use client";

import React, { useState } from "react";
import { GasData, formatRupiah, getTanggalIndo } from "@/lib/store";

interface GasLpgPageProps {
  gasData: GasData;
  onUpdate: (data: GasData) => void;
}

export default function GasLpgPage({ gasData, onUpdate }: GasLpgPageProps) {
  const [jualQty, setJualQty] = useState("");
  const [isiQty, setIsiQty] = useState("");

  const totalTabung = gasData.tabungIsi + gasData.tabungKosong;
  const profitPerTabung = gasData.hargaJual - gasData.hargaBeli;
  const persenIsi = totalTabung > 0 ? Math.round((gasData.tabungIsi / totalTabung) * 100) : 0;

  const handleJual = () => {
    const qty = parseInt(jualQty);
    if (!qty || qty <= 0 || qty > gasData.tabungIsi) {
      alert("Jumlah tidak valid atau melebihi stok isi!");
      return;
    }
    const updated: GasData = {
      ...gasData,
      tabungIsi: gasData.tabungIsi - qty,
      tabungKosong: gasData.tabungKosong + qty,
      riwayat: [...gasData.riwayat, { tanggal: getTanggalIndo(), aksi: "jual", qty }],
    };
    onUpdate(updated);
    setJualQty("");
  };

  const handleIsi = () => {
    const qty = parseInt(isiQty);
    if (!qty || qty <= 0 || qty > gasData.tabungKosong) {
      alert("Jumlah tidak valid atau melebihi tabung kosong!");
      return;
    }
    const updated: GasData = {
      ...gasData,
      tabungIsi: gasData.tabungIsi + qty,
      tabungKosong: gasData.tabungKosong - qty,
      riwayat: [...gasData.riwayat, { tanggal: getTanggalIndo(), aksi: "isi", qty }],
    };
    onUpdate(updated);
    setIsiQty("");
  };

  const statusColor = gasData.tabungIsi <= 3 ? "text-red-600" : gasData.tabungIsi <= 5 ? "text-orange-500" : "text-green-600";
  const statusText = gasData.tabungIsi <= 3 ? "KRITIS" : gasData.tabungIsi <= 5 ? "WASPADA" : "AMAN";

  return (
    <div className="p-4 lg:p-8">
      {/* Header Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Tabung Isi</p>
          <p className={`text-2xl font-bold ${statusColor}`}>{gasData.tabungIsi}</p>
          <p className="text-xs text-gray-400">tabung</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Tabung Kosong</p>
          <p className="text-2xl font-bold text-gray-600">{gasData.tabungKosong}</p>
          <p className="text-xs text-gray-400">tabung</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Profit/Tabung</p>
          <p className="text-lg font-bold text-green-600">{formatRupiah(profitPerTabung)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <p className={`text-lg font-bold ${statusColor}`}>{statusText}</p>
          <p className="text-xs text-gray-400">{persenIsi}% terisi</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Stok Gas</span>
          <span className="text-sm font-medium">{gasData.tabungIsi}/{totalTabung} tabung isi</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div className={`h-4 rounded-full progress-bar ${persenIsi > 50 ? "bg-green-500" : persenIsi > 30 ? "bg-orange-400" : "bg-red-500"}`} style={{ width: `${persenIsi}%` }}></div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Jual Gas */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-hover">
          <h4 className="font-semibold text-navy-900 mb-3">Jual Gas</h4>
          <p className="text-xs text-gray-500 mb-3">Stok isi: {gasData.tabungIsi} tabung</p>
          <div className="flex gap-3">
            <input type="number" value={jualQty} onChange={(e) => setJualQty(e.target.value)} placeholder="Jumlah" className="flex-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400" />
            <button onClick={handleJual} className="bg-primary-500 text-white px-5 py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors">Jual</button>
          </div>
        </div>

        {/* Isi Ulang */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-hover">
          <h4 className="font-semibold text-navy-900 mb-3">Isi Ulang (dari agen)</h4>
          <p className="text-xs text-gray-500 mb-3">Tabung kosong: {gasData.tabungKosong} tabung</p>
          <div className="flex gap-3">
            <input type="number" value={isiQty} onChange={(e) => setIsiQty(e.target.value)} placeholder="Jumlah" className="flex-1 px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-400" />
            <button onClick={handleIsi} className="bg-green-500 text-white px-5 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors">Isi</button>
          </div>
        </div>
      </div>

      {/* Harga Setting */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h4 className="font-semibold text-navy-900 mb-3">Harga Gas LPG 3kg</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Harga Beli (Modal)</p>
            <p className="text-lg font-bold text-navy-900">{formatRupiah(gasData.hargaBeli)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Harga Jual</p>
            <p className="text-lg font-bold text-green-600">{formatRupiah(gasData.hargaJual)}</p>
          </div>
        </div>
      </div>

      {/* Riwayat */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h4 className="font-semibold text-navy-900 mb-4">Riwayat Gas LPG</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {gasData.riwayat.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Belum ada riwayat</p>
          ) : (
            gasData.riwayat.slice().reverse().slice(0, 20).map((r, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${r.aksi === "jual" ? "bg-primary-500" : "bg-green-500"}`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.aksi === "jual" ? "Jual" : "Isi Ulang"} {r.qty} tabung</p>
                    <p className="text-xs text-gray-400">{r.tanggal}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium ${r.aksi === "jual" ? "text-primary-600" : "text-green-600"}`}>
                  {r.aksi === "jual" ? `+${formatRupiah(r.qty * profitPerTabung)}` : `-${formatRupiah(r.qty * gasData.hargaBeli)}`}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
