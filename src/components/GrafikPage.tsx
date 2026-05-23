"use client";

import React from "react";
import { OmzetHarian, formatRupiah, getToday } from "@/lib/store";

interface GrafikPageProps {
  omzetHariIni: OmzetHarian;
  omzetHistory: OmzetHarian[];
}

export default function GrafikPage({ omzetHariIni, omzetHistory }: GrafikPageProps) {
  const last7: { tanggal: string; omzet: number; day: string }[] = [];
  const today = new Date();
  const dayNames = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    let omzet = 0;
    if (dateStr === getToday()) {
      omzet = omzetHariIni.jumlah;
    } else {
      const found = omzetHistory.find((h) => h.tanggal === dateStr);
      if (found) omzet = found.jumlah;
    }
    last7.push({ tanggal: dateStr, omzet, day: dayNames[d.getDay()] });
  }

  const maxOmzet = Math.max(...last7.map((d) => d.omzet), 1);
  const total = last7.reduce((sum, d) => sum + d.omzet, 0);
  const daysWithData = last7.filter((d) => d.omzet > 0).length;
  const rata = daysWithData > 0 ? Math.round(total / daysWithData) : 0;

  return (
    <div className="p-4 lg:p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <h3 className="text-lg font-semibold text-navy-900 mb-4">Omzet 7 Hari Terakhir</h3>
        <div className="h-64 flex items-end gap-2">
          {last7.map((d, i) => {
            const height = maxOmzet > 0 ? Math.max(4, (d.omzet / maxOmzet) * 100) : 4;
            const isToday = d.tanggal === getToday();
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <p className="text-xs text-gray-500 mb-1 text-center truncate w-full">
                  {d.omzet > 0 ? formatRupiah(d.omzet).replace("Rp ", "") : "-"}
                </p>
                <div
                  className={`${isToday ? "bg-primary-500" : "bg-primary-300"} rounded-t-lg w-full transition-all duration-500`}
                  style={{ height: `${height}%` }}
                ></div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-400">
          {last7.map((d, i) => (
            <span key={i} className="flex-1 text-center">{d.day}</span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-hover">
          <p className="text-sm text-gray-500 mb-1">Total Omzet Mingguan</p>
          <p className="text-2xl font-bold text-navy-900">{formatRupiah(total)}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 card-hover">
          <p className="text-sm text-gray-500 mb-1">Rata-rata Harian</p>
          <p className="text-2xl font-bold text-primary-600">{formatRupiah(rata)}</p>
        </div>
      </div>
    </div>
  );
}
