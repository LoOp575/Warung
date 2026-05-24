"use client";

import React, { useState } from "react";
import { Barang, formatRupiah, KATEGORI_LABEL } from "@/lib/store";

interface JualPageProps {
  stokBarang: Barang[];
  onJual: (items: { barang: Barang; qty: number }[], note: string) => Promise<void>;
}

interface CartItem {
  barang: Barang;
  qty: number;
}

export default function JualPage({ stokBarang, onJual }: JualPageProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [qty, setQty] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const sellableProducts = stokBarang.filter((b) => b.kategori !== "pulsa" && b.stok > 0);

  const handleAddToCart = () => {
    const barang = stokBarang.find((b) => b.id === selectedId);
    if (!barang) { alert("Pilih barang!"); return; }
    const q = parseInt(qty);
    if (!q || q <= 0) { alert("Masukkan qty!"); return; }
    if (q > barang.stok) { alert(`Stok tidak cukup! Stok ${barang.nama}: ${barang.stok} ${barang.satuan}`); return; }

    // Check if already in cart
    const existing = cart.find((c) => c.barang.id === barang.id);
    if (existing) {
      const totalQty = existing.qty + q;
      if (totalQty > barang.stok) { alert(`Total qty melebihi stok! Max: ${barang.stok}`); return; }
      setCart(cart.map((c) => c.barang.id === barang.id ? { ...c, qty: totalQty } : c));
    } else {
      setCart([...cart, { barang, qty: q }]);
    }
    setSelectedId("");
    setQty("");
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(cart.filter((c) => c.barang.id !== id));
  };

  const handleSimpan = async () => {
    if (cart.length === 0) { alert("Keranjang kosong!"); return; }
    setSaving(true);
    try {
      await onJual(cart, note);
      setCart([]);
      setNote("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      alert("Gagal menyimpan penjualan");
    }
    setSaving(false);
  };

  const totalOmzet = cart.reduce((s, c) => s + c.qty * c.barang.hargaJual, 0);
  const totalModal = cart.reduce((s, c) => s + c.qty * c.barang.hargaModal, 0);
  const totalProfit = totalOmzet - totalModal;

  return (
    <div className="p-4 lg:p-8">
      <h3 className="text-lg font-semibold text-navy-900 mb-4">Jual Barang</h3>

      {/* Success message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">
          Penjualan berhasil disimpan!
        </div>
      )}

      {/* Add item form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600 block mb-1">Pilih Barang</label>
            <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm">
              <option value="">-- Pilih barang --</option>
              {sellableProducts.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.nama} ({b.stok} {b.satuan}) - {formatRupiah(b.hargaJual)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-600 block mb-1">Qty</label>
              <input type="number" value={qty} onChange={(e) => setQty(e.target.value)} placeholder="1" className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400" />
            </div>
            <button onClick={handleAddToCart} className="self-end bg-primary-500 text-white px-5 py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors">
              + Tambah
            </button>
          </div>
        </div>
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
          <h4 className="font-semibold text-navy-900 mb-3">Keranjang ({cart.length} item)</h4>
          <div className="space-y-2 mb-4">
            {cart.map((c) => {
              const subtotal = c.qty * c.barang.hargaJual;
              const profit = c.qty * (c.barang.hargaJual - c.barang.hargaModal);
              return (
                <div key={c.barang.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{c.barang.nama}</p>
                    <p className="text-xs text-gray-500">{c.qty} {c.barang.satuan} x {formatRupiah(c.barang.hargaJual)}</p>
                  </div>
                  <div className="text-right mr-3">
                    <p className="text-sm font-bold text-navy-900">{formatRupiah(subtotal)}</p>
                    <p className="text-xs text-green-600">+{formatRupiah(profit)}</p>
                  </div>
                  <button onClick={() => handleRemoveFromCart(c.barang.id)} className="text-red-400 hover:text-red-600 text-lg">&times;</button>
                </div>
              );
            })}
          </div>

          {/* Note */}
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan (opsional)" className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm mb-4" />

          {/* Summary */}
          <div className="bg-primary-50 rounded-xl p-4 mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Total Omzet</span>
              <span className="font-bold text-navy-900">{formatRupiah(totalOmzet)}</span>
            </div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Modal</span>
              <span className="text-gray-700">{formatRupiah(totalModal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Profit</span>
              <span className="font-bold text-green-600">{formatRupiah(totalProfit)}</span>
            </div>
          </div>

          {/* Submit */}
          <button onClick={handleSimpan} disabled={saving} className="w-full bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 transition-colors disabled:opacity-50">
            {saving ? "Menyimpan..." : "Simpan Penjualan"}
          </button>
        </div>
      )}

      {/* Empty state */}
      {cart.length === 0 && !success && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-sm">Pilih barang dan tambah ke keranjang untuk mulai menjual</p>
        </div>
      )}
    </div>
  );
}
