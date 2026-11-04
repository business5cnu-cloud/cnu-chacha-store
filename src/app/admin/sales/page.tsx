'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Search,
  BarChart3,
  Download,
  ArrowUpDown,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { formatKRW } from '@/lib/utils';
import {
  calculateProductSalesSummaries,
  exportSalesSummariesToCSV,
  triggerExcelCSVDownload,
} from '@/lib/utils/sales-analytics';
import { ProductArtwork } from '@/components/common/ProductArtwork';

type SortField = 'sold_desc' | 'revenue_desc' | 'stock_asc' | 'stock_desc';

export default function AdminSalesAnalyticsPage() {
  const { products, orders, categories } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('sold_desc');

  const summaries = calculateProductSalesSummaries(
    products,
    orders,
    startDate || undefined,
    endDate || undefined
  );

  const filteredAndSorted = summaries
    .filter((item) => {
      if (categoryFilter !== 'all' && item.product.category_id !== categoryFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        return (
          item.product.name.toLowerCase().includes(q) ||
          item.product.sku.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'sold_desc':
          return b.cumulativeQuantity - a.cumulativeQuantity;
        case 'revenue_desc':
          return b.cumulativeRevenue - a.cumulativeRevenue;
        case 'stock_asc':
          return a.currentStock - b.currentStock;
        case 'stock_desc':
          return b.currentStock - a.currentStock;
        default:
          return 0;
      }
    });

  const totalCumulativeQty = filteredAndSorted.reduce(
    (sum, s) => sum + s.cumulativeQuantity,
    0
  );
  const totalCumulativeRev = filteredAndSorted.reduce(
    (sum, s) => sum + s.cumulativeRevenue,
    0
  );

  const handleDownloadCSV = () => {
    const csvContent = exportSalesSummariesToCSV(filteredAndSorted);
    triggerExcelCSVDownload(
      `cnu_chacha_product_sales_${new Date().toISOString().slice(0, 10)}.csv`,
      csvContent
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1 rounded-full bg-cnu-navy/10 px-3 py-0.5 text-xs font-extrabold text-cnu-navy">
            <BarChart3 className="h-3.5 w-3.5" /> PRODUCT SALES ANALYTICS
          </span>
          <h1 className="mt-1 text-2xl font-black text-slate-900">
            제품별 판매 분석
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            전체 상품의 재고, 오늘/이번 달/누적 판매 수량, 누적 매출을 확인하고 개별 상품을 클릭해 심층 분석 페이지로 이동합니다.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadCSV}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-extrabold text-white shadow-sm hover:bg-emerald-800"
        >
          <Download className="h-4 w-4" />
          <span>전체 판매 현황 엑셀(CSV) 다운로드</span>
        </button>
      </div>

      {/* Summary Banner */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400">조회 상품 수</p>
          <p className="mt-1 text-2xl font-black text-slate-900">
            {filteredAndSorted.length}종
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400">조회 상품 총 누적 판매량</p>
          <p className="mt-1 text-2xl font-black text-cnu-navy">
            {totalCumulativeQty.toLocaleString()}개
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold text-slate-400">
            조회 상품 총 누적 매출 (취소·환불 제외)
          </p>
          <p className="mt-1 text-2xl font-black text-emerald-700">
            {formatKRW(totalCumulativeRev)}
          </p>
        </div>
      </div>

      {/* Search, Period & Sort Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
          <div className="relative md:col-span-3">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="상품명 또는 상품코드 검색..."
              className="input-base pl-10 text-xs"
            />
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="카테고리 필터"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-base text-xs font-bold"
            >
              <option value="all">전체 카테고리</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <input
              type="date"
              aria-label="기간 시작일"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-base text-xs"
            />
          </div>

          <div className="md:col-span-2">
            <input
              type="date"
              aria-label="기간 종료일"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-base text-xs"
            />
          </div>

          <div className="md:col-span-2">
            <select
              aria-label="정렬 기준"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortField)}
              className="input-base text-xs font-bold"
            >
              <option value="sold_desc">정렬: 판매량 높은순</option>
              <option value="revenue_desc">정렬: 매출 높은순</option>
              <option value="stock_asc">정렬: 재고 적은순</option>
              <option value="stock_desc">정렬: 재고 많은순</option>
            </select>
          </div>

          <div className="md:col-span-1 flex items-center justify-end">
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setStartDate('');
                setEndDate('');
                setSortBy('sold_desc');
              }}
              title="필터 초기화"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 8-1. 전체 상품 판매 현황 테이블 */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                <th className="px-4 py-3.5 font-bold">상품 정보</th>
                <th className="px-4 py-3.5 font-bold">카테고리</th>
                <th className="px-4 py-3.5 font-bold text-right">판매 가격</th>
                <th className="px-4 py-3.5 font-bold text-right">
                  <button
                    type="button"
                    onClick={() =>
                      setSortBy(sortBy === 'stock_asc' ? 'stock_desc' : 'stock_asc')
                    }
                    className="inline-flex items-center gap-1 hover:text-cnu-navy"
                  >
                    현재 재고 <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3.5 font-bold text-right">오늘 판매</th>
                <th className="px-4 py-3.5 font-bold text-right">이번 달 판매</th>
                <th className="px-4 py-3.5 font-bold text-right">
                  <button
                    type="button"
                    onClick={() => setSortBy('sold_desc')}
                    className="inline-flex items-center gap-1 hover:text-cnu-navy"
                  >
                    누적 판매 수량 <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3.5 font-bold text-right">
                  <button
                    type="button"
                    onClick={() => setSortBy('revenue_desc')}
                    className="inline-flex items-center gap-1 hover:text-cnu-navy"
                  >
                    누적 매출 <ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
                <th className="px-4 py-3.5 font-bold text-center">판매 상태</th>
                <th className="px-4 py-3.5 font-bold text-right">상세 분석</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSorted.map((row) => (
                <tr key={row.product.id} className="hover:bg-sky-50/40 transition-colors">
                  <td className="px-4 py-3.5">
                    <Link
                      href={`/admin/sales/${row.product.id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200">
                        <ProductArtwork
                          sku={row.product.sku}
                          name={row.product.name}
                          imageUrl={row.product.image_url}
                          className="h-full w-full"
                        />
                      </div>
                      <div>
                        <p className="font-black text-slate-900 group-hover:text-cnu-navy text-sm">
                          {row.product.name}
                        </p>
                        <p className="text-[11px] text-slate-400">{row.product.sku}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-600">
                    {row.product.category_name}
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-slate-800">
                    {formatKRW(row.effectivePrice)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span
                      className={`font-black ${
                        row.currentStock <= 5 ? 'text-rose-600' : 'text-slate-900'
                      }`}
                    >
                      {row.currentStock}개
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-emerald-700">
                    {row.todayQuantity}개
                  </td>
                  <td className="px-4 py-3.5 text-right font-bold text-sky-700">
                    {row.monthQuantity}개
                  </td>
                  <td className="px-4 py-3.5 text-right font-black text-slate-900">
                    {row.cumulativeQuantity.toLocaleString()}개
                  </td>
                  <td className="px-4 py-3.5 text-right font-black text-cnu-navy">
                    {formatKRW(row.cumulativeRevenue)}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span
                      className={`inline-block rounded-lg px-2 py-0.5 text-[11px] font-bold ${
                        row.product.status === 'on_sale' && row.currentStock > 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {row.product.status === 'on_sale' && row.currentStock > 0
                        ? '판매중'
                        : row.product.status === 'ended'
                        ? '판매종료'
                        : '품절'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/admin/sales/${row.product.id}`}
                      className="inline-flex items-center gap-1 rounded-xl bg-cnu-navy px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-900"
                    >
                      <span>개별 분석</span>
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
