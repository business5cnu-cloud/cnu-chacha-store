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
  Gift,
  MessageCircle,
  Camera,
  Edit3,
  Bell,
  Wand2,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { ProductCard } from '@/components/store/ProductCard';
import { CategorySlug } from '@/types';
import { INITIAL_PHOTO_REVIEWS } from '@/lib/supabase/seed-data';
import { formatKSTDate } from '@/lib/utils';

export default function StoreHomePage() {
  const { products, categories, reviews, setCommissionModalOpen } = useStore();
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
    <div className="space-y-14 pb-20">
      {/* 1. 차차 캐릭터 메인 배너 & 가상 전시회 배너 */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1A2648] via-cnu-navy to-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14 space-y-8">
          <div className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold text-sky-300 backdrop-blur-xs border border-white/15">
                <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                <span>CNU CHA CHA OFFICIAL MERCHANDISE & VR EXHIBITION</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl lg:leading-[1.15]">
                충남대학교 마스코트
                <br />
                <span className="text-sky-300">&lsquo;차차(CHA CHA)&rsquo;</span>와 함께하는
                <br />
                설레는 캠퍼스 라이프!
              </h1>
              <p className="max-w-xl text-sm sm:text-base text-slate-200 leading-relaxed">
                귀엽고 세련된 캠퍼스 후드티부터 도서관 필수템 텀블러, VR 가상 옷입히기 피팅룸, 그리고 폐과잠 업사이클링 맞춤 제작까지! 충남대인을 위한 공식 굿즈 플랫폼을 만나보세요.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 rounded-2xl bg-sky-400 px-6 py-3.5 text-sm font-extrabold text-slate-950 shadow-lg shadow-sky-500/20 transition-transform hover:scale-[1.02] hover:bg-sky-300"
                >
                  <span>쇼핑하기</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/fitting"
                  className="inline-flex items-center gap-2 rounded-2xl border border-sky-300/40 bg-white/15 px-5 py-3.5 text-sm font-bold text-white backdrop-blur-xs hover:bg-white/25"
                >
                  <Wand2 className="h-4 w-4 text-sky-300" />
                  <span>VR 가상 피팅룸 입장</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setCommissionModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-5 py-3.5 text-sm font-bold text-white backdrop-blur-xs hover:bg-white/20"
                >
                  <Edit3 className="h-4 w-4 text-amber-300" />
                  <span>맞춤 제작·과잠 리폼 의뢰</span>
                </button>
              </div>
            </div>

            {/* Interactive ChaCha Virtual Exhibition Banner (from clothing-market) */}
            <div className="lg:col-span-6">
              <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-[#1A2648] shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/chacha/hero_exhibition.png"
                  alt="CNU ChaCha Virtual Exhibition"
                  className="w-full h-auto block object-cover"
                />
                {/* Clickable Overlays for "전시관 입장하기" and "VR로 둘러보기" */}
                <Link
                  href="/fitting"
                  title="전시관 입장하기 (VR 가상 옷입히기)"
                  className="absolute left-[5.5%] top-[72%] h-[16%] w-[16%] rounded-lg hover:bg-white/10 transition"
                />
                <Link
                  href="/fitting"
                  title="VR로 둘러보기 (VR 가상 피팅룸)"
                  className="absolute right-[2.5%] top-[78%] h-[14%] w-[18%] rounded-lg hover:bg-white/10 transition"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 카테고리별 차차 굿즈 & 실시간 커뮤니티 사이드바 통합 섹션 */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Left Column (8 cols): Category Filter & Product Grid */}
          <div className="lg:col-span-8 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold text-cnu-blue uppercase">
                  BROWSE BY CATEGORY
                </span>
                <h2 className="mt-0.5 text-2xl font-black text-slate-900">
                  카테고리별 차차 굿즈
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
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
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-colors ${
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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {categoryFiltered.slice(0, 6).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {/* Bottom Banners Row (이달의 인기 굿즈 & 공지사항 from clothing-market) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Link
                href="/products?sort=popular"
                className="flex items-center justify-between rounded-2xl border border-[#DCE5F5] bg-[#EDF2FA] p-5 transition hover:shadow-sm"
              >
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-black text-slate-900">
                    <span>🔥 이달의 인기 굿즈</span>
                    <span className="text-slate-400">&gt;</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    지금 캠퍼스에서 가장 사랑받는 차차 굿즈를 만나보세요!
                  </p>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/chacha/mascot_popular.png"
                  alt="인기 굿즈 차차"
                  className="h-14 w-auto object-contain shrink-0"
                />
              </Link>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between">
                <div className="flex items-center gap-1.5 text-sm font-black text-slate-900 mb-2.5">
                  <Bell className="h-4 w-4 text-cnu-navy" />
                  <span>공지사항</span>
                </div>
                <ul className="space-y-1.5 text-xs text-slate-600">
                  <li className="flex items-center justify-between">
                    <span className="truncate">· 가을 학기 차차 굿즈 정기 재입고 안내</span>
                    <span className="text-[11px] text-slate-400 shrink-0 ml-2">2026.11.01</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <Link href="/fitting" className="truncate hover:text-cnu-navy font-semibold">
                      · 차차 VR 가상 전시회 & 옷입히기 피팅룸 오픈
                    </Link>
                    <span className="text-[11px] text-slate-400 shrink-0 ml-2">2026.10.25</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCommissionModalOpen(true)}
                      className="truncate hover:text-cnu-navy text-left"
                    >
                      · 폐과잠 친환경 업사이클링 리폼 제작 의뢰 안내
                    </button>
                    <span className="text-[11px] text-slate-400 shrink-0 ml-2">2026.10.20</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Real-Time Reviews, Photo Reviews, Commission & Banner */}
          <aside className="lg:col-span-4 space-y-5">
            {/* 1. 실시간 리뷰 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3.5">
                <h3 className="flex items-center gap-1.5 text-sm font-black text-slate-900">
                  <MessageCircle className="h-4 w-4 text-cnu-navy" />
                  <span>실시간 학우 리뷰</span>
                </h3>
                <Link
                  href="/products/prod-custom-doll"
                  className="text-xs font-bold text-slate-400 hover:text-cnu-navy"
                >
                  더보기 &rarr;
                </Link>
              </div>

              <div className="space-y-3 divide-y divide-slate-100">
                {reviews.slice(0, 3).map((rev, idx) => {
                  const badgeColors = ['bg-emerald-600', 'bg-slate-500', 'bg-amber-600'];
                  const shortName = rev.author.slice(0, 2);
                  return (
                    <Link
                      key={rev.id}
                      href={`/products/${rev.product_id}`}
                      className="flex items-center justify-between gap-3 pt-3 first:pt-0 group"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white ${
                            badgeColors[idx % badgeColors.length]
                          }`}
                        >
                          {shortName}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-cnu-navy truncate">
                              {rev.author}
                            </span>
                            <span className="text-[10px] text-cnu-navy">
                              {'★'.repeat(rev.rating)}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {rev.comment}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {formatKSTDate(rev.created_at)}
                          </span>
                        </div>
                      </div>
                      {rev.photo_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={rev.photo_url}
                          alt={rev.product_name}
                          className="h-11 w-11 shrink-0 rounded-xl bg-slate-50 object-contain p-1 border border-slate-100"
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* 2. 포토 후기 (4 Photos Grid) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="flex items-center gap-1.5 text-sm font-black text-slate-900">
                  <Camera className="h-4 w-4 text-cnu-navy" />
                  <span>포토 후기</span>
                </h3>
                <Link
                  href="/products"
                  className="text-xs font-bold text-slate-400 hover:text-cnu-navy"
                >
                  전체보기 &rarr;
                </Link>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {INITIAL_PHOTO_REVIEWS.map((pr) => (
                  <Link
                    key={pr.id}
                    href={`/products/${pr.productId}`}
                    title={`${pr.title} (${pr.author})`}
                    className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50 aspect-square hover:opacity-90 transition"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={pr.imageUrl}
                      alt={pr.title}
                      className="h-full w-full object-cover"
                    />
                  </Link>
                ))}
              </div>
            </div>

            {/* 3. 제작 의뢰하기 (Custom & Upcycling Commission Card) */}
            <div className="relative overflow-hidden rounded-2xl border border-[#E0E8F5] bg-[#F0F4FA] p-5">
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="flex items-center gap-1.5 text-sm font-black text-cnu-navy">
                  <Edit3 className="h-4 w-4" />
                  <span>제작 의뢰하기 (과잠 리폼·커스텀)</span>
                </h4>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-4 pr-14">
                원하는 학과/동아리 굿즈 디자인이나 졸업 과잠 업사이클링 에코백을 의뢰해보세요!
                차차와 함께하는 특별한 굿즈를 제작해드립니다.
              </p>
              <button
                type="button"
                onClick={() => setCommissionModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2B4B8B] px-4 py-2 text-xs font-extrabold text-white shadow-xs hover:bg-cnu-navy transition"
              >
                <span>제작 의뢰하기 &rarr;</span>
              </button>

              {/* Mascot illustration on bottom right */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/chacha/mascot_commission.png"
                alt="차차 제작 의뢰 마스코트"
                className="pointer-events-none absolute -right-1 bottom-1 h-16 w-auto object-contain"
              />
            </div>

            {/* 4. CNU ChaCha with you 배너 */}
            <Link
              href="/fitting"
              className="block overflow-hidden rounded-2xl border border-slate-200 shadow-xs hover:opacity-95 transition"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/images/chacha/banner_with_you.png"
                alt="CNU ChaCha with you"
                className="w-full h-auto object-cover block"
              />
            </Link>
          </aside>
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

      {/* 6. 브랜드 소개 (Brand Story & Benefits) */}
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
                CNU CHA CHA STORE는 충남대학교 재학생, 졸업생, 교직원 그리고 캐릭터 팬들이 일상 속에서 차차를 만날 수 있도록 기획된 공식 굿즈 & 업사이클링 플랫폼입니다.
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
                <h3 className="text-sm font-bold text-slate-900">VR 피팅 & 업사이클링</h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  가상 피팅룸에서 인형 의상을 입혀보고 폐과잠 리폼 굿즈를 맞춤 의뢰할 수 있습니다.
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
