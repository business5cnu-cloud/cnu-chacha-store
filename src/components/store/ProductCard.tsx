'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ShoppingCart, AlertCircle } from 'lucide-react';
import { Product } from '@/types';
import { formatKRW, calculateDiscountRate } from '@/lib/utils';
import { ProductArtwork } from '@/components/common/ProductArtwork';
import { useStore } from '@/hooks/useStore';

interface ProductCardProps {
  product: Product;
  rank?: number;
}

export function ProductCard({ product, rank }: ProductCardProps) {
  const { addToCart } = useStore();
  const discountRate = calculateDiscountRate(product.price, product.sale_price);
  const isSoldOut = product.stock <= 0 || product.status === 'sold_out';
  const isEnded = product.status === 'ended';

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSoldOut || isEnded) return;

    const firstOpt = product.options[0];
    const res = addToCart({
      product_id: product.id,
      option_id: firstOpt?.id,
      option_label: firstOpt ? `${firstOpt.option_name}: ${firstOpt.option_value}` : '기본 옵션',
      additional_price: firstOpt?.additional_price || 0,
      quantity: 1,
    });
    if (!res.success) {
      alert(res.message);
    }
  };

  return (
    <Link
      href={`/products/${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      {/* Thumbnail Area */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
        <ProductArtwork
          sku={product.sku}
          name={product.name}
          imageUrl={product.image_url}
          categoryName={product.category_name}
          isLimited={product.is_limited}
          className="h-full w-full"
        />

        {/* Top Left Badges */}
        <div className="absolute left-3 top-3 z-20 flex flex-wrap items-center gap-1.5">
          {rank !== undefined && (
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-xl bg-cnu-navy text-xs font-black text-white shadow">
              {rank}
            </span>
          )}
          {product.is_limited && (
            <span className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-2.5 py-1 text-[11px] font-extrabold text-white shadow-sm">
              <Sparkles className="h-3 w-3" />
              한정판
            </span>
          )}
          {discountRate > 0 && (
            <span className="inline-flex items-center rounded-xl bg-sky-500 px-2 py-1 text-[11px] font-extrabold text-white shadow-sm">
              {discountRate}% OFF
            </span>
          )}
        </div>

        {/* Status Badge Top Right */}
        <div className="absolute right-3 top-3 z-20">
          {isEnded ? (
            <span className="rounded-xl bg-slate-800/90 px-2.5 py-1 text-[11px] font-bold text-slate-200">
              판매종료
            </span>
          ) : isSoldOut ? (
            <span className="rounded-xl bg-rose-900/90 px-2.5 py-1 text-[11px] font-bold text-white">
              품절
            </span>
          ) : (
            <span className="rounded-xl bg-emerald-600/90 px-2.5 py-1 text-[11px] font-bold text-white">
              판매중
            </span>
          )}
        </div>

        {/* Sold Out / Ended Overlay */}
        {(isSoldOut || isEnded) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/60 backdrop-blur-[2px] text-white">
            <AlertCircle className="h-7 w-7 text-rose-400 mb-1" />
            <span className="text-sm font-extrabold tracking-wide">
              {isEnded ? '판매 기간 종료' : 'SOLD OUT (일시품절)'}
            </span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-cnu-blue">{product.category_name}</span>
            <span>누적 {product.total_sold.toLocaleString()}개 판매</span>
          </div>

          <h3 className="mt-1 line-clamp-1 text-base font-bold text-slate-900 group-hover:text-cnu-navy">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-slate-500 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-end justify-between">
          <div>
            {product.sale_price && product.sale_price < product.price ? (
              <div className="flex flex-col">
                <span className="text-xs text-slate-400 line-through">
                  {formatKRW(product.price)}
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-extrabold text-rose-600">
                    {discountRate}%
                  </span>
                  <span className="text-base font-black text-slate-900">
                    {formatKRW(product.sale_price)}
                  </span>
                </div>
              </div>
            ) : (
              <span className="text-base font-black text-slate-900">
                {formatKRW(product.price)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isSoldOut || isEnded}
            title={isSoldOut ? '품절된 상품입니다' : '장바구니 담기'}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-cnu-navy transition-colors hover:bg-cnu-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ShoppingCart className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Link>
  );
}
