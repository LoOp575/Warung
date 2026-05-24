"use client";

import React, { useState } from "react";
import { PulsaTransaction, formatRupiah } from "@/lib/store";

interface PulsaPageProps {
  balance: number;
  transactions: PulsaTransaction[];
  onTransaction: (type: "deposit" | "sell", amount: number, cost: number, note: string) => Promise<void>;
}

export default function PulsaPage({ balance, transactions, onTransaction }: PulsaPageProps) {
  const [mode, setMode] = useState<"deposit" | "sell">("sell");
  const [amount, setAmount] = useState("");
  const [cost, setCost] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  // Settings (stored in UI - can be made persistent later)
  const [minBalance] = useState(100000);

  const persenSaldo = balance > 0 ? Math.min(100, Math.round((balance / Math.max(balance, 1500000)) * 100)) : 0;
  const statusColor = balance <= minBalance ? "text-red-600" : balance <= minBalance * 3 ? "text-orange-500" : "text-green-600";
  const statusText = balance <= minBalance ? "ISI DEPOSIT" : "AMAN";

  const handleSubmit = async () => {
    const amt = parseInt(amount);
    if (!amt || amt <= 0) { alert("Masukkan nominal!"); return; }

    if (mode === "sell") {
      const c = parseInt(cost) || amt; // cost defaults to amount if not specified
      if (c > balance) { alert(`Saldo tidak cukup! Saldo: ${formatRupiah(balance)}`); return; }
      setSaving(true);
      await onTransaction("sell", amt, c, note || "Jual pulsa/PPOB");
      setSuccess(`Jual ${formatRupiah(amt)} berhasil! Profit: ${formatRupiah(amt - c)}`);
    } else {
      setSaving(true);
      await onTransaction("deposit", amt, 0, note || "Isi deposit");
      setSuccess(`Deposit ${formatRupiah(amt)} berhasil!`);
    }

    setAmount("");
    setCost("");
    setNote("");
    setSaving(false);
    setTimeout(() => setSuccess(""), 3000);
  };

  const totalDeposit = transactions.filter((t) => t.type === "deposit").reduce((s, t) => s + t.amount, 0);
  const totalSell = transactions.filter((t) => t.type === "sell").reduce((s, t) => s + t.amount, 0);
  const totalProfit = transactions.filter((t) => t.type === "sell").reduce((s, t) => s + t.profit, 0);

  return (
    <div className="p-4 lg:p-8">
      <h3 className="text-lg font-semibold text-navy-900 mb-4">Pulsa / PPOB</h3>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">{success}</div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Saldo Deposit</p>
          <p className={`text-xl font-bold ${statusColor}`}>{formatRupiah(balance)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Status</p>
          <p className={`text-lg font-bold ${statusColor}`}>{statusText}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Total Penjualan</p>
          <p className="text-lg font-bold text-navy-900">{formatRupiah(totalSell)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 card-hover">
          <p className="text-xs text-gray-500 mb-1">Total Profit</p>
          <p className="text-lg font-bold text-green-600">{formatRupiah(totalProfit)}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-gray-600">Saldo Deposit</span>
          <span className="text-sm font-medium">{formatRupiah(balance)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div className={`h-3 rounded-full progress-bar ${balance > minBalance * 3 ? "bg-green-500" : balance > minBalance ? "bg-orange-400" : "bg-red-500"}`} style={{ width: `${persenSaldo}%` }}></div>
        </div>
        <p className="text-xs text-gray-400 mt-1">Batas minimal: {formatRupiah(minBalance)}</p>
      </div>

      {/* Transaction Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => setMode("sell")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "sell" ? "bg-primary-500 text-white" : "bg-gray-100 text-gray-600"}`}>
            Jual Pulsa
          </button>
          <button onClick={() => setMode("deposit")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${mode === "deposit" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600"}`}>
            Isi Deposit
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600 block mb-1">
              {mode === "sell" ? "Nominal Jual (ke pembeli)" : "Jumlah Deposit"}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={mode === "sell" ? "25000" : "500000"} className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400" />
            </div>
          </div>

          {mode === "sell" && (
            <div>
              <label className="text-xs text-gray-600 block mb-1">Modal (potong saldo)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">Rp</span>
                <input type="number" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="24000" className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400" />
              </div>
              {amount && cost && parseInt(amount) > 0 && (
                <p className="text-xs text-green-600 mt-1">Profit: {formatRupiah(parseInt(amount) - (parseInt(cost) || 0))}</p>
              )}
            </div>
          )}

          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder={mode === "sell" ? "Pulsa Telkomsel 25rb" : "Deposit via transfer"} className="w-full px-4 py-2 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-400 text-sm" />

          <button onClick={handleSubmit} disabled={saving} className={`w-full py-3 rounded-xl font-medium transition-colors disabled:opacity-50 ${mode === "sell" ? "bg-primary-500 text-white hover:bg-primary-600" : "bg-green-500 text-white hover:bg-green-600"}`}>
            {saving ? "Menyimpan..." : mode === "sell" ? "Jual" : "Deposit"}
          </button>
        </div>
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h4 className="font-semibold text-navy-900 mb-4">Riwayat Transaksi</h4>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {transactions.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-6">Belum ada transaksi</p>
          ) : (
            transactions.slice(0, 30).map((tx) => (
              <div key={tx.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${tx.type === "deposit" ? "bg-green-500" : "bg-primary-500"}`}></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{tx.note || (tx.type === "deposit" ? "Deposit" : "Jual pulsa")}</p>
                    <p className="text-xs text-gray-400">{tx.createdAt ? new Date(tx.createdAt).toLocaleDateString("id-ID") : ""}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-medium ${tx.type === "deposit" ? "text-green-600" : "text-primary-600"}`}>
                    {tx.type === "deposit" ? "+" : "-"}{formatRupiah(tx.type === "deposit" ? tx.amount : tx.cost)}
                  </p>
                  {tx.type === "sell" && tx.profit > 0 && (
                    <p className="text-xs text-green-500">+{formatRupiah(tx.profit)}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
