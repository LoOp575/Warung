"use client";

import React from "react";
import { RiwayatHarian, OmzetHarian, formatRupiah, formatTanggalShort, getToday } from "@/lib/store";

interface RiwayatPageProps {
  riwayatHarian: RiwayatHarian[];
  omzetHariIni: OmzetHarian;
}

export default function RiwayatPage({ riwayatHarian, omzetHariIni }: RiwayatPageProps) {
  // Combine today + history
  const allData = [...riwayatHarian].reverse();

  const totalOmzet = allData.reduce((s, r) => s + r.omzet, 0) + omzetHariIni.jumlah;
  const totalProfit = allData.reduce((s, r) => s + r.profit, 0);
  const totalPengeluaran = allData.reduce((s, r) => s + r.pengeluaran, 0);
  const daysCount = allData.length || 1;

  return (
    <div className="p-4 lg:p-8">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Total Omzet</p>
          <p className="text-lg font-bold text-navy-900">{formatRupiah(totalOmzet)}</p>
          <p className="text-xs text-gray-400">{allData.length + 1} hari</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Total Profit</p>
          <p className="text-lg font-bold text-green-600">{formatRupiah(totalProfit)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Total Pengeluaran</p>
          <p className="text-lg font-bold text-red-500">{formatRupiah(totalPengeluaran)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Rata-rata/Hari</p>
          <p className="text-lg font-bold text-primary-600">{formatRupiah(Math.round(totalOmzet / (daysCount + 1)))}</p>
        </div>
      </div>

      {/* Riwayat Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Riwayat Harian</h3>

        {allData.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-sm">Belum ada riwayat. Data akan tercatat otomatis setiap hari.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Header - desktop only */}
            <div className="hidden lg:grid grid-cols-5 gap-4 text-xs font-medium text-gray-500 px-4 pb-2 border-b border-gray-100">
              <span>Tanggal</span>
              <span className="text-right">Omzet</span>
              <span className="text-right">Profit</span>
              <span className="text-right">Pengeluaran</span>
              <span className="text-right">Belanja</span>
            </div>

            {allData.map((r, i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-4">
                {/* Desktop */}
                <div className="hidden lg:grid grid-cols-5 gap-4 items-center">
                  <span className="text-sm font-medium text-gray-800">{formatTanggalShort(r.tanggal)}</span>
                  <span className="text-sm text-right text-navy-900 font-medium">{formatRupiah(r.omzet)}</span>
                  <span className="text-sm text-right text-green-600 font-medium">+{formatRupiah(r.profit)}</span>
                  <span className="text-sm text-right text-red-500 font-medium">-{formatRupiah(r.pengeluaran)}</span>
                  <span className="text-xs text-right text-gray-500">{r.barangDibeli.length} item</span>
                </div>
                {/* Mobile */}
                <div className="lg:hidden">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-gray-800">{formatTanggalShort(r.tanggal)}</span>
                    <span className="text-sm font-bold text-navy-900">{formatRupiah(r.omzet)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">Profit: +{formatRupiah(r.profit)}</span>
                    <span className="text-red-500">Keluar: -{formatRupiah(r.pengeluaran)}</span>
                  </div>
                  {r.barangDibeli.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-1">Belanja:</p>
                      {r.barangDibeli.map((item, j) => (
                        <p key={j} className="text-xs text-gray-600">• {item.nama} x{item.qty} = {formatRupiah(item.total)}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
