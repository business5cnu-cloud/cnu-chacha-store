'use client';

import React, { useMemo, useState } from 'react';
import {
  Scissors,
  Search,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  Phone,
  Mail,
  Recycle,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { CommissionRequest, CommissionStatus, CommissionTrack } from '@/types';
import { formatKSTDate, formatKRW } from '@/lib/utils';

const STATUS_OPTIONS: CommissionStatus[] = [
  '접수 대기',
  '상담 진행 중',
  '제작 진행 중',
  '제작 완료',
  '취소',
];

const STATUS_BADGE_STYLES: Record<CommissionStatus, string> = {
  '접수 대기': 'bg-amber-50 text-amber-800 border-amber-200',
  '상담 진행 중': 'bg-sky-50 text-sky-700 border-sky-200',
  '제작 진행 중': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  '제작 완료': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '취소': 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function AdminCommissionsPage() {
  const { commissions, updateCommissionStatus } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [trackFilter, setTrackFilter] = useState<'ALL' | CommissionTrack>('ALL');
  const [selectedCommission, setSelectedCommission] =
    useState<CommissionRequest | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [statusDraft, setStatusDraft] = useState<CommissionStatus>('접수 대기');
  const [savedBanner, setSavedBanner] = useState('');

  const filteredCommissions = useMemo(() => {
    return commissions.filter((item) => {
      const itemTrack: CommissionTrack = item.track ?? 'reform';
      if (trackFilter !== 'ALL' && itemTrack !== trackFilter) return false;
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.customer_name.toLowerCase().includes(q) ||
          item.item_type.toLowerCase().includes(q) ||
          item.details.toLowerCase().includes(q) ||
          item.phone.toLowerCase().includes(q) ||
          item.email.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [commissions, searchQuery, statusFilter, trackFilter]);

  const summaryCounts = useMemo(() => {
    return {
      total: commissions.length,
      waiting: commissions.filter((c) => c.status === '접수 대기').length,
      inProgress: commissions.filter(
        (c) => c.status === '상담 진행 중' || c.status === '제작 진행 중'
      ).length,
      completed: commissions.filter((c) => c.status === '제작 완료').length,
    };
  }, [commissions]);

  const handleSelectCommission = (c: CommissionRequest) => {
    setSelectedCommission(c);
    setStatusDraft(c.status);
    setNoteDraft(c.admin_note ?? '');
    setSavedBanner('');
  };

  const handleSaveCommission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommission) return;
    updateCommissionStatus(selectedCommission.id, statusDraft, noteDraft);
    setSelectedCommission({
      ...selectedCommission,
      status: statusDraft,
      admin_note: noteDraft,
    });
    setSavedBanner('의뢰 상태 및 관리자 메모가 저장되었습니다.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-extrabold text-sky-900">
            <Scissors className="h-3.5 w-3.5 text-sky-600" />
            CUSTOM & UPCYCLING COMMISSION
          </span>
          <h1 className="mt-1.5 text-2xl font-black text-slate-900">
            주문제작 · 과잠 리폼 의뢰 관리
          </h1>
          <p className="text-xs text-slate-500">
            학우 및 학과 단위의 커스텀 굿즈 제작 의뢰와 헌 과잠 업사이클링 리폼 신청 내역을 관리합니다.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-xs font-bold text-slate-400">전체 의뢰 건수</p>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {summaryCounts.total}건
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 shadow-xs">
          <p className="text-xs font-bold text-amber-700">신규 접수 대기</p>
          <p className="mt-2 text-2xl font-black text-amber-900">
            {summaryCounts.waiting}건
          </p>
        </div>
        <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-5 shadow-xs">
          <p className="text-xs font-bold text-sky-700">상담 · 제작 진행 중</p>
          <p className="mt-2 text-2xl font-black text-sky-900">
            {summaryCounts.inProgress}건
          </p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-5 shadow-xs">
          <p className="text-xs font-bold text-emerald-700">제작 완료</p>
          <p className="mt-2 text-2xl font-black text-emerald-900">
            {summaryCounts.completed}건
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            {(
              [
                { key: 'ALL', label: '전체 구분' },
                { key: 'upcycling', label: '표준 업사이클링' },
                { key: 'reform', label: '맞춤 리폼' },
              ] as const
            ).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTrackFilter(t.key)}
                className={`rounded-lg px-2.5 py-1 text-[11px] font-extrabold transition-colors ${
                  trackFilter === t.key
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
          {(['ALL', ...STATUS_OPTIONS] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                statusFilter === status
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'ALL' ? '전체 보기' : status}
            </button>
          ))}
          </div>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="신청자명, 품목, 연락처 검색..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-semibold text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Table List */}
        <div className="lg:col-span-7 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-extrabold uppercase text-slate-500">
                  <th className="py-3.5 px-4">신청자 / 연락처</th>
                  <th className="py-3.5 px-4">제작·리폼 품목</th>
                  <th className="py-3.5 px-4">상태</th>
                  <th className="py-3.5 px-4">접수일시</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {filteredCommissions.map((item) => {
                  const isSelected = selectedCommission?.id === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() => handleSelectCommission(item)}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-sky-50/70' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <p className="font-extrabold text-slate-900">
                          {item.customer_name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {item.phone}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                              item.track === 'upcycling'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-sky-50 text-sky-700 border border-sky-200'
                            }`}
                          >
                            {item.track === 'upcycling' ? (
                              <>
                                <Recycle className="h-2.5 w-2.5" /> 표준 업사이클링
                              </>
                            ) : (
                              <>
                                <Scissors className="h-2.5 w-2.5" /> 맞춤 리폼
                              </>
                            )}
                          </span>
                          <p className="font-bold text-slate-800">{item.item_type}</p>
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-500">
                          {item.details}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-extrabold ${
                            STATUS_BADGE_STYLES[item.status]
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-slate-500">
                        {formatKSTDate(item.created_at, true)}
                      </td>
                    </tr>
                  );
                })}
                {filteredCommissions.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-12 text-center text-sm font-bold text-slate-400"
                    >
                      조건에 해당하는 제작 의뢰 내역이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail & Status Update Panel */}
        <div className="lg:col-span-5">
          {selectedCommission ? (
            <form
              onSubmit={handleSaveCommission}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-5"
            >
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[11px] font-bold text-sky-600">
                    의뢰 번호 #{selectedCommission.id}
                  </span>
                  <h2 className="mt-0.5 text-lg font-black text-slate-900">
                    {selectedCommission.item_type}
                  </h2>
                </div>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-extrabold ${
                    STATUS_BADGE_STYLES[selectedCommission.status]
                  }`}
                >
                  {selectedCommission.status}
                </span>
              </div>

              {savedBanner && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {savedBanner}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-xs">
                <div>
                  <p className="text-[11px] font-bold text-slate-400">신청자 / 단체명</p>
                  <p className="mt-0.5 font-extrabold text-slate-900">
                    {selectedCommission.customer_name}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400">접수 일시</p>
                  <p className="mt-0.5 font-extrabold text-slate-900">
                    {formatKSTDate(selectedCommission.created_at, true)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Phone className="h-3.5 w-3.5 text-slate-400" />
                  <span>{selectedCommission.phone}</span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-700">
                  <Mail className="h-3.5 w-3.5 text-slate-400" />
                  <span className="truncate">{selectedCommission.email}</span>
                </div>
              </div>

              {selectedCommission.track === 'upcycling' && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5 text-xs space-y-1">
                  <p className="font-extrabold text-emerald-900">
                    표준 업사이클링 공정 정보
                  </p>
                  <p className="text-emerald-800">
                    표준 결과물: <strong>{selectedCommission.standard_template || selectedCommission.item_type}</strong>
                    {selectedCommission.estimated_price
                      ? ` (${formatKRW(selectedCommission.estimated_price)})`
                      : ''}
                  </p>
                  {selectedCommission.source_material && (
                    <p className="text-emerald-800">
                      수거 원재료: <strong>{selectedCommission.source_material}</strong>
                    </p>
                  )}
                </div>
              )}

              <div>
                <p className="mb-1.5 text-xs font-extrabold text-slate-700">
                  {selectedCommission.track === 'upcycling' ? '원재료 참고 메모' : '상세 요청 내용'}
                </p>
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 text-xs leading-relaxed text-slate-700">
                  {selectedCommission.details}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-extrabold text-slate-700">
                  진행 상태 변경
                </label>
                <select
                  value={statusDraft}
                  onChange={(e) => setStatusDraft(e.target.value as CommissionStatus)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-sky-500 focus:outline-none"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-extrabold text-slate-700">
                  <MessageSquare className="h-3.5 w-3.5 text-sky-600" />
                  관리자 상담 · 제작 메모
                </label>
                <textarea
                  rows={3}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="견적 안내 일자, 시안 컨펌 여부, 원단 수거 일정 등을 기록하세요."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-sky-500 focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-slate-900 py-3 text-xs font-black text-white hover:bg-sky-500 hover:text-slate-950 transition-colors"
              >
                상태 및 메모 저장하기
              </button>
            </form>
          ) : (
            <div className="flex h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center">
              <Sparkles className="h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-extrabold text-slate-700">
                좌측 목록에서 제작 의뢰 건을 선택해주세요
              </p>
              <p className="mt-1 text-xs text-slate-400">
                상세 요청사항 확인 및 진행 상태·상담 메모를 업데이트할 수 있습니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
