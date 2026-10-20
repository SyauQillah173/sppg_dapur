/**
 * Centralized Safe Error Sanitizer for SPPG Dapur Enterprise.
 * Mencegah kebocoran string koneksi database, kredensial PostgreSQL, query internal,
 * atau jejak teknis stack trace ke client (OWASP A04: Insecure Design & A05: Security Misconfiguration).
 */

export function safeErrorMessage(err: unknown, defaultFallback = 'Terjadi kendala pada server. Silakan hubungi administrator.'): string {
  if (!err) return defaultFallback;

  const rawMessage = typeof err === 'string' ? err : (err as any)?.message || '';
  if (!rawMessage || typeof rawMessage !== 'string') return defaultFallback;

  // Pola-pola sensitif yang WAJIB diblokir agar kredensial database tidak bocor:
  const SENSITIVE_PATTERNS = [
    /postgres(ql)?:\/\//i,
    /password\s*=/i,
    /user(name)?\s*=/i,
    /sslmode\s*=/i,
    /neon\.tech/i,
    /prisma/i,
    /\.findMany|\.findUnique|\.create|\.update|\.delete|\.upsert/i,
    /P1\d{3}|P2\d{3}/, // Prisma Error Codes (e.g. P1001 connection error, P2002 unique constraint)
    /DATABASE_URL|DIRECT_URL|SESSION_SECRET|GEMINI_API_KEY/i,
    /connect ECONNREFUSED/i,
    /connection terminated/i,
    /FATAL:\s*password authentication failed/i,
    /SASL authentication/i,
    /at\s+[\w\d_./\\-]+\.js:\d+:\d+/i, // Stack trace lines
  ];

  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(rawMessage)) {
      console.error('[SECURITY AUDIT WARNING] Sensitive database error suppressed from response:', rawMessage);
      return 'Terjadi kendala teknis pada layanan database. Data Anda tetap terlindungi dan aman.';
    }
  }

  // Jika pesan terlalu panjang (> 250 karakter) di mode produksi, potong untuk menghindari kebocoran data
  if (process.env.NODE_ENV === 'production' && rawMessage.length > 250) {
    return defaultFallback;
  }

  return rawMessage;
}
