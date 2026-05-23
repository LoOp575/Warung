"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import DashboardPage from "@/components/DashboardPage";
import StokPage from "@/components/StokPage";
import GrafikPage from "@/components/GrafikPage";
import TargetPage from "@/components/TargetPage";
import {
  Barang, OmzetHarian, ModalData,
  DEFAULT_STOK, getData, setData, getToday, getTanggalIndo,
} from "@/lib/store";

export default function Home() {
  const [activePage, setActivePage] = useState("dashboard");
  const [mounted, setMounted] = useState(false);
  const [stokBarang, setStokBarang] = useState<Barang[]>(DEFAULT_STOK);
  const [omzetHariIni, setOmzetHariIni] = useState<OmzetHarian>({ tanggal: getToday(), jumlah: 0 });
  const [omzetHistory, setOmzetHistory] = useState<OmzetHarian[]>([]);
  const [modalData, setModalData] = useState<ModalData>({ awal: 10000000, target: 20000000, berjalan: 10000000, history: [] });

  useEffect(() => {
    const storedStok = getData<Barang[]>("stok", DEFAULT_STOK);
    const storedOmzet = getData<OmzetHarian>("omzet_today", { tanggal: getToday(), jumlah: 0 });
    const storedHistory = getData<OmzetHarian[]>("omzet_history", []);
    const storedModal = getData<ModalData>("modal", { awal: 10000000, target: 20000000, berjalan: 10000000, history: [] });

    if (storedOmzet.tanggal !== getToday()) {
      if (storedOmzet.jumlah > 0) {
        const newHistory = [...storedHistory, storedOmzet].slice(-30);
        setOmzetHistory(newHistory);
        setData("omzet_history", newHistory);
      }
      const freshOmzet = { tanggal: getToday(), jumlah: 0 };
      setOmzetHariIni(freshOmzet);
      setData("omzet_today", freshOmzet);
    } else {
      setOmzetHariIni(storedOmzet);
      setOmzetHistory(storedHistory);
    }
    setStokBarang(storedStok);
    setModalData(storedModal);
    setMounted(true);
  }, []);

  const handleSimpanOmzet = (jumlah: number) => {
    const newOmzet = { tanggal: getToday(), jumlah };
    setOmzetHariIni(newOmzet);
    setData("omzet_today", newOmzet);
  };

  const handleResetHarian = () => {
    if (!confirm("Reset data harian?")) return;
    if (omzetHariIni.jumlah > 0) {
      const newHistory = [...omzetHistory, omzetHariIni].slice(-30);
      setOmzetHistory(newHistory);
      setData("omzet_history", newHistory);
    }
    const freshOmzet = { tanggal: getToday(), jumlah: 0 };
    setOmzetHariIni(freshOmzet);
    setData("omzet_today", freshOmzet);
  };

  const handleUpdateStok = (id: number, stok: number) => {
    const updated = stokBarang.map((b) => (b.id === id ? { ...b, stok } : b));
    setStokBarang(updated);
    setData("stok", updated);
  };

  const handleHapusBarang = (id: number) => {
    const updated = stokBarang.filter((b) => b.id !== id);
    setStokBarang(updated);
    setData("stok", updated);
  };

  const handleTambahBarang = (barang: Omit<Barang, "id">) => {
    const newId = stokBarang.length > 0 ? Math.max(...stokBarang.map((b) => b.id)) + 1 : 1;
    const updated = [...stokBarang, { ...barang, id: newId }];
    setStokBarang(updated);
    setData("stok", updated);
  };

  const handleTambahModal = (jumlah: number) => {
    const updated = {
      ...modalData,
      berjalan: modalData.berjalan + jumlah,
      history: [...modalData.history, { tanggal: getTanggalIndo(), jumlah }],
    };
    setModalData(updated);
    setData("modal", updated);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-primary-500 mb-2">WarungOS</h1>
          <p className="text-gray-400">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <main className="lg:ml-64 pb-24 lg:pb-8">
        <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-40 border-b border-gray-100 px-4 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-navy-900 lg:hidden">WarungOS</h2>
              <p className="text-sm text-gray-500">{getTanggalIndo()}</p>
            </div>
            <button onClick={handleResetHarian} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
              Reset Harian
            </button>
          </div>
        </header>
        {activePage === "dashboard" && <DashboardPage omzetHariIni={omzetHariIni} stokBarang={stokBarang} onSimpanOmzet={handleSimpanOmzet} />}
        {activePage === "stok" && <StokPage stokBarang={stokBarang} onUpdateStok={handleUpdateStok} onHapusBarang={handleHapusBarang} onTambahBarang={handleTambahBarang} />}
        {activePage === "grafik" && <GrafikPage omzetHariIni={omzetHariIni} omzetHistory={omzetHistory} />}
        {activePage === "target" && <TargetPage modalData={modalData} onTambahModal={handleTambahModal} />}
      </main>
      <MobileNav activePage={activePage} onNavigate={setActivePage} />
    </>
  );
}
