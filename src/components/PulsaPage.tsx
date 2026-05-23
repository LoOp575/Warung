"use client";

import React, { useState } from "react";
import { PulsaData, formatRupiah, getTanggalIndo } from "@/lib/store";

interface PulsaPageProps {
  pulsaData: PulsaData;
  onUpdate: (data: PulsaData) => void;
}

export default function PulsaPage({ pulsaData, onUpdate }: PulsaPageProps) {
  const [depositVal, setDepositVal] = useState("");
  const [jualVal, setJualVal] = useState("");
  const [jualKet, setJualKet] = useState("");

  const persenSaldo = Math.round((pulsaData.saldo / pulsaData.saldoMax) * 100);
  const statusColor = persenSaldo <= 30 ? "text-red-600" : persenSaldo <= 50 ? "text-orange-500" : "text-green-600";
  const statusText = persenSaldo <= 30 ? "ISI DEPOSIT" : persenSaldo <= 50 ? "WASPADA" : "AMAN";

  const handleDeposit = () => {
    const val = parseInt(depositVal);
    if (!val || val <= 0) { alert("Masukkan jumlah deposit!"); return; }
    const updated: PulsaData = {
      ...pulsaData,
      saldo: pulsaData.saldo + val,
      riwayat: [...pulsaData.riwayat, { tanggal: getTanggalIndo(), aksi: "deposit", jumlah: val, keterangan: "Isi deposit" }],
    };
    onUpdate(updated);
    setDepositVal("");
  };

  const handleJual = () => {
    const val = parseInt(jualVal);
    if (!val || val <= 0) { alert("Masukkan nominal!"); return; }
    if (val > pulsaData.saldo) { alert("Saldo tidak cukup!"); return; }
    const updated: PulsaData = {
      ...pulsaData,
      saldo: pulsaData.saldo - val,
      riwayat: [...pulsaData.riwayat, { tanggal: getTanggalIndo(), aksi: "jual", jumlah: val, keterangan: jualKet || "Jual pulsa/PPOB" }],
    };
    onUpdate(updated);
    setJualVal("");
    setJualKet("");
  };

  return (
    <div className="p-4 lg:p-8">

      {/* Header Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Saldo Deposit</p>
          <p className={`text-xl font-bold ${statusColor}`}>{formatRupiah(pulsaData.saldo)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Kapasitas Max</p>
          <p className="text-xl font-bold text-navy-900">{formatRupiah(pulsaData.saldoMax)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover col-span-2 lg:col-span-1">
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <p className={`text-lg font-bold ${statusColor}`}>{statusText}</p>
          <p className="text-xs text-gray-400">{persenSaldo}% saldo</p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Saldo Deposit</span>
          <span className="text-sm font-medium">{persenSaldo}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div className={`h-4 rounded-full progress-bar ${persenSaldo > 50 ? "bg-green-500" : persenSaldo > 30 ? "bg-orange-400" : "bg-red-500"}`} style={{ width: `${persenSaldo}%` }}></div>
        </div>
      </div>


      {/* Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-hover">
          <h4 className="font-semibold text-navy-900 mb-3">Isi Deposit</h4>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
              <input type="number" value={depositVal} onChange={(e) => setDepositVal(e.target.value)} placeholder="100000" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-400" />
            </div>
            <button onClick={handleDeposit} className="bg-green-500 text-white px-5 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors">Deposit</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-hover">
          <h4 className="font-semibold text-navy-900 mb-3">Jual Pulsa / PPOB</h4>
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                <input type="number" value={jualVal} onChange={(e) => setJualVal(e.target.value)} placeholder="25000" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              <button onClick={handleJual} className="bg-primary-500 text-white px-5 py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors">Jual</button>
            </div>
            <input type="text" value={jualKet} onChange={(e) => setJualKet(e.target.value)} placeholder="Keterangan (opsional)" className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" />
          </div>
        </div>
      </div>


      {/* Riwayat */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h4 className="font-semibold text-navy-900 mb-4">Riwayat Pulsa/PPOB</h4>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {pulsaData.riwayat.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Belum ada riwayat transaksi</p>
          ) : (
            pulsaData.riwayat.slice().reverse().slice(0, 20).map((r, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${r.aksi === "deposit" ? "bg-green-500" : "bg-primary-500"}`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{r.keterangan}</p>
                    <p className="text-xs text-gray-400">{r.tanggal}</p>
                  </div>
                </div>
                <span className={`text-sm font-medium ${r.aksi === "deposit" ? "text-green-600" : "text-primary-600"}`}>
                  {r.aksi === "deposit" ? "+" : "-"}{formatRupiah(r.jumlah)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
