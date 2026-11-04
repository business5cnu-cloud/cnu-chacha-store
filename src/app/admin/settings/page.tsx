'use client';

import React from 'react';
import { Settings, Database, CreditCard, ShieldCheck, Globe } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase/client';

export default function AdminSettingsPage() {
  const supabaseReady = isSupabaseConfigured();
  const tossReady = Boolean(
    process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY &&
      process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY.trim() !== ''
  );

  const handleResetDemoData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('cnu_chacha_products_v1');
      localStorage.removeItem('cnu_chacha_orders_v1');
      localStorage.removeItem('cnu_chacha_profiles_v1');
      localStorage.removeItem('cnu_chacha_movements_v1');
      localStorage.removeItem('cnu_chacha_cart_v1');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-black text-slate-900">시스템 설정</h1>
        <p className="mt-1 text-xs text-slate-500">
          CNU CHA CHA STORE 운영 환경, 데이터베이스 연동 상태, 결제 모듈 및 보안 정책 설정을 확인합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-black text-slate-900">
              <Database className="h-4 w-4 text-cnu-navy" /> Supabase PostgreSQL & Storage
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                supabaseReady
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-sky-100 text-cnu-navy'
              }`}
            >
              {supabaseReady ? '클라우드 연결됨' : '로컬 하이브리드 DB 활성'}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            .env.local에 Supabase URL 및 ANON KEY 설정 시 클라우드 DB와 동기화되며, 미설정 시에도 모든 데이터 흐름이 브라우저 영구 스토리지 및 초기 시드 데이터로 100% 동작합니다.
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-2 text-sm font-black text-slate-900">
              <CreditCard className="h-4 w-4 text-cnu-navy" /> 토스페이먼츠 결제 연동
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                tossReady ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-800'
              }`}
            >
              {tossReady ? 'LIVE 모드' : 'TEST 결제 모드'}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            서버 API(/api/payments/confirm)를 통해 결제 금액 위변조 여부를 검증한 후 주문을 승인합니다.
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Globe className="h-4 w-4 text-cnu-navy" /> 기본 스토어 환경 구성
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-slate-400 font-bold">기준 시간대 (Timezone)</p>
            <p className="mt-1 text-sm font-black text-slate-900">Asia/Seoul (KST, UTC+9)</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-slate-400 font-bold">기본 통화 / 언어</p>
            <p className="mt-1 text-sm font-black text-slate-900">KRW (원화) / 한국어 (ko-KR)</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-slate-400 font-bold">관리자 보안 정책</p>
            <p className="mt-1 text-sm font-black text-emerald-700 flex items-center gap-1">
              <ShieldCheck className="h-4 w-4" /> RLS + 서버 권한 검증 적용
            </p>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-800">초기 시드 데이터 복원</p>
            <p className="text-[11px] text-slate-500">
              테스트 중 변경된 상품·주문·재고 데이터를 초기 기본 상태로 되돌립니다.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetDemoData}
            className="btn-secondary text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
          >
            <Settings className="h-3.5 w-3.5 mr-1.5" />
            초기 데이터로 리셋
          </button>
        </div>
      </div>
    </div>
  );
}
