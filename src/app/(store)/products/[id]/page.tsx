'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Layers,
  Split,
  Eye,
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

interface GallerySlide {
  id: string;
  label: string;
  badge: string;
  largeSrc: string;
  thumbSrc: string;
  resolutionText: string;
  objectFit: 'contain' | 'cover';
  isAiEnhanced?: boolean;
}

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
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewAuthor, setReviewAuthor] = useState(currentUser?.name || '');
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState('');

  // Gallery, Zoom & Policy Inspection States
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [hoverZoomEnabled, setHoverZoomEnabled] = useState(false);
  const [hoverLensPos, setHoverLensPos] = useState({ x: 50, y: 50, active: false });

  const [zoomModalOpen, setZoomModalOpen] = useState(false);
  const [comparisonModalOpen, setComparisonModalOpen] = useState(false);
  const [modalZoomScale, setModalZoomScale] = useState<number>(1);
  const [modalPan, setModalPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({
    x: 0,
    y: 0,
    panX: 0,
    panY: 0,
  });
  const pinchDistanceRef = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);

  useEffect(() => {
    if (product && product.options.length > 0 && !selectedOptionId) {
      setSelectedOptionId(product.options[0].id);
    }
  }, [product, selectedOptionId]);

  useEffect(() => {
    setActiveSlideIndex(0);
    setModalZoomScale(1);
    setModalPan({ x: 0, y: 0 });
  }, [product?.id]);

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

  const mainLargeUrl = product.large_url || product.original_url || `/images/products/large/${product.id}.png`;
  const mainThumbUrl = product.thumbnail_url || `/images/products/thumbnail/${product.id}.png`;
  const lifestyleUrl = product.lifestyle_url || `/images/products/lifestyle/${product.id}.png`;
  const aiEnhancedUrl = product.ai_enhanced_url || `/images/products/ai_enhanced/${product.id}.png`;
  const extraCharUrl = product.gallery_images?.[2] || '/images/chacha/fitting_varsity.jpg';

  const gallerySlides: GallerySlide[] = [
    {
      id: 'studio-main',
      label: '스튜디오 정면 (1600×1600px)',
      badge: '1600×1600 HD 원본',
      largeSrc: mainLargeUrl,
      thumbSrc: mainThumbUrl,
      resolutionText: '1600 × 1600 px · object-fit: contain (원본 비율 보존)',
      objectFit: 'contain',
      isAiEnhanced: false,
    },
    {
      id: 'campus-lifestyle',
      label: '캠퍼스 연출 화보 (1600×2000px)',
      badge: '1600×2000 연출컷',
      largeSrc: lifestyleUrl,
      thumbSrc: lifestyleUrl,
      resolutionText: '1600 × 2000 px · object-fit: cover (라이프스타일 룩북)',
      objectFit: 'cover',
      isAiEnhanced: false,
    },
    {
      id: 'ai-enhanced-tier',
      label: 'AI 디테일 보정 그래픽 (1600×1600px)',
      badge: 'AI 그래픽 보정',
      largeSrc: aiEnhancedUrl,
      thumbSrc: aiEnhancedUrl,
      resolutionText: '1600 × 1600 px · AI 그래픽 보정 (외형/로고 왜곡 검수 완료)',
      objectFit: 'contain',
      isAiEnhanced: true,
    },
    {
      id: 'chacha-art',
      label: '뉴 차차 캐릭터 원화 (1024×1024px)',
      badge: '1024×1024 원화',
      largeSrc: extraCharUrl,
      thumbSrc: extraCharUrl,
      resolutionText: '1024 × 1024 px · object-fit: contain (무손실 공식 원화)',
      objectFit: 'contain',
      isAiEnhanced: false,
    },
  ];

  const activeSlide = gallerySlides[activeSlideIndex] || gallerySlides[0];

  const handlePrevSlide = () => {
    setActiveSlideIndex((prev) => (prev - 1 + gallerySlides.length) % gallerySlides.length);
    setModalZoomScale(1);
    setModalPan({ x: 0, y: 0 });
  };

  const handleNextSlide = () => {
    setActiveSlideIndex((prev) => (prev + 1) % gallerySlides.length);
    setModalZoomScale(1);
    setModalPan({ x: 0, y: 0 });
  };

  const openFullscreenZoom = () => {
    setModalZoomScale(1.5);
    setModalPan({ x: 0, y: 0 });
    setZoomModalOpen(true);
  };

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
      {/* Breadcrumb & Policy Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-600 hover:text-cnu-navy"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>상품 목록으로 돌아가기</span>
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {activeSlide.isAiEnhanced && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-violet-100 px-2.5 py-1 font-extrabold text-violet-800 border border-violet-300">
              <Wand2 className="h-3.5 w-3.5 text-violet-600" />
              <span>[정책 7] AI 그래픽 보정 표기</span>
            </span>
          )}
          <span className="text-slate-400">코드: {product.sku}</span>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        {/* Left: Gallery + Hover Zoom + Thumbnail Bar */}
        <div className="lg:col-span-6 space-y-4">
          <div
            className="group relative aspect-square w-full overflow-hidden rounded-3xl border border-slate-200 bg-[#F8FAFC] shadow-sm select-none cursor-zoom-in"
            onMouseMove={(e) => {
              if (!hoverZoomEnabled) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
              const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
              setHoverLensPos({ x, y, active: true });
            }}
            onMouseLeave={() => setHoverLensPos((prev) => ({ ...prev, active: false }))}
            onClick={() => openFullscreenZoom()}
          >
            {/* Stage Image */}
            <ProductArtwork
              sku={product.sku}
              name={product.name}
              imageUrl={activeSlide.largeSrc}
              thumbnailUrl={activeSlide.thumbSrc}
              largeUrl={activeSlide.largeSrc}
              originalUrl={product.original_url}
              categoryName={product.category_name}
              isLimited={product.is_limited}
              variant={activeSlide.objectFit === 'cover' ? 'lifestyle' : 'detail'}
              priority
              objectFit={activeSlide.objectFit}
              isAiEnhanced={activeSlide.isAiEnhanced}
              showAiBadge={activeSlide.isAiEnhanced}
              showResolutionBadge
              className="h-full w-full"
            />

            {/* Hover Lens Zoom (2.2x) */}
            {hoverZoomEnabled && hoverLensPos.active && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 z-20 bg-no-repeat"
                style={{
                  backgroundImage: `url(${activeSlide.largeSrc})`,
                  backgroundPosition: `${hoverLensPos.x}% ${hoverLensPos.y}%`,
                  backgroundSize: '220%',
                  backgroundColor: '#F8FAFC',
                }}
              />
            )}

            {/* Top Left Badge */}
            <div className="pointer-events-none absolute left-4 top-4 z-30 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900/80 px-3 py-1.5 text-xs font-extrabold text-white backdrop-blur-sm">
                <Layers className="h-3.5 w-3.5 text-sky-300" />
                {activeSlide.badge} ({activeSlideIndex + 1}/{gallerySlides.length})
              </span>
            </div>

            {/* Top Right Zoom / Inspection Controls */}
            <div
              className="absolute right-4 top-4 z-30 flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setHoverZoomEnabled((prev) => !prev)}
                className={`inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-extrabold shadow-sm transition-colors ${
                  hoverZoomEnabled ? 'bg-cnu-navy text-white' : 'bg-white/95 text-slate-700 hover:bg-white'
                }`}
              >
                <ZoomIn className="h-3.5 w-3.5" />
                <span>{hoverZoomEnabled ? '돋보기 ON' : '돋보기 켜기'}</span>
              </button>
              <button
                type="button"
                onClick={() => setComparisonModalOpen(true)}
                title="원본 vs 보정본 대조 확인"
                className="inline-flex items-center gap-1 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-extrabold text-violet-700 shadow-sm hover:bg-white"
              >
                <Split className="h-3.5 w-3.5" />
                <span>원본 대조</span>
              </button>
              <button
                type="button"
                onClick={() => openFullscreenZoom()}
                className="inline-flex items-center gap-1 rounded-xl bg-white/95 px-3 py-1.5 text-xs font-extrabold text-cnu-navy shadow-sm hover:bg-white"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                <span>확대 모달</span>
              </button>
            </div>

            {/* Arrows */}
            <button
              type="button"
              aria-label="이전 이미지"
              onClick={(e) => {
                e.stopPropagation();
                handlePrevSlide();
              }}
              className="absolute left-3 top-1/2 z-30 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label="다음 이미지"
              onClick={(e) => {
                e.stopPropagation();
                handleNextSlide();
              }}
              className="absolute right-3 top-1/2 z-30 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-800 shadow-md transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Thumbnail Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500 px-1">
              <span className="font-bold text-slate-700">
                선택된 이미지: {activeSlide.label}
              </span>
              <span className="text-[11px] text-slate-400">{activeSlide.resolutionText}</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {gallerySlides.map((slide, idx) => {
                const isSelected = idx === activeSlideIndex;
                return (
                  <button
                    key={slide.id}
                    type="button"
                    onClick={() => setActiveSlideIndex(idx)}
                    className={`group relative aspect-square overflow-hidden rounded-2xl border-2 bg-[#F8FAFC] transition-all ${
                      isSelected
                        ? 'border-cnu-navy ring-2 ring-cnu-navy/25 shadow-sm'
                        : 'border-slate-200 opacity-75 hover:opacity-100 hover:border-slate-300'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slide.thumbSrc}
                      alt={slide.label}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: slide.objectFit,
                      }}
                    />
                    <span className="absolute bottom-1.5 inset-x-1 truncate rounded-lg bg-slate-900/80 px-1 py-0.5 text-[9px] font-bold text-white text-center">
                      {slide.badge}
                    </span>
                  </button>
                );
              })}
            </div>
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
                <span>VR 가상 피팅룸</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right: Purchase & Details */}
        <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
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
                  한정판
                </span>
              )}
              {isEnded ? (
                <span className="rounded-xl bg-slate-800 px-3 py-1 text-xs font-bold text-white">판매 종료</span>
              ) : isSoldOut ? (
                <span className="rounded-xl bg-rose-700 px-3 py-1 text-xs font-bold text-white">품절</span>
              ) : (
                <span className="rounded-xl bg-emerald-600 px-3 py-1 text-xs font-bold text-white">판매중</span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{product.name}</h1>
            <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>

            {/* Price Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-2">
              {product.sale_price && product.sale_price < product.price ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span>정상가</span>
                    <span className="line-through">{formatKRW(product.price)}</span>
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-black text-rose-600">{discountRate}%</span>
                    <span className="text-3xl font-black text-slate-900">{formatKRW(product.sale_price)}</span>
                  </div>
                </>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-slate-900">{formatKRW(product.price)}</span>
                </div>
              )}
            </div>

            {/* Stock & Shipping */}
            <div className="rounded-2xl bg-slate-100/80 p-4 space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="font-semibold">재고 상태</span>
                <span className="font-bold text-slate-900">
                  {isSoldOut ? '일시 품절 (0개)' : `주문 가능 (남은 수량: ${product.stock}개)`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-cnu-navy" /> 배송비 안내
                </span>
                <span>3,000원 (30,000원 이상 구매 시 무료배송)</span>
              </div>
            </div>

            {/* Option & Quantity */}
            <ProductOptionQuantitySelector
              options={product.options}
              selectedOptionId={selectedOption?.id || ''}
              onSelectOption={(id) => setSelectedOptionId(id)}
              quantity={quantity}
              maxStock={product.stock}
              disabled={!canPurchase}
              onChangeQuantity={handleQuantityChange}
            />

            {/* Total */}
            <div className="flex items-baseline justify-between border-t border-slate-200 pt-4">
              <span className="text-sm font-bold text-slate-700">총 상품 금액 ({quantity}개)</span>
              <span className="text-2xl font-black text-cnu-navy">{formatKRW(totalPrice)}</span>
            </div>

            {/* Feedback */}
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
                  isLiked ? 'border-rose-300 bg-rose-50 text-rose-600' : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
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

      {/* Description & Policy Verification Section */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 space-y-8">
        <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-slate-900">상품 상세 정보 및 고해상도 룩북</h2>
            <p className="mt-1 text-xs text-slate-500">
              1600px 스튜디오 정면 컷과 1600×2000 캠퍼스 연출 화보를 고화질로 제공합니다.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setComparisonModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-cnu-navy px-3.5 py-2 text-xs font-bold text-white hover:bg-cnu-blue"
          >
            <Split className="h-4 w-4" />
            <span>원본 vs AI 보정본 대조</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-2">
            <span className="font-bold text-xs text-slate-700">1. 스튜디오 정면 컷 (1600×1600px · contain)</span>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-[#F8FAFC] aspect-square">
              <ProductArtwork
                sku={product.sku}
                name={`${product.name} 상세`}
                imageUrl={mainLargeUrl}
                thumbnailUrl={mainThumbUrl}
                largeUrl={mainLargeUrl}
                variant="detail"
                objectFit="contain"
                showResolutionBadge
                className="h-full w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <span className="font-bold text-xs text-slate-700">2. 캠퍼스 라이프스타일 컷 (1600×2000px · cover)</span>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 aspect-[4/5]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={lifestyleUrl}
                alt={`${product.name} 연출`}
                loading="lazy"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>

        {/* Policy 8: Legacy Preservation Notice */}
        {product.legacy_lowres_url && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 flex flex-col sm:flex-row items-center justify-between gap-5 text-xs text-amber-950">
            <div className="space-y-1.5">
              <p className="font-black text-sm flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>기존 원본 보존 및 고화질 리소스 제공 안내</span>
              </p>
              <p className="leading-relaxed text-amber-800">
                기존 파일({product.legacy_lowres_url})은 원본 해상도가 <strong>125×125px</strong>로 매우 낮아,
                인위적 확대 시 발생할 수 있는 왜곡 및 블러를 방지하기 위해 기존 파일은{' '}
                <code>legacy_original/</code>에 무손실 보존하고, 공식 1024px 원화 기반 1600px HD 리소스를 제공합니다.
              </p>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-1.5 rounded-2xl border border-amber-200 bg-white p-3">
              <span className="text-[10px] font-extrabold text-slate-500">기존 원본 1:1 실제 크기 (125×125px)</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.legacy_lowres_url}
                alt="기존 원본"
                style={{ width: '125px', height: '125px', objectFit: 'contain' }}
                className="rounded-lg border border-slate-100 bg-slate-50"
              />
            </div>
          </div>
        )}
      </section>

      {/* Customer Reviews */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-black text-slate-900">구매 학우 실시간 리뷰</h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-0.5 text-xs font-extrabold text-amber-700 border border-amber-200">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {avgRating} ({productReviews.length}개)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setReviewModalOpen(true)}
            className="btn-primary py-2.5 px-4 text-xs font-extrabold gap-1.5"
          >
            <MessageSquarePlus className="h-4 w-4" />
            <span>리뷰 작성</span>
          </button>
        </div>

        {productReviews.length === 0 ? (
          <div className="rounded-2xl bg-slate-50 p-10 text-center text-xs text-slate-400">
            등록된 리뷰가 없습니다. 첫 리뷰를 작성해보세요!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {productReviews.map((rev) => (
              <div key={rev.id} className="rounded-2xl border border-slate-200 p-5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-900">{rev.author}</span>
                  <span className="text-amber-500">{'★'.repeat(rev.rating)}</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                <p className="text-[11px] text-slate-400">{formatKSTDate(rev.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-xl font-black text-slate-900">추천 굿즈</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}

      {/* Policy 6: Side-by-Side Comparison Inspector Modal (원본 vs AI 보정본 4대 검수) */}
      {comparisonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm select-none">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                  <Split className="h-4 w-4 text-violet-600" />
                  <span>원본 vs AI 보정본 디테일 대조</span>
                </h3>
                <p className="text-xs text-slate-500">
                  캐릭터 외형(실루엣), 색상, 로고, 제품 형태 왜곡 여부를 나란히 대조합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setComparisonModalOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Split View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <span className="font-extrabold text-xs text-slate-700 block">
                  A. 원본 이미지 (Original · 1600×1600px)
                </span>
                <div className="aspect-square overflow-hidden rounded-xl bg-white border border-slate-200 flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={mainLargeUrl} alt="원본" className="h-full w-full object-contain" />
                </div>
                <span className="text-[11px] text-slate-400 block text-center">
                  무변형 원본 그래픽 (Policy 2 & 8 보존)
                </span>
              </div>

              <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-violet-900">
                    B. AI 디테일 보정본 (AI Enhanced)
                  </span>
                  <span className="rounded-md bg-violet-200 px-2 py-0.5 text-[10px] font-black text-violet-800">
                    AI 그래픽 보정
                  </span>
                </div>
                <div className="aspect-square overflow-hidden rounded-xl bg-white border border-violet-200 flex items-center justify-center p-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={aiEnhancedUrl} alt="AI 보정본" className="h-full w-full object-contain" />
                </div>
                <span className="text-[11px] text-violet-600 block text-center">
                  [정책 7] 실물 사진 오인 방지 배지 부착됨
                </span>
              </div>
            </div>

            {/* 4 Inspection Checkpoints (정책 6) */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
              <p className="font-black text-slate-900">4대 검수 점검 항목:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle2 className="h-4 w-4" /> 1. 캐릭터 외형(실루엣, 귀/볼선) 변형 없음
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle2 className="h-4 w-4" /> 2. CNU 시그니처 네이비 및 고유 색상 일치
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle2 className="h-4 w-4" /> 3. 충남대학교 로고 및 텍스트 찌그러짐 없음
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <CheckCircle2 className="h-4 w-4" /> 4. 제품 본체 형태 및 비율 왜곡 없음
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setComparisonModalOpen(false)}
                className="btn-primary text-xs"
              >
                검수 완료 및 닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen High-Res Zoom Modal */}
      {zoomModalOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 text-white backdrop-blur-md select-none"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setZoomModalOpen(false);
            if (e.key === 'ArrowLeft') handlePrevSlide();
            if (e.key === 'ArrowRight') handleNextSlide();
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">
                {product.name} — {activeSlide.label}
              </h3>
              <p className="text-[11px] text-slate-400">
                휠/버튼 확대 · 드래그 이동 · 모바일 두 손가락 핀치 줌 & 더블탭 지원
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setModalZoomScale((s) => Math.max(1, Number((s - 0.5).toFixed(2))))}
                className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20"
              >
                <ZoomOut className="h-4 w-4" />
                <span>축소</span>
              </button>
              <span className="min-w-[54px] text-center text-xs font-black text-sky-300">
                {Math.round(modalZoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setModalZoomScale((s) => Math.min(3.5, Number((s + 0.5).toFixed(2))))}
                className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20"
              >
                <ZoomIn className="h-4 w-4" />
                <span>확대</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setModalZoomScale(1);
                  setModalPan({ x: 0, y: 0 });
                }}
                className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold hover:bg-white/20"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>초기화</span>
              </button>
              <button
                type="button"
                onClick={() => setZoomModalOpen(false)}
                className="inline-flex items-center justify-center rounded-xl bg-rose-600 p-2 text-white hover:bg-rose-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div
            className="relative flex-1 overflow-hidden flex items-center justify-center touch-none"
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY < 0 ? 0.25 : -0.25;
              setModalZoomScale((s) => Math.max(1, Math.min(3.5, Number((s + delta).toFixed(2)))));
            }}
            onMouseDown={(e) => {
              if (modalZoomScale <= 1) return;
              setIsDraggingModal(true);
              dragStartRef.current = {
                x: e.clientX,
                y: e.clientY,
                panX: modalPan.x,
                panY: modalPan.y,
              };
            }}
            onMouseMove={(e) => {
              if (!isDraggingModal) return;
              const dx = e.clientX - dragStartRef.current.x;
              const dy = e.clientY - dragStartRef.current.y;
              setModalPan({
                x: dragStartRef.current.panX + dx,
                y: dragStartRef.current.panY + dy,
              });
            }}
            onMouseUp={() => setIsDraggingModal(false)}
            onMouseLeave={() => setIsDraggingModal(false)}
            onTouchStart={(e) => {
              if (e.touches.length === 2) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                pinchDistanceRef.current = Math.hypot(dx, dy);
              } else if (e.touches.length === 1) {
                const now = Date.now();
                if (now - lastTapRef.current < 300) {
                  setModalZoomScale((s) => (s > 1 ? 1 : 2.2));
                  setModalPan({ x: 0, y: 0 });
                }
                lastTapRef.current = now;
                dragStartRef.current = {
                  x: e.touches[0].clientX,
                  y: e.touches[0].clientY,
                  panX: modalPan.x,
                  panY: modalPan.y,
                };
              }
            }}
            onTouchMove={(e) => {
              if (e.touches.length === 2 && pinchDistanceRef.current) {
                const dx = e.touches[0].clientX - e.touches[1].clientX;
                const dy = e.touches[0].clientY - e.touches[1].clientY;
                const dist = Math.hypot(dx, dy);
                const ratio = dist / pinchDistanceRef.current;
                setModalZoomScale((s) => Math.max(1, Math.min(3.5, Number((s * ratio).toFixed(2)))));
                pinchDistanceRef.current = dist;
              } else if (e.touches.length === 1 && modalZoomScale > 1) {
                const dx = e.touches[0].clientX - dragStartRef.current.x;
                const dy = e.touches[0].clientY - dragStartRef.current.y;
                setModalPan({
                  x: dragStartRef.current.panX + dx,
                  y: dragStartRef.current.panY + dy,
                });
              }
            }}
            onTouchEnd={() => {
              pinchDistanceRef.current = null;
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeSlide.largeSrc}
              alt={activeSlide.label}
              draggable={false}
              style={{
                transform: `translate(${modalPan.x}px, ${modalPan.y}px) scale(${modalZoomScale})`,
                transition: isDraggingModal ? 'none' : 'transform 150ms ease-out',
                maxHeight: '82vh',
                maxWidth: '90vw',
                objectFit: 'contain',
              }}
              className="rounded-2xl shadow-2xl"
            />
          </div>
        </div>
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
                  <th className="border border-slate-200 p-2.5">어깨</th>
                  <th className="border border-slate-200 p-2.5">가슴</th>
                  <th className="border border-slate-200 p-2.5">소매</th>
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
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-3xl bg-white p-6 sm:p-7 shadow-2xl">
            <button
              type="button"
              onClick={() => setReviewModalOpen(false)}
              className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-base font-black text-cnu-navy mb-4">구매 후기 작성 ({product.name})</h3>
            <form onSubmit={handleSubmitReview} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">작성자 *</label>
                <input
                  type="text"
                  required
                  value={reviewAuthor}
                  onChange={(e) => setReviewAuthor(e.target.value)}
                  placeholder="예: 김충남"
                  className="input-base"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">별점 *</label>
                <select
                  value={reviewRating}
                  onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="input-base font-bold"
                >
                  <option value={5}>★★★★★ (5점)</option>
                  <option value={4}>★★★★☆ (4점)</option>
                  <option value={3}>★★★☆☆ (3점)</option>
                  <option value={2}>★★☆☆☆ (2점)</option>
                  <option value={1}>★☆☆☆☆ (1점)</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">후기 내용 *</label>
                <textarea
                  rows={4}
                  required
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="디자인 및 품질에 대한 솔직한 후기를 남겨주세요!"
                  className="input-base"
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
