"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import DashboardPage from "@/components/DashboardPage";
import StokPage from "@/components/StokPage";
import GrafikPage from "@/components/GrafikPage";
import TargetPage from "@/components/TargetPage";
import RiwayatPage from "@/components/RiwayatPage";
import GasLpgPage from "@/components/GasLpgPage";
import PulsaPage from "@/components/PulsaPage";
import {
  Barang, OmzetHarian, ModalData, RiwayatHarian, GasData, PulsaData,
  DEFAULT_STOK, DEFAULT_GAS, DEFAULT_PULSA,
  getData, setData, getToday, getTanggalIndo, hitungPembagian,
} from "@/lib/store";
import {
  isSupabaseConfigured,
  fetchProducts,
  insertProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/supabase";

export default function Home() {
  const [activePage, setActivePage] = useState("dashboard");
  const [mounted, setMounted] = useState(false);
  const [stokBarang, setStokBarang] = useState<Barang[]>(DEFAULT_STOK);
  const [syncStatus, setSyncStatus] = useState<"local" | "supabase" | "error">("local");
  const [omzetHariIni, setOmzetHariIni] = useState<OmzetHarian>({ tanggal: getToday(), jumlah: 0 });
  const [omzetHistory, setOmzetHistory] = useState<OmzetHarian[]>([]);
  const [modalData, setModalData] = useState<ModalData>({ awal: 10000000, target: 20000000, berjalan: 10000000, history: [] });
  const [riwayatHarian, setRiwayatHarian] = useState<RiwayatHarian[]>([]);
  const [gasData, setGasData] = useState<GasData>(DEFAULT_GAS);
  const [pulsaData, setPulsaData] = useState<PulsaData>(DEFAULT_PULSA);

  useEffect(() => {
    async function loadData() {
      const storedStok = getData<Barang[]>("stok_v2", DEFAULT_STOK);
      const storedOmzet = getData<OmzetHarian>("omzet_today", { tanggal: getToday(), jumlah: 0 });
      const storedHistory = getData<OmzetHarian[]>("omzet_history", []);
      const storedModal = getData<ModalData>("modal_v2", { awal: 10000000, target: 20000000, berjalan: 10000000, history: [] });
      const storedRiwayat = getData<RiwayatHarian[]>("riwayat_harian", []);
      const storedGas = getData<GasData>("gas_data", DEFAULT_GAS);
      const storedPulsa = getData<PulsaData>("pulsa_data", DEFAULT_PULSA);

      if (storedOmzet.tanggal !== getToday()) {
        if (storedOmzet.jumlah > 0) {
          const pembagian = hitungPembagian(storedOmzet.jumlah);
          const newRiwayat: RiwayatHarian = {
            tanggal: storedOmzet.tanggal,
            omzet: storedOmzet.jumlah,
            profit: Math.round(storedOmzet.jumlah * 0.15),
            pengeluaran: pembagian.restock,
            barangDibeli: [],
          };
          const updatedRiwayat = [...storedRiwayat, newRiwayat].slice(-30);
          setRiwayatHarian(updatedRiwayat);
          setData("riwayat_harian", updatedRiwayat);

          const newHistory = [...storedHistory, storedOmzet].slice(-30);
          setOmzetHistory(newHistory);
          setData("omzet_history", newHistory);
        } else {
          setRiwayatHarian(storedRiwayat);
          setOmzetHistory(storedHistory);
        }
        const freshOmzet = { tanggal: getToday(), jumlah: 0 };
        setOmzetHariIni(freshOmzet);
        setData("omzet_today", freshOmzet);
      } else {
        setOmzetHariIni(storedOmzet);
        setOmzetHistory(storedHistory);
        setRiwayatHarian(storedRiwayat);
      }

      setModalData(storedModal);
      setGasData(storedGas);
      setPulsaData(storedPulsa);

      if (isSupabaseConfigured) {
        try {
          const products = await fetchProducts();
          if (products && products.length > 0) {
            setStokBarang(products);
            setData("stok_v2", products);
          } else {
            setStokBarang(storedStok);
          }
          setSyncStatus("supabase");
        } catch (err) {
          console.warn("Gagal mengambil data Supabase, pakai localStorage", err);
          setStokBarang(storedStok);
          setSyncStatus("error");
        }
      } else {
        setStokBarang(storedStok);
        setSyncStatus("local");
      }

      setMounted(true);
    }

    loadData();
  }, []);

  const saveStok = (updated: Barang[]) => {
    setStokBarang(updated);
    setData("stok_v2", updated);
  };

  const handleSimpanOmzet = (jumlah: number) => {
    const newOmzet = { tanggal: getToday(), jumlah };
    setOmzetHariIni(newOmzet);
    setData("omzet_today", newOmzet);
  };

  const handleResetHarian = () => {
    if (!confirm("Reset data harian? Omzet akan disimpan ke riwayat.")) return;
    if (omzetHariIni.jumlah > 0) {
      const pembagian = hitungPembagian(omzetHariIni.jumlah);
      const newRiwayat: RiwayatHarian = {
        tanggal: omzetHariIni.tanggal,
        omzet: omzetHariIni.jumlah,
        profit: Math.round(omzetHariIni.jumlah * 0.15),
        pengeluaran: pembagian.restock,
        barangDibeli: [],
      };
      const updatedRiwayat = [...riwayatHarian, newRiwayat].slice(-30);
      setRiwayatHarian(updatedRiwayat);
      setData("riwayat_harian", updatedRiwayat);

      const newHistory = [...omzetHistory, omzetHariIni].slice(-30);
      setOmzetHistory(newHistory);
      setData("omzet_history", newHistory);
    }
    const freshOmzet = { tanggal: getToday(), jumlah: 0 };
    setOmzetHariIni(freshOmzet);
    setData("omzet_today", freshOmzet);
  };

  const handleUpdateStok = async (id: number, stok: number) => {
    const target = stokBarang.find((b) => b.id === id);
    const updated = stokBarang.map((b) => (b.id === id ? { ...b, stok } : b));
    saveStok(updated);
    if (target?.remoteId) {
      try {
        await updateProduct({ ...target, stok });
        setSyncStatus("supabase");
      } catch (err) {
        console.warn("Gagal update stok ke Supabase", err);
        setSyncStatus("error");
      }
    }
  };

  const handleHapusBarang = async (id: number) => {
    const target = stokBarang.find((b) => b.id === id);
    const updated = stokBarang.filter((b) => b.id !== id);
    saveStok(updated);
    if (target?.remoteId) {
      try {
        await deleteProduct(target);
        setSyncStatus("supabase");
      } catch (err) {
        console.warn("Gagal hapus barang di Supabase", err);
        setSyncStatus("error");
      }
    }
  };

  const handleTambahBarang = async (barang: Omit<Barang, "id">) => {
    const newId = stokBarang.length > 0 ? Math.max(...stokBarang.map((b) => b.id)) + 1 : 1;
    let newBarang: Barang = { ...barang, id: newId };
    if (isSupabaseConfigured) {
      try {
        const inserted = await insertProduct(barang);
        if (inserted) newBarang = { ...inserted, id: newId };
        setSyncStatus("supabase");
      } catch (err) {
        console.warn("Gagal tambah barang ke Supabase", err);
        setSyncStatus("error");
      }
    }
    saveStok([...stokBarang, newBarang]);
  };

  const handleUpdateBarang = async (barang: Barang) => {
    const updated = stokBarang.map((b) => (b.id === barang.id ? barang : b));
    saveStok(updated);
    if (barang.remoteId) {
      try {
        await updateProduct(barang);
        setSyncStatus("supabase");
      } catch (err) {
        console.warn("Gagal update barang ke Supabase", err);
        setSyncStatus("error");
      }
    }
  };

  const handleTambahModal = (jumlah: number, sumber: string) => {
    const updated = {
      ...modalData,
      berjalan: modalData.berjalan + jumlah,
      history: [...modalData.history, { tanggal: getTanggalIndo(), jumlah, sumber }],
    };
    setModalData(updated);
    setData("modal_v2", updated);
  };

  const handleUpdateGas = (data: GasData) => {
    setGasData(data);
    setData("gas_data", data);
  };

  const handleUpdatePulsa = (data: PulsaData) => {
    setPulsaData(data);
    setData("pulsa_data", data);
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
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-navy-900 lg:hidden">WarungOS</h2>
              <p className="text-sm text-gray-500">{getTanggalIndo()}</p>
              <p className={`text-xs mt-1 ${syncStatus === "supabase" ? "text-green-600" : syncStatus === "error" ? "text-red-500" : "text-orange-500"}`}>
                {syncStatus === "supabase" ? "Stok tersambung Supabase" : syncStatus === "error" ? "Supabase error, data lokal aktif" : "Mode lokal"}
              </p>
            </div>
            <button onClick={handleResetHarian} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
              Reset Harian
            </button>
          </div>
        </header>
        {activePage === "dashboard" && <DashboardPage omzetHariIni={omzetHariIni} stokBarang={stokBarang} onSimpanOmzet={handleSimpanOmzet} />}
        {activePage === "stok" && <StokPage stokBarang={stokBarang} onUpdateStok={handleUpdateStok} onHapusBarang={handleHapusBarang} onTambahBarang={handleTambahBarang} onUpdateBarang={handleUpdateBarang} />}
        {activePage === "gas" && <GasLpgPage gasData={gasData} onUpdate={handleUpdateGas} />}
        {activePage === "pulsa" && <PulsaPage pulsaData={pulsaData} onUpdate={handleUpdatePulsa} />}
        {activePage === "riwayat" && <RiwayatPage riwayatHarian={riwayatHarian} omzetHariIni={omzetHariIni} />}
        {activePage === "grafik" && <GrafikPage omzetHariIni={omzetHariIni} omzetHistory={omzetHistory} />}
        {activePage === "target" && <TargetPage modalData={modalData} riwayatHarian={riwayatHarian} onTambahModal={handleTambahModal} />}
      </main>
      <MobileNav activePage={activePage} onNavigate={setActivePage} />
    </>
  );
}
