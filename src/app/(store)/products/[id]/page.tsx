'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Sparkles,
  ShoppingBag,
  CreditCard,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Package,
  Truck,
  Heart,
  Ruler,
  MessageSquarePlus,
  Star,
  X,
  Wand2,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import {
  formatKRW,
  formatKSTDate,
  calculateDiscountRate,
  getEffectivePrice,
} from '@/lib/utils';
import { ProductArtwork } from '@/components/common/ProductArtwork';
import { ProductCard } from '@/components/store/ProductCard';
import { ProductOptionQuantitySelector } from '@/components/store/ProductOptionQuantitySelector';

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const {
    products,
    addToCart,
    wishlist,
    likeCounts,
    toggleWishlist,
    reviews,
    addReview,
    currentUser,
    setCartDrawerOpen,
  } = useStore();

  const product = products.find((p) => p.id === params?.id);

  const [selectedOptionId, setSelectedOptionId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAuthor, setReviewAuthor] = useState(currentUser?.name || '');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    if (product && product.options.length > 0 && !selectedOptionId) {
      setSelectedOptionId(product.options[0].id);
    }
  }, [product, selectedOptionId]);

  if (!product) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-2xl font-black text-slate-900">상품을 찾을 수 없습니다.</h1>
        <p className="mt-2 text-sm text-slate-500">
          삭제되었거나 존재하지 않는 상품 경로입니다.
        </p>
        <Link href="/products" className="btn-primary mt-6">
          전체 상품 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const selectedOption =
    product.options.find((o) => o.id === selectedOptionId) || product.options[0];
  const baseEffectivePrice = getEffectivePrice(product.price, product.sale_price);
  const additionalPrice = selectedOption?.additional_price || 0;
  const unitPrice = baseEffectivePrice + additionalPrice;
  const totalPrice = unitPrice * quantity;
  const discountRate = calculateDiscountRate(product.price, product.sale_price);

  const isSoldOut = product.stock <= 0 || product.status === 'sold_out';
  const isEnded = product.status === 'ended';
  const canPurchase = !isSoldOut && !isEnded;

  const isLiked = wishlist.includes(product.id);
  const likeCount = likeCounts[product.id] ?? 120;

  const productReviews = reviews.filter((r) => r.product_id === product.id);
  const avgRating =
    productReviews.length > 0
      ? (
          productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length
        ).toFixed(1)
      : '5.0';

  const handleQuantityChange = (next: number) => {
    if (next < 1) return;
    if (next > product.stock) {
      setFeedback({
        type: 'error',
        text: `현재 남은 재고(${product.stock}개)를 초과할 수 없습니다.`,
      });
      return;
    }
    setFeedback(null);
    setQuantity(next);
  };

  const handleAddToCart = () => {
    if (!canPurchase) return;
    const res = addToCart({
      product_id: product.id,
      option_id: selectedOption?.id,
      option_label: selectedOption
        ? `${selectedOption.option_name}: ${selectedOption.option_value}`
        : '기본 옵션',
      additional_price: additionalPrice,
      quantity,
    });

    setFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
    if (res.success) {
      setCartDrawerOpen(true);
    }
  };

  const handleBuyNow = () => {
    if (!canPurchase) return;
    const res = addToCart({
      product_id: product.id,
      option_id: selectedOption?.id,
      option_label: selectedOption
        ? `${selectedOption.option_name}: ${selectedOption.option_value}`
        : '기본 옵션',
      additional_price: additionalPrice,
      quantity,
    });

    if (res.success) {
      router.push('/checkout');
    } else {
      setFeedback({ type: 'error', text: res.message });
    }
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addReview({
      product_id: product.id,
      product_name: product.name,
      author: reviewAuthor || currentUser?.name || '익명 학우',
      rating: reviewRating,
      comment: reviewComment,
    });
    if (res.success) {
      setReviewComment('');
      setReviewModalOpen(false);
    } else {
      alert(res.message);
    }
  };

  const relatedProducts = products
    .filter(
      (p) =>
        p.category_id === product.category_id &&
        p.id !== product.id &&
        p.status !== 'hidden'
    )
    .slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-16">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-cnu-navy"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>상품 목록으로 돌아가기</span>
        </Link>
        <span className="text-xs text-slate-400">상품코드: {product.sku}</span>
      </div>

      {/* Main Product Section */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Left: Representative Image */}
        <div className="lg:col-span-6 space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm aspect-square">
            <ProductArtwork
              sku={product.sku}
              name={product.name}
              imageUrl={product.image_url}
              categoryName={product.category_name}
              isLimited={product.is_limited}
              className="h-full w-full"
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-slate-100 p-3.5 text-xs text-slate-600">
            <span>★ 평점 {avgRating} ({productReviews.length}개 구매 후기)</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setSizeGuideOpen(true)}
                className="inline-flex items-center gap-1 font-bold text-cnu-navy hover:underline"
              >
                <Ruler className="h-3.5 w-3.5" />
                <span>사이즈 가이드</span>
              </button>
              <Link
                href="/fitting"
                className="inline-flex items-center gap-1 font-bold text-cnu-blue hover:underline"
              >
                <Wand2 className="h-3.5 w-3.5" />
                <span>VR 가상 피팅룸 체험</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Purchase & Details */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Category & Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/categories/${product.category_slug}`}
                className="rounded-xl bg-cnu-navy/10 px-3 py-1 text-xs font-extrabold text-cnu-navy"
              >
                {product.category_name}
              </Link>
              {product.is_limited && (
                <span className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1 text-xs font-extrabold text-white shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  LIMITED EDITION (한정판)
                </span>
              )}
              {isEnded ? (
                <span className="rounded-xl bg-slate-800 px-3 py-1 text-xs font-bold text-white">
                  판매 기간 종료
                </span>
              ) : isSoldOut ? (
                <span className="rounded-xl bg-rose-700 px-3 py-1 text-xs font-bold text-white">
                  품절 (SOLD OUT)
                </span>
              ) : (
                <span className="rounded-xl bg-emerald-600 px-3 py-1 text-xs font-bold text-white">
                  판매중
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              {product.name}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              {product.description}
            </p>

            {/* Price Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
              {product.sale_price && product.sale_price < product.price ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>정상가</span>
                    <span className="line-through">{formatKRW(product.price)}</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-black text-rose-600">
                      {discountRate}%
                    </span>
                    <span className="text-3xl font-black text-slate-900">
                      {formatKRW(product.sale_price)}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                      할인 적용가
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">
                    {formatKRW(product.price)}
                  </span>
                </div>
              )}
            </div>

            {/* Limited Edition Exclusive Info Panel */}
            {product.is_limited && (
              <div className="rounded-2xl border-2 border-rose-200 bg-rose-50/70 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-sm font-black text-rose-700">
                    <Sparkles className="h-4 w-4" />
                    한정판 스페셜 에디션 안내
                  </span>
                  {isEnded || isSoldOut ? (
                    <span className="rounded-lg bg-rose-700 px-2.5 py-0.5 text-xs font-extrabold text-white">
                      판매 종료 안내
                    </span>
                  ) : (
                    <span className="rounded-lg bg-rose-600 px-2.5 py-0.5 text-xs font-extrabold text-white">
                      한정 판매 진행 중
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="rounded-xl bg-white p-3 border border-rose-100">
                    <p className="text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-rose-500" /> 판매 기간
                    </p>
                    <p className="mt-1 font-bold text-slate-900">
                      {product.start_at ? formatKSTDate(product.start_at) : '상시'} ~{' '}
                      {product.end_at ? formatKSTDate(product.end_at) : '소진 시'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-rose-100">
                    <p className="text-slate-500 flex items-center gap-1">
                      <Package className="h-3.5 w-3.5 text-rose-500" /> 총 한정 수량
                    </p>
                    <p className="mt-1 font-bold text-slate-900">
                      {product.limited_quantity || 100}개 한정 제작
                    </p>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-rose-100">
                    <p className="text-slate-500">현재 남은 재고</p>
                    <p className="mt-1 font-black text-rose-600 text-sm">
                      {product.stock}개 남음
                    </p>
                  </div>
                </div>
                {(isEnded || isSoldOut) && (
                  <p className="text-xs font-bold text-rose-800 bg-rose-100/80 rounded-xl px-3 py-2">
                    ※ 본 한정판 상품은 준비된 수량이 모두 소진되었거나 판매 기간이 종료되어 더 이상 구매할 수 없습니다.
                  </p>
                )}
              </div>
            )}

            {/* Stock & Shipping Info */}
            <div className="rounded-2xl bg-slate-100/80 p-4 space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold">재고 상태</span>
                <span className="font-bold text-slate-900">
                  {isSoldOut
                    ? '일시 품절 (재고 0개)'
                    : `주문 가능 (남은 수량: ${product.stock}개)`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-cnu-navy" /> 배송비 안내
                </span>
                <span>3,000원 (30,000원 이상 구매 시 무료배송)</span>
              </div>
            </div>

            {/* Option & Quantity Selection */}
            <ProductOptionQuantitySelector
              options={product.options}
              selectedOptionId={selectedOption?.id || ''}
              onSelectOption={(id) => setSelectedOptionId(id)}
              quantity={quantity}
              maxStock={product.stock}
              disabled={!canPurchase}
              onChangeQuantity={handleQuantityChange}
            />

            {/* Total Calculation */}
            <div className="flex items-baseline justify-between border-t border-slate-200 pt-4">
              <span className="text-sm font-bold text-slate-700">
                총 상품 금액 ({quantity}개)
              </span>
              <span className="text-2xl font-black text-cnu-navy">
                {formatKRW(totalPrice)}
              </span>
            </div>

            {/* Feedback Banner */}
            {feedback && (
              <div
                className={`flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-bold ${
                  feedback.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {feedback.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-rose-600" />
                  )}
                  <span>{feedback.text}</span>
                </div>
                {feedback.type === 'success' && (
                  <Link href="/cart" className="underline font-extrabold">
                    장바구니 이동 →
                  </Link>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => toggleWishlist(product.id)}
                title="위시리스트 찜하기"
                className={`inline-flex h-13 items-center justify-center gap-1.5 rounded-2xl border px-4 py-3.5 text-xs font-extrabold transition-colors ${
                  isLiked
                    ? 'border-rose-300 bg-rose-50 text-rose-600'
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>{likeCount}</span>
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!canPurchase}
                className="btn-secondary flex-1 py-3.5 text-sm sm:text-base font-bold gap-2 border-cnu-navy text-cnu-navy"
              >
                <ShoppingBag className="h-5 w-5" />
                <span>장바구니 담기</span>
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!canPurchase}
                className="btn-primary flex-1 py-3.5 text-sm sm:text-base font-bold gap-2"
              >
                <CreditCard className="h-5 w-5" />
                <span>{canPurchase ? '바로 구매하기' : '구매 불가'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Description & Detail Images Section */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 space-y-8">
        <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900">상품 상세 정보</h2>
          <button
            type="button"
            onClick={() => setSizeGuideOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
          >
            <Ruler className="h-4 w-4 text-cnu-navy" />
            <span>상세 사이즈 가이드</span>
          </button>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-700 leading-relaxed space-y-3">
            <h3 className="text-base font-bold text-cnu-navy">
              [CNU CHA CHA OFFICIAL] {product.name}
            </h3>
            <p>{product.detail_description || product.description}</p>
            <p className="text-xs text-slate-500">
              * 본 상품은 충남대학교 차차 공식 굿즈 스토어에서 판매하는 정품 굿즈입니다.
            </p>
          </div>

          {/* 상세 이미지 영역 */}
          <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-slate-200">
            <ProductArtwork
              sku={product.sku}
              name={`${product.name} 상세 이미지`}
              imageUrl={product.detail_images?.[0] || product.image_url}
              categoryName={product.category_name}
              isLimited={product.is_limited}
              className="aspect-[4/3] w-full"
            />
          </div>

          {/* 상품 기본 스펙 표 */}
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-left text-xs sm:text-sm">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <th className="w-1/3 bg-slate-50 px-4 py-3 font-bold text-slate-700">상품명</th>
                  <td className="px-4 py-3 text-slate-800">{product.name}</td>
                </tr>
                <tr>
                  <th className="bg-slate-50 px-4 py-3 font-bold text-slate-700">상품 코드 (SKU)</th>
                  <td className="px-4 py-3 text-slate-800">{product.sku}</td>
                </tr>
                <tr>
                  <th className="bg-slate-50 px-4 py-3 font-bold text-slate-700">카테고리</th>
                  <td className="px-4 py-3 text-slate-800">{product.category_name}</td>
                </tr>
                <tr>
                  <th className="bg-slate-50 px-4 py-3 font-bold text-slate-700">출시 등록일</th>
                  <td className="px-4 py-3 text-slate-800">{formatKSTDate(product.created_at)}</td>
                </tr>
                <tr>
                  <th className="bg-slate-50 px-4 py-3 font-bold text-slate-700">교환/반품 안내</th>
                  <td className="px-4 py-3 text-slate-800">
                    수령일로부터 7일 이내 마이페이지 또는 고객센터를 통해 신청 가능
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section (Integrated from clothing-market) */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900">구매 학우 실시간 리뷰</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-0.5 text-xs font-extrabold text-amber-700 border border-amber-200">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {avgRating} ({productReviews.length}개)
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              실제 차차 굿즈를 구매한 충남대 학우님들이 남겨주신 생생한 후기입니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReviewModalOpen(true)}
            className="btn-primary py-2.5 px-4 text-xs font-extrabold gap-1.5 self-start sm:self-auto"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span>리뷰 작성하기</span>
          </button>
        </div>

        {productReviews.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-10 text-center space-y-2">
            <p className="text-sm font-bold text-slate-700">
              아직 이 상품에 등록된 리뷰가 없습니다.
            </p>
            <p className="text-xs text-slate-400">
              첫 번째 리뷰를 작성하고 학우들과 후기를 공유해보세요!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productReviews.map((rev) => (
              <div
                key={rev.id}
                className="flex items-start justify-between gap-4 rounded-2xl border border-slate-200 p-5"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">{rev.author}</span>
                    <span className="text-xs text-amber-500">
                      {'★'.repeat(rev.rating)}
                      {'☆'.repeat(5 - rev.rating)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                  <p className="text-[11px] text-slate-400">{formatKSTDate(rev.created_at)}</p>
                </div>
                {rev.photo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={rev.photo_url}
                    alt="리뷰 썸네일"
                    className="h-14 w-14 shrink-0 rounded-xl border border-slate-100 bg-slate-50 object-contain p-1"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xl font-black text-slate-900">
            같은 카테고리의 추천 굿즈
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {/* Size Guide Modal */}
      {sizeGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl">
            <button
              type="button"
              onClick={() => setSizeGuideOpen(false)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-black text-cnu-navy mb-4 flex items-center gap-2">
              <Ruler className="h-4 w-4" />
              <span>사이즈 가이드 (단면 cm)</span>
            </h3>
            <table className="w-full text-xs text-center border-collapse border border-slate-200">
              <thead className="bg-slate-50 font-bold text-slate-700">
                <tr>
                  <th className="border border-slate-200 p-2.5">사이즈</th>
                  <th className="border border-slate-200 p-2.5">어깨너비</th>
                  <th className="border border-slate-200 p-2.5">가슴단면</th>
                  <th className="border border-slate-200 p-2.5">소매기장</th>
                  <th className="border border-slate-200 p-2.5">총장</th>
                </tr>
              </thead>
              <tbody className="text-slate-600">
                <tr>
                  <td className="border border-slate-200 p-2.5 font-black text-slate-900">S (90)</td>
                  <td className="border border-slate-200 p-2.5">48</td>
                  <td className="border border-slate-200 p-2.5">56</td>
                  <td className="border border-slate-200 p-2.5">62</td>
                  <td className="border border-slate-200 p-2.5">67</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 p-2.5 font-black text-slate-900">M (95)</td>
                  <td className="border border-slate-200 p-2.5">50</td>
                  <td className="border border-slate-200 p-2.5">58.5</td>
                  <td className="border border-slate-200 p-2.5">63.5</td>
                  <td className="border border-slate-200 p-2.5">70</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 p-2.5 font-black text-slate-900">L (100)</td>
                  <td className="border border-slate-200 p-2.5">52</td>
                  <td className="border border-slate-200 p-2.5">61</td>
                  <td className="border border-slate-200 p-2.5">65</td>
                  <td className="border border-slate-200 p-2.5">73</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 p-2.5 font-black text-slate-900">XL (105)</td>
                  <td className="border border-slate-200 p-2.5">54</td>
                  <td className="border border-slate-200 p-2.5">63.5</td>
                  <td className="border border-slate-200 p-2.5">66</td>
                  <td className="border border-slate-200 p-2.5">75</td>
                </tr>
              </tbody>
            </table>
            <p className="mt-3 text-[11px] text-slate-400 text-center">
              * 측정 위치 및 방법에 따라 1~2cm 오차가 발생할 수 있습니다. (인형류: 키링형 10cm / 기본 20~25cm)
            </p>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl">
            <button
              type="button"
              onClick={() => setReviewModalOpen(false)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-black text-cnu-navy mb-4">
              구매 후기 작성하기 ({product.name})
            </h3>
            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  작성자 성명 (또는 학과) *
                </label>
                <input
                  type="text"
                  required
                  value={reviewAuthor}
                  onChange={(e) => setReviewAuthor(e.target.value)}
                  placeholder="예: 김충남 (컴퓨터융합학부)"
                  className="input-base text-xs"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  별점 평가 (1 ~ 5점) *
                </label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="input-base text-xs font-bold"
                >
                  <option value={5}>★★★★★ (5점 - 최고예요)</option>
                  <option value={4}>★★★★☆ (4점 - 좋아요)</option>
                  <option value={3}>★★★☆☆ (3점 - 보통이에요)</option>
                  <option value={2}>★★☆☆☆ (2점 - 아쉬워요)</option>
                  <option value={1}>★☆☆☆☆ (1점 - 별로예요)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  후기 내용 *
                </label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="디자인, 퀄리티, 캠퍼스 활용도에 대한 솔직한 후기를 남겨주세요!"
                  className="input-base text-xs"
                />
              </div>
              <button type="submit" className="btn-primary w-full py-3 text-xs font-extrabold">
                리뷰 등록하기
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
