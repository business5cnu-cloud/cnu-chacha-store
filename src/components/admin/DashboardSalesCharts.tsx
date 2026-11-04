'use client';

import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { BarChart3, Calendar } from 'lucide-react';
import { Order, Product } from '@/types';
import { formatKRW, getKSTDateString } from '@/lib/utils';
import { isValidOrderForAnalytics } from '@/lib/utils/sales-analytics';

interface DashboardSalesChartsProps {
  orders: Order[];
  products: Product[];
}

type RangePreset = '7d' | '30d' | '90d' | 'year' | 'custom';
type Granularity = 'daily' | 'weekly' | 'monthly';

const PIE_COLORS = ['#0F2547', '#0284C7', '#E11D48', '#F59E0B', '#10B981'];

export function DashboardSalesCharts({ orders, products }: DashboardSalesChartsProps) {
  const [rangePreset, setRangePreset] = useState<RangePreset>('30d');
  const [granularity, setGranularity] = useState<Granularity>('daily');
  const [customStart, setCustomStart] = useState('2026-10-01');
  const [customEnd, setCustomEnd] = useState('2026-11-04');

  const validOrders = useMemo(
    () => orders.filter(isValidOrderForAnalytics),
    [orders]
  );

  // Filter orders by selected date range
  const rangeFilteredOrders = useMemo(() => {
    const now = new Date();
    const todayStr = getKSTDateString(now);

    return validOrders.filter((ord) => {
      const ordDateStr = getKSTDateString(new Date(ord.created_at));
      if (rangePreset === 'custom') {
        if (customStart && ordDateStr < customStart) return false;
        if (customEnd && ordDateStr > customEnd) return false;
        return true;
      }

      if (rangePreset === 'year') {
        return ordDateStr.startsWith(todayStr.slice(0, 4));
      }

      const days = rangePreset === '7d' ? 7 : rangePreset === '30d' ? 30 : 90;
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      const cutoffStr = getKSTDateString(cutoff);
      return ordDateStr >= cutoffStr;
    });
  }, [validOrders, rangePreset, customStart, customEnd]);

  // 1. 일별/주별/월별 매출 및 일별 주문 건수 데이터 생성
  const timeSeriesData = useMemo(() => {
    const bucketMap = new Map<string, { label: string; revenue: number; orders: number }>();

    // 기본 최근 일자 시드 데이터 (차트 시각적 완성도 및 실제 주문 결합)
    const seedDates = [
      '2026-10-25',
      '2026-10-28',
      '2026-10-30',
      '2026-11-01',
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
    ];
    if (granularity === 'daily') {
      for (const d of seedDates) {
        bucketMap.set(d, { label: d.slice(5), revenue: 0, orders: 0 });
      }
    }

    for (const ord of rangeFilteredOrders) {
      const dateStr = getKSTDateString(new Date(ord.created_at)); // YYYY-MM-DD
      let key = dateStr;
      let label = dateStr.slice(5);

      if (granularity === 'monthly') {
        key = dateStr.slice(0, 7);
        label = `${key}월`;
      } else if (granularity === 'weekly') {
        const dayNum = parseInt(dateStr.slice(8, 10), 10);
        const weekIndex = Math.ceil(dayNum / 7);
        key = `${dateStr.slice(0, 7)}-W${weekIndex}`;
        label = `${dateStr.slice(5, 7)}월 ${weekIndex}주`;
      }

      const prev = bucketMap.get(key) || { label, revenue: 0, orders: 0 };
      bucketMap.set(key, {
        label,
        revenue: prev.revenue + ord.total_amount,
        orders: prev.orders + 1,
      });
    }

    return Array.from(bucketMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, val]) => val);
  }, [rangeFilteredOrders, granularity]);

  // 2. 카테고리별 매출 비중
  const categoryPieData = useMemo(() => {
    const catMap = new Map<string, number>();
    for (const ord of rangeFilteredOrders) {
      for (const item of ord.items) {
        const catName = item.category_name || '기타';
        catMap.set(catName, (catMap.get(catName) || 0) + item.subtotal);
      }
    }

    if (catMap.size === 0) {
      for (const p of products) {
        const price = p.sale_price || p.price;
        catMap.set(
          p.category_name,
          (catMap.get(p.category_name) || 0) + price * p.total_sold
        );
      }
    }

    return Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));
  }, [rangeFilteredOrders, products]);

  // 3. 상품별 매출 비교 (상위 6개 상품)
  const productComparisonData = useMemo(() => {
    return products
      .map((p) => {
        const unit = p.sale_price && p.sale_price < p.price ? p.sale_price : p.price;
        const orderRev = rangeFilteredOrders.reduce((sum, o) => {
          const matched = o.items.filter((i) => i.product_id === p.id);
          return sum + matched.reduce((s, i) => s + i.subtotal, 0);
        }, 0);
        return {
          name: p.name.length > 8 ? `${p.name.slice(0, 8)}…` : p.name,
          fullName: p.name,
          revenue: Math.max(orderRev, p.total_sold * unit),
          sold: p.total_sold,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
  }, [products, rangeFilteredOrders]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
      {/* Header & Period Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cnu-navy" />
            매출 및 주문 추이 통합 분석 (Recharts)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            일별·주별·월별 매출 추이, 일별 주문 건수, 카테고리별 비중 및 상품별 매출 비교
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Granularity Toggle */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
            {(
              [
                { id: 'daily', label: '일별 추이' },
                { id: 'weekly', label: '주별 추이' },
                { id: 'monthly', label: '월별 추이' },
              ] as { id: Granularity; label: string }[]
            ).map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGranularity(g.id)}
                className={`rounded-lg px-3 py-1.5 transition-colors ${
                  granularity === g.id
                    ? 'bg-cnu-navy text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Period Presets */}
          <div className="inline-flex flex-wrap rounded-xl border border-slate-200 bg-white p-1 text-xs font-bold">
            {(
              [
                { id: '7d', label: '최근 7일' },
                { id: '30d', label: '최근 30일' },
                { id: '90d', label: '최근 90일' },
                { id: 'year', label: '올해' },
                { id: 'custom', label: '직접 날짜 지정' },
              ] as { id: RangePreset; label: string }[]
            ).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setRangePreset(preset.id)}
                className={`rounded-lg px-2.5 py-1.5 transition-colors ${
                  rangePreset === preset.id
                    ? 'bg-sky-100 text-cnu-navy font-extrabold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Date Inputs */}
      {rangePreset === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-slate-50 p-3.5 text-xs">
          <span className="font-bold text-slate-700 flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-cnu-navy" /> 조회 기간 직접 지정:
          </span>
          <input
            type="date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold"
          />
          <span>~</span>
          <input
            type="date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-semibold"
          />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Chart 1: Revenue Trend (AreaChart) */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
          <h3 className="text-xs font-extrabold text-slate-700">
            {granularity === 'daily'
              ? '일별 매출 추이 (원)'
              : granularity === 'weekly'
              ? '주별 매출 추이 (원)'
              : '월별 매출 추이 (원)'}
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${Math.round(v / 1000)}k`}
                />
                <Tooltip
                  formatter={(value) => [formatKRW(Number(value)), '매출액']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0F2547"
                  fill="#38BDF8"
                  fillOpacity={0.25}
                  strokeWidth={2.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Daily Order Count (BarChart) */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
          <h3 className="text-xs font-extrabold text-slate-700">
            기간별 주문 건수 추이 (건)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value) => [`${value}건`, '주문 건수']} />
                <Bar dataKey="orders" fill="#0284C7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Category Share (PieChart) */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
          <h3 className="text-xs font-extrabold text-slate-700">
            카테고리별 매출 비중
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) =>
                    `${name} ${((percent || 0) * 100).toFixed(0)}%`
                  }
                >
                  {categoryPieData.map((entry, idx) => (
                    <Cell
                      key={entry.name}
                      fill={PIE_COLORS[idx % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [formatKRW(Number(value)), '카테고리 매출']}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Product Revenue Comparison (BarChart) */}
        <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 space-y-3">
          <h3 className="text-xs font-extrabold text-slate-700">
            주요 상품별 매출 비교 (TOP 6)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productComparisonData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `${Math.round(v / 10000)}만`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={85}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  formatter={(value) => [formatKRW(Number(value)), '누적 매출']}
                />
                <Bar dataKey="revenue" fill="#0F2547" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
