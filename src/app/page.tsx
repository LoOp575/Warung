"use client";

import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import DashboardPage from "@/components/DashboardPage";
import StokPage from "@/components/StokPage";
import JualPage from "@/components/JualPage";
import RestockPage from "@/components/RestockPage";
import GasLpgPage from "@/components/GasLpgPage";
import PulsaPage from "@/components/PulsaPage";
import LaporanPage from "@/components/LaporanPage";
import GrafikPage from "@/components/GrafikPage";
import BackupPage from "@/components/BackupPage";
import {
  Barang, DailyReport, PulsaTransaction,
  DEFAULT_STOK, rowToBarang, barangToRow, rowToReport, rowToPulsa,
  getData, setData, getToday, getTanggalIndo, hitungPembagian,
} from "@/lib/store";
import {
  isSupabaseEnabled,
  dbFetchProducts, dbInsertProduct, dbUpdateProduct, dbDeleteProduct,
  dbCreateSale, dbFetchSalesToday, dbFetchSaleItemsToday,
  dbCreateRestock, dbFetchRestocksToday,
  dbUpsertDailyReport, dbFetchDailyReports, dbFetchTodayReport,
  dbInsertPulsaTransaction, dbFetchPulsaTransactions, dbFetchPulsaBalance,
  SaleItemRow,
} from "@/lib/supabase";

export default function Home() {
  const [activePage, setActivePage] = useState("dashboard");
  const [mounted, setMounted] = useState(false);
  const [dbStatus, setDbStatus] = useState<"loading" | "connected" | "offline">("loading");

  // Core state
  const [stokBarang, setStokBarang] = useState<Barang[]>([]);
  const [todayOmzet, setTodayOmzet] = useState(0);
  const [todayProfit, setTodayProfit] = useState(0);
  const [todayRestockSpent, setTodayRestockSpent] = useState(0);
  const [todaySaleItems, setTodaySaleItems] = useState<SaleItemRow[]>([]);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [pulsaBalance, setPulsaBalance] = useState(0);
  const [pulsaTransactions, setPulsaTransactions] = useState<PulsaTransaction[]>([]);

  // Load all data on mount
  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = useCallback(async () => {
    // Products
    let products: Barang[] | null = null;
    if (isSupabaseEnabled()) {
      const rows = await dbFetchProducts();
      if (rows) {
        products = rows.map(rowToBarang);
        setDbStatus("connected");
      } else {
        setDbStatus("offline");
      }
    } else {
      setDbStatus("offline");
    }

    if (products && products.length > 0) {
      setStokBarang(products);
      setData("products_cache", products);
    } else {
      const cached = getData<Barang[]>("products_cache", DEFAULT_STOK);
      setStokBarang(cached);
    }

    // Today's sales
    if (isSupabaseEnabled()) {
      const sales = await dbFetchSalesToday();
      if (sales) {
        const omzet = sales.reduce((s, r) => s + r.total_amount, 0);
        const profit = sales.reduce((s, r) => s + r.total_profit, 0);
        setTodayOmzet(omzet);
        setTodayProfit(profit);
      }
      const items = await dbFetchSaleItemsToday();
      if (items) setTodaySaleItems(items);

      const restocks = await dbFetchRestocksToday();
      if (restocks) {
        setTodayRestockSpent(restocks.reduce((s, r) => s + r.total_cost, 0));
      }

      // Reports
      const reps = await dbFetchDailyReports(30);
      if (reps) setReports(reps.map(rowToReport));

      // Pulsa
      const bal = await dbFetchPulsaBalance();
      if (bal !== null) setPulsaBalance(bal);
      const txs = await dbFetchPulsaTransactions(50);
      if (txs) setPulsaTransactions(txs.map(rowToPulsa));
    }

    setMounted(true);
  }, []);

  // === PRODUCT HANDLERS ===
  const handleTambahBarang = async (barang: Omit<Barang, "id">) => {
    const row = barangToRow(barang);
    const inserted = await dbInsertProduct(row);
    if (inserted) {
      const newBarang = rowToBarang(inserted);
      const updated = [...stokBarang, newBarang];
      setStokBarang(updated);
      setData("products_cache", updated);
    } else {
      // fallback local
      const newId = "local-" + Date.now();
      const updated = [...stokBarang, { ...barang, id: newId }];
      setStokBarang(updated);
      setData("products_cache", updated);
    }
  };

  const handleUpdateBarang = async (barang: Barang) => {
    const updated = stokBarang.map((b) => (b.id === barang.id ? barang : b));
    setStokBarang(updated);
    setData("products_cache", updated);
    await dbUpdateProduct(barang.id, {
      name: barang.nama, category: barang.kategori, unit: barang.satuan,
      stock: barang.stok, target_stock: barang.stokNormal, restock_limit: barang.minimum,
      buy_price: barang.hargaModal, sell_price: barang.hargaJual,
    });
  };

  const handleHapusBarang = async (id: string) => {
    const updated = stokBarang.filter((b) => b.id !== id);
    setStokBarang(updated);
    setData("products_cache", updated);
    await dbDeleteProduct(id);
  };

  // === JUAL HANDLER ===
  const handleJual = async (items: { barang: Barang; qty: number }[], note: string) => {
    let totalAmount = 0, totalCost = 0, totalProfit = 0;
    const saleItems: { product_id: string | null; product_name: string; qty: number; unit: string; buy_price: number; sell_price: number; subtotal: number; profit: number }[] = [];

    const updatedStok = [...stokBarang];
    for (const item of items) {
      const subtotal = item.qty * item.barang.hargaJual;
      const cost = item.qty * item.barang.hargaModal;
      const profit = subtotal - cost;
      totalAmount += subtotal;
      totalCost += cost;
      totalProfit += profit;
      saleItems.push({
        product_id: item.barang.id.startsWith("local-") ? null : item.barang.id,
        product_name: item.barang.nama, qty: item.qty, unit: item.barang.satuan,
        buy_price: item.barang.hargaModal, sell_price: item.barang.hargaJual,
        subtotal, profit,
      });
      // Reduce stock
      const idx = updatedStok.findIndex((b) => b.id === item.barang.id);
      if (idx >= 0) {
        updatedStok[idx] = { ...updatedStok[idx], stok: Math.max(0, updatedStok[idx].stok - item.qty) };
        await dbUpdateProduct(updatedStok[idx].id, { stock: updatedStok[idx].stok });
      }
    }
    setStokBarang(updatedStok);
    setData("products_cache", updatedStok);

    await dbCreateSale({ total_amount: totalAmount, total_cost: totalCost, total_profit: totalProfit, note }, saleItems);
    setTodayOmzet((o) => o + totalAmount);
    setTodayProfit((p) => p + totalProfit);
  };

  // === RESTOCK HANDLER ===
  const handleRestock = async (items: { barang: Barang; qty: number; buyPrice: number }[], note: string) => {
    let totalCost = 0;
    const restockItems: { product_id: string | null; product_name: string; qty: number; unit: string; buy_price: number; subtotal: number }[] = [];

    const updatedStok = [...stokBarang];
    for (const item of items) {
      const subtotal = item.qty * item.buyPrice;
      totalCost += subtotal;
      restockItems.push({
        product_id: item.barang.id.startsWith("local-") ? null : item.barang.id,
        product_name: item.barang.nama, qty: item.qty, unit: item.barang.satuan,
        buy_price: item.buyPrice, subtotal,
      });
      // Increase stock + update buy price
      const idx = updatedStok.findIndex((b) => b.id === item.barang.id);
      if (idx >= 0) {
        updatedStok[idx] = { ...updatedStok[idx], stok: updatedStok[idx].stok + item.qty, hargaModal: item.buyPrice };
        await dbUpdateProduct(updatedStok[idx].id, { stock: updatedStok[idx].stok, buy_price: item.buyPrice });
      }
    }
    setStokBarang(updatedStok);
    setData("products_cache", updatedStok);

    await dbCreateRestock({ total_cost: totalCost, note }, restockItems);
    setTodayRestockSpent((r) => r + totalCost);
  };

  // === PULSA HANDLER ===
  const handlePulsaTransaction = async (type: "deposit" | "sell", amount: number, cost: number, note: string) => {
    const profit = type === "sell" ? amount - cost : 0;
    const newBalance = type === "deposit" ? pulsaBalance + amount : pulsaBalance - cost;
    setPulsaBalance(newBalance);

    const tx = await dbInsertPulsaTransaction({ type, amount, cost, profit, note, balance_after: newBalance });
    if (tx) {
      setPulsaTransactions((prev) => [rowToPulsa(tx), ...prev]);
    }
    if (type === "sell") {
      setTodayOmzet((o) => o + amount);
      setTodayProfit((p) => p + profit);
    }
  };

  // === SAVE DAILY REPORT ===
  const handleSaveReport = async () => {
    const pembagian = hitungPembagian(todayOmzet);
    const report = {
      report_date: getToday(),
      omzet: todayOmzet,
      modal_terjual: todayOmzet - todayProfit,
      profit_kotor: todayProfit,
      restock_budget: pembagian.restock,
      tabungan: pembagian.tabungan,
      growth: pembagian.growth,
      kas_kecil: pembagian.kas,
      total_restock_spent: todayRestockSpent,
    };
    const saved = await dbUpsertDailyReport(report);
    if (saved) {
      const updated = await dbFetchDailyReports(30);
      if (updated) setReports(updated.map(rowToReport));
    }
    return !!saved;
  };

  // === LOADING ===
  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-500 mb-2">WarungNeng</h1>
          <p className="text-gray-400">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="lg:ml-64 pb-24 lg:pb-8">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-40 border-b border-gray-100 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-navy-900 lg:hidden">WarungNeng</h2>
              <p className="text-sm text-gray-500">{getTanggalIndo()}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${dbStatus === "connected" ? "bg-green-100 text-green-700" : dbStatus === "offline" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500"}`}>
                {dbStatus === "connected" ? "Supabase ✓" : dbStatus === "offline" ? "Lokal" : "..."}
              </span>
            </div>
          </div>
        </header>

        {/* Pages */}
        {activePage === "dashboard" && (
          <DashboardPage
            stokBarang={stokBarang}
            todayOmzet={todayOmzet}
            todayProfit={todayProfit}
            todayRestockSpent={todayRestockSpent}
            todaySaleItems={todaySaleItems}
            dbStatus={dbStatus}
          />
        )}
        {activePage === "stok" && (
          <StokPage
            stokBarang={stokBarang}
            onTambahBarang={handleTambahBarang}
            onUpdateBarang={handleUpdateBarang}
            onHapusBarang={handleHapusBarang}
          />
        )}
        {activePage === "jual" && (
          <JualPage stokBarang={stokBarang} onJual={handleJual} />
        )}
        {activePage === "restock" && (
          <RestockPage stokBarang={stokBarang} onRestock={handleRestock} />
        )}
        {activePage === "gas" && (
          <GasLpgPage
            stokBarang={stokBarang.filter((b) => b.kategori === "gas")}
            onTambahBarang={handleTambahBarang}
            onUpdateBarang={handleUpdateBarang}
            onHapusBarang={handleHapusBarang}
            onJual={handleJual}
            onRestock={handleRestock}
          />
        )}
        {activePage === "pulsa" && (
          <PulsaPage
            balance={pulsaBalance}
            transactions={pulsaTransactions}
            onTransaction={handlePulsaTransaction}
          />
        )}
        {activePage === "laporan" && (
          <LaporanPage
            reports={reports}
            todayOmzet={todayOmzet}
            todayProfit={todayProfit}
            todayRestockSpent={todayRestockSpent}
            onSaveReport={handleSaveReport}
          />
        )}
        {activePage === "grafik" && (
          <GrafikPage reports={reports} todaySaleItems={todaySaleItems} />
        )}
        {activePage === "backup" && (
          <BackupPage onReload={loadAll} />
        )}
      </main>
      <MobileNav activePage={activePage} onNavigate={setActivePage} />
    </>
  );
}
