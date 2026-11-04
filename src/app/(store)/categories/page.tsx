'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Layers } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { ProductCard } from '@/components/store/ProductCard';

export default function CategoriesIndexPage() {
  const { categories, products } = useStore();
  const activeProducts = products.filter((p) => p.status !== 'hidden');

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">
      <div className="rounded-3xl bg-cnu-navy p-8 sm:p-10 text-white">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-sky-300">
          <Layers className="h-3.5 w-3.5" />
          <span>CATEGORIES</span>
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-black">
          카테고리별 차차 굿즈 컬렉션
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          의류, 문구, 잡화, 그리고 시즌 한정판까지 원하는 카테고리를 선택해 살펴보세요.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {categories.map((cat) => {
            const count =
              cat.slug === 'limited'
                ? activeProducts.filter((p) => p.is_limited).length
                : activeProducts.filter((p) => p.category_slug === cat.slug).length;
            return (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="group rounded-2xl bg-white/10 p-4 backdrop-blur-sm border border-white/15 hover:bg-white/20 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-extrabold text-white">{cat.name}</span>
                  <span className="rounded-full bg-sky-400 px-2 py-0.5 text-xs font-black text-slate-950">
                    {count}종
                  </span>
                </div>
                <p className="mt-1 line-clamp-1 text-xs text-slate-300">{cat.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {categories.map((cat) => {
        const catProducts =
          cat.slug === 'limited'
            ? activeProducts.filter((p) => p.is_limited)
            : activeProducts.filter((p) => p.category_slug === cat.slug);

        return (
          <section key={cat.id} className="space-y-5">
            <div className="flex items-end justify-between border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-slate-900">{cat.name}</h2>
                  {cat.slug === 'limited' && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-extrabold text-rose-600">
                      <Sparkles className="h-3 w-3" />
                      LIMITED
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{cat.description}</p>
              </div>
              <Link
                href={`/categories/${cat.slug}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-cnu-navy hover:underline"
              >
                <span>{cat.name} 전체보기</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {catProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center text-sm text-slate-500">
                현재 등록된 상품이 없습니다.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {catProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
