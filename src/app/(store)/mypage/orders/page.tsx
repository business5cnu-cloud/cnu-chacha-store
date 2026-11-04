'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Package, Clock } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { formatKRW, formatKSTDate } from '@/lib/utils';

export default function MyOrdersListPage() {
  const { currentUser, orders, updateOrderStatus } = useStore();

  const myOrders = currentUser
    ? orders.filter(
        (o) => o.user_id === currentUser.id || o.user_email === currentUser.email
      )
    : orders;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <Link
            href="/mypage"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-cnu-navy mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            마이페이지로 돌아가기
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            주문 및 배송 조회
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            주문 당시의 상품명, 단가, 결제 상태 및 배송 진행 내역을 확인할 수 있습니다.
          </p>
        </div>
      </div>

      {myOrders.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white py-20 text-center">
          <Package className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <p className="text-base font-bold text-slate-700">주문 내역이 없습니다.</p>
          <Link href="/products" className="btn-primary mt-4">
            쇼핑하러 가기
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {myOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-cnu-navy">
                      {order.order_number}
                    </span>
                    <span className="rounded-xl bg-cnu-navy px-3 py-0.5 text-xs font-bold text-white">
                      {order.order_status}
                    </span>
                    <span className="rounded-xl bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                      결제: {order.payment_status}
                    </span>
                    {order.is_test_order && (
                      <span className="rounded-xl bg-amber-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-800">
                        테스트 결제 모드
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    주문일시: {formatKSTDate(order.created_at, true)} · 결제수단: {order.payment_method}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-400">총 결제 금액</p>
                  <p className="text-xl font-black text-slate-900">
                    {formatKRW(order.total_amount)}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between px-4 py-3 text-xs sm:text-sm"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{item.product_name}</p>
                      <p className="text-xs text-slate-500">
                        {item.option_text} · 주문 당시 단가 {formatKRW(item.price)} × {item.quantity}개
                      </p>
                    </div>
                    <span className="font-black text-slate-900">
                      {formatKRW(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Shipping & History */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs text-slate-600 bg-slate-50 rounded-2xl p-4">
                <div className="space-y-1">
                  <p className="font-bold text-slate-800">배송지 정보</p>
                  <p>수령인: {order.shipping_info.recipient_name} ({order.shipping_info.recipient_phone})</p>
                  <p>주소: {order.shipping_address}</p>
                  {order.shipping_info.tracking_number && (
                    <p className="text-cnu-blue font-bold">
                      택배사: {order.shipping_info.courier} ({order.shipping_info.tracking_number})
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" /> 최근 상태 이력
                  </p>
                  {order.status_history.slice(0, 2).map((h) => (
                    <p key={h.id}>
                      · [{h.new_status}] {h.note} ({formatKSTDate(h.created_at, true)})
                    </p>
                  ))}
                  {(order.order_status === '결제 대기' ||
                    order.order_status === '결제 완료') && (
                    <button
                      type="button"
                      onClick={() =>
                        updateOrderStatus(order.id, '주문 취소', '고객 주문내역 페이지 취소 요청')
                      }
                      className="mt-2 inline-block rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50"
                    >
                      주문 취소하기
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
