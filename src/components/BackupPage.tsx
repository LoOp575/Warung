"use client";

import React, { useState } from "react";
import { dbExportAll, dbResetAll, isSupabaseEnabled } from "@/lib/supabase";

interface BackupPageProps {
  onReload: () => Promise<void>;
}

export default function BackupPage({ onReload }: BackupPageProps) {
  const [exporting, setExporting] = useState(false);
  const [resetConfirm, setResetConfirm] = useState("");
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState("");

  // === EXPORT ===
  const handleExport = async () => {
    setExporting(true);
    setMessage("");
    try {
      let data: Record<string, unknown[]> | null = null;

      if (isSupabaseEnabled()) {
        data = await dbExportAll();
      }

      if (!data) {
        // Fallback: export localStorage
        const keys = ["products_cache", "omzet_today", "omzet_history", "modal_v2", "riwayat_harian", "gas_data", "pulsa_data"];
        const localData: Record<string, unknown> = {};
        keys.forEach((k) => {
          const val = localStorage.getItem("warungos_" + k);
          if (val) localData[k] = JSON.parse(val);
        });
        data = localData as Record<string, unknown[]>;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `warungneng-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setMessage("Export berhasil! File sudah didownload.");
    } catch (e) {
      setMessage("Gagal export data.");
    }
    setExporting(false);
  };

  // === IMPORT ===
  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);

        // Store to localStorage as cache
        if (data.products || data.products_cache) {
          localStorage.setItem("warungos_products_cache", JSON.stringify(data.products || data.products_cache));
        }
        if (data.daily_reports || data.riwayat_harian) {
          localStorage.setItem("warungos_riwayat_harian", JSON.stringify(data.daily_reports || data.riwayat_harian));
        }

        setMessage("Import berhasil! Refresh halaman untuk melihat data baru.");
        await onReload();
      } catch (err) {
        setMessage("Gagal import. Pastikan file JSON valid.");
      }
    };
    input.click();
  };

  // === RESET ===
  const handleReset = async () => {
    if (resetConfirm !== "YA RESET DATA") {
      alert('Ketik persis: "YA RESET DATA" untuk konfirmasi');
      return;
    }
    setResetting(true);
    setMessage("");

    if (isSupabaseEnabled()) {
      await dbResetAll();
    }

    // Clear localStorage
    const keys = Object.keys(localStorage).filter((k) => k.startsWith("warungos_"));
    keys.forEach((k) => localStorage.removeItem(k));

    setMessage("Semua data berhasil direset. Halaman akan reload.");
    setResetConfirm("");
    setResetting(false);

    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <div className="p-4 lg:p-8">
      <h3 className="text-lg font-semibold text-navy-900 mb-4">Backup & Reset</h3>

      {message && (
        <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-xl text-sm text-primary-700">{message}</div>
      )}

      {/* Export */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 card-hover">
        <h4 className="font-semibold text-navy-900 mb-2">Export Data</h4>
        <p className="text-sm text-gray-500 mb-4">Download semua data ke file JSON. Bisa dipakai untuk backup atau pindah device.</p>
        <button onClick={handleExport} disabled={exporting} className="bg-primary-500 text-white px-5 py-3 rounded-xl font-medium hover:bg-primary-600 transition-colors disabled:opacity-50">
          {exporting ? "Mengexport..." : "Export ke JSON"}
        </button>
      </div>

      {/* Import */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 card-hover">
        <h4 className="font-semibold text-navy-900 mb-2">Import Data</h4>
        <p className="text-sm text-gray-500 mb-4">Restore data dari file JSON backup sebelumnya.</p>
        <button onClick={handleImport} className="bg-green-500 text-white px-5 py-3 rounded-xl font-medium hover:bg-green-600 transition-colors">
          Import dari JSON
        </button>
      </div>

      {/* Reset */}
      <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-5 card-hover">
        <h4 className="font-semibold text-red-700 mb-2">Reset Semua Data</h4>
        <p className="text-sm text-gray-500 mb-2">Menghapus SEMUA data di Supabase dan localStorage. Tidak bisa di-undo!</p>
        <p className="text-sm text-red-600 font-medium mb-4">Pastikan sudah export backup sebelum reset.</p>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-600 block mb-1">Ketik <strong>YA RESET DATA</strong> untuk konfirmasi:</label>
            <input
              type="text"
              value={resetConfirm}
              onChange={(e) => setResetConfirm(e.target.value)}
              placeholder="YA RESET DATA"
              className="w-full px-4 py-3 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-400 text-sm"
            />
          </div>
          <button
            onClick={handleReset}
            disabled={resetting || resetConfirm !== "YA RESET DATA"}
            className="bg-red-500 text-white px-5 py-3 rounded-xl font-medium hover:bg-red-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {resetting ? "Mereset..." : "RESET SEMUA DATA"}
          </button>
        </div>
      </div>
    </div>
  );
}
