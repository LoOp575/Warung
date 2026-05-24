"use client";

import React from "react";
import { Barang, formatRupiah, getStatus, hitungPembagian, getRekomendasiBelanja } from "@/lib/store";
import { SaleItemRow } from "@/lib/supabase";

interface DashboardPageProps {
  stokBarang: Barang[];
  todayOmzet: number;
  todayProfit: number;
  todayRestockSpent: number;
  todaySaleItems: SaleItemRow[];
  dbStatus: "loading" | "connected" | "offline";
}

export default function DashboardPage({ stokBarang, todayOmzet, todayProfit, todayRestockSpent, todaySaleItems, dbStatus }: DashboardPageProps) {
  const pembagian = hitungPembagian(todayOmzet);
  const modalTerjual = todayOmzet - todayProfit;

  // Count status
  let beli = 0, aman = 0;
  const alerts: Barang[] = [];
  stokBarang.forEach((b) => {
    const s = getStatus(b);
    if (s.status === "BELI") { beli++; alerts.push(b); }
    else { aman++; }
  });

  // Top items sold today
  const itemMap = new Map<string, { name: string; qty: number; profit: number }>();
  todaySaleItems.forEach((it) => {
    const existing = itemMap.get(it.product_name) || { name: it.product_name, qty: 0, profit: 0 };
    existing.qty += it.qty;
    existing.profit += it.profit;
    itemMap.set(it.product_name, existing);
  });
  const topItems = Array.from(itemMap.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);

  // Rekomendasi belanja
  const rekomendasi = getRekomendasiBelanja(stokBarang);
  const totalBiayaBelanja = rekomendasi.reduce((s, r) => s + r.estimasiBiaya, 0);

  return (
    <div className="p-4 lg:p-8">
      {/* Connection Status */}
      <div className={`mb-4 p-2 rounded-lg text-xs text-center ${dbStatus === "connected" ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-700"}`}>
        {dbStatus === "connected" ? "Data tersambung Supabase" : "Supabase error, data lokal aktif"}
      </div>

      {/* Row 1: Omzet & Profit */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Omzet Hari Ini</p>
          <p className="text-lg font-bold text-navy-900">{formatRupiah(todayOmzet)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Profit Kotor</p>
          <p className="text-lg font-bold text-green-600">{formatRupiah(todayProfit)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Modal Terjual</p>
          <p className="text-lg font-bold text-gray-600">{formatRupiah(modalTerjual)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Restock Hari Ini</p>
          <p className="text-lg font-bold text-orange-600">{formatRupiah(todayRestockSpent)}</p>
        </div>
      </div>

      {/* Row 2: Pembagian Uang */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
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
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Kas Kecil (5%)</p>
          <p className="text-lg font-bold text-orange-500">{formatRupiah(pembagian.kas)}</p>
        </div>
      </div>

      {/* Row 3: Stok status */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <p className="text-xs text-gray-500">Wajib Beli</p>
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

      {/* 2-col: Top Items + Alarm */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Items Laku */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 card-hover">
          <h4 className="font-semibold text-navy-900 mb-3">Top Barang Laku Hari Ini</h4>
          {topItems.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Belum ada penjualan hari ini</p>
          ) : (
            <div className="space-y-2">
              {topItems.map((item, i) => (
                <div key={i} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-primary-500 w-5">#{i + 1}</span>
                    <span className="text-sm text-gray-800">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">{item.qty} terjual</p>
                    <p className="text-xs text-green-600">+{formatRupiah(item.profit)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alarm Restock */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 card-hover">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-navy-900">Wajib Beli</h4>
            {rekomendasi.length > 0 && <span className="text-xs font-bold text-primary-600">{formatRupiah(totalBiayaBelanja)}</span>}
          </div>
          {alerts.length === 0 ? (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <p className="text-sm text-green-700">Semua stok aman!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {alerts.slice(0, 8).map((b) => {
                const s = getStatus(b);
                return (
                  <div key={b.id} className="flex items-center justify-between p-2 bg-red-50 rounded-xl border border-red-100">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{b.nama}</p>
                        <p className="text-xs text-gray-500">{b.stok}/{b.stokNormal} {b.satuan}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded">
                      {b.kategori === "gas" ? "ISI" : "BELI"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          {rekomendasi.length > 0 && (
            <div className="mt-3 p-2 bg-primary-50 rounded-lg">
              <p className="text-xs text-gray-600">Budget restock (70% omzet):</p>
              <p className="text-sm font-bold text-primary-700">
                {formatRupiah(pembagian.restock)} {pembagian.restock >= totalBiayaBelanja ? "✓ Cukup" : "✗ Kurang " + formatRupiah(totalBiayaBelanja - pembagian.restock)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
