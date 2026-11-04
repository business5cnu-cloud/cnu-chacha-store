'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  AlertTriangle,
  Truck,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { formatKRW, getEffectivePrice } from '@/lib/utils';
import { ProductArtwork } from '@/components/common/ProductArtwork';

export default function CartPage() {
  const router = useRouter();
  const {
    cart,
    products,
    removeFromCart,
    updateCartQuantity,
    updateCartOption,
    clearCart,
  } = useStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const detailedCart = cart.map((item) => {
    const product = products.find((p) => p.id === item.product_id);
    const basePrice = product ? getEffectivePrice(product.price, product.sale_price) : 0;
    const unitPrice = basePrice + (item.additional_price || 0);
    const subtotal = unitPrice * item.quantity;
    const isInsufficientStock =
      !product ||
      product.stock < item.quantity ||
      product.stock <= 0 ||
      product.status === 'sold_out' ||
      product.status === 'ended';

    return {
      ...item,
      product,
      unitPrice,
      subtotal,
      isInsufficientStock,
    };
  });

  const hasStockIssue = detailedCart.some((d) => d.isInsufficientStock);
  const subtotalAmount = detailedCart.reduce((sum, d) => sum + d.subtotal, 0);
  const shippingFee = subtotalAmount === 0 ? 0 : subtotalAmount >= 30000 ? 0 : 3000;
  const finalAmount = subtotalAmount + shippingFee;

  const handleQtyChange = (cartItemId: string, nextQty: number) => {
    setErrorMessage(null);
    const res = updateCartQuantity(cartItemId, nextQty);
    if (!res.success) {
      setErrorMessage(res.message);
    }
  };

  const handleOptionChange = (cartItemId: string, productId: string, optionId: string) => {
    const product = products.find((p) => p.id === productId);
    const foundOption = product?.options.find((o) => o.id === optionId);
    if (!foundOption) return;
    updateCartOption(
      cartItemId,
      foundOption.id,
      `${foundOption.option_name}: ${foundOption.option_value}`,
      foundOption.additional_price
    );
  };

  const handleProceedToCheckout = () => {
    if (detailedCart.length === 0) return;
    if (hasStockIssue) {
      setErrorMessage(
        '재고가 부족하거나 판매 종료된 상품이 포함되어 있어 주문을 진행할 수 없습니다. 수량을 조정하거나 삭제해주세요.'
      );
      return;
    }
    router.push('/checkout');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">장바구니</h1>
          <p className="mt-1 text-sm text-slate-500">
            담아두신 차차 굿즈의 옵션과 수량을 확인하고 주문을 진행해보세요.
          </p>
        </div>
        {detailedCart.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="text-xs font-bold text-slate-400 hover:text-rose-600"
          >
            장바구니 전체 비우기
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-700">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {detailedCart.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-200 bg-white py-20 text-center">
          <ShoppingBag className="h-14 w-14 text-slate-300 mb-3" />
          <h2 className="text-lg font-bold text-slate-800">장바구니에 담긴 상품이 없습니다.</h2>
          <p className="mt-1 text-xs text-slate-500">
            귀여운 충남대학교 차차 굿즈를 장바구니에 담아보세요!
          </p>
          <Link href="/products" className="btn-primary mt-6">
            차차 굿즈 쇼핑하러 가기
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-8 space-y-4">
            {detailedCart.map((item) => {
              const prod = item.product;
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border bg-white p-4 sm:p-5 shadow-sm transition-all ${
                    item.isInsufficientStock ? 'border-rose-300 bg-rose-50/30' : 'border-slate-200'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                      href={prod ? `/products/${prod.id}` : '/products'}
                      className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200"
                    >
                      <ProductArtwork
                        sku={prod?.sku}
                        name={prod?.name || '삭제된 상품'}
                        imageUrl={prod?.image_url}
                        categoryName={prod?.category_name}
                        isLimited={prod?.is_limited}
                        className="h-full w-full"
                      />
                    </Link>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-xs font-bold text-cnu-blue">
                            {prod?.category_name || '기타'}
                          </span>
                          <Link
                            href={prod ? `/products/${prod.id}` : '/products'}
                            className="block text-base font-black text-slate-900 hover:text-cnu-navy"
                          >
                            {prod?.name || '존재하지 않는 상품'}
                          </Link>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          aria-label="상품 삭제"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Option Selector */}
                      {prod && prod.options.length > 0 && (
                        <div className="max-w-xs">
                          <select
                            aria-label="장바구니 옵션 변경"
                            value={item.option_id || prod.options[0].id}
                            onChange={(e) =>
                              handleOptionChange(item.id, prod.id, e.target.value)
                            }
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                          >
                            {prod.options.map((opt) => (
                              <option key={opt.id} value={opt.id}>
                                {opt.option_name}: {opt.option_value}
                                {opt.additional_price > 0
                                  ? ` (+${formatKRW(opt.additional_price)})`
                                  : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {item.isInsufficientStock && (
                        <p className="text-xs font-bold text-rose-600 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          재고 부족 (현재 구매 가능 재고: {prod?.stock || 0}개) — 수량을 조정해주세요.
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.id, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-8 text-center text-sm font-black text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQtyChange(item.id, item.quantity + 1)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                          <span className="text-xs text-slate-400 ml-1">
                            (단가 {formatKRW(item.unitPrice)})
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs text-slate-400 mr-1.5">합계</span>
                          <span className="text-base font-black text-cnu-navy">
                            {formatKRW(item.subtotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 sticky top-24">
            <h2 className="text-lg font-black text-slate-900">결제 예정 금액</h2>

            <div className="space-y-3 text-sm border-b border-slate-200 pb-4">
              <div className="flex items-center justify-between text-slate-600">
                <span>총 상품 금액</span>
                <span className="font-bold text-slate-900">{formatKRW(subtotalAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-1">
                  <Truck className="h-4 w-4 text-cnu-navy" /> 배송비
                </span>
                <span className="font-bold text-slate-900">
                  {shippingFee === 0 ? '무료배송 (0원)' : formatKRW(shippingFee)}
                </span>
              </div>
              {shippingFee > 0 && (
                <p className="rounded-xl bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800">
                  💡 {formatKRW(30000 - subtotalAmount)} 더 담으시면 무료배송 혜택이 적용됩니다!
                </p>
              )}
            </div>

            <div className="flex items-baseline justify-between">
              <span className="text-base font-bold text-slate-900">총 결제 금액</span>
              <span className="text-2xl font-black text-cnu-navy">
                {formatKRW(finalAmount)}
              </span>
            </div>

            {hasStockIssue && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs font-bold text-rose-700">
                ⚠️ 재고 부족 상품이 포함되어 있어 주문이 제한됩니다.
              </div>
            )}

            <button
              type="button"
              onClick={handleProceedToCheckout}
              disabled={hasStockIssue}
              className="btn-primary w-full py-3.5 text-base font-extrabold gap-2"
            >
              <span>주문하기</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <Link
              href="/products"
              className="btn-secondary w-full text-center text-xs"
            >
              쇼핑 계속하기
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
