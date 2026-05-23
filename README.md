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

## Cara Pakai

1. Buka file `warungos/index.html` di browser
2. Input omzet harian di dashboard
3. Kelola stok barang di halaman Stok
4. Pantau grafik dan target modal

## Teknologi

- HTML5
- Tailwind CSS (via CDN)
- Vanilla JavaScript
- localStorage (data tersimpan di browser)

## Desain

- Responsive (mobile & desktop)
- Mobile: bottom navigation, 1 kolom
- Desktop: sidebar kiri, grid 2-3 kolom
- Warna: biru muda pucat, cyan, putih, navy gelap
- Card rounded dengan shadow halus

## Struktur File

```
warungos/
├── index.html    # Halaman utama (HTML + Tailwind)
└── app.js        # Logic aplikasi (JavaScript)
```

## Catatan

- Data disimpan di localStorage browser
- Tidak memerlukan server/database
- Cocok dibuka di HP Android via browser
