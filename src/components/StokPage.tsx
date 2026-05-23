"use client";

import React, { useState } from "react";
import { Barang, getStatus, getRekomendasi, KATEGORI_LABEL } from "@/lib/store";

interface StokPageProps {
  stokBarang: Barang[];
  onUpdateStok: (id: number, stok: number) => void;
  onHapusBarang: (id: number) => void;
  onTambahBarang: (barang: Omit<Barang, "id">) => void;
}

export default function StokPage({ stokBarang, onUpdateStok, onHapusBarang, onTambahBarang }: StokPageProps) {
  const [filter, setFilter] = useState("semua");
  const [showTambah, setShowTambah] = useState(false);
  const [editBarang, setEditBarang] = useState<Barang | null>(null);
  const [editStokVal, setEditStokVal] = useState("");
  const [addNama, setAddNama] = useState("");
  const [addKategori, setAddKategori] = useState("rokok");
  const [addSatuan, setAddSatuan] = useState("");
  const [addStok, setAddStok] = useState("");
  const [addStokNormal, setAddStokNormal] = useState("");
  const [addMinimum, setAddMinimum] = useState("");

  const filtered = filter === "semua" ? stokBarang : stokBarang.filter((b) => b.kategori === filter);

  const handleSimpanBarang = () => {
    if (!addNama.trim()) { alert("Nama barang harus diisi!"); return; }
    onTambahBarang({ nama: addNama.trim(), kategori: addKategori, satuan: addSatuan.trim() || "pcs", stok: parseInt(addStok) || 0, stokNormal: parseInt(addStokNormal) || 10, minimum: parseInt(addMinimum) || 3 });
    setShowTambah(false);
    setAddNama(""); setAddKategori("rokok"); setAddSatuan(""); setAddStok(""); setAddStokNormal(""); setAddMinimum("");
  };

  const handleUpdateStok = () => {
    if (!editBarang) return;
    const newStok = parseInt(editStokVal);
    if (isNaN(newStok) || newStok < 0) { alert("Masukkan stok yang valid!"); return; }
    onUpdateStok(editBarang.id, newStok);
    setEditBarang(null);
  };

  return (
    <div className="p-4 lg:p-8">
      <div className="flex flex-wrap gap-3 mb-6">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary-400 outline-none">
          <option value="semua">Semua Kategori</option>
          <option value="rokok">Rokok</option>
          <option value="kopi">Kopi</option>
          <option value="snack">Snack</option>
          <option value="sembako">Sembako</option>
          <option value="gas">Gas LPG</option>
          <option value="pulsa">Pulsa/PPOB</option>
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
          const barColor = s.color === "red" ? "bg-red-500" : s.color === "orange" ? "bg-orange-400" : "bg-green-500";
          const statusClass = s.status === "BELI" ? "bg-red-100 text-red-700" : s.status === "WASPADA" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700";
          return (
            <div key={b.id} onClick={() => { setEditBarang(b); setEditStokVal(String(b.stok)); }} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 card-hover cursor-pointer">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-navy-900">{b.nama}</h4>
                  <p className="text-xs text-gray-400">{KATEGORI_LABEL[b.kategori] || b.kategori}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${statusClass}`}>{s.status}</span>
              </div>
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Stok: {b.stok} {b.satuan}</span>
                  <span className="font-medium">{persen}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className={`${barColor} h-2 rounded-full progress-bar`} style={{ width: `${persen}%` }}></div>
                </div>
              </div>
              <p className="text-xs text-gray-500">{rek}</p>
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
            <div className="space-y-4">
              <div><label className="text-sm text-gray-600 mb-1 block">Nama Barang</label><input type="text" value={addNama} onChange={(e) => setAddNama(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400" placeholder="Contoh: Pandemas" /></div>
              <div><label className="text-sm text-gray-600 mb-1 block">Kategori</label><select value={addKategori} onChange={(e) => setAddKategori(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400"><option value="rokok">Rokok</option><option value="kopi">Kopi</option><option value="snack">Snack</option><option value="sembako">Sembako</option><option value="gas">Gas LPG</option><option value="pulsa">Pulsa/PPOB</option></select></div>
              <div><label className="text-sm text-gray-600 mb-1 block">Satuan</label><input type="text" value={addSatuan} onChange={(e) => setAddSatuan(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400" placeholder="slop, renceng, pcs" /></div>
              <div><label className="text-sm text-gray-600 mb-1 block">Stok Saat Ini</label><input type="number" value={addStok} onChange={(e) => setAddStok(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400" placeholder="0" /></div>
              <div><label className="text-sm text-gray-600 mb-1 block">Stok Normal</label><input type="number" value={addStokNormal} onChange={(e) => setAddStokNormal(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400" placeholder="10" /></div>
              <div><label className="text-sm text-gray-600 mb-1 block">Batas Minimum</label><input type="number" value={addMinimum} onChange={(e) => setAddMinimum(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400" placeholder="3" /></div>
              <button onClick={handleSimpanBarang} className="w-full bg-primary-500 text-white py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors">Simpan Barang</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Edit */}
      {editBarang && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-navy-900">Update Stok</h3>
              <button onClick={() => setEditBarang(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <p className="text-sm text-gray-500 mb-3">{editBarang.nama} ({editBarang.stok} {editBarang.satuan})</p>
            <input type="number" value={editStokVal} onChange={(e) => setEditStokVal(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 mb-4" placeholder="Stok baru" />
            <div className="flex gap-3">
              <button onClick={handleUpdateStok} className="flex-1 bg-primary-500 text-white py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors">Update</button>
              <button onClick={() => { if (confirm("Yakin hapus?")) { onHapusBarang(editBarang.id); setEditBarang(null); } }} className="bg-red-50 text-red-600 px-4 py-3 rounded-xl font-medium hover:bg-red-100 transition-colors">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
