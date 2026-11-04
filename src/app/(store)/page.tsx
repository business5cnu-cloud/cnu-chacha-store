'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ArrowRight,
  Flame,
  Clock,
  Heart,
  Award,
  Truck,
  ShieldCheck,
  Gift,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { ProductCard } from '@/components/store/ProductCard';
import { CategorySlug } from '@/types';

export default function StoreHomePage() {
  const { products, categories } = useStore();
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug | 'all'>('all');

  const activeProducts = products.filter((p) => p.status !== 'hidden');

  // 3. 인기 상품 TOP 5 (판매량 기준 정렬)
  const top5Products = [...activeProducts]
    .sort((a, b) => b.total_sold - a.total_sold)
    .slice(0, 5);

  // 4. 신상품 소개 (등록일 최신순 4개)
  const newArrivals = [...activeProducts]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 4);

  // 5. 시즌 한정 상품 소개
  const limitedProducts = activeProducts.filter((p) => p.is_limited);

  // 6. 카테고리별 상품
  const categoryFiltered =
    selectedCategory === 'all'
      ? activeProducts.slice(0, 8)
      : activeProducts.filter((p) => p.category_slug === selectedCategory);

  // 7. 추천 상품 (캠퍼스 필수 데일리 굿즈)
  const recommendedProducts = activeProducts.filter((p) =>
    ['prod-hoodie', 'prod-tumbler', 'prod-laptop-pouch', 'prod-ecobag'].includes(p.id)
  );

  return (
    <div className="space-y-16 pb-20">
      {/* 1. 차차 캐릭터 메인 배너 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cnu-navy via-blue-950 to-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-sky-300 backdrop-blur-sm border border-white/15">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>CNU CHA CHA OFFICIAL MERCHANDISE STORE</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl lg:leading-[1.15]">
                충남대학교 마스코트
                <br />
                <span className="text-sky-300">&lsquo;차차(CHA CHA)&rsquo;</span>와 함께하는
                <br />
                설레는 캠퍼스 라이프!
              </h1>
              <p className="max-w-xl text-sm sm:text-base text-slate-200 leading-relaxed">
                귀엽고 세련된 캠퍼스 후드티부터 도서관 필수템 텀블러, 그리고 오직 이번 시즌에만 만날 수 있는 리미티드 인형까지! 충남대인을 위한 공식 굿즈 컬렉션을 만나보세요.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 rounded-2xl bg-sky-400 px-7 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-sky-500/20 transition-transform hover:scale-[1.02] hover:bg-sky-300"
                >
                  <span>쇼핑하기</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/categories/limited"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur-sm hover:bg-white/20"
                >
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>시즌 한정판 보러가기</span>
                </Link>
              </div>
            </div>

            {/* Character Placeholder Showcase Card */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md rounded-3xl border border-white/15 bg-white/10 p-6 backdrop-blur-md shadow-2xl">
                <div className="flex flex-col items-center rounded-2xl bg-gradient-to-b from-sky-100 to-white p-8 text-center text-slate-900">
                  <div className="mb-4 flex h-28 w-28 items-center justify-center rounded-full bg-cnu-navy text-5xl shadow-inner ring-4 ring-sky-300">
                    🐾
                  </div>
                  <span className="rounded-full bg-cnu-navy px-3 py-1 text-[11px] font-extrabold text-sky-300">
                    MASCOT PLACEHOLDER
                  </span>
                  <h2 className="mt-3 text-xl font-black text-cnu-navy">
                    충남대학교 마스코트 차차
                  </h2>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                    공식 캐릭터 이미지 등록 전까지 사용되는 플레이스홀더입니다.
                    관리자 상품 관리에서 언제든 실제 이미지를 업로드하여 교체할 수 있습니다.
                  </p>
                  <div className="mt-5 grid w-full grid-cols-3 gap-2 border-t border-slate-200 pt-4 text-xs">
                    <div className="rounded-xl bg-slate-50 p-2">
                      <p className="font-black text-cnu-navy">{activeProducts.length}종</p>
                      <p className="text-[10px] text-slate-500">공식 굿즈</p>
                    </div>
                    <div className="rounded-xl bg-rose-50 p-2">
                      <p className="font-black text-rose-600">{limitedProducts.length}종</p>
                      <p className="text-[10px] text-rose-500">한정판 에디션</p>
                    </div>
                    <div className="rounded-xl bg-sky-50 p-2">
                      <p className="font-black text-sky-700">무료배송</p>
                      <p className="text-[10px] text-sky-600">3만원 이상</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 브랜드 소개 (Brand Story & Benefits) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-center">
            <div className="lg:col-span-5 space-y-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-cnu-blue">
                ABOUT CNU CHA CHA STORE
              </span>
              <h2 className="text-2xl font-black text-cnu-navy sm:text-3xl">
                캠퍼스의 추억과 자부심을 담은
                <br />
                충남대학교 공식 캐릭터 스토어
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                CNU CHA CHA STORE는 충남대학교 재학생, 졸업생, 교직원 그리고 캐릭터 팬들이 일상 속에서 차차를 만날 수 있도록 기획된 공식 굿즈 플랫폼입니다.
              </p>
            </div>
            <div className="lg:col-span-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100">
                <Award className="h-7 w-7 text-cnu-navy mb-2.5" />
                <h3 className="text-sm font-bold text-slate-900">공식 라이선스 굿즈</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  엄선된 소재와 퀄리티로 제작된 충남대학교 차차 정품 굿즈만을 선보입니다.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100">
                <Gift className="h-7 w-7 text-rose-600 mb-2.5" />
                <h3 className="text-sm font-bold text-slate-900">시즌 한정 에디션</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  입학·졸업·대동제 시즌마다 한정 수량으로 출시되는 스페셜 라인업을 만나보세요.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-5 border border-slate-100">
                <Truck className="h-7 w-7 text-sky-600 mb-2.5" />
                <h3 className="text-sm font-bold text-slate-900">빠르고 안전한 배송</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  기숙사, 단과대, 자취방 어디든 3만원 이상 구매 시 무료로 신속하게 배송합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. 인기 상품 TOP 5 */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-600 uppercase">
              <Flame className="h-4 w-4" />
              <span>BEST SELLERS TOP 5</span>
            </div>
            <h2 className="mt-1 text-2xl font-black text-slate-900">
              가장 사랑받는 인기 상품 TOP 5
            </h2>
          </div>
          <Link
            href="/products?sort=popular"
            className="inline-flex items-center gap-1 text-sm font-bold text-cnu-navy hover:underline"
          >
            <span>인기 상품 전체보기</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {top5Products.map((product, index) => (
            <ProductCard key={product.id} product={product} rank={index + 1} />
          ))}
        </div>
      </section>

      {/* 4. 신상품 소개 (NEW ARRIVALS) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-sky-600 uppercase">
              <Clock className="h-4 w-4" />
              <span>NEW ARRIVALS</span>
            </div>
            <h2 className="mt-1 text-2xl font-black text-slate-900">
              새로 출시된 차차 신상품
            </h2>
          </div>
          <Link
            href="/products?sort=newest"
            className="inline-flex items-center gap-1 text-sm font-bold text-cnu-navy hover:underline"
          >
            <span>신상품 더보기</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {newArrivals.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 5. 시즌 한정 상품 소개 (LIMITED EDITION) */}
      <section className="bg-gradient-to-r from-slate-900 via-cnu-navy to-indigo-950 py-14 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/20 px-3 py-1 text-xs font-extrabold text-rose-300 border border-rose-400/30">
                <Sparkles className="h-3.5 w-3.5" />
                LIMITED EDITION
              </span>
              <h2 className="mt-2 text-2xl font-black sm:text-3xl">
                놓치면 다시 없는 시즌 한정판 에디션
              </h2>
              <p className="mt-1 text-sm text-slate-300">
                정해진 판매 기간과 한정 수량으로만 제공되며, 재고 소진 시 즉시 품절됩니다.
              </p>
            </div>
            <Link
              href="/categories/limited"
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-cnu-navy hover:bg-sky-100 self-start sm:self-auto"
            >
              <span>한정판 전용관 이동</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {limitedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* 6. 카테고리별 상품 */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <span className="text-xs font-extrabold text-cnu-blue uppercase">
              BROWSE BY CATEGORY
            </span>
            <h2 className="mt-1 text-2xl font-black text-slate-900">
              카테고리별 차차 굿즈
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-cnu-navy text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              전체
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.slug)}
                className={`rounded-xl px-4 py-2 text-xs font-bold transition-colors ${
                  selectedCategory === cat.slug
                    ? 'bg-cnu-navy text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categoryFiltered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* 7. 추천 상품 (MD's PICK) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-sky-50/80 border border-sky-100 p-6 sm:p-10">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-cnu-navy uppercase">
                <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                <span>MD&apos;S CAMPUS PICK</span>
              </div>
              <h2 className="mt-1 text-2xl font-black text-slate-900">
                신입생 & 재학생 필수 추천 아이템
              </h2>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-1 text-sm font-bold text-cnu-navy hover:underline"
            >
              <span>전체 상품 구경하기</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {recommendedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
