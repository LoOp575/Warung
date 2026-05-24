"use client";

import React, { useState } from "react";
import { Barang, formatRupiah, getStatus } from "@/lib/store";

interface RestockPageProps {
  stokBarang: Barang[];
  onRestock: (items: { barang: Barang; qty: number; buyPrice: number }[], note: string) => Promise<void>;
}

interface CartItem {
  barang: Barang;
  qty: number;
  buyPrice: number;
}

export default function RestockPage({ stokBarang, onRestock }: RestockPageProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [qty, setQty] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const restockableProducts = stokBarang.filter((b) => b.kategori !== "pulsa");

  // Auto-fill buy price when product selected
  const handleSelectProduct = (id: string) => {
    setSelectedId(id);
    const barang = stokBarang.find((b) => b.id === id);
    if (barang) setBuyPrice(String(barang.hargaModal));
  };

  const handleAddToCart = () => {
    const barang = stokBarang.find((b) => b.id === selectedId);
    if (!barang) { alert("Pilih barang!"); return; }
    const q = parseInt(qty);
    if (!q || q <= 0) { alert("Masukkan qty!"); return; }
    const price = parseInt(buyPrice) || barang.hargaModal;

    const existing = cart.find((c) => c.barang.id === barang.id);
    if (existing) {
      setCart(cart.map((c) => c.barang.id === barang.id ? { ...c, qty: c.qty + q, buyPrice: price } : c));
    } else {
      setCart([...cart, { barang, qty: q, buyPrice: price }]);
    }
    setSelectedId("");
    setQty("");
    setBuyPrice("");
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter((c) => c.barang.id !== id));
  };

  const handleSimpan = async () => {
    if (cart.length === 0) { alert("Keranjang kosong!"); return; }
    setSaving(true);
    try {
      await onRestock(cart, note);
      setCart([]);
      setNote("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      alert("Gagal menyimpan restock");
    }
    setSaving(false);
  };

  const totalCost = cart.reduce((s, c) => s + c.qty * c.buyPrice, 0);

  // Show recommended restocks
  const needRestock = stokBarang
    .filter((b) => b.kategori !== "pulsa" && getStatus(b).status === "BELI")
    .slice(0, 5);

  return (
    <div className="p-4 lg:p-8">
      <h3 className="text-lg font-semibold text-navy-900 mb-4">Restock / Belanja</h3>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          Restock berhasil disimpan! Stok sudah diperbarui.
        </div>
      )}

      {/* Recommended restocks */}
      {needRestock.length > 0 && cart.length === 0 && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6">
          <h4 className="text-sm font-semibold text-red-700 mb-2">Perlu Restock:</h4>
          <div className="space-y-1">
            {needRestock.map((b) => {
              const s = getStatus(b);
              return (
                <div key={b.id} className="flex justify-between text-xs">
                  <span className="text-gray-700">{b.nama}</span>
                  <span className="text-red-600 font-medium">{s.qtyRekomFormatted}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add item form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600 block mb-1">Pilih Barang</label>
            <select value={selectedId} onChange={(e) => handleSelectProduct(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm">
              <option value="">-- Pilih barang --</option>
              {restockableProducts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nama} (stok: {b.stok}/{b.stokNormal} {b.satuan})
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 block mb-1">Qty Beli</label>
              <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="1" className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400" />
            </div>
            <div>
              <label className="text-xs text-gray-600 block mb-1">Harga Modal</label>
              <input type="number" value={buyPrice} onChange={(e) => setBuyPrice(e.target.value)} placeholder="0" className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400" />
            </div>
          </div>
          <button onClick={handleAddToCart} className="w-full bg-primary-500 text-white py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors">
            + Tambah ke Keranjang
          </button>
        </div>
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <h4 className="font-semibold text-navy-900 mb-3">Keranjang Belanja ({cart.length} item)</h4>
          <div className="space-y-2 mb-4">
            {cart.map((c) => {
              const subtotal = c.qty * c.buyPrice;
              return (
                <div key={c.barang.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{c.barang.nama}</p>
                    <p className="text-xs text-gray-500">{c.qty} {c.barang.satuan} x {formatRupiah(c.buyPrice)}</p>
                  </div>
                  <div className="text-right mr-3">
                    <p className="text-sm font-bold text-navy-900">{formatRupiah(subtotal)}</p>
                  </div>
                  <button onClick={() => handleRemoveFromCart(c.barang.id)} className="text-red-400 hover:text-red-600 text-lg">&times;</button>
                </div>
              );
            })}
          </div>

          {/* Note */}
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan: beli di toko X" className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm mb-4" />

          {/* Summary */}
          <div className="bg-orange-50 rounded-xl p-4 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Pengeluaran</span>
              <span className="font-bold text-navy-900">{formatRupiah(totalCost)}</span>
            </div>
          </div>

          {/* Submit */}
          <button onClick={handleSimpan} disabled={saving} className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors disabled:opacity-50">
            {saving ? "Menyimpan..." : "Simpan Restock"}
          </button>
        </div>
      )}

      {cart.length === 0 && !success && needRestock.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">Pilih barang untuk restock</p>
        </div>
      )}
    </div>
  );
}
