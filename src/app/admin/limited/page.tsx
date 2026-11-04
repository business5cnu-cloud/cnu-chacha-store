'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Play,
  Square,
  Plus,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { formatKRW, formatKSTDate } from '@/lib/utils';
import { ProductArtwork } from '@/components/common/ProductArtwork';

export default function AdminLimitedPage() {
  const { products, addProduct, updateProduct } = useStore();
  const [notice, setNotice] = useState<string | null>(null);

  // Quick register form state
  const [newName, setNewName] = useState('');
  const [newSku, setNewSku] = useState('CNU-LIM-004');
  const [newPrice, setNewPrice] = useState(39000);
  const [newSalePrice, setNewSalePrice] = useState(35000);
  const [newLimitedQty, setNewLimitedQty] = useState(100);
  const [newStock, setNewStock] = useState(50);
  const [newStartAt, setNewStartAt] = useState('2026-11-01');
  const [newEndAt, setNewEndAt] = useState('2026-12-31');

  const limitedProducts = products.filter((p) => p.is_limited);

  const handleRegisterLimited = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const res = addProduct({
      name: newName.trim(),
      sku: newSku.trim(),
      category_id: 'cat-limited',
      category_name: '한정판',
      category_slug: 'limited',
      description: `[한정판] ${newName.trim()} 스페셜 에디션 굿즈입니다.`,
      price: Number(newPrice),
      sale_price: Number(newSalePrice) > 0 ? Number(newSalePrice) : null,
      stock: Number(newStock),
      image_url: '/images/products/default-product.svg',
      detail_images: ['/images/products/default-product.svg'],
      is_limited: true,
      status: Number(newStock) > 0 ? 'on_sale' : 'sold_out',
      options: [
        {
          id: `opt-lim-${Date.now()}`,
          product_id: 'temp',
          option_name: '에디션',
          option_value: '스페셜 리미티드 패키지',
          additional_price: 0,
        },
      ],
      start_at: `${newStartAt}T00:00:00+09:00`,
      end_at: `${newEndAt}T23:59:59+09:00`,
      limited_quantity: Number(newLimitedQty),
    });

    setNotice(res.message);
    setNewName('');
    setNewSku(`CNU-LIM-00${limitedProducts.length + 2}`);
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div>
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-0.5 text-xs font-extrabold text-rose-700">
          <Sparkles className="h-3.5 w-3.5" /> LIMITED EDITION MANAGEMENT
        </span>
        <h1 className="mt-1 text-2xl font-black text-slate-900">한정판 관리</h1>
        <p className="mt-1 text-xs text-slate-500">
          한정판 상품 등록, 판매 기간 설정, 한정 수량 및 남은 재고 확인, 판매 시작·종료를 관리합니다. 재고 0개 시 자동 품절, 종료일 경과 시 판매 종료 상태로 자동 전환됩니다.
        </p>
      </div>

      {notice && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* Quick Limited Product Registration */}
      <form
        onSubmit={handleRegisterLimited}
        className="rounded-3xl border border-rose-200 bg-white p-6 shadow-sm space-y-4"
      >
        <h2 className="text-base font-black text-slate-900 flex items-center gap-1.5">
          <Plus className="h-4 w-4 text-rose-600" />
          신규 한정판 상품 등록
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">한정판 상품명 *</label>
            <input
              type="text"
              required
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="예: 2026 졸업 기념 학사모 차차 인형"
              className="input-base text-xs"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">상품 코드 (SKU) *</label>
            <input
              type="text"
              required
              value={newSku}
              onChange={(e) => setNewSku(e.target.value)}
              className="input-base text-xs"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">정상가 (원)</label>
            <input
              type="number"
              min={0}
              value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
              className="input-base text-xs"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">할인가 (원)</label>
            <input
              type="number"
              min={0}
              value={newSalePrice}
              onChange={(e) => setNewSalePrice(Number(e.target.value))}
              className="input-base text-xs"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">총 한정 수량</label>
            <input
              type="number"
              min={1}
              value={newLimitedQty}
              onChange={(e) => setNewLimitedQty(Number(e.target.value))}
              className="input-base text-xs"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">초기 배정 재고</label>
            <input
              type="number"
              min={0}
              value={newStock}
              onChange={(e) => setNewStock(Number(e.target.value))}
              className="input-base text-xs"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">판매 시작일</label>
            <input
              type="date"
              value={newStartAt}
              onChange={(e) => setNewStartAt(e.target.value)}
              className="input-base text-xs"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">판매 종료일</label>
            <input
              type="date"
              value={newEndAt}
              onChange={(e) => setNewEndAt(e.target.value)}
              className="input-base text-xs"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-rose-700"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>한정판 에디션 등록하기</span>
          </button>
        </div>
      </form>

      {/* Limited Products Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {limitedProducts.map((product) => {
          const totalLimit = product.limited_quantity || 100;
          const remainingRatio = Math.min(
            100,
            Math.round((product.stock / totalLimit) * 100)
          );

          return (
            <div
              key={product.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3.5">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200">
                    <ProductArtwork
                      sku={product.sku}
                      name={product.name}
                      imageUrl={product.image_url}
                      isLimited
                      className="h-full w-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-rose-600">
                        {product.sku}
                      </span>
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[10px] font-extrabold ${
                          product.status === 'on_sale' && product.stock > 0
                            ? 'bg-emerald-100 text-emerald-700'
                            : product.status === 'ended'
                            ? 'bg-slate-800 text-white'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {product.status === 'on_sale' && product.stock > 0
                          ? '한정판매 진행중'
                          : product.status === 'ended'
                          ? '판매 종료'
                          : '품절 (재고소진)'}
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-black text-slate-900 truncate">
                      {product.name}
                    </h3>
                    <p className="text-xs font-bold text-cnu-navy">
                      {formatKRW(product.sale_price || product.price)}
                    </p>
                  </div>
                </div>

                {/* Remaining Stock Progress */}
                <div className="rounded-2xl bg-slate-50 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600 flex items-center gap-1">
                      <Package className="h-3.5 w-3.5 text-rose-500" /> 남은 수량 / 한정 수량
                    </span>
                    <span className="font-black text-rose-600">
                      {product.stock}개 / 총 {totalLimit}개 ({remainingRatio}%)
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-rose-500 transition-all"
                      style={{ width: `${remainingRatio}%` }}
                    />
                  </div>
                </div>

                {/* Period & Stock Controls */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="flex items-center gap-1 font-semibold">
                      <Calendar className="h-3.5 w-3.5 text-cnu-navy" /> 판매 기간
                    </span>
                    <span className="font-bold text-slate-900">
                      {product.start_at ? formatKSTDate(product.start_at) : '-'} ~{' '}
                      {product.end_at ? formatKSTDate(product.end_at) : '-'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        종료일 변경
                      </label>
                      <input
                        type="date"
                        value={product.end_at ? product.end_at.slice(0, 10) : '2026-12-31'}
                        onChange={(e) => {
                          const res = updateProduct(product.id, {
                            end_at: `${e.target.value}T23:59:59+09:00`,
                          });
                          setNotice(res.message);
                        }}
                        className="input-base py-1.5 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 mb-1">
                        남은 재고 수량 설정
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={product.stock}
                        onChange={(e) => {
                          const nextStock = Math.max(0, Number(e.target.value));
                          const res = updateProduct(
                            product.id,
                            {
                              stock: nextStock,
                              status: nextStock === 0 ? 'sold_out' : 'on_sale',
                            },
                            '한정판 관리 페이지 재고 수정'
                          );
                          setNotice(res.message);
                        }}
                        className="input-base py-1.5 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Start / End Sale Action Buttons */}
              <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    const nextStock = product.stock > 0 ? product.stock : 10;
                    const res = updateProduct(product.id, {
                      status: 'on_sale',
                      stock: nextStock,
                      end_at: '2026-12-31T23:59:59+09:00',
                    });
                    setNotice(`[${product.name}] 한정 판매가 시작(재개)되었습니다. (${res.message})`);
                  }}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>판매 시작</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const res = updateProduct(product.id, {
                      status: 'ended',
                    });
                    setNotice(`[${product.name}] 한정 판매가 종료 처리되었습니다. (${res.message})`);
                  }}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-800 px-3 py-2 text-xs font-bold text-white hover:bg-slate-900"
                >
                  <Square className="h-3.5 w-3.5" />
                  <span>판매 종료</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
