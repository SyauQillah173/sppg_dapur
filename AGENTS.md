<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## SPPG Dapur Enterprise AI Development Rules
Semua AI Agent yang bekerja di repositori ini WAJIB membaca dan mematuhi panduan lengkap di:
👉 [AI-PROJECT-GUIDELINES.md](file:///d:/Projek/PROJEK%20REAL/SPPG%20DAPUR/AI-PROJECT-GUIDELINES.md)

### Aturan Utama Konsistensi:
1. **Keamanan Database (Zero Credential Leak)**: Selalu gunakan `safeErrorMessage(error)` dari `@/lib/safe-error` di seluruh blok `catch` rute API `/api/**`. Jangan pernah mengembalikan `error?.message` mentah ke respon JSON klien.
2. **Tanpa Raw SQL & Tanpa dangerouslySetInnerHTML**: Kueri wajib menggunakan Prisma ORM terparameterisasi. Hindari `dangerouslySetInnerHTML`.
3. **Integritas Stok & Alokasi Pasokan**: 
   - Stok Gudang Sementara = `currentStock - totalAllocated (sppgDistribution)`.
   - Menghapus alokasi pasokan (`DELETE /api/supply-distributions/[id]`) wajib mengembalikan 100% kuantitas alokasi ke Gudang Sementara via `prisma.$transaction`.
   - Penarikan bahan ke gudang sementara (`return-to-warehouse`) mengosongkan `sppgDistribution` dan memastikan headroom `currentStock` mencukupi.
4. **Desain Responsif**: Tabel atau daftar panjang wajib diberi batas tinggi dan scroll internal (`max-h-[...] overflow-y-auto`) agar tidak memanjang merusak halaman.
5. **Verifikasi Wajib Sebelum Selesai**: Jalankan `npx tsc --noEmit` (harus 0 error) dan `npm run build` sebelum push ke Git `main`.

