# WarungOS

**Dashboard Management Warung Kampung** - Aplikasi web untuk mengelola keuangan harian, stok barang, alarm restock, dan target modal warung.

## Fitur Utama

- **Input Omzet Harian** - Catat omzet dan otomatis hitung pembagian uang (70% restock, 15% tabungan, 10% growth, 5% kas kecil)
- **Manajemen Stok** - Kelola stok barang dengan kategori (Rokok, Kopi, Snack, Sembako, Gas LPG, Pulsa)
- **Alarm Restock Otomatis** - Notifikasi otomatis ketika stok di bawah batas minimum
- **Grafik Omzet** - Visualisasi omzet 7 hari terakhir dengan total mingguan & rata-rata harian
- **Target Modal** - Pantau progress pertumbuhan modal dari Rp 10 juta ke Rp 20 juta

## Status Stok

| Warna  | Status   | Keterangan              |
|--------|----------|-------------------------|
| Hijau  | AMAN     | Stok mencukupi          |
| Orange | WASPADA  | Stok mulai menipis      |
| Merah  | BELI/ISI | Segera restock/isi ulang |

## Deploy di Vercel

1. Push repo ini ke GitHub
2. Buka [vercel.com](https://vercel.com)
3. Import repository dari GitHub
4. Vercel otomatis detect Next.js, klik **Deploy**
5. Selesai!

## Development

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000)

## Teknologi

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- localStorage (data tersimpan di browser)

## Desain

- Responsive (mobile & desktop)
- Mobile: bottom navigation, 1 kolom
- Desktop: sidebar kiri, grid 2-3 kolom
- Warna: biru muda pucat, cyan, putih, navy gelap
- Card rounded dengan shadow halus

## Struktur

```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── DashboardPage.tsx
│   ├── GrafikPage.tsx
│   ├── MobileNav.tsx
│   ├── Sidebar.tsx
│   ├── StokPage.tsx
│   └── TargetPage.tsx
└── lib/
    └── store.ts
```
