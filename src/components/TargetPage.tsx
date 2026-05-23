"use client";

import React, { useState } from "react";
import { ModalData, formatRupiah } from "@/lib/store";

interface TargetPageProps {
  modalData: ModalData;
  onTambahModal: (jumlah: number) => void;
}

export default function TargetPage({ modalData, onTambahModal }: TargetPageProps) {
  const [inputVal, setInputVal] = useState("");

  const persen = Math.min(100, Math.round((modalData.berjalan / modalData.target) * 100));
  const sisa = Math.max(0, modalData.target - modalData.berjalan);

  let barClass = "bg-gradient-to-r from-red-400 to-red-600";
  if (persen >= 100) barClass = "bg-gradient-to-r from-green-400 to-green-600";
  else if (persen >= 70) barClass = "bg-gradient-to-r from-primary-400 to-primary-600";
  else if (persen >= 40) barClass = "bg-gradient-to-r from-yellow-400 to-orange-500";

  const handleTambah = () => {
    const val = parseInt(inputVal);
    if (!val || val <= 0) { alert("Masukkan jumlah modal yang valid!"); return; }
    onTambahModal(val);
    setInputVal("");
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6 card-hover">
        <h3 className="text-lg font-semibold text-navy-900 mb-2">Target Modal Warung</h3>
        <p className="text-sm text-gray-500 mb-6">Pantau pertumbuhan modal warung kamu</p>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div><p className="text-xs text-gray-500">Modal Awal</p><p className="text-lg font-bold text-navy-900">{formatRupiah(modalData.awal)}</p></div>
          <div><p className="text-xs text-gray-500">Target</p><p className="text-lg font-bold text-primary-600">{formatRupiah(modalData.target)}</p></div>
        </div>
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-bold text-primary-600">{persen}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div className={`progress-bar ${barClass} h-4 rounded-full`} style={{ width: `${persen}%` }}></div>
          </div>
        </div>
        <div className="bg-primary-50 rounded-xl p-4 mb-6">
          <p className="text-sm text-gray-600">Modal Berjalan Saat Ini</p>
          <p className="text-2xl font-bold text-navy-900">{formatRupiah(modalData.berjalan)}</p>
          <p className="text-xs text-gray-500 mt-1">Sisa {formatRupiah(sisa)} menuju target</p>
        </div>
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">Rp</span>
            <input type="number" value={inputVal} onChange={(e) => setInputVal(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleTambah()} placeholder="Tambah modal" className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-400 focus:border-transparent outline-none" />
          </div>
          <button onClick={handleTambah} className="bg-green-500 text-white px-5 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors">+ Tambah</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-hover">
        <h4 className="font-semibold text-navy-900 mb-4">Riwayat Penambahan Modal</h4>
        <div className="space-y-2">
          {modalData.history.length === 0 ? (
            <p className="text-gray-400 text-sm">Belum ada riwayat penambahan modal</p>
          ) : (
            modalData.history.slice().reverse().slice(0, 10).map((h, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-gray-800">+{formatRupiah(h.jumlah)}</p>
                  <p className="text-xs text-gray-400">{h.tanggal}</p>
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
