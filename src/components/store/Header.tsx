'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ShoppingBag,
  User,
  Menu,
  X,
  Sparkles,
  ShieldCheck,
  LogOut,
  Search,
  Wand2,
  Edit3,
  Heart,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';

const NAV_ITEMS = [
  { label: 'HOME', href: '/' },
  { label: 'SHOP', href: '/products' },
  { label: 'BEST', href: '/products?sort=popular' },
  { label: 'NEW', href: '/products?sort=newest' },
  { label: 'LIMITED', href: '/categories/limited', highlight: true },
  { label: 'VR 피팅룸', href: '/fitting', special: true },
];

export function Header() {
  const pathname = usePathname();
  const {
    cart,
    wishlist,
    currentUser,
    logout,
    setCartDrawerOpen,
    setCommissionModalOpen,
  } = useStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      {/* Top Announcement Bar */}
      <div className="bg-cnu-navy px-4 py-1.5 text-center text-xs font-medium text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="hidden sm:inline text-sky-200">
            충남대학교 공식 마스코트 &lsquo;차차(CHA CHA)&rsquo; 굿즈 스토어 & 가상 전시관
          </span>
          <span className="mx-auto sm:mx-0">
            🎓 학내 학생회관 픽업 무료 / 30,000원 이상 구매 시 전국 무료배송!
          </span>
          <div className="hidden md:flex items-center gap-3 text-slate-200">
            <Link href="/fitting" className="text-sky-300 hover:underline font-semibold">
              VR 옷입히기
            </Link>
            <span>·</span>
            <button
              type="button"
              onClick={() => setCommissionModalOpen(true)}
              className="hover:text-white font-semibold"
            >
              제작·리폼 의뢰
            </button>
            <span>·</span>
            <Link href="/admin/dashboard" className="text-amber-300 hover:underline font-semibold">
              관리자 센터
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo with ChaCha Head Mascot */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 border border-slate-200 p-1 shadow-xs transition-transform group-hover:scale-105">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/chacha/logo_head.png"
              alt="CNU ChaCha"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-extrabold tracking-tight text-cnu-navy sm:text-lg leading-none">
              CHA CHA STORE
            </span>
            <span className="mt-0.5 text-[10px] font-semibold tracking-wider text-slate-400">
              CNU OFFICIAL GOODS
            </span>
          </div>
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href.split('?')[0]);

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`relative inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs lg:text-sm font-bold transition-colors ${
                  item.highlight
                    ? 'text-rose-600 hover:bg-rose-50'
                    : item.special
                    ? 'bg-sky-50 text-cnu-blue border border-sky-200 hover:bg-sky-100'
                    : isActive
                    ? 'bg-slate-100 text-cnu-navy'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-cnu-navy'
                }`}
              >
                {item.highlight && <Sparkles className="h-3.5 w-3.5 text-rose-500" />}
                {item.special && <Wand2 className="h-3.5 w-3.5 text-cnu-blue" />}
                {item.label}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => setCommissionModalOpen(true)}
            className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs lg:text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-cnu-navy transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5 text-cnu-navy" />
            <span>제작 의뢰</span>
          </button>
        </nav>

        {/* Right Actions: Search, Wishlist, Login/Mypage, Cart Drawer */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/products"
            aria-label="상품 검색"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 hover:text-cnu-navy"
          >
            <Search className="h-5 w-5" />
          </Link>

          <Link
            href="/products?wishlist=true"
            title="찜한 위시리스트"
            className="relative hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 hover:bg-rose-50 hover:text-rose-600"
          >
            <Heart className="h-5 w-5" />
            {wishlist.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                {wishlist.length}
              </span>
            )}
          </Link>

          {currentUser ? (
            <div className="hidden sm:flex items-center gap-1.5">
              {currentUser.role === 'admin' && (
                <Link
                  href="/admin/dashboard"
                  className="inline-flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 border border-amber-200 hover:bg-amber-100"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  관리자
                </Link>
              )}
              <Link
                href="/mypage"
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <User className="h-4 w-4 text-cnu-navy" />
                <span>{currentUser.name}님</span>
              </Link>
              <button
                type="button"
                onClick={logout}
                title="로그아웃"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-rose-600"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <User className="h-4 w-4 text-cnu-navy" />
              로그인
            </Link>
          )}

          <button
            type="button"
            onClick={() => setCartDrawerOpen(true)}
            className="relative inline-flex items-center gap-1.5 rounded-xl bg-cnu-navy px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-900 transition-colors"
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">장바구니</span>
            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-sky-400 px-1.5 text-xs font-extrabold text-slate-950">
              {totalCartCount}
            </span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 md:hidden"
            aria-label="메뉴 열기"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
              >
                <span>{item.label}</span>
                {item.highlight && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-600">
                    시즌한정
                  </span>
                )}
                {item.special && (
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-extrabold text-cnu-blue">
                    VR 피팅
                  </span>
                )}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setCommissionModalOpen(true);
              }}
              className="flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-bold text-cnu-navy hover:bg-slate-50"
            >
              <span>🧵 맞춤 제작 / 과잠 리폼 의뢰</span>
              <span className="rounded-full bg-cnu-navy/10 px-2 py-0.5 text-[10px] font-extrabold text-cnu-navy">
                상담접수
              </span>
            </button>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <p className="px-3 text-xs font-semibold text-slate-400 uppercase mb-2">
              카테고리 바로가기
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/categories/apparel"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                🧥 의류
              </Link>
              <Link
                href="/categories/stationery"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                📝 문구
              </Link>
              <Link
                href="/categories/accessories"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
              >
                🎒 잡화
              </Link>
              <Link
                href="/categories/limited"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700"
              >
                ✨ 한정판
              </Link>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4 flex items-center justify-between gap-2">
            {currentUser ? (
              <>
                <Link
                  href="/mypage"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-secondary flex-1 text-center"
                >
                  마이페이지 ({currentUser.name})
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="btn-secondary text-rose-600"
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary flex-1"
                >
                  로그인
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-secondary flex-1"
                >
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
