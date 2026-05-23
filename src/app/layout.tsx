import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WarungOS - Dashboard Management Warung",
  description: "Aplikasi dashboard management warung kampung untuk menghitung uang harian, stok barang, alarm restock, gas LPG, pulsa, dan target modal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="bg-gradient-to-br from-primary-50 via-white to-primary-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
