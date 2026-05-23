"use client";

import React, { useState } from "react";
import { Barang, getStatus, getRekomendasi, KATEGORI_LABEL, formatRupiah, hitungMarginPersen } from "@/lib/store";

interface StokPageProps {
  stokBarang: Barang[];
  onUpdateStok: (id: number, stok: number) => void;
  onHapusBarang: (id: number) => void;
  onTambahBarang: (barang: Omit<Barang, "id">) => void;
  onUpdateBarang: (barang: Barang) => void;
}

export default function StokPage({ stokBarang, onUpdateStok, onHapusBarang, onTambahBarang, onUpdateBarang }: StokPageProps) {
  const [filter, setFilter] = useState("semua");
  const [showTambah, setShowTambah] = useState(false);
  const [editBarang, setEditBarang] = useState<Barang | null>(null);
  const [editStokVal, setEditStokVal] = useState("");
  const [editHargaModal, setEditHargaModal] = useState("");
  const [editHargaJual, setEditHargaJual] = useState("");
  const [addNama, setAddNama] = useState("");
  const [addKategori, setAddKategori] = useState("rokok");
  const [addSatuan, setAddSatuan] = useState("");
  const [addStok, setAddStok] = useState("");
  const [addStokNormal, setAddStokNormal] = useState("");
  const [addMinimum, setAddMinimum] = useState("");
  const [addHargaModal, setAddHargaModal] = useState("");
  const [addHargaJual, setAddHargaJual] = useState("");

  const filtered = filter === "semua" ? stokBarang.filter(b => b.kategori !== "gas" && b.kategori !== "pulsa") : stokBarang.filter((b) => b.kategori === filter);

  const handleSimpanBarang = () => {
    if (!addNama.trim()) { alert("Nama barang harus diisi!"); return; }
    onTambahBarang({
      nama: addNama.trim(), kategori: addKategori, satuan: addSatuan.trim() || "pcs",
      stok: parseInt(addStok) || 0, stokNormal: parseInt(addStokNormal) || 10,
      minimum: parseInt(addMinimum) || 3, hargaModal: parseInt(addHargaModal) || 0,
      hargaJual: parseInt(addHargaJual) || 0,
    });
    setShowTambah(false);
    setAddNama(""); setAddKategori("rokok"); setAddSatuan(""); setAddStok("");
    setAddStokNormal(""); setAddMinimum(""); setAddHargaModal(""); setAddHargaJual("");
  };

  const handleUpdate = () => {
    if (!editBarang) return;
    const updated = {
      ...editBarang,
      stok: parseInt(editStokVal) || editBarang.stok,
      hargaModal: parseInt(editHargaModal) || editBarang.hargaModal,
      hargaJual: parseInt(editHargaJual) || editBarang.hargaJual,
    };
    onUpdateBarang(updated);
    setEditBarang(null);
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-400 outline-none">
          <option value="semua">Semua (tanpa Gas/Pulsa)</option>
          <option value="rokok">Rokok</option>
          <option value="kopi">Kopi</option>
          <option value="snack">Snack</option>
          <option value="sembako">Sembako</option>
        </select>
        <button onClick={() => setShowTambah(true)} className="bg-primary-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-primary-600 transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Tambah Barang
        </button>
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm col-span-full text-center py-8">Tidak ada barang</p>
        ) : filtered.map((b) => {
          const s = getStatus(b);
          const rek = getRekomendasi(b, s);
          const persen = Math.min(100, Math.round(s.persen));
          const margin = hitungMarginPersen(b);
          const barColor = s.color === "red" ? "bg-red-500" : s.color === "orange" ? "bg-orange-400" : "bg-green-500";
          const statusClass = s.status === "BELI" ? "bg-red-100 text-red-700" : s.status === "WASPADA" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700";
          return (
            <div key={b.id} onClick={() => { setEditBarang(b); setEditStokVal(String(b.stok)); setEditHargaModal(String(b.hargaModal)); setEditHargaJual(String(b.hargaJual)); }} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 card-hover cursor-pointer">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-navy-900">{b.nama}</h4>
                  <p className="text-xs text-gray-400">{KATEGORI_LABEL[b.kategori] || b.kategori}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${statusClass}`}>{s.status}</span>
              </div>
              <div className="mb-2">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Stok: {b.stok} {b.satuan}</span>
                  <span className="font-medium">{persen}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className={`${barColor} h-2 rounded-full progress-bar`} style={{ width: `${persen}%` }}></div>
                </div>
              </div>
              {/* Harga */}
              <div className="flex justify-between text-xs mb-2 bg-gray-50 rounded-lg p-2">
                <span className="text-gray-500">Modal: {formatRupiah(b.hargaModal)}</span>
                <span className="text-green-600 font-medium">Jual: {formatRupiah(b.hargaJual)}</span>
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">{rek}</p>
                {margin > 0 && <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded">+{margin}%</span>}
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
              <div><label className="text-sm text-gray-600 block mb-1">Nama</label><input type="text" value={addNama} onChange={(e) => setAddNama(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400" placeholder="Nama barang" /></div>
              <div><label className="text-sm text-gray-600 block mb-1">Kategori</label><select value={addKategori} onChange={(e) => setAddKategori(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400"><option value="rokok">Rokok</option><option value="kopi">Kopi</option><option value="snack">Snack</option><option value="sembako">Sembako</option></select></div>
              <div><label className="text-sm text-gray-600 block mb-1">Satuan</label><input type="text" value={addSatuan} onChange={(e) => setAddSatuan(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400" placeholder="slop, renceng, pcs" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div><label className="text-xs text-gray-600 block mb-1">Stok</label><input type="number" value={addStok} onChange={(e) => setAddStok(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" placeholder="0" /></div>
                <div><label className="text-xs text-gray-600 block mb-1">Normal</label><input type="number" value={addStokNormal} onChange={(e) => setAddStokNormal(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" placeholder="10" /></div>
                <div><label className="text-xs text-gray-600 block mb-1">Min</label><input type="number" value={addMinimum} onChange={(e) => setAddMinimum(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" placeholder="3" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-600 block mb-1">Harga Modal</label><input type="number" value={addHargaModal} onChange={(e) => setAddHargaModal(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" placeholder="0" /></div>
                <div><label className="text-xs text-gray-600 block mb-1">Harga Jual</label><input type="number" value={addHargaJual} onChange={(e) => setAddHargaJual(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" placeholder="0" /></div>
              </div>
              <button onClick={handleSimpanBarang} className="w-full bg-primary-500 text-white py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors">Simpan</button>
            </div>
          </div>
        </div>
      )}


      {/* Modal Edit */}
      {editBarang && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-navy-900">Edit Barang</h3>
              <button onClick={() => setEditBarang(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-3">{editBarang.nama}</p>
            <div className="space-y-3 mb-4">
              <div><label className="text-xs text-gray-600 block mb-1">Stok ({editBarang.satuan})</label><input type="number" value={editStokVal} onChange={(e) => setEditStokVal(e.target.value)} className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs text-gray-600 block mb-1">Harga Modal</label><input type="number" value={editHargaModal} onChange={(e) => setEditHargaModal(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" /></div>
                <div><label className="text-xs text-gray-600 block mb-1">Harga Jual</label><input type="number" value={editHargaJual} onChange={(e) => setEditHargaJual(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" /></div>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleUpdate} className="flex-1 bg-primary-500 text-white py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors">Simpan</button>
              <button onClick={() => { if (confirm("Yakin hapus?")) { onHapusBarang(editBarang.id); setEditBarang(null); } }} className="bg-red-50 text-red-600 px-4 py-3 rounded-xl font-medium hover:bg-red-100 transition-colors">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
