'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  Eye,
  EyeOff,
  ShoppingBag,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { formatKRW, formatKSTDate } from '@/lib/utils';
import { isValidOrderForAnalytics } from '@/lib/utils/sales-analytics';

function maskEmail(email: string, unmasked: boolean): string {
  if (unmasked) return email;
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const visible = local.slice(0, 2);
  return `${visible}***@${domain}`;
}

function maskPhone(phone: string | undefined, unmasked: boolean): string {
  if (!phone) return '-';
  if (unmasked) return phone;
  return phone.replace(/(\d{3})-?(\d{2,4})-?(\d{4})/, '$1-****-$3');
}

export default function AdminCustomersPage() {
  const { profiles, orders } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showUnmaskedPII, setShowUnmaskedPII] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>(
    profiles.find((p) => p.role === 'customer')?.id || profiles[0]?.id || ''
  );

  const customerStats = profiles.map((profile) => {
    const userOrders = orders.filter(
      (o) => o.user_id === profile.id || o.user_email === profile.email
    );
    const validOrders = userOrders.filter(isValidOrderForAnalytics);
    const totalSpent = validOrders.reduce((sum, o) => sum + o.total_amount, 0);
    const purchaseCount = validOrders.length;
    const latestOrder = [...validOrders].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    return {
      profile,
      allOrders: userOrders,
      totalSpent,
      purchaseCount,
      lastPurchaseDate: latestOrder ? latestOrder.created_at : null,
    };
  });

  const filteredCustomers = customerStats.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      item.profile.name.toLowerCase().includes(q) ||
      item.profile.email.toLowerCase().includes(q)
    );
  });

  const selectedCustomer =
    filteredCustomers.find((c) => c.profile.id === selectedUserId) ||
    filteredCustomers[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">고객 관리</h1>
          <p className="mt-1 text-xs text-slate-500">
            회원 목록 조회, 회원 검색, 회원별 주문 내역, 누적 구매 금액, 구매 횟수 및 최근 구매일을 확인합니다.
          </p>
        </div>

        {/* Privacy Protection Masking Toggle */}
        <button
          type="button"
          onClick={() => setShowUnmaskedPII(!showUnmaskedPII)}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs font-extrabold transition-colors ${
            showUnmaskedPII
              ? 'border-amber-300 bg-amber-50 text-amber-900'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          {showUnmaskedPII ? (
            <>
              <EyeOff className="h-4 w-4 text-amber-600" />
              <span>개인정보 마스킹 적용하기 (보호 권장)</span>
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 text-cnu-navy" />
              <span>관리자 권한 상세 개인정보 열람</span>
            </>
          )}
        </button>
      </div>

      {/* Security Notice */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 flex items-center gap-2.5 shadow-sm">
        <ShieldCheck className="h-4 w-4 text-cnu-navy shrink-0" />
        <span>
          개인정보 보호 정책에 따라 기본 화면에서는 연락처 및 이메일 일부가 마스킹(*) 처리되어 불필요한 노출을 방지합니다.
        </span>
      </div>

      {/* Search Input */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="회원 이름 또는 이메일로 검색..."
            className="input-base pl-10 text-xs"
          />
        </div>
      </div>

      {/* Master-Detail Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left: Member List */}
        <div className="lg:col-span-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <Users className="h-4 w-4 text-cnu-navy" />
              전체 회원 목록 ({filteredCustomers.length}명)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                  <th className="px-4 py-3 font-bold">회원명 / 이메일</th>
                  <th className="px-4 py-3 font-bold">연락처</th>
                  <th className="px-4 py-3 font-bold text-right">구매 횟수</th>
                  <th className="px-4 py-3 font-bold text-right">누적 구매 금액</th>
                  <th className="px-4 py-3 font-bold text-right">최근 구매일</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((item) => {
                  const active = selectedCustomer?.profile.id === item.profile.id;
                  return (
                    <tr
                      key={item.profile.id}
                      onClick={() => setSelectedUserId(item.profile.id)}
                      className={`cursor-pointer transition-colors ${
                        active ? 'bg-sky-50/80' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-slate-900 text-sm">
                            {item.profile.name}
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                              item.profile.role === 'admin'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.profile.role === 'admin' ? '관리자' : '일반회원'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {maskEmail(item.profile.email, showUnmaskedPII)}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {maskPhone(item.profile.phone, showUnmaskedPII)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                        {item.purchaseCount}회
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-cnu-navy">
                        {formatKRW(item.totalSpent)}
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-500">
                        {item.lastPurchaseDate
                          ? formatKSTDate(item.lastPurchaseDate)
                          : '구매 이력 없음'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Selected Member Order History */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          {selectedCustomer ? (
            <>
              <div className="border-b border-slate-200 pb-4">
                <span className="text-xs font-bold text-slate-400">회원 상세 구매 프로필</span>
                <h3 className="text-lg font-black text-slate-900 mt-0.5">
                  {selectedCustomer.profile.name}님 ({maskEmail(selectedCustomer.profile.email, showUnmaskedPII)})
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  가입일: {formatKSTDate(selectedCustomer.profile.created_at)} · 기본 배송지:{' '}
                  {showUnmaskedPII
                    ? `${selectedCustomer.profile.address || ''} ${selectedCustomer.profile.address_detail || ''}`
                    : `${selectedCustomer.profile.address || '대전광역시 유성구'} (상세주소 보호됨)`}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500">실결제 횟수</p>
                  <p className="mt-1 text-base font-black text-slate-900">
                    {selectedCustomer.purchaseCount}회
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500">누적 구매액</p>
                  <p className="mt-1 text-base font-black text-cnu-navy">
                    {formatKRW(selectedCustomer.totalSpent)}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[11px] text-slate-500">최근 구매일</p>
                  <p className="mt-1 text-xs font-bold text-slate-800">
                    {selectedCustomer.lastPurchaseDate
                      ? formatKSTDate(selectedCustomer.lastPurchaseDate)
                      : '-'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4 text-cnu-navy" />
                  회원별 주문 내역 ({selectedCustomer.allOrders.length}건)
                </h4>

                {selectedCustomer.allOrders.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                    주문 내역이 없습니다.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                    {selectedCustomer.allOrders.map((ord) => (
                      <div
                        key={ord.id}
                        className="rounded-2xl border border-slate-200 p-3.5 text-xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-black text-cnu-navy">
                            {ord.order_number}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                              ord.order_status === '주문 취소' ||
                              ord.order_status === '환불 완료'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-sky-100 text-cnu-navy'
                            }`}
                          >
                            {ord.order_status}
                          </span>
                        </div>
                        <p className="font-semibold text-slate-800">
                          {ord.items.map((i) => `${i.product_name}(${i.quantity}개)`).join(', ')}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span>{formatKSTDate(ord.created_at, true)}</span>
                          <span className="font-black text-slate-900">
                            {formatKRW(ord.total_amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400">
              회원을 선택해주세요.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
