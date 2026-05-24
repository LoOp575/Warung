"use client";

import React, { useState } from "react";
import { DailyReport, formatRupiah, hitungPembagian, formatTanggalShort, getToday } from "@/lib/store";

interface LaporanPageProps {
  reports: DailyReport[];
  todayOmzet: number;
  todayProfit: number;
  todayRestockSpent: number;
  onSaveReport: () => Promise<boolean>;
}

export default function LaporanPage({ reports, todayOmzet, todayProfit, todayRestockSpent, onSaveReport }: LaporanPageProps) {
  const [viewDays, setViewDays] = useState<7 | 30>(7);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const pembagian = hitungPembagian(todayOmzet);
  const modalTerjual = todayOmzet - todayProfit;

  const handleSave = async () => {
    if (!confirm("Simpan laporan hari ini? Data omzet, profit, dan restock akan dicatat.")) return;
    setSaving(true);
    const ok = await onSaveReport();
    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      alert("Gagal menyimpan laporan");
    }
  };

  const filteredReports = reports.slice(0, viewDays);
  const totalOmzet = filteredReports.reduce((s, r) => s + r.omzet, 0);
  const totalProfit = filteredReports.reduce((s, r) => s + r.profitKotor, 0);
  const totalRestock = filteredReports.reduce((s, r) => s + r.totalRestockSpent, 0);

  return (
    <div className="p-4 lg:p-8">
      <h3 className="text-lg font-semibold text-navy-900 mb-4">Laporan Harian</h3>

      {saved && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          Laporan hari ini berhasil disimpan!
        </div>
      )}

      {/* Today's Report Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-navy-900">Hari Ini ({getToday()})</h4>
          <button onClick={handleSave} disabled={saving} className="bg-primary-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50">
            {saving ? "Menyimpan..." : "Simpan Laporan"}
          </button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div className="bg-primary-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">Omzet</p>
            <p className="text-sm font-bold text-navy-900">{formatRupiah(todayOmzet)}</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">Profit Kotor</p>
            <p className="text-sm font-bold text-green-600">{formatRupiah(todayProfit)}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">Modal Terjual</p>
            <p className="text-sm font-bold text-gray-600">{formatRupiah(modalTerjual)}</p>
          </div>
          <div className="bg-orange-50 rounded-xl p-3">
            <p className="text-xs text-gray-500">Restock</p>
            <p className="text-sm font-bold text-orange-600">{formatRupiah(todayRestockSpent)}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-400">Restock 70%</p>
            <p className="text-xs font-bold text-primary-600">{formatRupiah(pembagian.restock)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-400">Tabungan 15%</p>
            <p className="text-xs font-bold text-green-600">{formatRupiah(pembagian.tabungan)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-400">Growth 10%</p>
            <p className="text-xs font-bold text-purple-600">{formatRupiah(pembagian.growth)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-gray-400">Kas 5%</p>
            <p className="text-xs font-bold text-orange-500">{formatRupiah(pembagian.kas)}</p>
          </div>
        </div>
      </div>

      {/* History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-semibold text-navy-900">Riwayat Laporan</h4>
          <div className="flex gap-2">
            <button onClick={() => setViewDays(7)} className={`px-3 py-1 rounded-lg text-xs font-medium ${viewDays === 7 ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-600"}`}>7 Hari</button>
            <button onClick={() => setViewDays(30)} className={`px-3 py-1 rounded-lg text-xs font-medium ${viewDays === 30 ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-600"}`}>30 Hari</button>
          </div>
        </div>

        {/* Summary for period */}
        {filteredReports.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-primary-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">Total Omzet</p>
              <p className="text-sm font-bold text-navy-900">{formatRupiah(totalOmzet)}</p>
            </div>
            <div className="bg-green-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">Total Profit</p>
              <p className="text-sm font-bold text-green-600">{formatRupiah(totalProfit)}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-2 text-center">
              <p className="text-xs text-gray-500">Total Restock</p>
              <p className="text-sm font-bold text-orange-600">{formatRupiah(totalRestock)}</p>
            </div>
          </div>
        )}

        {/* Table */}
        {filteredReports.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Belum ada laporan tersimpan. Klik "Simpan Laporan" untuk mulai.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {/* Header - desktop */}
            <div className="hidden lg:grid grid-cols-6 gap-2 text-xs font-medium text-gray-500 px-3 pb-2 border-b">
              <span>Tanggal</span>
              <span className="text-right">Omzet</span>
              <span className="text-right">Profit</span>
              <span className="text-right">Modal</span>
              <span className="text-right">Restock</span>
              <span className="text-right">Tabungan</span>
            </div>
            {filteredReports.map((r) => (
              <div key={r.id} className="bg-gray-50 rounded-xl p-3">
                {/* Desktop */}
                <div className="hidden lg:grid grid-cols-6 gap-2 items-center text-sm">
                  <span className="font-medium text-gray-800">{formatTanggalShort(r.reportDate)}</span>
                  <span className="text-right text-navy-900">{formatRupiah(r.omzet)}</span>
                  <span className="text-right text-green-600">+{formatRupiah(r.profitKotor)}</span>
                  <span className="text-right text-gray-500">{formatRupiah(r.modalTerjual)}</span>
                  <span className="text-right text-orange-600">-{formatRupiah(r.totalRestockSpent)}</span>
                  <span className="text-right text-primary-600">{formatRupiah(r.tabungan)}</span>
                </div>
                {/* Mobile */}
                <div className="lg:hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-800">{formatTanggalShort(r.reportDate)}</span>
                    <span className="text-sm font-bold text-navy-900">{formatRupiah(r.omzet)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">Profit: {formatRupiah(r.profitKotor)}</span>
                    <span className="text-orange-600">Restock: {formatRupiah(r.totalRestockSpent)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
