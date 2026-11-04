'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Package,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  LogOut,
  ChevronRight,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { formatKRW, formatKSTDate } from '@/lib/utils';

export default function MyPage() {
  const { currentUser, orders, updateProfile, logout, updateOrderStatus } = useStore();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [address, setAddress] = useState('');
  const [addressDetail, setAddressDetail] = useState('');
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setPostalCode(currentUser.postal_code || '34134');
      setAddress(currentUser.address || '대전광역시 유성구 대학로 99');
      setAddressDetail(currentUser.address_detail || '');
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-slate-600">
          <User className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-black text-slate-900">로그인이 필요한 서비스입니다</h1>
        <p className="text-sm text-slate-500">
          마이페이지 및 주문 내역 조회를 위해 먼저 로그인해주세요.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link href="/login" className="btn-primary">
            로그인하러 가기
          </Link>
          <Link href="/signup" className="btn-secondary">
            회원가입
          </Link>
        </div>
      </div>
    );
  }

  const myOrders = orders.filter(
    (o) => o.user_id === currentUser.id || o.user_email === currentUser.email
  );

  const selectedOrder = myOrders.find((o) => o.id === selectedOrderId) || myOrders[0] || null;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateProfile({
      name,
      phone,
      postal_code: postalCode,
      address,
      address_detail: addressDetail,
    });
    if (res.success) {
      setSavedNotice(res.message);
      setTimeout(() => setSavedNotice(null), 3000);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl bg-cnu-navy p-8 text-white">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-0.5 text-xs font-bold text-sky-300">
            <span>MY PAGE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">
            안녕하세요, {currentUser.name}님!
          </h1>
          <p className="text-xs text-slate-300">
            가입 이메일: {currentUser.email} · 가입일: {formatKSTDate(currentUser.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {currentUser.role === 'admin' && (
            <Link
              href="/admin/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-slate-950"
            >
              <ShieldCheck className="h-4 w-4" />
              관리자 백오피스 이동
            </Link>
          )}
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 px-4 py-2.5 text-xs font-bold text-white hover:bg-white/20"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: Personal Info Edit */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <User className="h-5 w-5 text-cnu-navy" />
              개인정보 및 기본 배송지 수정
            </h2>

            {savedNotice && (
              <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-800">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{savedNotice}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  이메일 (아이디)
                </label>
                <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2.5 text-sm text-slate-500">
                  <Mail className="h-4 w-4" />
                  <span>{currentUser.email}</span>
                </div>
              </div>

              <div>
                <label htmlFor="mp-name" className="block text-xs font-bold text-slate-700 mb-1">
                  이름
                </label>
                <input
                  id="mp-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-base"
                />
              </div>

              <div>
                <label htmlFor="mp-phone" className="block text-xs font-bold text-slate-700 mb-1">
                  연락처
                </label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="mp-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-base pl-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="mp-zip" className="block text-xs font-bold text-slate-700 mb-1">
                    우편번호
                  </label>
                  <input
                    id="mp-zip"
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="input-base"
                  />
                </div>
                <div className="col-span-2">
                  <label htmlFor="mp-addr" className="block text-xs font-bold text-slate-700 mb-1">
                    기본 주소
                  </label>
                  <input
                    id="mp-addr"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="input-base"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="mp-addr-detail" className="block text-xs font-bold text-slate-700 mb-1">
                  상세 주소 (기숙사 동·호수 / 단과대 호실)
                </label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="mp-addr-detail"
                    type="text"
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    className="input-base pl-10"
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary w-full py-3">
                개인정보 저장하기
              </button>
            </form>
          </div>
        </div>

        {/* Right: Order History & Order Detail */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Package className="h-5 w-5 text-cnu-navy" />
                나의 주문 내역 ({myOrders.length}건)
              </h2>
              <Link href="/mypage/orders" className="text-xs font-bold text-cnu-navy hover:underline">
                주문내역 전체보기 →
              </Link>
            </div>

            {myOrders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 py-14 text-center">
                <p className="text-sm font-bold text-slate-600">아직 주문하신 내역이 없습니다.</p>
                <Link href="/products" className="btn-primary mt-4">
                  첫 굿즈 쇼핑하러 가기
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {myOrders.map((order) => {
                  const isSelected = selectedOrder?.id === order.id;
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrderId(order.id)}
                      className={`cursor-pointer rounded-2xl border p-4 transition-all ${
                        isSelected
                          ? 'border-cnu-navy bg-sky-50/40 ring-1 ring-cnu-navy'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-cnu-navy">
                            {order.order_number}
                          </span>
                          {order.is_test_order && (
                            <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                              테스트결제
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-400">
                          {formatKSTDate(order.created_at, true)}
                        </span>
                      </div>

                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {order.items[0]?.product_name}
                            {order.items.length > 1 ? ` 외 ${order.items.length - 1}건` : ''}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-500">
                            결제금액: <strong className="text-slate-900">{formatKRW(order.total_amount)}</strong> · 결제상태: {order.payment_status}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="rounded-xl bg-cnu-navy px-3 py-1 text-xs font-bold text-white">
                            {order.order_status}
                          </span>
                          <ChevronRight className="h-4 w-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Order Detailed View */}
          {selectedOrder && (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-xs font-bold text-slate-400">선택된 주문 상세 조회</span>
                  <h3 className="text-base font-black text-slate-900">
                    주문번호: {selectedOrder.order_number}
                  </h3>
                </div>
                {(selectedOrder.order_status === '결제 대기' ||
                  selectedOrder.order_status === '결제 완료') && (
                  <button
                    type="button"
                    onClick={() =>
                      updateOrderStatus(
                        selectedOrder.id,
                        '주문 취소',
                        '고객 마이페이지 직접 주문 취소'
                      )
                    }
                    className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                  >
                    주문 취소 요청
                  </button>
                )}
              </div>

              <div className="space-y-2 text-xs text-slate-600">
                <p>
                  <strong>받는 분:</strong> {selectedOrder.shipping_info.recipient_name} (
                  {selectedOrder.shipping_info.recipient_phone})
                </p>
                <p>
                  <strong>배송지:</strong> {selectedOrder.shipping_address}
                </p>
                {selectedOrder.shipping_info.tracking_number && (
                  <p className="text-cnu-blue font-bold">
                    🚚 배송정보: {selectedOrder.shipping_info.courier} (송장번호:{' '}
                    {selectedOrder.shipping_info.tracking_number})
                  </p>
                )}
              </div>

              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                {selectedOrder.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-4 py-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{item.product_name}</p>
                      <p className="text-slate-500">
                        {item.option_text} · 단가 {formatKRW(item.price)} × {item.quantity}개
                      </p>
                    </div>
                    <span className="font-black text-slate-900">
                      {formatKRW(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-slate-50 p-3.5 text-xs space-y-1.5">
                <p className="font-bold text-slate-700 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-cnu-navy" /> 주문 상태 변경 이력
                </p>
                {selectedOrder.status_history.map((h) => (
                  <div key={h.id} className="flex items-center justify-between text-slate-600">
                    <span>
                      [{h.new_status}] {h.note} ({h.changed_by})
                    </span>
                    <span className="text-slate-400">{formatKSTDate(h.created_at, true)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
