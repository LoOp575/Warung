"use client";

import React, { useState } from "react";
import { Barang, getStatus, getRekomendasi, KATEGORI_LABEL, KATEGORI_OPTIONS, SATUAN_OPTIONS, formatRupiah, hitungMarginPersen } from "@/lib/store";

interface StokPageProps {
  stokBarang: Barang[];
  onTambahBarang: (barang: Omit<Barang, "id">) => Promise<void>;
  onUpdateBarang: (barang: Barang) => Promise<void>;
  onHapusBarang: (id: string) => Promise<void>;
}

export default function StokPage({ stokBarang, onTambahBarang, onUpdateBarang, onHapusBarang }: StokPageProps) {
  const [filter, setFilter] = useState("semua");
  const [showTambah, setShowTambah] = useState(false);
  const [editBarang, setEditBarang] = useState<Barang | null>(null);

  // Add form
  const [addNama, setAddNama] = useState("");
  const [addKategori, setAddKategori] = useState("rokok");
  const [addSatuan, setAddSatuan] = useState("pcs");
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
  const [editJual, setEditJual] = useState("");
  const [editKategori, setEditKategori] = useState("");
  const [editSatuan, setEditSatuan] = useState("");

  const filtered = filter === "semua"
    ? stokBarang.filter((b) => b.kategori !== "gas" && b.kategori !== "pulsa")
    : stokBarang.filter((b) => b.kategori === filter);

  const handleTambah = async () => {
    if (!addNama.trim()) { alert("Nama barang harus diisi!"); return; }
    await onTambahBarang({
      nama: addNama.trim(), kategori: addKategori, satuan: addSatuan,
      stok: parseInt(addStok) || 0, stokNormal: parseInt(addTarget) || 10,
      minimum: parseInt(addMin) || 3, hargaModal: parseInt(addModal) || 0,
      hargaJual: parseInt(addJual) || 0,
    });
    setShowTambah(false);
    setAddNama(""); setAddKategori("rokok"); setAddSatuan("pcs");
    setAddStok(""); setAddTarget(""); setAddMin(""); setAddModal(""); setAddJual("");
  };

  const handleUpdate = async () => {
    if (!editBarang) return;
    await onUpdateBarang({
      ...editBarang,
      kategori: editKategori || editBarang.kategori,
      satuan: editSatuan || editBarang.satuan,
      stok: parseInt(editStok) || editBarang.stok,
      stokNormal: parseInt(editTarget) || editBarang.stokNormal,
      minimum: parseInt(editMin) || editBarang.minimum,
      hargaModal: parseInt(editModal) || editBarang.hargaModal,
      hargaJual: parseInt(editJual) || editBarang.hargaJual,
    });
    setEditBarang(null);
  };

  const openEdit = (b: Barang) => {
    setEditBarang(b);
    setEditStok(String(b.stok));
    setEditTarget(String(b.stokNormal));
    setEditMin(String(b.minimum));
    setEditModal(String(b.hargaModal));
    setEditJual(String(b.hargaJual));
    setEditKategori(b.kategori);
    setEditSatuan(b.satuan);
  };

  return (
    <div className="p-4 lg:p-8">
      {/* Filter & Add */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-400 outline-none">
          <option value="semua">Semua (tanpa Gas/Pulsa)</option>
          {KATEGORI_OPTIONS.filter((k) => k !== "gas" && k !== "pulsa").map((k) => (
            <option key={k} value={k}>{KATEGORI_LABEL[k]}</option>
          ))}
        </select>
        <button onClick={() => setShowTambah(true)} className="bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Tambah Barang
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm col-span-full text-center py-8">Tidak ada barang di kategori ini</p>
        ) : filtered.map((b) => {
          const s = getStatus(b);
          const rek = getRekomendasi(b, s);
          const persen = Math.min(100, Math.round(s.persen));
          const margin = hitungMarginPersen(b);
          const barColor = s.color === "red" ? "bg-red-500" : "bg-green-500";
          const statusClass = s.status === "BELI" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700";
          return (
            <div key={b.id} onClick={() => openEdit(b)} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 card-hover cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-navy-900">{b.nama}</h4>
                  <p className="text-xs text-gray-400">{KATEGORI_LABEL[b.kategori] || b.kategori}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${statusClass}`}>{s.status}</span>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Stok: {b.stok}/{b.stokNormal} {b.satuan}</span>
                  <span className="font-medium">{persen}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className={`${barColor} h-2 rounded-full progress-bar`} style={{ width: `${persen}%` }}></div>
                </div>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Min: {b.minimum}</span>
                  <span>Target: {b.stokNormal}</span>
                </div>
              </div>
              <div className="flex justify-between text-xs mb-2 bg-gray-50 rounded-lg p-2">
                <span className="text-gray-500">Modal: {formatRupiah(b.hargaModal)}</span>
                <span className="text-green-600 font-medium">Jual: {formatRupiah(b.hargaJual)}</span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500 truncate flex-1">{rek}</p>
                {margin > 0 && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded ml-1">+{margin}%</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Tambah */}
      {showTambah && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-navy-900">Tambah Barang</h3>
              <button onClick={() => setShowTambah(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="space-y-3">
              <div><label className="text-xs text-gray-600 block mb-1">Nama</label><input type="text" value={addNama} onChange={(e) => setAddNama(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400" placeholder="Nama barang" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-600 block mb-1">Kategori</label><select value={addKategori} onChange={(e) => setAddKategori(e.target.value)} className="w-full px-3 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm">{KATEGORI_OPTIONS.map((k) => <option key={k} value={k}>{KATEGORI_LABEL[k]}</option>)}</select></div>
                <div><label className="text-xs text-gray-600 block mb-1">Satuan</label><select value={addSatuan} onChange={(e) => setAddSatuan(e.target.value)} className="w-full px-3 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm">{SATUAN_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-gray-600 block mb-1">Stok</label><input type="number" value={addStok} onChange={(e) => setAddStok(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" placeholder="0" /></div>
                <div><label className="text-xs text-gray-600 block mb-1">Target</label><input type="number" value={addTarget} onChange={(e) => setAddTarget(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" placeholder="10" /></div>
                <div><label className="text-xs text-gray-600 block mb-1">Min</label><input type="number" value={addMin} onChange={(e) => setAddMin(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" placeholder="3" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-600 block mb-1">Harga Modal</label><input type="number" value={addModal} onChange={(e) => setAddModal(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" placeholder="0" /></div>
                <div><label className="text-xs text-gray-600 block mb-1">Harga Jual</label><input type="number" value={addJual} onChange={(e) => setAddJual(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" placeholder="0" /></div>
              </div>
              <button onClick={handleTambah} className="w-full bg-primary-500 text-white py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors">Simpan</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit */}
      {editBarang && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-navy-900">Edit: {editBarang.nama}</h3>
              <button onClick={() => setEditBarang(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-600 block mb-1">Kategori</label><select value={editKategori} onChange={(e) => setEditKategori(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm">{KATEGORI_OPTIONS.map((k) => <option key={k} value={k}>{KATEGORI_LABEL[k]}</option>)}</select></div>
                <div><label className="text-xs text-gray-600 block mb-1">Satuan</label><select value={editSatuan} onChange={(e) => setEditSatuan(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm">{SATUAN_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div><label className="text-xs text-gray-600 block mb-1">Stok Sekarang ({editSatuan || editBarang.satuan})</label><input type="number" value={editStok} onChange={(e) => setEditStok(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-600 block mb-1">Target Stok Max</label><input type="number" value={editTarget} onChange={(e) => setEditTarget(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" /></div>
                <div><label className="text-xs text-gray-600 block mb-1">Batas Restock</label><input type="number" value={editMin} onChange={(e) => setEditMin(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-600 block mb-1">Harga Modal</label><input type="number" value={editModal} onChange={(e) => setEditModal(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" /></div>
                <div><label className="text-xs text-gray-600 block mb-1">Harga Jual</label><input type="number" value={editJual} onChange={(e) => setEditJual(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" /></div>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500">
                <p>Stok &le; Batas Restock → <span className="text-red-600 font-bold">BELI</span></p>
                <p>Rekomendasi = Target - Stok sekarang</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleUpdate} className="flex-1 bg-primary-500 text-white py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors">Simpan</button>
              <button onClick={() => { if (confirm("Yakin hapus barang ini?")) { onHapusBarang(editBarang.id); setEditBarang(null); } }} className="bg-red-50 text-red-600 px-4 py-3 rounded-xl font-medium hover:bg-red-100 transition-colors">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
