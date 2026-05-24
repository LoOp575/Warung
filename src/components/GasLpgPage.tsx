"use client";

import React, { useState } from "react";
import { Barang, formatRupiah, getStatus, SATUAN_OPTIONS } from "@/lib/store";

interface GasLpgPageProps {
  stokBarang: Barang[];
  onTambahBarang: (barang: Omit<Barang, "id">) => Promise<void>;
  onUpdateBarang: (barang: Barang) => Promise<void>;
  onHapusBarang: (id: string) => Promise<void>;
  onJual: (items: { barang: Barang; qty: number }[], note: string) => Promise<void>;
  onRestock: (items: { barang: Barang; qty: number; buyPrice: number }[], note: string) => Promise<void>;
}

export default function GasLpgPage({ stokBarang, onTambahBarang, onUpdateBarang, onHapusBarang, onJual, onRestock }: GasLpgPageProps) {
  const [showTambah, setShowTambah] = useState(false);
  const [editBarang, setEditBarang] = useState<Barang | null>(null);
  const [jualBarang, setJualBarang] = useState<Barang | null>(null);
  const [restockBarang, setRestockBarang] = useState<Barang | null>(null);
  const [qty, setQty] = useState("");
  const [buyPrice, setBuyPrice] = useState("");

  // Add form
  const [addNama, setAddNama] = useState("");
  const [addStok, setAddStok] = useState("");
  const [addTarget, setAddTarget] = useState("");
  const [addMin, setAddMin] = useState("");
  const [addModal, setAddModal] = useState("");
  const [addJual, setAddJual] = useState("");

  // Edit form
  const [editStok, setEditStok] = useState("");
  const [editTarget, setEditTarget] = useState("");
  const [editMin, setEditMin] = useState("");
  const [editModal, setEditModal] = useState("");
  const [editJualPrice, setEditJualPrice] = useState("");

  const handleTambah = async () => {
    if (!addNama.trim()) { alert("Nama gas harus diisi!"); return; }
    await onTambahBarang({
      nama: addNama.trim(), kategori: "gas", satuan: "tabung",
      stok: parseInt(addStok) || 0, stokNormal: parseInt(addTarget) || 10,
      minimum: parseInt(addMin) || 3, hargaModal: parseInt(addModal) || 0,
      hargaJual: parseInt(addJual) || 0,
    });
    setShowTambah(false);
    setAddNama(""); setAddStok(""); setAddTarget(""); setAddMin(""); setAddModal(""); setAddJual("");
  };

  const handleEdit = async () => {
    if (!editBarang) return;
    await onUpdateBarang({
      ...editBarang,
      stok: parseInt(editStok) || editBarang.stok,
      stokNormal: parseInt(editTarget) || editBarang.stokNormal,
      minimum: parseInt(editMin) || editBarang.minimum,
      hargaModal: parseInt(editModal) || editBarang.hargaModal,
      hargaJual: parseInt(editJualPrice) || editBarang.hargaJual,
    });
    setEditBarang(null);
  };

  const handleJual = async () => {
    if (!jualBarang) return;
    const q = parseInt(qty);
    if (!q || q <= 0) { alert("Masukkan jumlah!"); return; }
    if (q > jualBarang.stok) { alert("Stok tidak cukup!"); return; }
    await onJual([{ barang: jualBarang, qty: q }], `Jual ${jualBarang.nama}`);
    setJualBarang(null); setQty("");
  };

  const handleRestock = async () => {
    if (!restockBarang) return;
    const q = parseInt(qty);
    const price = parseInt(buyPrice) || restockBarang.hargaModal;
    if (!q || q <= 0) { alert("Masukkan jumlah!"); return; }
    await onRestock([{ barang: restockBarang, qty: q, buyPrice: price }], `Isi ${restockBarang.nama}`);
    setRestockBarang(null); setQty(""); setBuyPrice("");
  };

  const totalTabung = stokBarang.reduce((s, b) => s + b.stok, 0);
  const totalProfit = stokBarang.reduce((s, b) => s + (b.hargaJual - b.hargaModal), 0);

  return (
    <div className="p-4 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-navy-900">Gas LPG</h3>
        <button onClick={() => setShowTambah(true)} className="bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors">
          + Tambah Gas
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Total Stok</p>
          <p className="text-xl font-bold text-navy-900">{totalTabung} tabung</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Jenis Gas</p>
          <p className="text-xl font-bold text-primary-600">{stokBarang.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover col-span-2 lg:col-span-1">
          <p className="text-xs text-gray-500 mb-1">Rata-rata Profit/Tabung</p>
          <p className="text-xl font-bold text-green-600">{stokBarang.length > 0 ? formatRupiah(Math.round(totalProfit / stokBarang.length)) : "Rp 0"}</p>
        </div>
      </div>

      {/* Gas Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {stokBarang.length === 0 ? (
          <p className="text-gray-400 text-sm col-span-full text-center py-8">Belum ada gas. Tambah gas baru.</p>
        ) : stokBarang.map((b) => {
          const s = getStatus(b);
          const profit = b.hargaJual - b.hargaModal;
          const persen = Math.min(100, Math.round(s.persen));
          const statusColor = s.status === "BELI" ? "text-red-600" : "text-green-600";
          const barColor = s.status === "BELI" ? "bg-red-500" : "bg-green-500";
          return (
            <div key={b.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 card-hover">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-navy-900">{b.nama}</h4>
                  <p className={`text-xs font-bold ${statusColor}`}>{s.status === "BELI" ? "ISI / BELI" : "AMAN"}</p>
                </div>
                <span className="text-lg font-bold text-navy-900">{b.stok}</span>
              </div>
              {/* Progress */}
              <div className="mb-3">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{b.stok}/{b.stokNormal} tabung</span>
                  <span>{persen}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className={`${barColor} h-2 rounded-full`} style={{ width: `${persen}%` }}></div>
                </div>
                <p className="text-xs text-gray-400 mt-1">Batas restock: {b.minimum} tabung</p>
              </div>
              {/* Harga */}
              <div className="flex justify-between text-xs bg-gray-50 rounded-lg p-2 mb-3">
                <span className="text-gray-500">Modal: {formatRupiah(b.hargaModal)}</span>
                <span className="text-green-600 font-medium">Jual: {formatRupiah(b.hargaJual)}</span>
              </div>
              <p className="text-xs text-green-600 mb-3">Profit/tabung: {formatRupiah(profit)}</p>
              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => { setJualBarang(b); setQty(""); }} className="flex-1 text-xs bg-primary-50 text-primary-600 py-2 rounded-lg font-medium hover:bg-primary-100">Jual</button>
                <button onClick={() => { setRestockBarang(b); setQty(""); setBuyPrice(String(b.hargaModal)); }} className="flex-1 text-xs bg-green-50 text-green-600 py-2 rounded-lg font-medium hover:bg-green-100">Isi</button>
                <button onClick={() => { setEditBarang(b); setEditStok(String(b.stok)); setEditTarget(String(b.stokNormal)); setEditMin(String(b.minimum)); setEditModal(String(b.hargaModal)); setEditJualPrice(String(b.hargaJual)); }} className="flex-1 text-xs bg-gray-50 text-gray-600 py-2 rounded-lg font-medium hover:bg-gray-100">Edit</button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah Gas */}
      {showTambah && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-navy-900">Tambah Gas Baru</h3>
              <button onClick={() => setShowTambah(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-600 block mb-1">Nama Gas</label><input type="text" value={addNama} onChange={(e) => setAddNama(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400" placeholder="LPG 3kg" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-gray-600 block mb-1">Stok</label><input type="number" value={addStok} onChange={(e) => setAddStok(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" placeholder="0" /></div>
                <div><label className="text-xs text-gray-600 block mb-1">Target</label><input type="number" value={addTarget} onChange={(e) => setAddTarget(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" placeholder="10" /></div>
                <div><label className="text-xs text-gray-600 block mb-1">Min</label><input type="number" value={addMin} onChange={(e) => setAddMin(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" placeholder="3" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-600 block mb-1">Harga Modal</label><input type="number" value={addModal} onChange={(e) => setAddModal(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" placeholder="18000" /></div>
                <div><label className="text-xs text-gray-600 block mb-1">Harga Jual</label><input type="number" value={addJual} onChange={(e) => setAddJual(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" placeholder="23000" /></div>
              </div>
              <button onClick={handleTambah} className="w-full bg-primary-500 text-white py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit Gas */}
      {editBarang && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-navy-900">Edit {editBarang.nama}</h3>
              <button onClick={() => setEditBarang(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="space-y-3 mb-4">
              <div><label className="text-xs text-gray-600 block mb-1">Stok (tabung)</label><input type="number" value={editStok} onChange={(e) => setEditStok(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-600 block mb-1">Target</label><input type="number" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" /></div>
                <div><label className="text-xs text-gray-600 block mb-1">Min</label><input type="number" value={editMin} onChange={(e) => setEditMin(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-600 block mb-1">Modal</label><input type="number" value={editModal} onChange={(e) => setEditModal(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" /></div>
                <div><label className="text-xs text-gray-600 block mb-1">Jual</label><input type="number" value={editJualPrice} onChange={(e) => setEditJualPrice(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" /></div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleEdit} className="flex-1 bg-primary-500 text-white py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors">Simpan</button>
              <button onClick={() => { if (confirm("Yakin hapus gas ini?")) { onHapusBarang(editBarang.id); setEditBarang(null); } }} className="bg-red-50 text-red-600 px-4 py-3 rounded-xl font-medium hover:bg-red-100 transition-colors">Hapus</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Jual Gas */}
      {jualBarang && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-navy-900">Jual {jualBarang.nama}</h3>
              <button onClick={() => setJualBarang(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <p className="text-sm text-gray-500 mb-3">Stok: {jualBarang.stok} tabung | Harga jual: {formatRupiah(jualBarang.hargaJual)}</p>
            <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 mb-3" placeholder="Jumlah tabung" />
            {qty && parseInt(qty) > 0 && (
              <div className="bg-green-50 rounded-xl p-3 mb-3 text-sm">
                <p className="text-gray-600">Omzet: <span className="font-bold">{formatRupiah(parseInt(qty) * jualBarang.hargaJual)}</span></p>
                <p className="text-green-600">Profit: <span className="font-bold">{formatRupiah(parseInt(qty) * (jualBarang.hargaJual - jualBarang.hargaModal))}</span></p>
              </div>
            )}
            <button onClick={handleJual} className="w-full bg-primary-500 text-white py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors">Jual</button>
          </div>
        </div>
      )}

      {/* Modal Isi/Restock Gas */}
      {restockBarang && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-navy-900">Isi {restockBarang.nama}</h3>
              <button onClick={() => setRestockBarang(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <p className="text-sm text-gray-500 mb-3">Stok: {restockBarang.stok} tabung</p>
            <div className="space-y-3 mb-3">
              <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400" placeholder="Jumlah tabung" />
              <input type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400" placeholder="Harga modal per tabung" />
            </div>
            {qty && parseInt(qty) > 0 && (
              <div className="bg-orange-50 rounded-xl p-3 mb-3 text-sm">
                <p className="text-gray-600">Total biaya: <span className="font-bold">{formatRupiah(parseInt(qty) * (parseInt(buyPrice) || restockBarang.hargaModal))}</span></p>
              </div>
            )}
            <button onClick={handleRestock} className="w-full bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 transition-colors">Isi Ulang</button>
          </div>
        </div>
      )}
    </div>
  );
}
