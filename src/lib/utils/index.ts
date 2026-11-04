import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatKRW(amount: number): string {
  return `${Math.round(amount).toLocaleString('ko-KR')}원`;
}

export function formatKSTDate(isoString: string, includeTime = false): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    return new Intl.DateTimeFormat('ko-KR', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      ...(includeTime
        ? {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
          }
        : {}),
    }).format(date);
  } catch {
    return isoString;
  }
}

export function getKSTDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date); // YYYY-MM-DD in Asia/Seoul
}

export function calculateDiscountRate(price: number, salePrice: number | null): number {
  if (!salePrice || salePrice >= price || price <= 0) return 0;
  return Math.round(((price - salePrice) / price) * 100);
}

export function getEffectivePrice(price: number, salePrice: number | null): number {
  if (salePrice !== null && salePrice > 0 && salePrice < price) {
    return salePrice;
  }
  return price;
}
