# Dokumentasi Database SPPG Dapur

Database: Neon PostgreSQL (serverless). Skema: `public`. File definisi: `prisma/schema.prisma`.
Semua tabel di bawah ini adalah **satu-satunya sumber data** — aplikasi membaca dan menulis langsung ke sini.

## Aturan umum

1. Satu menu = satu tabel. Tidak ada data yang disimpan ganda.
2. Id di database sama dengan id di aplikasi (`SPPG-AA02`, `SUP-01`, `EMP-AA01`, `ING-001`), jadi mudah dicocokkan saat memeriksa manual.
3. Anti duplikat dijaga dua lapis:
   - Lapisan database: kolom kunci diberi `UNIQUE` (lihat tabel di bawah).
   - Lapisan API: nama yang sudah ada tidak dibuat ulang, tapi dikembalikan baris yang sudah ada (`duplicate: true`).
4. Angka rupiah disimpan sebagai `Decimal(15,2)`, jumlah bahan `Decimal(10,2)`, supaya tidak ada pembulatan yang hilang.
5. Menghapus data induk yang masih dipakai ditolak dengan pesan jelas (mis. supplier masih dipakai di nota belanja).

## Tabel master (data induk)

| Tabel | Isi | Ditulis dari menu | Kunci anti duplikat |
|---|---|---|---|
| `admin_users` | Akun login (username, password ter-hash scrypt, peran) | CMS → Kelola Akun Admin, tombol "Akun" di header | `username` unik |
| `sppg_units` | 4 unit dapur SPPG: kode, nama, PIC, telepon, pagu kas, realisasi | CMS → Unit SPPG | `code` unik |
| `employees` | Karyawan peminta belanja per unit | CMS → Karyawan / Supplier | `employeeNumber` unik, `(name, sppgUnitId)` unik |
| `suppliers` | CV / supplier belanja | CMS → Supplier, form belanja (ketik baru) | `code` unik, `name` unik |
| `ingredient_categories` | Kategori bahan (Protein Hewani, Sayuran, dst) | CMS → Kategori Bahan | `code` dan `name` unik |
| `ingredients` | Bahan makanan + stok + harga patokan + sebaran per unit | CMS → Bahan Makanan, mutasi stok | `code` dan `name` unik |
| `master_units` | Satuan ukur (Kg, Karung, Pack, Liter, dst) | CMS → Satuan Ukur | `symbol` unik |

## Tabel transaksi

| Tabel | Isi | Ditulis dari menu |
|---|---|---|
| `procurement_orders` | Kepala nota belanja: tanggal, unit tujuan, peminta, supplier, dana diminta, total nota, kembalian, status audit, foto nota, catatan | Pembelanjaan → Catat Pembelanjaan (juga dari AI Scanner) |
| `procurement_items` | Rincian bahan tiap nota: nama, kategori, jumlah, satuan, harga, subtotal, penanda anomali harga >20% | Ikut tersimpan bersama notanya |
| `budget_allocations` | Dana masuk / pagu kas: unit, periode fiskal, tanggal, nominal, keterangan | Catatan Dana Masuk |
| `stock_movements` | Mutasi stok bahan: masuk/keluar, jumlah, keperluan, sisa stok setelah mutasi | Inventaris Dapur → Mutasi Stok |
| `nota_photos` | Foto nota (bytea) | Upload foto di form belanja |

## Tabel pendukung

| Tabel | Isi |
|---|---|
| `app_state` | Cache offline (satu baris `singleton`) supaya tampilan tetap ada saat internet mati. Bukan sumber data. |

## Cara kerja saat data disimpan

1. Form mengirim ke API (mis. `POST /api/procurement`).
2. API menulis ke tabel di dalam satu transaksi database.
3. API menyesuaikan angka turunan: `sppg_units.totalRealized` / `totalRemaining` dan `suppliers.totalDisbursed` / `totalTransactions`.
4. Aplikasi memuat ulang data dari tabel, jadi angka di layar selalu berasal dari database.

Nota atau dana masuk dengan tujuan **Semua SPPG** disimpan apa adanya dengan `sppgUnitId = 'ALL'`, dan angka turunannya dibagi rata ke semua unit supaya total tidak berlipat. Karena itu kolom `sppgUnitId` di `procurement_orders` dan `budget_allocations` sengaja tidak memakai foreign key.

## Kalau ada perubahan struktur

```bash
npx prisma db push        # samakan tabel di database dengan schema.prisma
npx prisma generate       # perbarui tipe Prisma Client
```

Perpindahan data sekali jalan ditaruh di folder `scripts/` dan dijalankan dengan `npx tsx <nama-file>`.

## Pemeriksaan rutin

```bash
npx tsx scripts/audit-db.ts                    # daftar duplikat + jumlah baris tiap tabel
npx tsx scripts/check-master-api.ts <url>      # uji API master + anti duplikat
npx tsx scripts/check-excel-import.ts          # uji parser import Excel
```
