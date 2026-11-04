'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, Phone, AlertTriangle } from 'lucide-react';
import { useStore } from '@/hooks/useStore';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError('이름을 2자 이상 입력해주세요.');
      return;
    }
    if (!email.includes('@')) {
      setError('유효한 이메일 주소를 입력해주세요.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호와 비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    const res = signup(name, email, password, phone);
    if (res.success) {
      router.push('/mypage');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-cnu-navy text-white font-black text-xl">
            C
          </div>
          <h1 className="text-2xl font-black text-slate-900">차차 스토어 회원가입</h1>
          <p className="text-xs text-slate-500">
            충남대학교 구성원 및 차차 팬 누구나 무료로 가입할 수 있습니다.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-bold text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="signup-name" className="block text-xs font-bold text-slate-700">
              이름 (실명)
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="signup-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="input-base pl-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-email" className="block text-xs font-bold text-slate-700">
              이메일 주소
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="signup-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@o.cnu.ac.kr"
                className="input-base pl-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-phone" className="block text-xs font-bold text-slate-700">
              휴대폰 번호
            </label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="signup-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-1234-5678"
                className="input-base pl-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-password" className="block text-xs font-bold text-slate-700">
              비밀번호 (6자 이상)
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="signup-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className="input-base pl-10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="signup-password-confirm" className="block text-xs font-bold text-slate-700">
              비밀번호 확인
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="signup-password-confirm"
                type="password"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                placeholder="비밀번호 재입력"
                className="input-base pl-10"
              />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3 text-sm font-extrabold">
            회원가입 완료하기
          </button>
        </form>

        <p className="text-center text-xs text-slate-500">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="font-bold text-cnu-navy hover:underline">
            로그인하기
          </Link>
        </p>
      </div>
    </div>
  );
}
