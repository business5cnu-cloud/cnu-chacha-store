'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface ProductArtworkProps {
  sku?: string;
  name: string;
  imageUrl?: string;
  categoryName?: string;
  isLimited?: boolean;
  className?: string;
}

const SKU_DEFAULT_IMAGES: Record<string, string> = {
  'CNU-APP-001': '/images/products/prod_hoodie.png',
  'CNU-APP-002': '/images/products/prod_socks.png',
  'CNU-STA-001': '/images/products/prod_notebook.png',
  'CNU-LIM-003': '/images/products/prod_sticker.png',
  'CNU-ACC-002': '/images/products/prod_keyring.png',
  'CNU-ACC-003': '/images/products/prod_tumbler.png',
  'CNU-ACC-010': '/images/products/prod_ecobag.png',
  'CNU-LIM-001': '/images/products/prod_doll_s.png',
  'CNU-LIM-002': '/images/products/prod_doll_s.png',
};

const PALETTES: Record<string, { bg: string; accent: string; badge: string; icon: string }> = {
  'CNU-APP-001': { bg: 'from-slate-900 via-blue-950 to-slate-800', accent: 'text-sky-300', badge: 'PREMIUM HOODIE', icon: '🧥' },
  'CNU-APP-002': { bg: 'from-blue-50 via-indigo-50 to-sky-100', accent: 'text-cnu-navy', badge: 'DAILY SOCKS', icon: '🧦' },
  'CNU-STA-001': { bg: 'from-amber-50 via-yellow-50 to-orange-50', accent: 'text-amber-900', badge: '100 SHEETS MEMO', icon: '📝' },
  'CNU-LIM-003': { bg: 'from-fuchsia-100 via-pink-50 to-sky-100', accent: 'text-fuchsia-900', badge: 'HOLOGRAM STICKER', icon: '✨' },
  'CNU-ACC-001': { bg: 'from-sky-100 via-blue-50 to-indigo-100', accent: 'text-blue-900', badge: 'MAGSAFE GRIP', icon: '📱' },
  'CNU-ACC-002': { bg: 'from-rose-50 via-pink-50 to-amber-50', accent: 'text-rose-900', badge: 'SOFT PVC KEYRING', icon: '🔑' },
  'CNU-ACC-003': { bg: 'from-slate-100 via-blue-50 to-slate-200', accent: 'text-slate-800', badge: '500ML TUMBLER', icon: '🥤' },
  'CNU-ACC-004': { bg: 'from-violet-100 via-purple-50 to-indigo-100', accent: 'text-violet-900', badge: 'RANDOM FIGURE', icon: '🎁' },
  'CNU-ACC-005': { bg: 'from-indigo-100 via-blue-50 to-slate-100', accent: 'text-indigo-950', badge: 'QUILTED POUCH', icon: '💻' },
  'CNU-ACC-006': { bg: 'from-cyan-50 via-sky-100 to-blue-100', accent: 'text-cyan-950', badge: '10000mAh PD', icon: '🔋' },
  'CNU-ACC-007': { bg: 'from-teal-50 via-emerald-50 to-cyan-100', accent: 'text-teal-900', badge: 'DENTAL CARE SET', icon: '🪥' },
  'CNU-ACC-008': { bg: 'from-blue-50 via-sky-50 to-indigo-100', accent: 'text-blue-900', badge: '3PCS TRAVEL SET', icon: '🧳' },
  'CNU-ACC-009': { bg: 'from-rose-50 via-orange-50 to-amber-100', accent: 'text-rose-900', badge: 'CAR FRESHENER', icon: '🚗' },
  'CNU-ACC-010': { bg: 'from-stone-100 via-amber-50/60 to-stone-200', accent: 'text-stone-800', badge: 'CANVAS ECOBAG', icon: '👜' },
  'CNU-LIM-001': { bg: 'from-blue-950 via-indigo-900 to-slate-900', accent: 'text-amber-300', badge: 'CUSTOM PLUSH 25CM', icon: '🧸' },
  'CNU-LIM-002': { bg: 'from-rose-100 via-pink-100 to-purple-100', accent: 'text-rose-950', badge: 'SEASON EDITION', icon: '🌸' },
};

export function ProductArtwork({
  sku,
  name,
  imageUrl,
  categoryName,
  isLimited,
  className = '',
}: ProductArtworkProps) {
  const isDefaultPlaceholder =
    !imageUrl ||
    imageUrl === '/images/products/default-product.svg' ||
    imageUrl === '/images/chacha/chacha-placeholder.svg';

  const resolvedImageUrl = !isDefaultPlaceholder
    ? imageUrl
    : sku && SKU_DEFAULT_IMAGES[sku]
    ? SKU_DEFAULT_IMAGES[sku]
    : undefined;

  if (resolvedImageUrl) {
    const isContainAsset = resolvedImageUrl.includes('/images/products/prod_') || resolvedImageUrl.includes('/images/chacha/');
    return (
      <div className={`relative overflow-hidden bg-[#F8F9FA] flex items-center justify-center ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={resolvedImageUrl}
          alt={name}
          className={`h-full w-full transition-transform duration-300 group-hover:scale-105 ${
            isContainAsset ? 'object-contain p-3' : 'object-cover'
          }`}
        />
      </div>
    );
  }

  const palette = (sku && PALETTES[sku]) || {
    bg: 'from-blue-50 via-indigo-50 to-slate-100',
    accent: 'text-cnu-navy',
    badge: categoryName || 'CHA CHA OFFICIAL',
    icon: '🐾',
  };

  const isDark = palette.bg.includes('900') || palette.bg.includes('950');

  return (
    <div
      className={`relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br p-4 select-none ${palette.bg} ${className}`}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/15 blur-xl" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-sky-400/15 blur-xl" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/90 text-3xl shadow-sm ring-2 ring-white/60 transition-transform duration-300 group-hover:scale-110">
          <span>{palette.icon}</span>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase ${
            isDark ? 'bg-white/15 text-white' : 'bg-cnu-navy/10 text-cnu-navy'
          }`}
        >
          {isLimited && <Sparkles className="h-2.5 w-2.5 text-amber-400" />}
          {palette.badge}
        </span>
        <p
          className={`mt-1.5 line-clamp-1 text-xs font-bold ${
            isDark ? 'text-white/95' : 'text-slate-800'
          }`}
        >
          {name}
        </p>
        <p
          className={`mt-0.5 text-[10px] ${
            isDark ? 'text-slate-300/80' : 'text-slate-500'
          }`}
        >
          차차 공식 굿즈 에디션
        </p>
      </div>
    </div>
  );
}
