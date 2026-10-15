import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'GiziFlow Enterprise - Sistem Manajemen Operasional, Logistik & Keuangan SPPG',
  description: 'Enterprise ERP & Financial Audit Web Application untuk 4 SPPG Dapur: SPPG Abar Abir 02, SPPG Banjarsari 02 Leran Manyar, SPPG Dahan Rejo 01, dan SPPG Semampir.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans bg-slate-50/60 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
