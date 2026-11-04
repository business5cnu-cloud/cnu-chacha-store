'use client';

import React, { useState } from 'react';
import {
  Boxes,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { formatKSTDate } from '@/lib/utils';
import { MovementType } from '@/types';
import { ProductArtwork } from '@/components/common/ProductArtwork';

export default function AdminInventoryPage() {
  const { products, inventoryMovements, adjustInventory } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'low' | 'sold_out'>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id || '');
  const [movementType, setMovementType] = useState<MovementType>('IN');
  const [quantityInput, setQuantityInput] = useState<number>(20);
  const [reasonInput, setReasonInput] = useState('정기 재고 입고');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const lowStockProducts = products.filter((p) => p.stock > 0 && p.stock <= 5);
  const soldOutProducts = products.filter((p) => p.stock <= 0 || p.status === 'sold_out');

  const filteredProducts = products.filter((p) => {
    if (filterMode === 'low' && !(p.stock > 0 && p.stock <= 5)) return false;
    if (filterMode === 'sold_out' && !(p.stock <= 0 || p.status === 'sold_out')) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    }
    return true;
  });

  const handleInventorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || quantityInput <= 0) return;

    const change = movementType === 'OUT' ? -Math.abs(quantityInput) : Math.abs(quantityInput);
    const res = adjustInventory(
      selectedProductId,
      movementType,
      change,
      reasonInput.trim() || '관리자 재고 수동 처리'
    );

    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">재고 관리</h1>
        <p className="mt-1 text-xs text-slate-500">
          전체 상품 재고 현황, 입고 수량 등록, 재고 부족 및 품절 상품 확인, 모든 입출고 변경 이력을 트랜잭션 기반으로 관리합니다.
        </p>
      </div>

      {/* Summary & Low Stock Alert Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setFilterMode('all')}
          className={`rounded-2xl border p-5 text-left transition-all ${
            filterMode === 'all'
              ? 'border-cnu-navy bg-white ring-2 ring-cnu-navy/20'
              : 'border-slate-200 bg-white'
          }`}
        >
          <p className="text-xs font-bold text-slate-400">전체 관리 상품</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{products.length}종</p>
          <p className="mt-1 text-[11px] text-slate-500">
            총 보유 재고 합계: {products.reduce((s, p) => s + p.stock, 0).toLocaleString()}개
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode('low')}
          className={`rounded-2xl border p-5 text-left transition-all ${
            filterMode === 'low'
              ? 'border-amber-500 bg-amber-50 ring-2 ring-amber-500/20'
              : 'border-amber-200 bg-amber-50/40'
          }`}
        >
          <p className="text-xs font-bold text-amber-800 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" /> 재고 부족 알림 (5개 이하)
          </p>
          <p className="mt-1 text-2xl font-black text-amber-900">
            {lowStockProducts.length}종
          </p>
          <p className="mt-1 text-[11px] text-amber-700 line-clamp-1">
            {lowStockProducts.map((p) => `${p.name}(${p.stock})`).join(', ') || '해당 없음'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => setFilterMode('sold_out')}
          className={`rounded-2xl border p-5 text-left transition-all ${
            filterMode === 'sold_out'
              ? 'border-rose-500 bg-rose-50 ring-2 ring-rose-500/20'
              : 'border-rose-200 bg-rose-50/40'
          }`}
        >
          <p className="text-xs font-bold text-rose-700">품절 상품 (재고 0개)</p>
          <p className="mt-1 text-2xl font-black text-rose-600">
            {soldOutProducts.length}종
          </p>
          <p className="mt-1 text-[11px] text-rose-500">클릭하여 품절 상품만 필터링</p>
        </button>
      </div>

      {feedback && (
        <div
          className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-xs font-bold ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          }`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
        {/* Left: Stock Table */}
        <div className="lg:col-span-7 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <Boxes className="h-4 w-4 text-cnu-navy" />
              상품별 실시간 재고 현황
            </h2>
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="상품명 / SKU 검색..."
                className="input-base pl-8 py-1.5 text-xs"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
                  <th className="px-4 py-3 font-bold">상품</th>
                  <th className="px-4 py-3 font-bold">카테고리</th>
                  <th className="px-4 py-3 font-bold text-right">현재 재고</th>
                  <th className="px-4 py-3 font-bold text-center">상태</th>
                  <th className="px-4 py-3 font-bold text-right">빠른 입고</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedProductId(p.id)}
                    className={`cursor-pointer ${
                      selectedProductId === p.id ? 'bg-sky-50/70' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-200">
                          <ProductArtwork
                            sku={p.sku}
                            name={p.name}
                            imageUrl={p.image_url}
                            className="h-full w-full"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <p className="text-[10px] text-slate-400">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.category_name}</td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`text-sm font-black ${
                          p.stock === 0
                            ? 'text-rose-600'
                            : p.stock <= 5
                            ? 'text-amber-600'
                            : 'text-slate-900'
                        }`}
                      >
                        {p.stock}개
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {p.stock <= 0 ? (
                        <span className="rounded-lg bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-700">
                          품절
                        </span>
                      ) : p.stock <= 5 ? (
                        <span className="rounded-lg bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold text-amber-800">
                          재고부족
                        </span>
                      ) : (
                        <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                          정상
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const res = adjustInventory(
                            p.id,
                            'IN',
                            10,
                            '관리자 원클릭 +10개 빠른 입고'
                          );
                          setFeedback({ type: 'success', text: res.message });
                        }}
                        className="rounded-lg bg-cnu-navy px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-900"
                      >
                        +10개 입고
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Stock In/Out Form & Movement History */}
        <div className="lg:col-span-5 space-y-6">
          {/* Stock Registration Form */}
          <form
            onSubmit={handleInventorySubmit}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
          >
            <h2 className="text-base font-black text-slate-900">
              입고 수량 등록 및 재고 조정
            </h2>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                대상 상품 선택
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="input-base text-xs font-bold"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.sku}] {p.name} (현재 재고: {p.stock}개)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMovementType('IN')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-extrabold ${
                  movementType === 'IN'
                    ? 'border-emerald-600 bg-emerald-600 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                <ArrowDownToLine className="h-4 w-4" />
                <span>재고 입고 (+추가)</span>
              </button>
              <button
                type="button"
                onClick={() => setMovementType('OUT')}
                className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-xs font-extrabold ${
                  movementType === 'OUT'
                    ? 'border-rose-600 bg-rose-600 text-white'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
                }`}
              >
                <ArrowUpFromLine className="h-4 w-4" />
                <span>재고 출고 (-차감)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  변경 수량 (개)
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={quantityInput}
                  onChange={(e) => setQuantityInput(Number(e.target.value))}
                  className="input-base text-xs font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  변경 사유 (필수 기록)
                </label>
                <input
                  type="text"
                  required
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="예: 2차 추가 제작 입고"
                  className="input-base text-xs"
                />
              </div>
            </div>

            <button type="submit" className="btn-primary w-full py-3 text-xs font-black">
              재고 변경 실행 및 이력 저장
            </button>
          </form>

          {/* Inventory Movements History */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-1.5">
              <History className="h-4 w-4 text-cnu-navy" />
              재고 변경 이력 ({inventoryMovements.length}건)
            </h2>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {inventoryMovements.map((mov) => (
                <div
                  key={mov.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-3.5 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-slate-900">
                      {mov.product_name}{' '}
                      <span className="text-[10px] font-normal text-slate-400">
                        ({mov.product_sku})
                      </span>
                    </span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold ${
                        mov.quantity > 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {mov.movement_type} ({mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity}개)
                    </span>
                  </div>
                  <p className="text-slate-600">{mov.reason}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>
                      재고 변동: {mov.previous_stock}개 →{' '}
                      <strong className="text-slate-700">{mov.current_stock}개</strong>
                    </span>
                    <span>{formatKSTDate(mov.created_at, true)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
