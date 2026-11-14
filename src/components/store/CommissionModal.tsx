'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, Sparkles, Recycle, Scissors } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { CommissionTrack } from '@/types';
import { formatKRW } from '@/lib/utils';

interface UpcyclingTemplate {
  id: string;
  name: string;
  spec: string;
  price: number;
  leadTime: string;
}

const UPCYCLING_TEMPLATES: UpcyclingTemplate[] = [
  {
    id: 'ecobag',
    name: '차차 데일리 에코백 (표준형)',
    spec: '36×40cm · 안감 보강 + 차차 자수 와펜 기본 포함',
    price: 18000,
    leadTime: '약 7일',
  },
  {
    id: 'pouch-set',
    name: '차차 멀티 파우치 2종 세트',
    spec: '지퍼 파우치 + 카드홀더 표준 패턴 재단',
    price: 15000,
    leadTime: '약 5일',
  },
  {
    id: 'doll-varsity',
    name: '25cm 인형용 미니 과잠',
    spec: '차차 봉제인형 전용 표준 치수 · 자수 이식',
    price: 16000,
    leadTime: '약 7일',
  },
];

const UPCYCLING_MATERIALS = [
  '폐과잠 / 학잠 (야구점퍼)',
  '헌 후드티 / 맨투맨',
  '기타 면 / 데님 의류',
];

const REFORM_TYPES = [
  '1:1 맞춤 의류·소품 리폼',
  '차차 인형용 커스텀 의상 제작',
  '동아리/학과 단체 커스텀 굿즈 제작',
  '기타 개별 맞춤 제작',
];

export function CommissionModal() {
  const {
    isCommissionModalOpen,
    setCommissionModalOpen,
    createCommission,
    currentUser,
  } = useStore();

  const [track, setTrack] = useState<CommissionTrack>('upcycling');
  const [customerName, setCustomerName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState(UPCYCLING_TEMPLATES[0].id);
  const [sourceMaterial, setSourceMaterial] = useState(UPCYCLING_MATERIALS[0]);
  const [reformType, setReformType] = useState(REFORM_TYPES[0]);
  const [details, setDetails] = useState('');
  const [submittedMsg, setSubmittedMsg] = useState<string | null>(null);

  if (!isCommissionModalOpen) return null;

  const selectedTemplate =
    UPCYCLING_TEMPLATES.find((t) => t.id === selectedTemplateId) || UPCYCLING_TEMPLATES[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const res =
      track === 'upcycling'
        ? createCommission({
            track: 'upcycling',
            customer_name: customerName,
            phone,
            email,
            item_type: selectedTemplate.name,
            standard_template: selectedTemplate.name,
            source_material: sourceMaterial,
            estimated_price: selectedTemplate.price,
            details,
          })
        : createCommission({
            track: 'reform',
            customer_name: customerName,
            phone,
            email,
            item_type: reformType,
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
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 sm:p-7 shadow-2xl">
        <button
          type="button"
          onClick={() => setCommissionModalOpen(false)}
          className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
          aria-label="닫기"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/chacha/mascot_commission.png"
            alt="차차 제작 의뢰"
            className="h-12 w-auto object-contain"
          />
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-cnu-navy/10 px-2.5 py-0.5 text-[10px] font-extrabold text-cnu-navy">
              <Sparkles className="h-3 w-3" /> UPCYCLING & CUSTOM REFORM
            </span>
            <h3 className="mt-0.5 text-lg font-black text-cnu-navy">
              업사이클링 · 맞춤 리폼 의뢰
            </h3>
          </div>
        </div>

        {/* Track Selector */}
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1.5 mb-4">
          <button
            type="button"
            onClick={() => setTrack('upcycling')}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-extrabold transition-all ${
              track === 'upcycling'
                ? 'bg-white text-emerald-800 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Recycle className="h-3.5 w-3.5" />
            <span>표준 업사이클링</span>
          </button>
          <button
            type="button"
            onClick={() => setTrack('reform')}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-extrabold transition-all ${
              track === 'reform'
                ? 'bg-white text-cnu-navy shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scissors className="h-3.5 w-3.5" />
            <span>맞춤 리폼 · 커스텀</span>
          </button>
        </div>

        <div
          className={`mb-5 rounded-2xl border p-3 text-[11px] leading-relaxed ${
            track === 'upcycling'
              ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950'
              : 'border-sky-200 bg-sky-50/70 text-sky-950'
          }`}
        >
          {track === 'upcycling' ? (
            <p>
              <strong>공급자 표준 공정:</strong> 보내주신 헌 과잠·의류를 정해진 패턴과 단가로 재가공합니다. 원단 색상과 패치 위치에는 개체별 차이가 있습니다.
            </p>
          ) : (
            <p>
              <strong>1:1 주문 맞춤 제작:</strong> 요청하신 디자인·치수·수량 사양에 맞춰 개별 제작합니다. 접수 후 담당 학생 디자이너가 상담 및 견적을 안내해 드립니다.
            </p>
          )}
        </div>

        {submittedMsg ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center space-y-2">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
            <p className="text-sm font-black text-emerald-950">접수 완료!</p>
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

            {track === 'upcycling' ? (
              <>
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    표준 결과물 선택 (고정 규격 · 정찰제) *
                  </label>
                  <div className="space-y-2">
                    {UPCYCLING_TEMPLATES.map((tpl) => {
                      const isSelected = tpl.id === selectedTemplateId;
                      return (
                        <button
                          key={tpl.id}
                          type="button"
                          onClick={() => setSelectedTemplateId(tpl.id)}
                          className={`w-full rounded-2xl border p-3 text-left transition-all ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-slate-900">{tpl.name}</span>
                            <span className="shrink-0 font-black text-emerald-700">
                              {formatKRW(tpl.price)} · {tpl.leadTime}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">{tpl.spec}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    보내실 원재료 (수거 의류) *
                  </label>
                  <select
                    value={sourceMaterial}
                    onChange={(e) => setSourceMaterial(e.target.value)}
                    className="input-base text-xs font-bold"
                  >
                    {UPCYCLING_MATERIALS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    원재료 참고 메모 (선택)
                  </label>
                  <textarea
                    rows={2}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="예: 등판 학과 자수 살려주세요 / 소매 부분 약간의 사용감 있음"
                    className="input-base text-xs"
                  />
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    맞춤 제작 · 리폼 분야 *
                  </label>
                  <select
                    value={reformType}
                    onChange={(e) => setReformType(e.target.value)}
                    className="input-base text-xs font-bold"
                  >
                    {REFORM_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    요청사항 및 상세 사양 *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="원하시는 디자인, 치수, 수량, 자수 문구 등 주문 제작 사양을 구체적으로 적어주세요."
                    className="input-base text-xs"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              className={`w-full rounded-2xl py-3.5 text-xs font-extrabold text-white transition-colors ${
                track === 'upcycling'
                  ? 'bg-emerald-700 hover:bg-emerald-800'
                  : 'bg-cnu-navy hover:bg-slate-900'
              }`}
            >
              {track === 'upcycling'
                ? `${selectedTemplate.name} (${formatKRW(selectedTemplate.price)}) 신청하기`
                : '맞춤 제작 · 리폼 의뢰서 제출하기'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
