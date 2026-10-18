import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIDR(value: number): string {
  if (value === undefined || value === null || isNaN(value)) return "Rp 0";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export const formatRupiah = formatIDR;

/** Selisih nota vs kasbon: nominal + persen realisasi, dihitung otomatis sistem tanpa minus membingungkan. */
export function hitungSelisih(amountRequested: number, actualReceiptTotal: number) {
  const nominal = actualReceiptTotal - amountRequested; // + = over (nombok), - = sisa kasbon
  const over = nominal > 0;
  
  // Berapa persen dana kasbon yang terserap/terpakai
  const persenTerpakai = amountRequested > 0 ? (actualReceiptTotal / amountRequested) * 100 : (actualReceiptTotal > 0 ? 100 : 0);
  
  // Berapa persen sisa dana kasbon yang masih utuh/kembali
  const persenSisa = amountRequested > 0 ? Math.max(0, 100 - persenTerpakai) : 0;
  
  // Persentase selisih nominal relatif terhadap kasbon
  const persenOver = amountRequested > 0 && over ? ((nominal / amountRequested) * 100) : 0;

  return {
    nominal,
    over,
    persen: over ? persenOver : persenTerpakai,
    persenTerpakai,
    persenSisa,
    persenOver,
    // Teks persentase yang ramah pengguna
    persenText: over ? `+${persenOver.toFixed(1)}%` : `${persenTerpakai.toFixed(1)}%`,
    nominalText: over ? `+${formatIDR(nominal)}` : `-${formatIDR(Math.abs(nominal))}`,
    terpakaiText: `${persenTerpakai < 0.1 && persenTerpakai > 0 ? '< 0.1%' : persenTerpakai.toFixed(1) + '%'} Terpakai`,
    sisaText: `${persenSisa.toFixed(1)}% Sisa`,
  };
}

export function formatNumber(value: number, decimals: number = 0): string {
  if (value === undefined || value === null || isNaN(value)) return "0";
  return new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatKg(value: number): string {
  return `${formatNumber(value, value % 1 === 0 ? 0 : 2)} Kg`;
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(d);
  } catch {
    return dateStr;
  }
}

export function formatDateTimeIndo(dateStr: string): string {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return dateStr;
  }
}
