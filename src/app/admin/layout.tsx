'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ShieldAlert, Lock, LogIn } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, isInitialized, login, products } = useStore();

  // /admin/login 페이지는 별도 전체화면으로 렌더링
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!isInitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white text-sm">
        관리자 권한 및 보안 세션을 확인하는 중입니다...
      </div>
    );
  }

  // 관리자 권한 검증: 비로그인 상태이거나 일반 회원(customer)인 경우 접근 차단
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-white">
        <div className="max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl space-y-5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <ShieldAlert className="h-9 w-9" />
          </div>
          <div className="space-y-2">
            <span className="rounded-full bg-rose-500/20 px-3 py-0.5 text-[11px] font-extrabold text-rose-300">
              403 FORBIDDEN - ACCESS DENIED
            </span>
            <h1 className="text-xl font-black">관리자 전용 접근 제한 구역</h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              {currentUser
                ? `현재 로그인된 계정(${currentUser.email})은 일반 회원(customer) 권한이므로 관리자 백오피스에 접근할 수 없습니다.`
                : '관리자 로그인이 필요합니다. 승인된 관리자 계정으로 로그인해주세요.'}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 pt-2">
            <Link
              href="/admin/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-400 px-5 py-3 text-xs font-black text-slate-950 hover:bg-sky-300"
            >
              <Lock className="h-4 w-4" />
              <span>관리자 로그인 페이지로 이동</span>
            </Link>
            <button
              type="button"
              onClick={() => {
                login('admin@cnu.ac.kr', 'admin1234!', true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-5 py-2.5 text-xs font-bold text-sky-300 hover:bg-slate-700"
            >
              <LogIn className="h-4 w-4" />
              <span>데모 총괄관리자(admin@cnu.ac.kr) 즉시 인증</span>
            </button>
            <Link
              href="/"
              className="text-xs font-semibold text-slate-400 hover:text-white pt-1"
            >
              ← 고객용 쇼핑몰 홈으로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const soldOutCount = products.filter((p) => p.stock <= 0 || p.status === 'sold_out').length;

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <AdminSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Admin Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-cnu-navy px-2.5 py-1 text-xs font-extrabold text-white">
              ADMIN
            </span>
            <span className="text-sm font-bold text-slate-700">
              충남대학교 차차 스토어 통합 운영 백오피스
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            {(lowStockCount > 0 || soldOutCount > 0) && (
              <Link
                href="/admin/inventory"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 font-bold text-amber-800 hover:bg-amber-100"
              >
                <span>⚠️ 재고 부족 {lowStockCount}건 / 품절 {soldOutCount}건</span>
              </Link>
            )}
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">{currentUser.name}</span>
              <span className="text-slate-400">({currentUser.email})</span>
            </div>
            <button
              type="button"
              onClick={() => router.push('/admin/settings')}
              className="rounded-lg border border-slate-200 px-2.5 py-1 font-semibold text-slate-600 hover:bg-slate-50"
            >
              설정
            </button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
