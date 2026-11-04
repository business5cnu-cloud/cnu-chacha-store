'use client';

import React from 'react';
import Link from 'next/link';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { formatKRW, getEffectivePrice } from '@/lib/utils';
import { ProductArtwork } from '@/components/common/ProductArtwork';

export function CartDrawer() {
  const {
    cart,
    products,
    isCartDrawerOpen,
    setCartDrawerOpen,
    updateCartQuantity,
    removeFromCart,
  } = useStore();

  if (!isCartDrawerOpen) return null;

  const enrichedItems = cart
    .map((item) => {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) return null;
      const unitPrice =
        getEffectivePrice(product.price, product.sale_price) +
        (item.additional_price || 0);
      return {
        ...item,
        product,
        unitPrice,
        subtotal: unitPrice * item.quantity,
      };
    })
    .filter(Boolean) as {
    id: string;
    product_id: string;
    option_id?: string;
    option_label?: string;
    additional_price: number;
    quantity: number;
    product: (typeof products)[0];
    unitPrice: number;
    subtotal: number;
  }[];

  const totalCount = enrichedItems.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = enrichedItems.reduce((sum, i) => sum + i.subtotal, 0);
  const shippingFee = enrichedItems.length === 0 ? 0 : subtotal >= 30000 ? 0 : 3000;
  const totalAmount = subtotal + shippingFee;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setCartDrawerOpen(false)}
        className="absolute inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="flex w-screen max-w-md flex-col bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h3 className="flex items-center gap-2 text-sm font-black text-cnu-navy">
              <ShoppingBag className="h-4 w-4" />
              <span>장바구니 ({totalCount})</span>
            </h3>
            <button
              type="button"
              onClick={() => setCartDrawerOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-800"
              aria-label="닫기"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Shipping Promo Notice */}
          <div className="border-b border-sky-100 bg-sky-50 px-6 py-2.5 text-center text-xs font-bold text-cnu-navy">
            🎓 학내 픽업 무료 / 30,000원 이상 구매 시 전국 무료 배송!
          </div>

          {/* Cart Items */}
          {enrichedItems.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-3xl">
                🐴
              </div>
              <p className="text-sm font-bold text-slate-700">
                장바구니가 비어 있습니다.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                귀여운 차차 굿즈나 가상 피팅룸 코디를 담아보세요!
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-6 space-y-4">
              {enrichedItems.map((item) => (
                <div key={item.id} className="flex gap-3.5 pt-4 first:pt-0">
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                    <ProductArtwork
                      sku={item.product.sku}
                      name={item.product.name}
                      imageUrl={item.product.image_url}
                      className="h-full w-full"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/products/${item.product.id}`}
                          onClick={() => setCartDrawerOpen(false)}
                          className="truncate text-xs font-black text-slate-900 hover:text-cnu-navy"
                        >
                          {item.product.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="text-slate-400 hover:text-rose-600"
                          title="삭제"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-slate-500">
                        {item.option_label || '기본 옵션'}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-slate-500 hover:text-slate-900"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-slate-500 hover:text-slate-900"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-xs font-black text-cnu-navy">
                        {formatKRW(item.subtotal)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Summary */}
          <div className="border-t border-slate-200 bg-slate-50/70 p-6 space-y-3">
            <div className="flex justify-between text-xs text-slate-500">
              <span>상품 금액</span>
              <span className="font-bold text-slate-800">{formatKRW(subtotal)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-500">
              <span>배송비</span>
              <span className="font-bold text-slate-800">
                {shippingFee === 0 ? '무료' : formatKRW(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2.5 text-sm font-black text-slate-900">
              <span>총 결제 예정 금액</span>
              <span className="text-base text-cnu-navy">{formatKRW(totalAmount)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <Link
                href="/cart"
                onClick={() => setCartDrawerOpen(false)}
                className="btn-secondary py-3 text-xs font-bold text-center"
              >
                장바구니 상세보기
              </Link>
              <Link
                href={enrichedItems.length > 0 ? '/checkout' : '/products'}
                onClick={() => setCartDrawerOpen(false)}
                className="btn-primary py-3 text-xs font-extrabold gap-1 text-center"
              >
                <span>{enrichedItems.length > 0 ? '주문 및 결제하기' : '쇼핑하러 가기'}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
