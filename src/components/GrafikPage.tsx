"use client";

import React from "react";
import { DailyReport, formatRupiah, formatTanggalShort } from "@/lib/store";
import { SaleItemRow } from "@/lib/supabase";

interface GrafikPageProps {
  reports: DailyReport[];
  todaySaleItems: SaleItemRow[];
}

export default function GrafikPage({ reports, todaySaleItems }: GrafikPageProps) {
  // Last 7 days for charts
  const last7 = reports.slice(0, 7).reverse();

  // Max values for scaling
  const maxOmzet = Math.max(...last7.map((r) => r.omzet), 1);
  const maxProfit = Math.max(...last7.map((r) => r.profitKotor), 1);
  const maxRestock = Math.max(...last7.map((r) => r.totalRestockSpent), 1);

  // Totals
  const total7Omzet = last7.reduce((s, r) => s + r.omzet, 0);
  const total7Profit = last7.reduce((s, r) => s + r.profitKotor, 0);
  const total7Restock = last7.reduce((s, r) => s + r.totalRestockSpent, 0);
  const avgOmzet = last7.length > 0 ? Math.round(total7Omzet / last7.length) : 0;

  // Top 5 barang paling laku (from today's sale items)
  const itemMap = new Map<string, { name: string; qty: number; profit: number }>();
  todaySaleItems.forEach((it) => {
    const e = itemMap.get(it.product_name) || { name: it.product_name, qty: 0, profit: 0 };
    e.qty += it.qty;
    e.profit += it.profit;
    itemMap.set(it.product_name, e);
  });
  const topLaku = Array.from(itemMap.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
  const topUntung = Array.from(itemMap.values()).sort((a, b) => b.profit - a.profit).slice(0, 5);

  // Barang sering BELI (from reports - simplified: show items with low stock from products)
  // This is approximated since we track at report level

  return (
    <div className="p-4 lg:p-8">
      <h3 className="text-lg font-semibold text-navy-900 mb-4">Grafik & Analitik</h3>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Omzet 7 Hari</p>
          <p className="text-lg font-bold text-navy-900">{formatRupiah(total7Omzet)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Profit 7 Hari</p>
          <p className="text-lg font-bold text-green-600">{formatRupiah(total7Profit)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Restock 7 Hari</p>
          <p className="text-lg font-bold text-orange-600">{formatRupiah(total7Restock)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Rata-rata/Hari</p>
          <p className="text-lg font-bold text-primary-600">{formatRupiah(avgOmzet)}</p>
        </div>
      </div>

      {/* Omzet Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <h4 className="font-semibold text-navy-900 mb-4">Omzet 7 Hari Terakhir</h4>
        {last7.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Belum ada data laporan. Simpan laporan harian untuk melihat grafik.</p>
        ) : (
          <>
            <div className="h-48 flex items-end gap-2">
              {last7.map((r, i) => {
                const height = Math.max(4, (r.omzet / maxOmzet) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                    <p className="text-xs text-gray-500 mb-1 truncate w-full text-center">{r.omzet > 0 ? formatRupiah(r.omzet).replace("Rp ", "") : "-"}</p>
                    <div className="bg-primary-400 hover:bg-primary-500 rounded-t-lg w-full transition-all" style={{ height: `${height}%` }}></div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              {last7.map((r, i) => <span key={i} className="flex-1 text-center">{formatTanggalShort(r.reportDate)}</span>)}
            </div>
          </>
        )}
      </div>

      {/* Profit Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <h4 className="font-semibold text-navy-900 mb-4">Profit 7 Hari Terakhir</h4>
        {last7.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Belum ada data</p>
        ) : (
          <>
            <div className="h-40 flex items-end gap-2">
              {last7.map((r, i) => {
                const height = Math.max(4, (r.profitKotor / maxProfit) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                    <p className="text-xs text-gray-500 mb-1 truncate w-full text-center">{r.profitKotor > 0 ? formatRupiah(r.profitKotor).replace("Rp ", "") : "-"}</p>
                    <div className="bg-green-400 hover:bg-green-500 rounded-t-lg w-full transition-all" style={{ height: `${height}%` }}></div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              {last7.map((r, i) => <span key={i} className="flex-1 text-center">{formatTanggalShort(r.reportDate)}</span>)}
            </div>
          </>
        )}
      </div>

      {/* Restock Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <h4 className="font-semibold text-navy-900 mb-4">Pengeluaran Restock 7 Hari</h4>
        {last7.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Belum ada data</p>
        ) : (
          <>
            <div className="h-36 flex items-end gap-2">
              {last7.map((r, i) => {
                const height = Math.max(4, (r.totalRestockSpent / maxRestock) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                    <p className="text-xs text-gray-500 mb-1 truncate w-full text-center">{r.totalRestockSpent > 0 ? formatRupiah(r.totalRestockSpent).replace("Rp ", "") : "-"}</p>
                    <div className="bg-orange-400 hover:bg-orange-500 rounded-t-lg w-full transition-all" style={{ height: `${height}%` }}></div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              {last7.map((r, i) => <span key={i} className="flex-1 text-center">{formatTanggalShort(r.reportDate)}</span>)}
            </div>
          </>
        )}
      </div>

      {/* Bottom: Top items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Paling Laku */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 card-hover">
          <h4 className="font-semibold text-navy-900 mb-3">Top 5 Paling Laku</h4>
          {topLaku.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Belum ada data penjualan</p>
          ) : (
            <div className="space-y-2">
              {topLaku.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary-500 w-5">#{i + 1}</span>
                    <span className="text-sm text-gray-800">{item.name}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-600">{item.qty} terjual</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top 5 Paling Untung */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 card-hover">
          <h4 className="font-semibold text-navy-900 mb-3">Top 5 Paling Untung</h4>
          {topUntung.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Belum ada data penjualan</p>
          ) : (
            <div className="space-y-2">
              {topUntung.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-green-500 w-5">#{i + 1}</span>
                    <span className="text-sm text-gray-800">{item.name}</span>
                  </div>
                  <span className="text-xs font-medium text-green-600">{formatRupiah(item.profit)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
