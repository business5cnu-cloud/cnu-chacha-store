'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Sparkles } from 'lucide-react';
import { useStore } from '@/hooks/useStore';

const COMMISSION_TYPES = [
  '폐과잠 리폼 에코백 제작',
  '차차 인형용 과잠/의상 맞춤 제작',
  '동아리/소모임 커스텀 굿즈 제작',
  '기타 친환경 의류 업사이클링',
];

export function CommissionModal() {
  const {
    isCommissionModalOpen,
    setCommissionModalOpen,
    createCommission,
    currentUser,
  } = useStore();

  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [itemType, setItemType] = useState(COMMISSION_TYPES[0]);
  const [details, setDetails] = useState('');
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);

  if (!isCommissionModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = createCommission({
      customer_name: customerName,
      phone,
      email,
      item_type: itemType,
      details,
    });

    if (res.success) {
      setSubmittedMsg(res.message);
      setDetails('');
      setTimeout(() => {
        setSubmittedMsg(null);
        setCommissionModalOpen(false);
      }, 2200);
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl bg-white p-6 sm:p-7 shadow-2xl">
        <button
          type="button"
          onClick={() => setCommissionModalOpen(false)}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/chacha/mascot_commission.png"
            alt="차차 제작 의뢰"
            className="h-12 w-auto object-contain"
          />
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-cnu-navy/10 px-2.5 py-0.5 text-[10px] font-extrabold text-cnu-navy">
              <Sparkles className="h-3 w-3" /> CUSTOM & UPCYCLING
            </span>
            <h3 className="mt-0.5 text-lg font-black text-cnu-navy">
              차차 굿즈 맞춤 제작 의뢰
            </h3>
          </div>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed mb-5">
          원하는 학과/동아리 커스텀 굿즈 디자인이나 헌 과잠 업사이클링 리폼 의뢰를 접수해 주시면 담당 학생 디자이너가 상담을 도와드립니다.
        </p>

        {submittedMsg ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-2">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <p className="text-sm font-black text-emerald-950">의뢰 접수 완료!</p>
            <p className="text-xs text-emerald-800 leading-relaxed">{submittedMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                성명 (또는 학과/학번) *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="예: 김충남 (컴퓨터융합학부 21)"
                className="input-base text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  연락처 *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="input-base text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  이메일 *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@o.cnu.ac.kr"
                  className="input-base text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                희망 제작 품목 *
              </label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
                className="input-base text-xs font-bold"
              >
                {COMMISSION_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                요청사항 및 상세 설명 *
              </label>
              <textarea
                rows={4}
                required
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="제작하고 싶은 디자인, 수량, 과잠 자수 문구 등을 자유롭게 적어주세요."
                className="input-base text-xs"
              />
            </div>

            <button type="submit" className="btn-primary w-full py-3.5 text-xs font-extrabold">
              제작 의뢰서 제출하기
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
