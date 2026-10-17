/**
 * Utility Kompresi Gambar Client-Side HD (WebP / JPEG)
 * Otomatis mengonversi foto resolusi tinggi dari kamera HP (3MB - 12MB)
 * menjadi WebP jernih dengan ukuran ultra-hemat (~70KB - 150KB)
 * dengan resolusi HD (maksimal 1280px).
 *
 * Menghemat 95%+ kapasitas penyimpanan database Postgres Neon free tier
 * sehingga awet dan aman dipakai jangka panjang bertahun-tahun.
 */

export interface CompressionResult {
  file: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
  formattedOriginal: string;
  formattedCompressed: string;
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export async function compressImageHD(
  file: File,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.78
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    // Validasi apakah file merupakan gambar
    if (!file.type || !file.type.startsWith('image/')) {
      return reject(new Error('File yang dipilih bukan merupakan berkas gambar.'));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar dari perangkat.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gagal memproses gambar untuk kompresi HD.'));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Hitung skala rasio agar tetap proporsional dan tidak gepeng
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Browser tidak mendukung akselerasi Canvas 2D.'));
        }

        // Aktifkan anti-aliasing dan image smoothing kualitas tinggi
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Ekspor ke WebP (format modern Google dengan kompresi superior)
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              // Fallback aman ke JPEG jika browser tidak mendukung blob webp
              canvas.toBlob(
                (jpegBlob) => {
                  if (!jpegBlob) return reject(new Error('Gagal menghasilkan berkas gambar terkompresi.'));
                  finalize(jpegBlob, 'jpg', 'image/jpeg');
                },
                'image/jpeg',
                quality
              );
              return;
            }
            finalize(blob, 'webp', 'image/webp');
          },
          'image/webp',
          quality
        );

        function finalize(blob: Blob, ext: string, mimeType: string) {
          const rawName = file.name.replace(/\.[^/.]+$/, '');
          const cleanName = rawName.replace(/[^a-zA-Z0-9_-]/g, '_');
          const newFileName = `${cleanName || 'bukti'}_hd.${ext}`;
          const compressedFile = new File([blob], newFileName, { type: mimeType });
          const dataUrl = canvas.toDataURL(mimeType, quality);
          const originalSize = file.size;
          const compressedSize = blob.size;
          const reductionPercentage = originalSize > 0
            ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
            : 0;

          resolve({
            file: compressedFile,
            dataUrl,
            originalSize,
            compressedSize,
            reductionPercentage,
            formattedOriginal: formatBytes(originalSize),
            formattedCompressed: formatBytes(compressedSize),
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
