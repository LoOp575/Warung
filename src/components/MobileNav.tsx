"use client";

import React, { useState } from "react";

interface MobileNavProps {
  activePage: string;
  onNavigate: (page: string) => void;
}

export default function MobileNav({ activePage, onNavigate }: MobileNavProps) {
  const [showMore, setShowMore] = useState(false);

  const mainNav = [
    { id: "dashboard", label: "Home", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
    { id: "jual", label: "Jual", icon: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" },
    { id: "stok", label: "Stok", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
    { id: "restock", label: "Restock", icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" },
  ];

  const moreNav = [
    { id: "gas", label: "Gas", icon: "M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" },
    { id: "pulsa", label: "Pulsa", icon: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" },
    { id: "laporan", label: "Laporan", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { id: "grafik", label: "Grafik", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
    { id: "backup", label: "Backup", icon: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" },
  ];

  const isMoreActive = moreNav.some((n) => n.id === activePage);

  return (
    <>
      {/* More menu popup */}
      {showMore && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200 p-3 z-50 shadow-lg rounded-t-2xl">
          <div className="grid grid-cols-5 gap-1">
            {moreNav.map((item) => (
              <button key={item.id} onClick={() => { onNavigate(item.id); setShowMore(false); }} className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg ${activePage === item.id ? "text-primary-500" : "text-gray-500"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                <span className="text-xs">{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center px-1 py-2 z-50">
        {mainNav.map((item) => (
          <button key={item.id} onClick={() => { onNavigate(item.id); setShowMore(false); }} className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${activePage === item.id ? "text-primary-500" : "text-gray-400"}`}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
        <button onClick={() => setShowMore(!showMore)} className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${showMore || isMoreActive ? "text-primary-500" : "text-gray-400"}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
          <span className="text-xs">Lainnya</span>
        </button>
      </nav>
    </>
  );
}
