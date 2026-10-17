/**
 * Security Input Sanitizer for SPPG Dapur Enterprise
 * Mencegah serangan XSS, defacement, script injeksi judol, dan HTML payload berbahaya.
 */

// Regex untuk mendeteksi script, iframe, objek, form, event handlers javascript, atau link judol berbahaya
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  /<applet\b[^<]*(?:(?!<\/applet>)<[^<]*)*<\/applet>/gi,
  /<link\b[^>]*>/gi,
  /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
  /on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, // onmouseover=, onclick=, onerror=, etc.
  /javascript\s*:/gi,
  /data\s*:\s*text\/html/gi,
  /vbscript\s*:/gi,
];

/**
 * Membersihkan string teks dari HTML tags dan pola berbahaya.
 */
export function sanitizeText(input: unknown): string {
  if (typeof input !== 'string') return '';
  let cleaned = input.trim();

  // Bersihkan kontrol karakter tersembunyi (selain newline dan tab yang valid)
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Hapus semua pola script / tag berbahaya
  for (const pattern of DANGEROUS_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Escape sisa tag HTML agar tidak bisa dirender sebagai elemen DOM
  cleaned = cleaned
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return cleaned;
}

/**
 * Membersihkan objek secara rekursif (misalnya body JSON dari request)
 */
export function sanitizeObject<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    if (typeof obj === 'string') return sanitizeText(obj) as unknown as T;
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item)) as unknown as T;
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    // Jangan sanitasi password karena karakter khusus (!@#$) adalah bagian dari keamanan password
    if (key.toLowerCase().includes('password')) {
      result[key] = value;
    } else if (typeof value === 'string') {
      result[key] = sanitizeText(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Validasi apakah URL redirect aman (hanya internal relative URL)
 */
export function isSafeRedirectUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  // Harus diawali dengan '/' tunggal dan bukan '//' (mencegah protocol-relative redirect ke situs luar)
  return url.startsWith('/') && !url.startsWith('//') && !url.includes('\\');
}
