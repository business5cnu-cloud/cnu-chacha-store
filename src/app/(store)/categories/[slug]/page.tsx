'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Sparkles, ArrowLeft, PackageOpen } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { ProductCard } from '@/components/store/ProductCard';

export default function CategoryDetailPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug || 'apparel';
  const { categories, products } = useStore();

  const currentCategory = categories.find((c) => c.slug === slug);
  const activeProducts = products.filter((p) => p.status !== 'hidden');

  const categoryProducts =
    slug === 'limited'
      ? activeProducts.filter((p) => p.is_limited)
      : activeProducts.filter((p) => p.category_slug === slug);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Category Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <Link
            href="/categories"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-cnu-navy mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            전체 카테고리 목록
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-cnu-navy">
              {currentCategory ? currentCategory.name : '카테고리'}
            </h1>
            {slug === 'limited' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-xs font-extrabold text-white">
                <Sparkles className="h-3.5 w-3.5" />
                한정판 전용관
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {currentCategory?.description || '차차 공식 굿즈 카테고리 상품 목록입니다.'}
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/categories/${cat.slug}`}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                cat.slug === slug
                  ? 'bg-cnu-navy text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {categoryProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white py-20 text-center">
          <PackageOpen className="h-12 w-12 text-slate-300 mb-3" />
          <p className="text-base font-bold text-slate-700">
            해당 카테고리에 등록된 상품이 없습니다.
          </p>
          <Link href="/products" className="btn-primary mt-4">
            전체 상품 보러가기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {categoryProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
