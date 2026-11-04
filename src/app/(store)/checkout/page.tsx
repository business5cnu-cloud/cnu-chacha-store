'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  ShieldCheck,
  Truck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Lock,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { formatKRW, formatKSTDate, getEffectivePrice } from '@/lib/utils';
import { Order } from '@/types';

const isTossLiveConfigured = Boolean(
  process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY &&
    process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY.trim() !== ''
);

export default function CheckoutPage() {
  const { cart, products, currentUser, createOrder } = useStore();

  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [postalCode, setPostalCode] = useState('34134');
  const [address, setAddress] = useState('대전광역시 유성구 대학로 99');
  const [addressDetail, setAddressDetail] = useState('충남대학교 학생생활관');
  const [memo, setMemo] = useState('문 앞에 안전하게 놓아주세요.');
  const [paymentMethod, setPaymentMethod] = useState<'카드결제' | '토스페이' | '가상계좌'>('카드결제');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (currentUser) {
      setRecipientName(currentUser.name || '');
      setRecipientPhone(currentUser.phone || '010-2345-6789');
      setPostalCode(currentUser.postal_code || '34134');
      setAddress(currentUser.address || '대전광역시 유성구 대학로 99');
      setAddressDetail(currentUser.address_detail || '충남대학교');
    }
  }, [currentUser]);

  const detailedCart = cart.map((item) => {
    const product = products.find((p) => p.id === item.product_id);
    const basePrice = product ? getEffectivePrice(product.price, product.sale_price) : 0;
    const unitPrice = basePrice + (item.additional_price || 0);
    return {
      ...item,
      product,
      unitPrice,
      subtotal: unitPrice * item.quantity,
    };
  });

  const subtotalAmount = detailedCart.reduce((sum, i) => sum + i.subtotal, 0);
  const shippingFee = subtotalAmount === 0 ? 0 : subtotalAmount >= 30000 ? 0 : 3000;
  const totalAmount = subtotalAmount + shippingFee;

  if (completedOrder) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            {completedOrder.is_test_order && (
              <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-extrabold text-amber-800">
                토스페이먼츠 테스트 모드 결제 완료
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              주문이 성공적으로 완료되었습니다!
            </h1>
            <p className="text-sm text-slate-500">
              주문번호: <strong className="text-cnu-navy">{completedOrder.order_number}</strong> · 주문일시:{' '}
              {formatKSTDate(completedOrder.created_at, true)}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-5 text-left text-xs sm:text-sm space-y-2 border border-slate-200/80">
            <div className="flex justify-between">
              <span className="text-slate-500">주문자 / 수령인</span>
              <span className="font-bold text-slate-900">
                {completedOrder.shipping_info.recipient_name} ({completedOrder.shipping_info.recipient_phone})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">배송지</span>
              <span className="font-bold text-slate-900">{completedOrder.shipping_address}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">결제 수단</span>
              <span className="font-bold text-slate-900">{completedOrder.payment_method}</span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <span className="font-bold text-slate-700">총 결제 승인 금액</span>
              <span className="text-lg font-black text-cnu-navy">
                {formatKRW(completedOrder.total_amount)}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link href="/mypage/orders" className="btn-primary flex-1 py-3">
              주문 내역 확인하기
            </Link>
            <Link href="/products" className="btn-secondary flex-1 py-3">
              쇼핑 계속하기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (detailedCart.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center space-y-4">
        <h1 className="text-2xl font-black text-slate-900">결제할 상품이 없습니다.</h1>
        <p className="text-sm text-slate-500">장바구니에 상품을 먼저 담아주세요.</p>
        <Link href="/products" className="btn-primary">
          상품 목록으로 이동
        </Link>
      </div>
    );
  }

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!recipientName.trim() || !recipientPhone.trim() || !address.trim()) {
      setError('수령인 이름, 연락처, 배송지 주소를 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 서버 측 결제 승인 및 금액 검증 API 호출
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: detailedCart.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            additional_price: i.additional_price,
            unit_price: i.unitPrice,
          })),
          paymentMethod,
          clientAmount: totalAmount,
        }),
      });

      const verifyData = await response.json();
      if (!response.ok || !verifyData.success) {
        setError(verifyData.message || '서버 결제 승인 검증에 실패했습니다.');
        setIsSubmitting(false);
        return;
      }

      const orderRes = createOrder({
        shipping_info: {
          recipient_name: recipientName.trim(),
          recipient_phone: recipientPhone.trim(),
          postal_code: postalCode.trim(),
          address: address.trim(),
          address_detail: addressDetail.trim(),
          memo: memo.trim(),
        },
        payment_method: verifyData.paymentMethod,
        payment_key: verifyData.paymentKey,
        is_test_order: Boolean(verifyData.isTestMode),
      });

      if (!orderRes.success || !orderRes.order) {
        setError(orderRes.message);
      } else {
        setCompletedOrder(orderRes.order);
      }
    } catch {
      setError('결제 처리 중 네트워크 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">주문 및 결제</h1>
        <p className="mt-1 text-sm text-slate-500">
          배송지 정보를 입력하고 토스페이먼츠 결제를 진행합니다.
        </p>
      </div>

      {/* Toss Payments Mode Banner */}
      {!isTossLiveConfigured && (
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs sm:text-sm font-black text-amber-950">
                [토스페이먼츠 테스트 결제 모드 동작 중]
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                현재 실제 토스페이먼츠 API 키가 설정되지 않아 실제 금전이 청구되지 않는 안전한 테스트 결제 모드로 작동하며, 서버 API(/api/payments/confirm)에서 결제 금액 및 재고 정합성을 검증합니다.
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-xl bg-amber-200 px-3 py-1 text-xs font-extrabold text-amber-950">
            TEST MODE
          </span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-bold text-rose-700">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handlePaymentSubmit} className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left: Shipping & Payment Method */}
        <div className="lg:col-span-7 space-y-6">
          {/* Shipping Address Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Truck className="h-5 w-5 text-cnu-navy" />
              배송지 정보
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="chk-name" className="block text-xs font-bold text-slate-700 mb-1">
                  수령인 이름 *
                </label>
                <input
                  id="chk-name"
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="김충남"
                  className="input-base"
                />
              </div>
              <div>
                <label htmlFor="chk-phone" className="block text-xs font-bold text-slate-700 mb-1">
                  수령인 연락처 *
                </label>
                <input
                  id="chk-phone"
                  type="tel"
                  required
                  value={recipientPhone}
                  onChange={(e) => setRecipientPhone(e.target.value)}
                  placeholder="010-2345-6789"
                  className="input-base"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label htmlFor="chk-zip" className="block text-xs font-bold text-slate-700 mb-1">
                  우편번호 *
                </label>
                <input
                  id="chk-zip"
                  type="text"
                  required
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="input-base"
                />
              </div>
              <div className="col-span-2">
                <label htmlFor="chk-addr" className="block text-xs font-bold text-slate-700 mb-1">
                  기본 주소 *
                </label>
                <input
                  id="chk-addr"
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="input-base"
                />
              </div>
            </div>

            <div>
              <label htmlFor="chk-detail" className="block text-xs font-bold text-slate-700 mb-1">
                상세 주소
              </label>
              <input
                id="chk-detail"
                type="text"
                value={addressDetail}
                onChange={(e) => setAddressDetail(e.target.value)}
                placeholder="동·호수 또는 단과대 건물/호실"
                className="input-base"
              />
            </div>

            <div>
              <label htmlFor="chk-memo" className="block text-xs font-bold text-slate-700 mb-1">
                배송 요청사항
              </label>
              <input
                id="chk-memo"
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                className="input-base"
              />
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-cnu-navy" />
                토스페이먼츠 결제 수단 선택
              </h2>
              <span className="text-xs font-bold text-sky-600">Toss Payments 보안결제</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {(['카드결제', '토스페이', '가상계좌'] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => setPaymentMethod(method)}
                  className={`rounded-2xl border p-4 text-center text-sm font-bold transition-all ${
                    paymentMethod === method
                      ? 'border-cnu-navy bg-cnu-navy text-white shadow-sm'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-600 flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-cnu-navy shrink-0 mt-0.5" />
              <p>
                결제 완료 여부는 브라우저 파라미터가 아닌 서버 결제 검증 엔드포인트에서 직접 확인하며, 동시에 재고 차감 트랜잭션이 실행됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Order Items & Final Payment Button */}
        <div className="lg:col-span-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-5 sticky top-24">
          <h2 className="text-lg font-black text-slate-900">
            주문 상품 정보 ({detailedCart.length}종)
          </h2>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto pr-1">
            {detailedCart.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-slate-900">{item.product?.name}</p>
                  <p className="text-slate-500">
                    {item.option_label} · {item.quantity}개
                  </p>
                </div>
                <span className="font-black text-slate-900">
                  {formatKRW(item.subtotal)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 pt-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>총 상품 금액</span>
              <span className="font-bold text-slate-900">{formatKRW(subtotalAmount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>배송비</span>
              <span className="font-bold text-slate-900">
                {shippingFee === 0 ? '무료 (0원)' : formatKRW(shippingFee)}
              </span>
            </div>
            <div className="flex justify-between items-baseline border-t border-slate-200 pt-3">
              <span className="text-base font-black text-slate-900">최종 결제 금액</span>
              <span className="text-2xl font-black text-cnu-navy">
                {formatKRW(totalAmount)}
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full py-4 text-base font-black gap-2"
          >
            <Lock className="h-4 w-4" />
            <span>
              {isSubmitting
                ? '서버 결제 승인 검증 중...'
                : `${formatKRW(totalAmount)} ${
                    isTossLiveConfigured ? '결제하기' : '테스트 결제하기'
                  }`}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
