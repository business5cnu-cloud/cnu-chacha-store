'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, AlertTriangle, ArrowLeft } from 'lucide-react';
import { useStore } from '@/hooks/useStore';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login } = useStore();

  const [email, setEmail] = useState('admin@cnu.ac.kr');
  const [password, setPassword] = useState('admin1234!');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('관리자 이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    const res = login(email, password, true);
    if (res.success) {
      router.push('/admin/dashboard');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-slate-950 px-4 py-12 text-slate-100">
      <div className="mx-auto w-full max-w-md space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>고객용 쇼핑몰 메인으로 돌아가기</span>
        </Link>

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cnu-navy text-sky-300 border border-sky-400/30 shadow-inner">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <span className="inline-block rounded-full bg-sky-500/10 px-3 py-0.5 text-[11px] font-extrabold text-sky-400">
              ADMIN BACKOFFICE PORTAL
            </span>
            <h1 className="text-2xl font-black text-white">관리자 전용 로그인</h1>
            <p className="text-xs text-slate-400">
              관리자 권한(role: admin)이 부여된 계정만 접근할 수 있습니다.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-500/40 bg-rose-950/60 p-3.5 text-xs font-bold text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="admin-email" className="block text-xs font-bold text-slate-300">
                관리자 이메일
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="admin-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-password" className="block text-xs font-bold text-slate-300">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  id="admin-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-800/80 pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-sky-400 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-sky-500/20 hover:bg-sky-300 transition-colors"
            >
              관리자 인증 및 대시보드 접속
            </button>
          </form>

          {/* Security & Demo Guide */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-xs text-slate-400 space-y-2">
            <p className="font-bold text-slate-200">🔒 보안 및 권한 검증 안내</p>
            <ul className="space-y-1 list-disc list-inside text-[11px]">
              <li>기본 관리자 계정: <strong className="text-sky-300">admin@cnu.ac.kr</strong></li>
              <li>일반 회원 계정(chacha.fan@o.cnu.ac.kr)으로 로그인 시도 시 즉시 차단됩니다.</li>
              <li>Supabase RLS 및 서버 권한 검증 API가 함께 적용되어 있습니다.</li>
            </ul>
            <button
              type="button"
              onClick={() => {
                setEmail('chacha.fan@o.cnu.ac.kr');
                const res = login('chacha.fan@o.cnu.ac.kr', 'test', true);
                if (!res.success) setError(res.message);
              }}
              className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-[11px] font-semibold text-slate-300 hover:bg-slate-800"
            >
              일반 회원 접근 차단 테스트 실행 (chacha.fan@o.cnu.ac.kr)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
