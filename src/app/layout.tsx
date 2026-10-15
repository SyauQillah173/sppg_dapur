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
  title: 'SPPG Dapur — Sistem Manajemen Operasional & Keuangan',
  description: 'Portal internal manajemen operasional, logistik, dan keuangan 4 unit SPPG Dapur.',
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
