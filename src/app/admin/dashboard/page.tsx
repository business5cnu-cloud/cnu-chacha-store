'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  ShoppingCart,
  Package,
  AlertTriangle,
  Flame,
  Clock,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { formatKRW, formatKSTDate, getKSTDateString } from '@/lib/utils';
import { ProductArtwork } from '@/components/common/ProductArtwork';
import { DashboardSalesCharts } from '@/components/admin/DashboardSalesCharts';
import { Order } from '@/types';

export function isValidSalesOrder(order: Order): boolean {
  return (
    order.order_status !== '주문 취소' &&
    order.order_status !== '환불 완료' &&
    order.order_status !== '결제 대기' &&
    order.payment_status === '완료'
  );
}

export default function AdminDashboardPage() {
  const { orders, products } = useStore();
  const [excludeTestOrders, setExcludeTestOrders] = useState(false);

  const filteredOrders = excludeTestOrders
    ? orders.filter((o) => !o.is_test_order)
    : orders;

  const validOrders = filteredOrders.filter(isValidSalesOrder);

  const todayKST = getKSTDateString(new Date()); // YYYY-MM-DD
  const currentMonthPrefix = todayKST.slice(0, 7); // YYYY-MM

  // 7-1. 핵심 지표 8종 계산 (실제 주문 상세 기반)
  const totalRevenue = validOrders.reduce((sum, o) => sum + o.total_amount, 0);

  const todayOrders = validOrders.filter(
    (o) => getKSTDateString(new Date(o.created_at)) === todayKST
  );
  const todayRevenue = todayOrders.reduce((sum, o) => sum + o.total_amount, 0);

  const monthOrders = validOrders.filter((o) =>
    getKSTDateString(new Date(o.created_at)).startsWith(currentMonthPrefix)
  );
  const monthRevenue = monthOrders.reduce((sum, o) => sum + o.total_amount, 0);

  const totalOrderCount = validOrders.length;
  const todayOrderCount = todayOrders.length;

  const totalSoldQuantity = validOrders.reduce(
    (sum, o) => sum + o.items.reduce((s, item) => s + item.quantity, 0),
    0
  );

  const registeredProductCount = products.length;
  const soldOutProductCount = products.filter(
    (p) => p.stock <= 0 || p.status === 'sold_out'
  ).length;
  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= 5);

  // 7-3. 인기 상품 TOP 5 (주문 상세 매출 및 누적 판매량 기준 자동 정렬)
  const productSalesMap = new Map<string, { qty: number; rev: number }>();
  for (const ord of validOrders) {
    for (const item of ord.items) {
      const prev = productSalesMap.get(item.product_id) || { qty: 0, rev: 0 };
      productSalesMap.set(item.product_id, {
        qty: prev.qty + item.quantity,
        rev: prev.rev + item.subtotal,
      });
    }
  }

  const top5Products = products
    .map((p) => {
      const orderStat = productSalesMap.get(p.id) || { qty: 0, rev: 0 };
      const effectivePrice = p.sale_price && p.sale_price < p.price ? p.sale_price : p.price;
      const combinedSold = Math.max(p.total_sold, orderStat.qty);
      const combinedRevenue =
        orderStat.rev > 0 ? orderStat.rev + p.total_sold * effectivePrice : p.total_sold * effectivePrice;
      return {
        ...p,
        displaySold: combinedSold,
        displayRevenue: combinedRevenue,
      };
    })
    .sort((a, b) => b.displaySold - a.displaySold)
    .slice(0, 5);

  // 7-4. 최근 주문 내역 (최신순)
  const recentOrders = [...filteredOrders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 7);

  return (
    <div className="space-y-8">
      {/* Page Title & Data Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">관리자 대시보드</h1>
          <p className="mt-1 text-xs text-slate-500 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-cnu-navy" />
            기준 시간대: Asia/Seoul ({todayKST}) · 모든 지표는 취소·환불을 제외한 실결제 데이터 기반입니다.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 cursor-pointer shadow-sm">
            <input
              type="checkbox"
              checked={excludeTestOrders}
              onChange={(e) => setExcludeTestOrders(e.target.checked)}
              className="rounded border-slate-300 text-cnu-navy"
            />
            <span>테스트 결제 주문 제외하고 집계</span>
          </label>
          <Link href="/admin/sales" className="btn-primary text-xs">
            상세 판매 분석 보기 →
          </Link>
        </div>
      </div>

      {/* Low Stock Warning Banner */}
      {(lowStockProducts.length > 0 || soldOutProductCount > 0) && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs font-bold text-amber-900">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <span>
              재고 부족 경고: 현재 재고 5개 이하 상품{' '}
              <strong className="underline">{lowStockProducts.length}개</strong> (
              {lowStockProducts.map((p) => `${p.name}(${p.stock}개)`).join(', ')}) 및 품절 상품{' '}
              <strong className="underline">{soldOutProductCount}개</strong>가 있습니다.
            </span>
          </div>
          <Link
            href="/admin/inventory"
            className="shrink-0 rounded-xl bg-amber-900 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-amber-800"
          >
            재고 입고 관리 →
          </Link>
        </div>
      )}

      {/* 7-1. 핵심 지표 8개 카드 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>총매출 (누적 실결제)</span>
            <TrendingUp className="h-4 w-4 text-cnu-navy" />
          </div>
          <p className="mt-2 text-2xl font-black text-cnu-navy">
            {formatKRW(totalRevenue)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">취소·환불 제외 정산 매출</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>오늘 매출 ({todayKST})</span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-700">
            {formatKRW(todayRevenue)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">오늘 결제 완료 기준</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>이번 달 매출 ({currentMonthPrefix})</span>
            <TrendingUp className="h-4 w-4 text-sky-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {formatKRW(monthRevenue)}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">당월 누적 실매출</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>총 주문 건수 / 오늘 주문</span>
            <ShoppingCart className="h-4 w-4 text-cnu-navy" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {totalOrderCount}건{' '}
            <span className="text-sm font-bold text-sky-600">
              (오늘 {todayOrderCount}건)
            </span>
          </p>
          <p className="mt-1 text-[11px] text-slate-500">전체 주문 {filteredOrders.length}건 중 유효주문</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>오늘 주문 건수</span>
            <ShoppingCart className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {todayOrderCount}건
          </p>
          <p className="mt-1 text-[11px] text-slate-500">KST 당일 신규 주문</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>총 판매 수량 (주문상품 합계)</span>
            <Package className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {totalSoldQuantity.toLocaleString()}개
          </p>
          <p className="mt-1 text-[11px] text-slate-500">실결제 주문 품목 수량 합산</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>등록 상품 수</span>
            <Package className="h-4 w-4 text-cnu-navy" />
          </div>
          <p className="mt-2 text-2xl font-black text-slate-900">
            {registeredProductCount}종
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            한정판 {products.filter((p) => p.is_limited).length}종 포함
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>품절 상품 수</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-600">
            {soldOutProductCount}종
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            재고 부족(5개 이하) {lowStockProducts.length}종
          </p>
        </div>
      </div>

      {/* 7-2. 매출 분석 (Recharts) */}
      <DashboardSalesCharts orders={filteredOrders} products={products} />

      {/* 7-3. 인기 상품 TOP 5 & 7-4. 최근 주문 내역 */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* TOP 5 Products */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Flame className="h-5 w-5 text-amber-500" />
              인기 상품 TOP 5
            </h2>
            <Link href="/admin/sales" className="text-xs font-bold text-cnu-navy hover:underline">
              전체 분석 →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400">
                  <th className="py-2.5 font-bold">순위</th>
                  <th className="py-2.5 font-bold">상품</th>
                  <th className="py-2.5 font-bold">카테고리</th>
                  <th className="py-2.5 font-bold text-right">판매 수량</th>
                  <th className="py-2.5 font-bold text-right">총매출</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {top5Products.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-3 font-black text-cnu-navy">{idx + 1}위</td>
                    <td className="py-3">
                      <Link
                        href={`/admin/sales/${p.id}`}
                        className="flex items-center gap-2.5 font-bold text-slate-900 hover:text-cnu-navy"
                      >
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-200">
                          <ProductArtwork
                            sku={p.sku}
                            name={p.name}
                            imageUrl={p.image_url}
                            className="h-full w-full"
                          />
                        </div>
                        <span className="line-clamp-1">{p.name}</span>
                      </Link>
                    </td>
                    <td className="py-3 text-slate-500">{p.category_name}</td>
                    <td className="py-3 text-right font-bold text-slate-900">
                      {p.displaySold.toLocaleString()}개
                    </td>
                    <td className="py-3 text-right font-black text-cnu-navy">
                      {formatKRW(p.displayRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Clock className="h-5 w-5 text-cnu-navy" />
              최근 주문 내역
            </h2>
            <Link
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-bold text-cnu-navy hover:underline"
            >
              <span>전체 주문 관리</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400">
                  <th className="py-2.5 font-bold">주문번호</th>
                  <th className="py-2.5 font-bold">주문일</th>
                  <th className="py-2.5 font-bold">고객명</th>
                  <th className="py-2.5 font-bold">상품명</th>
                  <th className="py-2.5 font-bold text-right">주문금액</th>
                  <th className="py-2.5 font-bold text-right">주문상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50">
                    <td className="py-3 font-black text-cnu-navy">
                      <Link href="/admin/orders" className="hover:underline">
                        {ord.order_number}
                      </Link>
                      {ord.is_test_order && (
                        <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
                          TEST
                        </span>
                      )}
                    </td>
                    <td className="py-3 text-slate-500">
                      {formatKSTDate(ord.created_at)}
                    </td>
                    <td className="py-3 font-bold text-slate-800">{ord.user_name}</td>
                    <td className="py-3 text-slate-700">
                      {ord.items[0]?.product_name}
                      {ord.items.length > 1 ? ` 외 ${ord.items.length - 1}건` : ''}
                    </td>
                    <td className="py-3 text-right font-black text-slate-900">
                      {formatKRW(ord.total_amount)}
                    </td>
                    <td className="py-3 text-right">
                      <span
                        className={`inline-block rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                          ord.order_status === '주문 취소' || ord.order_status === '환불 완료'
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
