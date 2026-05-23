"use client";

import React, { useState } from "react";
import { ModalData, RiwayatHarian, formatRupiah, getTanggalIndo } from "@/lib/store";

interface TargetPageProps {
  modalData: ModalData;
  riwayatHarian: RiwayatHarian[];
  onTambahModal: (jumlah: number, sumber: string) => void;
}

export default function TargetPage({ modalData, riwayatHarian, onTambahModal }: TargetPageProps) {
  const [inputVal, setInputVal] = useState("");
  const [sumber, setSumber] = useState("manual");

  const persen = Math.min(100, Math.round((modalData.berjalan / modalData.target) * 100));
  const sisa = Math.max(0, modalData.target - modalData.berjalan);
  const totalProfitHistory = riwayatHarian.reduce((s, r) => s + r.profit, 0);

  let barClass = "bg-gradient-to-r from-red-400 to-red-600";
  if (persen >= 100) barClass = "bg-gradient-to-r from-green-400 to-green-600";
  else if (persen >= 70) barClass = "bg-gradient-to-r from-primary-400 to-primary-600";
  else if (persen >= 40) barClass = "bg-gradient-to-r from-yellow-400 to-orange-500";

  const handleTambah = () => {
    const val = parseInt(inputVal);
    if (!val || val <= 0) { alert("Masukkan jumlah modal!"); return; }
    const sumberLabel = sumber === "profit" ? "Dari profit" : sumber === "tabungan" ? "Dari tabungan" : "Manual";
    onTambahModal(val, sumberLabel);
    setInputVal("");
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 card-hover">
        <h3 className="text-lg font-semibold text-navy-900 mb-2">Target Modal Warung</h3>
        <p className="text-sm text-gray-500 mb-6">Dari Rp 10 Juta menuju Rp 20 Juta</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div><p className="text-xs text-gray-500">Modal Awal</p><p className="text-lg font-bold text-navy-900">{formatRupiah(modalData.awal)}</p></div>
          <div><p className="text-xs text-gray-500">Target</p><p className="text-lg font-bold text-primary-600">{formatRupiah(modalData.target)}</p></div>
          <div><p className="text-xs text-gray-500">Modal Sekarang</p><p className="text-lg font-bold text-green-600">{formatRupiah(modalData.berjalan)}</p></div>
          <div><p className="text-xs text-gray-500">Total Profit</p><p className="text-lg font-bold text-purple-600">{formatRupiah(totalProfitHistory)}</p></div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress ke Target</span>
            <span className="text-sm font-bold text-primary-600">{persen}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-5 overflow-hidden">
            <div className={`progress-bar ${barClass} h-5 rounded-full flex items-center justify-center`} style={{ width: `${persen}%` }}>
              {persen > 20 && <span className="text-xs text-white font-medium">{formatRupiah(modalData.berjalan)}</span>}
            </div>
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-400">
            <span>{formatRupiah(modalData.awal)}</span>
            <span>{formatRupiah(modalData.target)}</span>
          </div>
        </div>


        <div className="bg-primary-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-600">Sisa menuju target</p>
          <p className="text-2xl font-bold text-navy-900">{formatRupiah(sisa)}</p>
          {sisa > 0 && totalProfitHistory > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Estimasi {Math.ceil(sisa / (totalProfitHistory / Math.max(riwayatHarian.length, 1)))} hari lagi (dari rata-rata profit)
            </p>
          )}
        </div>

        {/* Input Tambah Modal */}
        <div className="space-y-3">
          <div className="flex gap-3">
            <select value={sumber} onChange={(e) => setSumber(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-primary-400">
              <option value="manual">Manual</option>
              <option value="profit">Dari Profit</option>
              <option value="tabungan">Dari Tabungan</option>
            </select>
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rp</span>
              <input type="number" value={inputVal} onChange={(e) => setInputVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleTambah()} placeholder="Tambah modal" className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none" />
            </div>
            <button onClick={handleTambah} className="bg-green-500 text-white px-5 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors">+ Tambah</button>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-hover">
        <h4 className="font-semibold text-navy-900 mb-4">Riwayat Penambahan Modal</h4>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {modalData.history.length === 0 ? (
            <p className="text-gray-400 text-sm">Belum ada riwayat</p>
          ) : (
            modalData.history.slice().reverse().slice(0, 15).map((h, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-800">+{formatRupiah(h.jumlah)}</p>
                  <p className="text-xs text-gray-400">{h.tanggal} &bull; {h.sumber}</p>
                </div>
                <span className="text-xs text-green-600 font-medium">&#x2713;</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
