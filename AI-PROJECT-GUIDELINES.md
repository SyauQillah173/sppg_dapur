# 📘 Panduan Pengembangan & Konsistensi AI (AI Development & Consistency Guidelines)
### SPPG Dapur Enterprise (GiziFlow)
> **PENTING UNTUK SEMUA AI AGENT / ASSISTANT:**  
> Dokumen ini adalah **pedoman resmi** arsitektur, standar keamanan, basis data, dan aturan bisnis aplikasi **SPPG DAPUR**.  
> Setiap kali ada permintaan update fitur, bugfix, atau refactoring, AI **WAJIB MEMATUHI** seluruh prinsip di dokumen ini agar sistem tetap **100% konsisten, aman, dan bebas regresi**.

---

## 📌 1. Identitas & Gambaran Umum Sistem
* **Nama Proyek**: SPPG Dapur Enterprise (GiziFlow)
* **Tujuan**: Sistem terpadu manajemen logistik bahan pangan, pengadaan belanja, penyebaran pasokan bahan antar dapur, kartu stok pergudangan, dan distribusi porsi Makan Bergizi Gratis (MBG) resmi ke sekolah penerima manfaat.
* **Unit Dapur SPPG Terkelola (4 Dapur Utama)**:
  1. `SPPG-AA02`: SPPG ABAR ABIR 02 (Dapur Utama / Pusat)
  2. `SPPG-BS02`: SPPG BUNGAH SARI 02
  3. `SPPG-DR01`: SPPG DRIYOREJO 01
  4. `SPPG-SM01`: SPPG SIDAYU MAKMUR 01
* **Peran Pengguna (User Roles)**:
  1. `SUPERADMIN`: Hak akses penuh ke seluruh modul, CMS, hapus/edit data, manajemen anggaran, dan alokasi.
  2. `EXECUTIVE_AUDITOR`: Hak pantau/baca (read-only), verifikasi nota belanja, audit selisih harga, dan pemantauan kartu stok (tidak dapat mengubah alokasi/anggaran).
  3. `DISTRIBUTION_DRIVER`: Hak khusus modul logistik armada pengiriman, update status perjalanan (IN_TRANSIT, ARRIVED), dan serah terima BAST di sekolah.

---

## 🛡️ 2. Aturan Keamanan Mutlak (Non-Negotiable Security Rules)
Setiap perubahan pada kode backend atau frontend **WAJIB** mematuhi 6 aturan keamanan berikut:

### 2.1. Sanitasi Error Database (Zero Credential Leakage)
* **DILARANG KERAS** mengembalikan `error?.message` mentah ke respon JSON klien pada rute API (`src/app/api/**`).
* **WAJIB** gunakan fungsi pembungkus `safeErrorMessage(error)` dari `@/lib/safe-error.ts`:
  ```typescript
  import { safeErrorMessage } from '@/lib/safe-error';
  // ...
  } catch (error: any) {
    return NextResponse.json({ success: false, error: safeErrorMessage(error) }, { status: 500 });
  }
  ```
* Fungsi ini otomatis mendeteksi dan menghapus connection string PostgreSQL (`postgresql://...`), password, hostname Neon (`neon.tech`), kode internal Prisma (`P1001`, `P2002`), serta stack trace server.

### 2.2. Proteksi SQL Injection & XSS
* Semua query database **wajib menggunakan Prisma ORM query builder** terparameterisasi. **Dilarang memakai raw query** (`$queryRaw` / `$executeRaw`).
* **Dilarang menggunakan `dangerouslySetInnerHTML`** pada komponen React/Next.js. Selalu biarkan JSX melakukan auto-escaping.

### 2.3. Validasi CSRF & Cross-Origin
* File [src/middleware.ts](file:///d:/Projek/PROJEK%20REAL/SPPG%20DAPUR/src/middleware.ts) memeriksa header `Origin` vs `Host` pada metode mutasi (`POST`, `PUT`, `PATCH`, `DELETE`). Jangan mematikan atau membypass validasi ini.

### 2.4. Keamanan Otentikasi & Password
* Hash password menggunakan **Bcrypt (cost factor 12)** via `hashPassword` dan `verifyPassword` di `@/lib/password.ts`.
* Rute login memiliki proteksi **Timing Attack**: jika username tidak ditemukan, sistem tetap memanggil verifikasi bcrypt dummy agar durasi respon identik.
* Rate limiting aktif:
  - Login: 5 req/menit per IP & username.
  - API umum: 180 req/menit per IP.
  - Restore token: 30 req/menit per IP.
* Query `adminUser` selalu mengecualikan kolom `password` menggunakan `select` whitelist.

### 2.5. Keamanan Sesi & Remote Logout
* Tabel `UserSession` hanya menyimpan **hash SHA-256** dari token (`tokenHash`), tidak pernah menyimpan raw session token.
* Jika perangkat dikeluarkan dari jarak jauh (Remote Logout), middleware dan helper frontend `postJson` di [store.tsx](file:///d:/Projek/PROJEK%20REAL/SPPG%20DAPUR/src/lib/store.tsx) mendeteksi status 401 dan seketika membersihkan `localStorage` serta me-redirect browser ke `/login`.

### 2.6. Header Keamanan HTTP
* Header enterprise terpasang di [next.config.ts](file:///d:/Projek/PROJEK%20REAL/SPPG%20DAPUR/next.config.ts) dan [middleware.ts](file:///d:/Projek/PROJEK%20REAL/SPPG%20DAPUR/src/middleware.ts):
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Frame-Options: DENY`, `frame-ancestors 'none'`
  - `X-Content-Type-Options: nosniff`
  - `Cross-Origin-Opener-Policy: same-origin`
  - `Cross-Origin-Resource-Policy: same-origin`
  - `poweredByHeader: false`

---

## 🗄️ 3. Arsitektur Basis Data (Prisma Models)

| Model Prisma | Tabel DB | Deskripsi & Aturan Integritas |
|---|---|---|
| `AdminUser` | `admin_users` | Akun pengelola. Peran: `SUPERADMIN`, `EXECUTIVE_AUDITOR`, `DISTRIBUTION_DRIVER`. Password ter-hash bcrypt. |
| `UserSession` | `user_sessions` | Riwayat login & sesi aktif perangkat. Identifikasi via `tokenHash` (SHA-256), User-Agent parser, IP, status `isActive`. |
| `SppgUnit` | `sppg_units` | Data 4 unit dapur SPPG. Kode: `SPPG-AA02`, `SPPG-BS02`, dll. Mengelola `activeBudget`, `totalRealized`, `totalRemaining`. |
| `Employee` | `employees` | Karyawan dapur peminta kasbon/belanja per unit. Memiliki skor kepatuhan SPJ (`complianceScore`). |
| `Supplier` | `suppliers` | CV/rekanan penyedia bahan pangan. Anti-duplikat berdasarkan nama. |
| `IngredientCategory` | `ingredient_categories` | 6 Kategori Nutrisi (Protein Hewani, Protein Nabati, Sayuran, Buah, Bumbu/Saus, Sembako). |
| `Ingredient` | `ingredients` | Katalog bahan makanan. Kolom kunci: `currentStock` (total stok fisik) dan `sppgDistribution` (JSON sebaran stok per unit dapur: `{"SPPG-AA02": 100, ...}`). |
| `MasterUnit` | `master_units` | Satuan ukur standar (Kg, Pack, Karung, Liter, Botol, Ikat, Renteng). |
| `ProcurementOrder` | `procurement_orders` | Kepala nota belanja fisik/kasbon. Menyimpan total nota, status audit (`VERIFIED`, `PENDING_AUDIT`, `DISCREPANCY`), dan URL foto nota di DB. |
| `ProcurementItem` | `procurement_items` | Rincian bahan pada nota belanja, terhubung ke `Ingredient`, mendeteksi anomali harga (>20%). |
| `BudgetAllocation` | `budget_allocations` | Pagu kas masuk per unit SPPG atau kas gabungan (`sppgUnitId = 'ALL'`). |
| `StockMovement` | `stock_movements` | Kartu stok mutasi pergudangan (`MASUK` / `KELUAR`) dengan riwayat `remainingStockAfter`. |
| `MealDistribution` | `meal_distributions` | Surat jalan & BAST distribusi porsi makanan MBG ke sekolah penerima manfaat (termasuk potong stok dapur otomatis). |
| `SupplyDistribution` | `supply_distributions` | Surat jalan resmi penyebaran bahan belanja dari supplier/Gudang Sementara ke 4 dapur SPPG. |
| `SystemNotification` | `system_notifications` | Log notifikasi real-time aktivitas penting (alokasi pasokan, mutasi stok, audit selisih, kasbon lunas). |
| `NotaPhoto` | `nota_photos` | Berkas foto nota/bukti transfer disimpan sebagai binary `bytea` di PostgreSQL (aman dari penghapusan ephemeral container). |
| `AppState` | `app_state` | Singleton snapshot cadangan offline. |

---

## ⚙️ 4. Logika Bisnis & Perilaku Modul Penting

### 4.1. Modul Alokasi Pasokan Bahan Belanja (`SupplyAllocationModule`)
* **Rumus Gudang Sementara**:
  $$\text{Stok Gudang Sementara} = \text{currentStock} - \sum (\text{sppgDistribution per unit})$$
* **Fitur Hapus Alokasi (`DELETE /api/supply-distributions/[id]`)**:
  - Saat suatu surat alokasi dihapus, **100% kuantitas bahan yang pernah dialokasikan wajib dikembalikan ke Gudang Sementara**.
  - Dilakukan secara atomik di dalam `prisma.$transaction`: mengurangi sebaran di `sppgDistribution` dan mencatat kartu stok mutasi pembatalan.
* **Fitur Tarik Kembali Bahan ke Gudang Sementara**:
  - Tombol "Tarik Bahan ke Gudang Sementara" (baik per bahan maupun "Tarik Semua"):
    1. Mengosongkan kuantitas alokasi di unit dapur (`sppgDistribution`).
    2. Menjamin `currentStock` memiliki nilai yang mencukupi agar stok Gudang Sementara bertambah secara akurat.
* **Tampilan Responsif**:
  - Tabel alokasi yang memiliki banyak baris **wajib dibungkus dalam container dengan scroll internal (`max-h-[...] overflow-y-auto`)**, jangan dibiarkan memanjang ke bawah merusak layout halaman.

### 4.2. Modul Distribusi Porsi Makanan MBG (`MealDistribution`)
* **Otomasi Pemotongan Stok**:
  - Jika opsi `deductStockNow` diaktifkan saat membuat surat jalan distribusi, sistem memotong stok bahan makanan terkait dari unit dapur pengirim dan mencatat `stockMovement` tipe `KELUAR`.
  - Jika surat jalan distribusi dihapus (`DELETE /api/distribution/[id]`), stok yang pernah terpotong otomatis dikembalikan ke dapur (`MASUK`).
* **Dokumen Resmi BAST**:
  - Dokumen Berita Acara Serah Terima (BAST) dan Surat Jalan Pengiriman dilengkapi tanda tangan digital, suhu makanan saat serah terima, foto dokumentasi, dan format cetak standar dinas.

### 4.3. Modul Audit Pembelanjaan & AI Nota Scanner
* **AI OCR Nota Belanja**:
  - Endpoint `POST /api/scan-receipt` menggunakan model `gemini-2.5-flash` dengan prompt instruksi terstruktur untuk mengekstrak nomor nota, supplier, nama bahan, kuantitas, satuan, kategori gizi, dan harga satuan.
  - Dilengkapi mesin fallback heuristik realistis jika kuota API habis atau offline.

---

## 🎨 5. Standar Desain & Frontend UX (GiziFlow Aesthetics)
* **Desain Responsif**:
  - Wajib mendukung tampilan Mobile (360px - 480px), Tablet (768px - 1024px), dan Desktop/Ultrawide.
  - Gunakan touch-friendly buttons pada mobile (minimal ukuran tap target 44px).
  - Hindari horizontal overflow (`overflow-x-hidden` pada wrapper root).
* **Komunikasi Data Frontend (`src/lib/store.tsx`)**:
  - Semua mutasi data melalui helper `postJson(url, body, method)`:
    - Otomatis menyertakan header `Authorization: Bearer <token>` dari `localStorage` jika cookie tidak terkirim di lingkungan standalone PWA.
    - Otomatis menangani respon 401 dan mengarahkan pengguna ke `/login` secara bersih.
* **Feedback Pengguna**:
  - Tampilkan modal konfirmasi sebelum aksi berbahaya (seperti hapus alokasi, hapus nota belanja, atau tarik bahan).
  - Gunakan notifikasi toast/alert `failNotify` yang ramah pengguna.

---

## 🚀 6. Checklist Wajib Sebelum Menyelesaikan Tugas (AI Verification Protocol)
Sebelum melaporkan pekerjaan selesai kepada user, AI **WAJIB MENJALANKAN URUTAN BERIKUT**:

1. **Pemeriksaan TypeScript**:
   ```bash
   npx tsc --noEmit
   ```
   *Wajib keluar dengan code 0 tanpa satupun error tipe data.*

2. **Pemeriksaan Build Produksi Next.js**:
   ```bash
   npm run build
   ```
   *Wajib selesai sukses (seluruh rute halaman dan API terkompilasi).*

3. **Commit & Push ke GitHub**:
   ```bash
   git add .
   git commit -m "feat/fix: <deskripsi perubahan yang jelas dan padat>"
   git push origin main
   ```

4. **Laporan ke User**:
   - Jelaskan perubahan secara lugas dalam Bahasa Indonesia.
   - Cantumkan tautan markdown file yang dimodifikasi (`file:///d:/...`).
   - Sertakan konfirmasi bahwa build telah tervalidasi 100%.

---
*Dokumen ini diperbarui secara berkala dan menjadi referensi utama stabilitas sistem SPPG Dapur Enterprise.*
