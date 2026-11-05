'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, AlertTriangle, Wand2 } from 'lucide-react';

export type ArtworkVariant = 'thumbnail' | 'list' | 'detail' | 'lifestyle' | 'banner';

interface ProductArtworkProps {
  sku?: string;
  name: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
  originalUrl?: string;
  lifestyleUrl?: string;
  aiEnhancedUrl?: string;
  isAiEnhanced?: boolean;
  categoryName?: string;
  isLimited?: boolean;
  variant?: ArtworkVariant;
  priority?: boolean;
  objectFit?: 'contain' | 'cover';
  showResolutionBadge?: boolean;
  showAiBadge?: boolean;
  className?: string;
}

const SKU_MULTI_RES_MAP: Record<
  string,
  {
    id: string;
    thumbnail: string;
    medium: string;
    large: string;
    original: string;
    lifestyle: string;
    aiEnhanced: string;
  }
> = {
  'CNU-APP-001': {
    id: 'prod-hoodie',
    thumbnail: '/images/products/thumbnail/prod-hoodie.png',
    medium: '/images/products/medium/prod-hoodie.png',
    large: '/images/products/large/prod-hoodie.png',
    original: '/images/products/original/prod-hoodie.png',
    lifestyle: '/images/products/lifestyle/prod-hoodie.png',
    aiEnhanced: '/images/products/ai_enhanced/prod-hoodie.png',
  },
  'CNU-APP-002': {
    id: 'prod-socks',
    thumbnail: '/images/products/thumbnail/prod-socks.png',
    medium: '/images/products/medium/prod-socks.png',
    large: '/images/products/large/prod-socks.png',
    original: '/images/products/original/prod-socks.png',
    lifestyle: '/images/products/lifestyle/prod-socks.png',
    aiEnhanced: '/images/products/ai_enhanced/prod-socks.png',
  },
  'CNU-STA-001': {
    id: 'prod-memo',
    thumbnail: '/images/products/thumbnail/prod-memo.png',
    medium: '/images/products/medium/prod-memo.png',
    large: '/images/products/large/prod-memo.png',
    original: '/images/products/original/prod-memo.png',
    lifestyle: '/images/products/lifestyle/prod-memo.png',
    aiEnhanced: '/images/products/ai_enhanced/prod-memo.png',
  },
  'CNU-LIM-003': {
    id: 'prod-limited-sticker',
    thumbnail: '/images/products/thumbnail/prod-limited-sticker.png',
    medium: '/images/products/medium/prod-limited-sticker.png',
    large: '/images/products/large/prod-limited-sticker.png',
    original: '/images/products/original/prod-limited-sticker.png',
    lifestyle: '/images/products/lifestyle/prod-limited-sticker.png',
    aiEnhanced: '/images/products/ai_enhanced/prod-limited-sticker.png',
  },
  'CNU-ACC-001': {
    id: 'prod-griptok',
    thumbnail: '/images/products/thumbnail/prod-griptok.png',
    medium: '/images/products/medium/prod-griptok.png',
    large: '/images/products/large/prod-griptok.png',
    original: '/images/products/original/prod-griptok.png',
    lifestyle: '/images/products/lifestyle/prod-griptok.png',
    aiEnhanced: '/images/products/ai_enhanced/prod-griptok.png',
  },
  'CNU-ACC-002': {
    id: 'prod-keyring',
    thumbnail: '/images/products/thumbnail/prod-keyring.png',
    medium: '/images/products/medium/prod-keyring.png',
    large: '/images/products/large/prod-keyring.png',
    original: '/images/products/original/prod-keyring.png',
    lifestyle: '/images/products/lifestyle/prod-keyring.png',
    aiEnhanced: '/images/products/ai_enhanced/prod-keyring.png',
  },
  'CNU-ACC-003': {
    id: 'prod-tumbler',
    thumbnail: '/images/products/thumbnail/prod-tumbler.png',
    medium: '/images/products/medium/prod-tumbler.png',
    large: '/images/products/large/prod-tumbler.png',
    original: '/images/products/original/prod-tumbler.png',
    lifestyle: '/images/products/lifestyle/prod-tumbler.png',
    aiEnhanced: '/images/products/ai_enhanced/prod-tumbler.png',
  },
  'CNU-ACC-004': {
    id: 'prod-figure',
    thumbnail: '/images/products/thumbnail/prod-figure.png',
    medium: '/images/products/medium/prod-figure.png',
    large: '/images/products/large/prod-figure.png',
    original: '/images/products/original/prod-figure.png',
    lifestyle: '/images/products/lifestyle/prod-figure.png',
    aiEnhanced: '/images/products/ai_enhanced/prod-figure.png',
  },
  'CNU-ACC-005': {
    id: 'prod-laptop-pouch',
    thumbnail: '/images/products/thumbnail/prod-laptop-pouch.png',
    medium: '/images/products/medium/prod-laptop-pouch.png',
    large: '/images/products/large/prod-laptop-pouch.png',
    original: '/images/products/original/prod-laptop-pouch.png',
    lifestyle: '/images/products/lifestyle/prod-laptop-pouch.png',
    aiEnhanced: '/images/products/ai_enhanced/prod-laptop-pouch.png',
  },
  'CNU-ACC-006': {
    id: 'prod-powerbank',
    thumbnail: '/images/products/thumbnail/prod-powerbank.png',
    medium: '/images/products/medium/prod-powerbank.png',
    large: '/images/products/large/prod-powerbank.png',
    original: '/images/products/original/prod-powerbank.png',
    lifestyle: '/images/products/lifestyle/prod-powerbank.png',
    aiEnhanced: '/images/products/ai_enhanced/prod-powerbank.png',
  },
  'CNU-ACC-007': {
    id: 'prod-toothbrush',
    thumbnail: '/images/products/thumbnail/prod-toothbrush.png',
    medium: '/images/products/medium/prod-toothbrush.png',
    large: '/images/products/large/prod-toothbrush.png',
    original: '/images/products/original/prod-toothbrush.png',
    lifestyle: '/images/products/lifestyle/prod-toothbrush.png',
    aiEnhanced: '/images/products/ai_enhanced/prod-toothbrush.png',
  },
  'CNU-ACC-008': {
    id: 'prod-travel-pouch',
    thumbnail: '/images/products/thumbnail/prod-travel-pouch.png',
    medium: '/images/products/medium/prod-travel-pouch.png',
    large: '/images/products/large/prod-travel-pouch.png',
    original: '/images/products/original/prod-travel-pouch.png',
    lifestyle: '/images/products/lifestyle/prod-travel-pouch.png',
    aiEnhanced: '/images/products/ai_enhanced/prod-travel-pouch.png',
  },
  'CNU-ACC-009': {
    id: 'prod-car-freshener',
    thumbnail: '/images/products/thumbnail/prod-car-freshener.png',
    medium: '/images/products/medium/prod-car-freshener.png',
    large: '/images/products/large/prod-car-freshener.png',
    original: '/images/products/original/prod-car-freshener.png',
    lifestyle: '/images/products/lifestyle/prod-car-freshener.png',
    aiEnhanced: '/images/products/ai_enhanced/prod-car-freshener.png',
  },
  'CNU-ACC-010': {
    id: 'prod-ecobag',
    thumbnail: '/images/products/thumbnail/prod-ecobag.png',
    medium: '/images/products/medium/prod-ecobag.png',
    large: '/images/products/large/prod-ecobag.png',
    original: '/images/products/original/prod-ecobag.png',
    lifestyle: '/images/products/lifestyle/prod-ecobag.png',
    aiEnhanced: '/images/products/ai_enhanced/prod-ecobag.png',
  },
  'CNU-LIM-001': {
    id: 'prod-custom-doll',
    thumbnail: '/images/products/thumbnail/prod-custom-doll.png',
    medium: '/images/products/medium/prod-custom-doll.png',
    large: '/images/products/large/prod-custom-doll.png',
    original: '/images/products/original/prod-custom-doll.png',
    lifestyle: '/images/products/lifestyle/prod-custom-doll.png',
    aiEnhanced: '/images/products/ai_enhanced/prod-custom-doll.png',
  },
  'CNU-LIM-002': {
    id: 'prod-season-doll',
    thumbnail: '/images/products/thumbnail/prod-season-doll.png',
    medium: '/images/products/medium/prod-season-doll.png',
    large: '/images/products/large/prod-season-doll.png',
    original: '/images/products/original/prod-season-doll.png',
    lifestyle: '/images/products/lifestyle/prod-season-doll.png',
    aiEnhanced: '/images/products/ai_enhanced/prod-season-doll.png',
  },
};

const LEGACY_LOWRES_UPGRADE_MAP: Record<string, string> = {
  '/images/products/prod_hoodie.png': 'CNU-APP-001',
  '/images/products/prod_socks.png': 'CNU-APP-002',
  '/images/products/prod_notebook.png': 'CNU-STA-001',
  '/images/products/prod_sticker.png': 'CNU-LIM-003',
  '/images/products/prod_keyring.png': 'CNU-ACC-002',
  '/images/products/prod_tumbler.png': 'CNU-ACC-003',
  '/images/products/prod_ecobag.png': 'CNU-ACC-010',
  '/images/products/prod_doll_s.png': 'CNU-LIM-001',
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

function deriveMultiResSet(
  sku?: string,
  imageUrl?: string,
  thumbnailUrl?: string,
  mediumUrl?: string,
  largeUrl?: string,
  originalUrl?: string,
  lifestyleUrl?: string,
  aiEnhancedUrl?: string
) {
  const mappedSku = sku || (imageUrl ? LEGACY_LOWRES_UPGRADE_MAP[imageUrl] : undefined);
  const skuSet = mappedSku ? SKU_MULTI_RES_MAP[mappedSku] : undefined;

  const tierMatch = imageUrl?.match(/^\/images\/products\/(thumbnail|medium|large|original|ai_enhanced)\/([^/]+\.png)$/);
  const matchedFile = tierMatch ? tierMatch[2] : undefined;

  const isLegacyPlaceholder =
    !imageUrl ||
    imageUrl === '/images/products/default-product.svg' ||
    imageUrl === '/images/chacha/chacha-placeholder.svg' ||
    Boolean(imageUrl && LEGACY_LOWRES_UPGRADE_MAP[imageUrl]);

  const customUrl = !isLegacyPlaceholder ? imageUrl : undefined;

  const thumb =
    thumbnailUrl ||
    (matchedFile ? `/images/products/thumbnail/${matchedFile}` : undefined) ||
    skuSet?.thumbnail ||
    customUrl;

  const med =
    mediumUrl ||
    (matchedFile ? `/images/products/medium/${matchedFile}` : undefined) ||
    skuSet?.medium ||
    customUrl;

  const lrg =
    largeUrl ||
    (matchedFile ? `/images/products/large/${matchedFile}` : undefined) ||
    skuSet?.large ||
    customUrl;

  const orig =
    originalUrl ||
    (matchedFile ? `/images/products/original/${matchedFile}` : undefined) ||
    skuSet?.original ||
    lrg;

  const life =
    lifestyleUrl ||
    (matchedFile ? `/images/products/lifestyle/${matchedFile}` : undefined) ||
    skuSet?.lifestyle;

  const ai =
    aiEnhancedUrl ||
    (matchedFile ? `/images/products/ai_enhanced/${matchedFile}` : undefined) ||
    skuSet?.aiEnhanced;

  const hasStandardTiers = Boolean(matchedFile || skuSet || (thumb && med && lrg));

  return {
    thumbnail: thumb,
    medium: med,
    large: lrg,
    original: orig,
    lifestyle: life,
    aiEnhanced: ai,
    customUrl,
    hasStandardTiers,
  };
}

export function ProductArtwork({
  sku,
  name,
  imageUrl,
  thumbnailUrl,
  mediumUrl,
  largeUrl,
  originalUrl,
  lifestyleUrl,
  aiEnhancedUrl,
  isAiEnhanced = false,
  categoryName,
  isLimited,
  variant = 'list',
  priority = false,
  objectFit,
  showResolutionBadge = false,
  showAiBadge = false,
  className = '',
}: ProductArtworkProps) {
  const [hasError, setHasError] = useState(false);
  const [naturalDims, setNaturalDims] = useState<{ w: number; h: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const resSet = deriveMultiResSet(
    sku,
    imageUrl,
    thumbnailUrl,
    mediumUrl,
    largeUrl,
    originalUrl,
    lifestyleUrl,
    aiEnhancedUrl
  );

  let primarySrc: string | undefined;
  if (variant === 'thumbnail') {
    primarySrc = resSet.thumbnail || resSet.medium || resSet.customUrl;
  } else if (variant === 'detail') {
    primarySrc = resSet.large || resSet.aiEnhanced || resSet.original || resSet.customUrl || resSet.medium;
  } else if (variant === 'lifestyle') {
    primarySrc = resSet.lifestyle || resSet.large || resSet.customUrl;
  } else {
    primarySrc = resSet.medium || resSet.customUrl || resSet.large;
  }

  useEffect(() => {
    setHasError(false);
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setNaturalDims({ w: el.naturalWidth, h: el.naturalHeight });
    }
  }, [primarySrc]);

  const canUseMultiResSrcSet =
    resSet.hasStandardTiers &&
    variant !== 'lifestyle' &&
    !primarySrc?.startsWith('data:') &&
    resSet.thumbnail &&
    resSet.medium &&
    resSet.large;

  const srcSet = canUseMultiResSrcSet
    ? `${resSet.thumbnail} 400w, ${resSet.medium} 800w, ${resSet.large} 1600w`
    : undefined;

  let sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw';
  if (variant === 'thumbnail') {
    sizes = '(max-width: 640px) 80px, 120px';
  } else if (variant === 'detail' || variant === 'lifestyle') {
    sizes = '(max-width: 768px) 100vw, (max-width: 1280px) 55vw, 800px';
  } else if (variant === 'banner') {
    sizes = '100vw';
  }

  const effectiveObjectFit: 'contain' | 'cover' =
    objectFit || (variant === 'lifestyle' || variant === 'banner' ? 'cover' : 'contain');

  // Policy 1: Prevent forcible enlargement larger than original resolution
  const isLowResOriginal = Boolean(
    naturalDims && (naturalDims.w < 400 || naturalDims.h < 400)
  );

  // Policy 7: Check if AI enhanced
  const isActuallyAiEnhanced =
    isAiEnhanced || Boolean(primarySrc && primarySrc.includes('/ai_enhanced/'));

  if (primarySrc && !hasError) {
    return (
      <div
        className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-[#F8FAFC] ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={primarySrc}
          srcSet={srcSet}
          sizes={srcSet ? sizes : undefined}
          alt={name}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={(e) => {
            const imgEl = e.currentTarget;
            if (imgEl.naturalWidth && imgEl.naturalHeight) {
              setNaturalDims({ w: imgEl.naturalWidth, h: imgEl.naturalHeight });
            }
          }}
          onError={() => {
            setHasError(true);
          }}
          style={
            isLowResOriginal && naturalDims
              ? {
                  width: '100%',
                  height: '100%',
                  maxWidth: `${naturalDims.w}px`,
                  maxHeight: `${naturalDims.h}px`,
                  objectFit: 'contain',
                }
              : {
                  width: '100%',
                  height: '100%',
                  objectFit: effectiveObjectFit,
                }
          }
          className={`relative z-10 transition-transform duration-300 ${
            effectiveObjectFit === 'contain'
              ? 'object-contain group-hover:scale-[1.03]'
              : 'object-cover group-hover:scale-[1.03]'
          }`}
        />

        {/* Policy 7: AI Enhancement Warning Badge (실제 제품 사진 오인 방지 표기) */}
        {(showAiBadge || isActuallyAiEnhanced) && (
          <div className="pointer-events-none absolute top-2.5 right-2.5 z-20 flex items-center gap-1 rounded-full bg-violet-900/80 px-2.5 py-0.5 text-[10px] font-extrabold text-violet-100 backdrop-blur-xs border border-violet-400/30">
            <Wand2 className="h-3 w-3 text-violet-300" />
            <span>AI 그래픽 보정</span>
          </div>
        )}

        {/* Resolution Badge or Low-Res Warning Badge */}
        {showResolutionBadge && naturalDims && (
          <div className="pointer-events-none absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1 rounded-full bg-slate-900/75 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-xs">
            {isLowResOriginal ? (
              <>
                <AlertTriangle className="h-3 w-3 text-amber-400" />
                <span>
                  원본 {naturalDims.w}×{naturalDims.h}px (확대 방지)
                </span>
              </>
            ) : (
              <span>
                HD {naturalDims.w}×{naturalDims.h}px
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  // Fallback artwork
  const palette = (sku && PALETTES[sku]) || {
    bg: 'from-blue-50 via-indigo-50 to-slate-100',
    accent: 'text-cnu-navy',
    badge: categoryName || 'CHA CHA OFFICIAL',
    icon: '🐾',
  };

  const isDark = palette.bg.includes('900') || palette.bg.includes('950');

  return (
    <div
      className={`relative flex h-full w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br p-4 select-none ${palette.bg} ${className}`}
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
          {hasError ? '대체 아트워크 표시 중' : '차차 공식 굿즈 에디션'}
        </p>
      </div>
    </div>
  );
}
