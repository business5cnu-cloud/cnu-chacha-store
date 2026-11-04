'use client';

import React, { useState } from 'react';
import {
  Search,
  Truck,
  CheckCircle2,
  Clock,
  RotateCcw,
  Ban,
  CreditCard,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { formatKRW, formatKSTDate, getKSTDateString } from '@/lib/utils';
import { Order, OrderStatus } from '@/types';

const ORDER_STATUS_LIST: OrderStatus[] = [
  '결제 대기',
  '결제 완료',
  '상품 준비 중',
  '배송 중',
  '배송 완료',
  '주문 취소',
  '환불 완료',
];

export default function AdminOrdersPage() {
  const { orders, updateOrderStatus } = useStore();

  const [orderNumberQuery, setOrderNumberQuery] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [courierInput, setCourierInput] = useState('CJ대한통운');
  const [trackingInput, setTrackingInput] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'all' && order.order_status !== statusFilter) return false;

    if (
      orderNumberQuery.trim() &&
      !order.order_number.toLowerCase().includes(orderNumberQuery.trim().toLowerCase())
    ) {
      return false;
    }

    if (
      customerQuery.trim() &&
      !order.user_name.toLowerCase().includes(customerQuery.trim().toLowerCase()) &&
      !order.user_email.toLowerCase().includes(customerQuery.trim().toLowerCase())
    ) {
      return false;
    }

    if (productQuery.trim()) {
      const q = productQuery.trim().toLowerCase();
      const hasProduct = order.items.some((i) =>
        i.product_name.toLowerCase().includes(q)
      );
      if (!hasProduct) return false;
    }

    const orderDate = getKSTDateString(new Date(order.created_at));
    if (startDate && orderDate < startDate) return false;
    if (endDate && orderDate > endDate) return false;

    return true;
  });

  const selectedOrder: Order | undefined =
    filteredOrders.find((o) => o.id === selectedOrderId) || filteredOrders[0];

  const handleSelectOrder = (ord: Order) => {
    setSelectedOrderId(ord.id);
    setCourierInput(ord.shipping_info.courier || 'CJ대한통운');
    setTrackingInput(ord.shipping_info.tracking_number || '');
    setStatusNote('');
  };

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (!selectedOrder) return;
    const res = updateOrderStatus(
      selectedOrder.id,
      newStatus,
      statusNote || `${newStatus} 처리 완료`,
      courierInput,
      trackingInput
    );
    setNotice(res.message);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleSaveShippingInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    const res = updateOrderStatus(
      selectedOrder.id,
      selectedOrder.order_status === '결제 완료' || selectedOrder.order_status === '상품 준비 중'
        ? '배송 중'
        : selectedOrder.order_status,
      `송장 등록 완료 (${courierInput} ${trackingInput})`,
      courierInput,
      trackingInput
    );
    setNotice(res.message);
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">주문 관리</h1>
          <p className="mt-1 text-xs text-slate-500">
            주문번호·고객명·날짜·상품별 검색과 주문 상태 변경, 배송 송장 입력, 취소·환불 및 변경 이력을 관리합니다.
          </p>
        </div>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Search & Filter Panel */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              주문번호 검색
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={orderNumberQuery}
                onChange={(e) => setOrderNumberQuery(e.target.value)}
                placeholder="CNU-2026..."
                className="input-base pl-8 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              고객명 / 이메일 검색
            </label>
            <input
              type="text"
              value={customerQuery}
              onChange={(e) => setCustomerQuery(e.target.value)}
              placeholder="김충남"
              className="input-base text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              주문 상품명 검색
            </label>
            <input
              type="text"
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="후드티, 인형..."
              className="input-base text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              조회 시작일
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-base text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              조회 종료일
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-base text-xs"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 mb-1">
              주문 상태 필터
            </label>
            <select
              aria-label="주문 상태 필터"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-base text-xs font-bold"
            >
              <option value="all">전체 상태 ({orders.length})</option>
              {ORDER_STATUS_LIST.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Master-Detail Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left: Orders List */}
        <div className="lg:col-span-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 flex items-center justify-between">
            <h2 className="text-sm font-black text-slate-900">
              조회된 주문 목록 ({filteredOrders.length}건)
            </h2>
            <button
              type="button"
              onClick={() => {
                setOrderNumberQuery('');
                setCustomerQuery('');
                setProductQuery('');
                setStartDate('');
                setEndDate('');
                setStatusFilter('all');
              }}
              className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-cnu-navy"
            >
              <RotateCcw className="h-3.5 w-3.5" /> 검색 초기화
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                  <th className="px-4 py-3 font-bold">주문번호 / 일시</th>
                  <th className="px-4 py-3 font-bold">주문자</th>
                  <th className="px-4 py-3 font-bold">주문 상품</th>
                  <th className="px-4 py-3 font-bold text-right">결제금액</th>
                  <th className="px-4 py-3 font-bold text-center">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((ord) => {
                  const active = selectedOrder?.id === ord.id;
                  return (
                    <tr
                      key={ord.id}
                      onClick={() => handleSelectOrder(ord)}
                      className={`cursor-pointer transition-colors ${
                        active ? 'bg-sky-50/80' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="px-4 py-3.5">
                        <span className="font-black text-cnu-navy block">
                          {ord.order_number}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatKSTDate(ord.created_at, true)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-900 block">
                          {ord.user_name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {ord.user_phone}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-700">
                        {ord.items[0]?.product_name}
                        {ord.items.length > 1 ? ` 외 ${ord.items.length - 1}건` : ''}
                      </td>
                      <td className="px-4 py-3.5 text-right font-black text-slate-900">
                        {formatKRW(ord.total_amount)}
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span
                          className={`inline-block rounded-lg px-2.5 py-1 text-[11px] font-bold ${
                            ord.order_status === '주문 취소' ||
                            ord.order_status === '환불 완료'
                              ? 'bg-rose-100 text-rose-700'
                              : ord.order_status === '배송 완료'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-sky-100 text-cnu-navy'
                          }`}
                        >
                          {ord.order_status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Selected Order Detail & Management Panel */}
        <div className="lg:col-span-5 space-y-5">
          {selectedOrder ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <span className="text-xs font-bold text-slate-400">주문 상세 및 처리</span>
                  <h3 className="text-lg font-black text-cnu-navy">
                    {selectedOrder.order_number}
                  </h3>
                  <p className="text-xs text-slate-500">
                    결제상태: <strong>{selectedOrder.payment_status}</strong> ({selectedOrder.payment_method})
                  </p>
                </div>
                <span className="rounded-xl bg-cnu-navy px-3 py-1 text-xs font-extrabold text-white">
                  {selectedOrder.order_status}
                </span>
              </div>

              {/* Customer & Shipping Info */}
              <div className="rounded-2xl bg-slate-50 p-4 text-xs space-y-1.5">
                <p className="font-bold text-slate-800">주문자 및 배송지 정보</p>
                <p>주문자: {selectedOrder.user_name} ({selectedOrder.user_email})</p>
                <p>
                  수령인: {selectedOrder.shipping_info.recipient_name} (
                  {selectedOrder.shipping_info.recipient_phone})
                </p>
                <p>배송지: {selectedOrder.shipping_address}</p>
                {selectedOrder.shipping_info.memo && (
                  <p className="text-slate-500">요청사항: {selectedOrder.shipping_info.memo}</p>
                )}
              </div>

              {/* Order Items Snapshot */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-800">
                  주문 상품 목록 (주문 당시 가격·상품명 보존)
                </p>
                <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                  {selectedOrder.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between px-3.5 py-2.5 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{item.product_name}</p>
                        <p className="text-[11px] text-slate-500">
                          {item.option_text} · {formatKRW(item.price)} × {item.quantity}개
                        </p>
                      </div>
                      <span className="font-black text-slate-900">
                        {formatKRW(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-1 text-sm font-black text-cnu-navy">
                  <span>총 결제 금액</span>
                  <span>{formatKRW(selectedOrder.total_amount)}</span>
                </div>
              </div>

              {/* Status Change Controls */}
              <div className="border-t border-slate-200 pt-4 space-y-3">
                <p className="text-xs font-bold text-slate-800">주문 상태 변경 및 취소/환불 처리</p>
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="상태 변경 사유 메모 입력 (선택)"
                  className="input-base text-xs"
                />
                <div className="grid grid-cols-3 gap-2">
                  {(['결제 완료', '상품 준비 중', '배송 중', '배송 완료'] as OrderStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleStatusChange(st)}
                        className={`rounded-xl border px-2.5 py-2 text-xs font-bold transition-colors ${
                          selectedOrder.order_status === st
                            ? 'border-cnu-navy bg-cnu-navy text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => handleStatusChange('주문 취소')}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100"
                  >
                    <Ban className="h-3.5 w-3.5" /> 주문 취소
                  </button>
                  <button
                    type="button"
                    onClick={() => handleStatusChange('환불 완료')}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-rose-300 bg-rose-600 px-2.5 py-2 text-xs font-bold text-white hover:bg-rose-700"
                  >
                    <CreditCard className="h-3.5 w-3.5" /> 환불 처리
                  </button>
                </div>
              </div>

              {/* Shipping Tracking Input */}
              <form
                onSubmit={handleSaveShippingInfo}
                className="border-t border-slate-200 pt-4 space-y-3"
              >
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Truck className="h-4 w-4 text-cnu-navy" /> 배송 송장 정보 입력
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    value={courierInput}
                    onChange={(e) => setCourierInput(e.target.value)}
                    className="input-base text-xs"
                  >
                    <option value="CJ대한통운">CJ대한통운</option>
                    <option value="우체국택배">우체국택배</option>
                    <option value="한진택배">한진택배</option>
                    <option value="로젠택배">로젠택배</option>
                  </select>
                  <input
                    type="text"
                    value={trackingInput}
                    onChange={(e) => setTrackingInput(e.target.value)}
                    placeholder="운송장 번호 입력"
                    className="input-base col-span-2 text-xs"
                  />
                </div>
                <button type="submit" className="btn-secondary w-full text-xs">
                  배송 송장 저장 및 발송 처리
                </button>
              </form>

              {/* Status Change History */}
              <div className="border-t border-slate-200 pt-4 space-y-2">
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-cnu-navy" /> 주문 상태 변경 이력
                </p>
                <div className="space-y-1.5 max-h-40 overflow-y-auto text-[11px] text-slate-600">
                  {selectedOrder.status_history.map((h) => (
                    <div
                      key={h.id}
                      className="rounded-xl bg-slate-50 px-3 py-2 flex items-center justify-between"
                    >
                      <span>
                        <strong>[{h.new_status}]</strong> {h.note} ({h.changed_by})
                      </span>
                      <span className="text-slate-400">
                        {formatKSTDate(h.created_at, true)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-xs text-slate-500">
              좌측 목록에서 주문을 선택하면 상세 정보와 상태 변경 도구가 표시됩니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
