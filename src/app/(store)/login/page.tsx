'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Lock, Mail, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';
import { useStore } from '@/hooks/useStore';

export default function LoginPage() {
  const router = useRouter();
  const { login, resetPasswordRequest } = useStore();

  const [email, setEmail] = useState('chacha.fan@o.cnu.ac.kr');
  const [password, setPassword] = useState('cnu1234!');
  const [mode, setMode] = useState<'login' | 'reset'>('login');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!email.trim() || !email.includes('@')) {
      setFeedback({ type: 'error', text: '올바른 이메일 주소를 입력해주세요.' });
      return;
    }

    if (mode === 'reset') {
      const res = resetPasswordRequest(email);
      setFeedback({ type: res.success ? 'success' : 'error', text: res.message });
      return;
    }

    if (!password || password.length < 4) {
      setFeedback({ type: 'error', text: '비밀번호를 4자 이상 입력해주세요.' });
      return;
    }

    const res = login(email, password, false);
    if (res.success) {
      router.push('/mypage');
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleDemoQuickLogin = (demoEmail: string) => {
    const res = login(demoEmail, 'demo1234', false);
    if (res.success) {
      router.push('/mypage');
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cnu-navy text-white font-black text-xl">
            C
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            {mode === 'login' ? '차차 스토어 회원 로그인' : '비밀번호 재설정'}
          </h1>
          <p className="text-xs text-slate-500">
            {mode === 'login'
              ? '충남대학교 차차 공식 굿즈 쇼핑몰에 오신 것을 환영합니다.'
              : '가입하신 이메일 주소를 입력하시면 재설정 안내 링크를 보내드립니다.'}
          </p>
        </div>

        {feedback && (
          <div
            className={`flex items-center gap-2 rounded-2xl p-3.5 text-xs font-bold ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            )}
            <span>{feedback.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="block text-xs font-bold text-slate-700">
              이메일 주소
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@o.cnu.ac.kr"
                className="input-base pl-10"
              />
            </div>
          </div>

          {mode === 'login' && (
            <div className="space-y-1.5">
              <label htmlFor="login-password" className="block text-xs font-bold text-slate-700">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호 입력"
                  className="input-base pl-10"
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary w-full py-3 text-sm font-extrabold">
            {mode === 'login' ? '로그인하기' : '비밀번호 재설정 링크 발송'}
          </button>
        </form>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          {mode === 'login' ? (
            <button
              type="button"
              onClick={() => {
                setMode('reset');
                setFeedback(null);
              }}
              className="hover:text-cnu-navy underline"
            >
              비밀번호를 잊으셨나요?
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setFeedback(null);
              }}
              className="hover:text-cnu-navy underline"
            >
              로그인 화면으로 돌아가기
            </button>
          )}
          <Link href="/signup" className="font-bold text-cnu-navy hover:underline">
            신규 회원가입 →
          </Link>
        </div>

        {/* Demo Quick Login Box */}
        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-2.5">
          <p className="text-xs font-extrabold text-cnu-navy flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-sky-500" />
            빠른 테스트 계정 로그인 (Supabase Auth 연동 지원)
          </p>
          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => handleDemoQuickLogin('chacha.fan@o.cnu.ac.kr')}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-sky-50"
            >
              <span className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-cnu-navy" />
                일반 학생회원 (김충남)
              </span>
              <span className="text-[11px] text-slate-400">chacha.fan@o.cnu.ac.kr</span>
            </button>
            <Link
              href="/admin/login"
              className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/70 px-3 py-2 text-xs font-bold text-amber-900 hover:bg-amber-100"
            >
              <span>관리자 전용 로그인 페이지 이동</span>
              <span>/admin/login →</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
