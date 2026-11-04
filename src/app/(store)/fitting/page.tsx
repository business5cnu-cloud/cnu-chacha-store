'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  RotateCcw,
  ShoppingBag,
  CreditCard,
  ArrowLeft,
  Leaf,
  CheckCircle2,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { formatKRW, getEffectivePrice } from '@/lib/utils';

type OutfitKey = 'none' | 'varsity' | 'graduation' | 'hoodie' | 'vest' | 'dungarees';
type HatKey = 'none' | 'grad_cap' | 'ballcap' | 'cherry';
type AccKey = 'none' | 'crossbag' | 'diploma';
type WardrobeTab = 'outfit' | 'hat' | 'acc';

const BASE_DOLL_PRICE = 18000;

const OUTFIT_ITEMS: {
  key: OutfitKey;
  emoji: string;
  name: string;
  desc: string;
  price: number;
}[] = [
  { key: 'none', emoji: '❌', name: '미착용', desc: '기본 차차 몸체', price: 0 },
  { key: 'varsity', emoji: '⚾', name: '충남대 과잠', desc: '네이비 & 레더 패치', price: 14000 },
  { key: 'graduation', emoji: '🎓', name: '학사복 & 리본', desc: '졸업 시즌 에디션', price: 16000 },
  { key: 'hoodie', emoji: '👕', name: 'CNU 후드티', desc: '캐주얼 데일리 후드', price: 12000 },
  { key: 'vest', emoji: '🦺', name: '프레피 니트 조끼', desc: 'V넥 셔츠 & 타이', price: 13000 },
  { key: 'dungarees', emoji: '👖', name: '레트로 멜빵바지', desc: '워싱 데님 오버롤', price: 12500 },
];

const HAT_ITEMS: {
  key: HatKey;
  emoji: string;
  name: string;
  desc: string;
  price: number;
}[] = [
  { key: 'none', emoji: '❌', name: '모자 미착용', desc: '기본 귀 노출', price: 0 },
  { key: 'grad_cap', emoji: '🎓', name: '골드 태슬 학사모', desc: '졸업 기념 사각모', price: 7000 },
  { key: 'ballcap', emoji: '🧢', name: 'CNU 시그니처 볼캡', desc: '네이비 자수 캡', price: 6000 },
  { key: 'cherry', emoji: '🌸', name: '캠퍼스 벚꽃 화관', desc: '봄 축제 에디션', price: 5000 },
];

const ACC_ITEMS: {
  key: AccKey;
  emoji: string;
  name: string;
  desc: string;
  price: number;
}[] = [
  { key: 'none', emoji: '❌', name: '소품 없음', desc: '기본 포즈', price: 0 },
  { key: 'crossbag', emoji: '👜', name: '차차 미니 크로스백', desc: '네이비 메신저백', price: 5500 },
  { key: 'diploma', emoji: '📜', name: '충남대학교 졸업장', desc: '학위기 롤 소품', price: 4000 },
];

export default function VirtualFittingRoomPage() {
  const router = useRouter();
  const { products, addToCart } = useStore();

  const [activeTab, setActiveTab] = useState<WardrobeTab>('outfit');
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitKey>('varsity');
  const [selectedHat, setSelectedHat] = useState<HatKey>('none');
  const [selectedAcc, setSelectedAcc] = useState<AccKey>('none');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const outfitObj = OUTFIT_ITEMS.find((i) => i.key === selectedOutfit)!;
  const hatObj = HAT_ITEMS.find((i) => i.key === selectedHat)!;
  const accObj = ACC_ITEMS.find((i) => i.key === selectedAcc)!;

  const totalCoordinatePrice =
    BASE_DOLL_PRICE + outfitObj.price + hatObj.price + accObj.price;

  const coordinateParts = ['차차 기본 인형'];
  if (selectedOutfit !== 'none') coordinateParts.push(outfitObj.name);
  if (selectedHat !== 'none') coordinateParts.push(hatObj.name);
  if (selectedAcc !== 'none') coordinateParts.push(accObj.name);
  const coordinateSummaryName = coordinateParts.join(' + ');

  const handleReset = () => {
    setSelectedOutfit('none');
    setSelectedHat('none');
    setSelectedAcc('none');
  };

  const addCoordinateToStoreCart = (goToCheckout = false) => {
    const targetProduct =
      products.find((p) => p.id === 'prod-custom-doll') || products[0];
    if (!targetProduct) return;

    const baseProdPrice = getEffectivePrice(
      targetProduct.price,
      targetProduct.sale_price
    );
    const additionalPrice = totalCoordinatePrice - baseProdPrice;

    const res = addToCart({
      product_id: targetProduct.id,
      option_id: `fit-${selectedOutfit}-${selectedHat}-${selectedAcc}`,
      option_label: `VR 피팅 코디: ${coordinateSummaryName}`,
      additional_price: additionalPrice,
      quantity: 1,
    });

    if (res.success) {
      if (goToCheckout) {
        router.push('/checkout');
      } else {
        setToastMsg(`[${coordinateSummaryName}] 코디 세트가 장바구니에 담겼습니다!`);
        setTimeout(() => setToastMsg(null), 4000);
      }
    } else {
      alert(res.message);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-8">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-cnu-navy mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>메인 쇼핑몰로 돌아가기</span>
          </Link>
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-cnu-blue border border-blue-200">
              <span className="h-2 w-2 rounded-full bg-cnu-blue animate-ping" />
              VR 가상 옷입히기 피팅룸
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              차차 가상 전시관 & 커스텀 옷장
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            차차에게 충남대학교 과잠, 학사복, 후드티와 모자·소품을 자유롭게 입혀보고 나만의 코디 세트를 바로 주문해보세요.
          </p>
        </div>
      </div>

      {toastMsg && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 text-xs sm:text-sm font-bold text-emerald-900 shadow-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
          <Link href="/cart" className="underline font-extrabold text-cnu-navy ml-4 shrink-0">
            장바구니 바로가기 →
          </Link>
        </div>
      )}

      {/* Main Fitting Room Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Left: Interactive ChaCha Mascot Stage */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col items-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cnu-navy/10 px-3 py-1 text-xs font-extrabold text-cnu-navy">
              🐴 VIRTUAL DRESSING STAGE
            </span>
            <span className="text-xs font-semibold text-slate-400">
              실시간 레이어 프리뷰
            </span>
          </div>

          {/* Stage Backdrop */}
          <div className="relative flex h-96 sm:h-[420px] w-full items-center justify-center rounded-2xl border border-sky-100 bg-gradient-to-b from-sky-50/70 via-white to-slate-50">
            {/* Floor shadow */}
            <div className="absolute bottom-8 h-8 w-60 rounded-full bg-blue-950/10 blur-md" />

            {/* Interactive SVG Character */}
            <div className="relative z-10 flex h-80 w-72 items-center justify-center transition-transform duration-300">
              {/* 1. Base ChaCha Character SVG */}
              <svg viewBox="0 0 200 220" className="h-full w-full drop-shadow-md">
                {/* Ears */}
                <polygon
                  points="55,45 40,15 75,35"
                  fill="#FFFFFF"
                  stroke="#003876"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <polygon points="50,40 43,22 68,34" fill="#DCEBFF" />
                <polygon
                  points="145,45 160,15 125,35"
                  fill="#FFFFFF"
                  stroke="#003876"
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
                <polygon points="150,40 157,22 132,34" fill="#DCEBFF" />

                {/* Mane (Blue hair puff) */}
                <path
                  d="M70,30 Q90,5 110,25 Q130,10 135,35 Q110,38 70,30 Z"
                  fill="#1E5BBB"
                  stroke="#003876"
                  strokeWidth="2.5"
                />

                {/* Head */}
                <ellipse
                  cx="100"
                  cy="85"
                  rx="55"
                  ry="48"
                  fill="#FFFFFF"
                  stroke="#003876"
                  strokeWidth="3.5"
                />

                {/* Blush Cheeks */}
                <circle cx="68" cy="95" r="7" fill="#FFB6C1" opacity="0.6" />
                <circle cx="132" cy="95" r="7" fill="#FFB6C1" opacity="0.6" />

                {/* Eyes */}
                <ellipse cx="80" cy="80" rx="5" ry="7" fill="#003876" />
                <circle cx="82" cy="78" r="2" fill="#FFFFFF" />
                <ellipse cx="120" cy="80" rx="5" ry="7" fill="#003876" />
                <circle cx="122" cy="78" r="2" fill="#FFFFFF" />

                {/* Cute Muzzle & Smile */}
                <ellipse cx="100" cy="98" rx="14" ry="9" fill="#EBF3FF" />
                <circle cx="96" cy="96" r="1.5" fill="#003876" />
                <circle cx="104" cy="96" r="1.5" fill="#003876" />
                <path
                  d="M96,101 Q100,105 104,101"
                  fill="none"
                  stroke="#003876"
                  strokeWidth="2"
                  strokeLinecap="round"
                />

                {/* Body */}
                <path
                  d="M65,120 Q100,115 135,120 Q150,180 130,195 Q100,200 70,195 Q50,180 65,120 Z"
                  fill="#FFFFFF"
                  stroke="#003876"
                  strokeWidth="3.5"
                />

                {/* Arms */}
                <ellipse
                  cx="58"
                  cy="150"
                  rx="12"
                  ry="18"
                  fill="#FFFFFF"
                  stroke="#003876"
                  strokeWidth="3"
                  transform="rotate(20 58 150)"
                />
                <ellipse
                  cx="142"
                  cy="150"
                  rx="12"
                  ry="18"
                  fill="#FFFFFF"
                  stroke="#003876"
                  strokeWidth="3"
                  transform="rotate(-20 142 150)"
                />

                {/* Feet */}
                <ellipse
                  cx="80"
                  cy="195"
                  rx="14"
                  ry="10"
                  fill="#FFFFFF"
                  stroke="#003876"
                  strokeWidth="3"
                />
                <ellipse
                  cx="120"
                  cy="195"
                  rx="14"
                  ry="10"
                  fill="#FFFFFF"
                  stroke="#003876"
                  strokeWidth="3"
                />

                {/* Belly Patch */}
                <ellipse cx="100" cy="160" rx="22" ry="25" fill="#F0F7FF" />
              </svg>

              {/* 2. Outfit Overlay Layer */}
              <div className="pointer-events-none absolute inset-0">
                {selectedOutfit === 'varsity' && (
                  <svg viewBox="0 0 200 220" className="h-full w-full">
                    <path
                      d="M62,125 Q100,120 138,125 L145,185 Q100,190 55,185 Z"
                      fill="#003876"
                      stroke="#002244"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M48,135 Q55,160 52,175 L62,165 Z"
                      fill="#FFFFFF"
                      stroke="#002244"
                      strokeWidth="2"
                    />
                    <path
                      d="M152,135 Q145,160 148,175 L138,165 Z"
                      fill="#FFFFFF"
                      stroke="#002244"
                      strokeWidth="2"
                    />
                    <circle cx="100" cy="140" r="2.5" fill="#FFFFFF" />
                    <circle cx="100" cy="155" r="2.5" fill="#FFFFFF" />
                    <circle cx="100" cy="170" r="2.5" fill="#FFFFFF" />
                    <text
                      x="78"
                      y="152"
                      fontFamily="Arial, sans-serif"
                      fontWeight="900"
                      fontSize="14"
                      fill="#FFFFFF"
                    >
                      C
                    </text>
                    <path
                      d="M58,185 Q100,190 142,185"
                      stroke="#FFFFFF"
                      strokeWidth="3"
                      strokeDasharray="4 2"
                    />
                  </svg>
                )}

                {selectedOutfit === 'graduation' && (
                  <svg viewBox="0 0 200 220" className="h-full w-full">
                    <path
                      d="M58,123 Q100,118 142,123 L148,195 Q100,200 52,195 Z"
                      fill="#1A1A1A"
                      stroke="#000000"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M78,122 L100,155 L122,122"
                      fill="#003876"
                      stroke="#F1C40F"
                      strokeWidth="2"
                    />
                    <circle cx="100" cy="132" r="4" fill="#E74C3C" />
                  </svg>
                )}

                {selectedOutfit === 'hoodie' && (
                  <svg viewBox="0 0 200 220" className="h-full w-full">
                    <path
                      d="M60,123 Q100,118 140,123 L145,188 Q100,192 55,188 Z"
                      fill="#1E5BBB"
                      stroke="#003876"
                      strokeWidth="2.5"
                    />
                    <ellipse cx="100" cy="122" rx="35" ry="10" fill="#003876" />
                    <rect x="80" y="158" width="40" height="22" rx="4" fill="#164996" />
                    <text
                      x="100"
                      y="146"
                      textAnchor="middle"
                      fontFamily="Arial, sans-serif"
                      fontWeight="bold"
                      fontSize="9"
                      fill="#FFFFFF"
                    >
                      CNU
                    </text>
                  </svg>
                )}

                {selectedOutfit === 'vest' && (
                  <svg viewBox="0 0 200 220" className="h-full w-full">
                    <path
                      d="M68,122 Q100,118 132,122 L135,185 Q100,190 65,185 Z"
                      fill="#FFFFFF"
                      stroke="#CCCCCC"
                      strokeWidth="2"
                    />
                    <path
                      d="M70,124 L85,150 L115,150 L130,124 L138,180 Q100,185 62,180 Z"
                      fill="#FBF8E6"
                      stroke="#003876"
                      strokeWidth="2"
                    />
                    <polygon points="98,126 102,126 104,148 100,152 96,148" fill="#003876" />
                  </svg>
                )}

                {selectedOutfit === 'dungarees' && (
                  <svg viewBox="0 0 200 220" className="h-full w-full">
                    <rect
                      x="74"
                      y="125"
                      width="8"
                      height="40"
                      rx="2"
                      fill="#3B71CA"
                      stroke="#1D4ED8"
                      strokeWidth="1.5"
                    />
                    <rect
                      x="118"
                      y="125"
                      width="8"
                      height="40"
                      rx="2"
                      fill="#3B71CA"
                      stroke="#1D4ED8"
                      strokeWidth="1.5"
                    />
                    <circle cx="78" cy="155" r="2.5" fill="#F59E0B" />
                    <circle cx="122" cy="155" r="2.5" fill="#F59E0B" />
                    <path
                      d="M72,150 L128,150 L138,192 Q100,198 62,192 Z"
                      fill="#3B71CA"
                      stroke="#1D4ED8"
                      strokeWidth="2"
                    />
                    <rect x="88" y="160" width="24" height="16" rx="2" fill="#2563EB" />
                  </svg>
                )}
              </div>

              {/* 3. Hat Overlay Layer */}
              <div className="pointer-events-none absolute inset-0">
                {selectedHat === 'grad_cap' && (
                  <svg viewBox="0 0 200 220" className="h-full w-full">
                    <polygon
                      points="100,15 155,30 100,45 45,30"
                      fill="#111111"
                      stroke="#000000"
                      strokeWidth="2"
                    />
                    <rect x="82" y="38" width="36" height="12" rx="3" fill="#1A1A1A" />
                    <circle cx="100" cy="30" r="3" fill="#F1C40F" />
                    <path
                      d="M100,30 Q125,32 135,48 L138,62"
                      fill="none"
                      stroke="#F1C40F"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <circle cx="138" cy="62" r="3" fill="#F1C40F" />
                  </svg>
                )}

                {selectedHat === 'ballcap' && (
                  <svg viewBox="0 0 200 220" className="h-full w-full">
                    <path
                      d="M68,48 Q100,20 132,48 Q145,55 140,58 L60,58 Q55,55 68,48 Z"
                      fill="#003876"
                      stroke="#002244"
                      strokeWidth="2"
                    />
                    <ellipse cx="100" cy="58" rx="42" ry="7" fill="#002244" />
                    <text
                      x="100"
                      y="44"
                      textAnchor="middle"
                      fontFamily="Arial, sans-serif"
                      fontWeight="900"
                      fontSize="8"
                      fill="#FFFFFF"
                    >
                      CNU
                    </text>
                  </svg>
                )}

                {selectedHat === 'cherry' && (
                  <svg viewBox="0 0 200 220" className="h-full w-full">
                    <circle cx="70" cy="40" r="7" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="1.5" />
                    <circle cx="85" cy="34" r="7" fill="#FFC0CB" stroke="#FF69B4" strokeWidth="1.5" />
                    <circle cx="100" cy="30" r="8" fill="#FF69B4" stroke="#C71585" strokeWidth="1.5" />
                    <circle cx="115" cy="34" r="7" fill="#FFC0CB" stroke="#FF69B4" strokeWidth="1.5" />
                    <circle cx="130" cy="40" r="7" fill="#FFB6C1" stroke="#FF69B4" strokeWidth="1.5" />
                  </svg>
                )}
              </div>

              {/* 4. Accessory Overlay Layer */}
              <div className="pointer-events-none absolute inset-0">
                {selectedAcc === 'crossbag' && (
                  <svg viewBox="0 0 200 220" className="h-full w-full">
                    <path
                      d="M60,135 Q100,165 145,185"
                      fill="none"
                      stroke="#795548"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <rect
                      x="122"
                      y="170"
                      width="26"
                      height="20"
                      rx="4"
                      fill="#003876"
                      stroke="#002244"
                      strokeWidth="1.5"
                    />
                    <circle cx="135" cy="180" r="2" fill="#F1C40F" />
                  </svg>
                )}

                {selectedAcc === 'diploma' && (
                  <svg viewBox="0 0 200 220" className="h-full w-full">
                    <rect
                      x="135"
                      y="145"
                      width="22"
                      height="7"
                      rx="3"
                      fill="#FFFDE7"
                      stroke="#003876"
                      strokeWidth="1.5"
                      transform="rotate(-30 135 145)"
                    />
                    <rect
                      x="144"
                      y="142"
                      width="4"
                      height="9"
                      fill="#E74C3C"
                      transform="rotate(-30 144 142)"
                    />
                  </svg>
                )}
              </div>
            </div>
          </div>

          {/* Coordinate Summary & Price */}
          <div className="mt-6 flex w-full items-center justify-between border-t border-slate-100 pt-4">
            <div>
              <span className="block text-xs font-semibold text-slate-400">
                현재 피팅 코디 세트
              </span>
              <h3 className="mt-0.5 text-sm sm:text-base font-black text-cnu-navy">
                {coordinateSummaryName}
              </h3>
            </div>
            <div className="text-right">
              <span className="block text-xs text-slate-400">예상 결제 금액</span>
              <span className="text-xl font-black text-slate-900">
                {formatKRW(totalCoordinatePrice)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 grid w-full grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary py-3 text-xs font-bold gap-1.5"
            >
              <RotateCcw className="h-4 w-4" />
              <span>처음부터 다시</span>
            </button>
            <button
              type="button"
              onClick={() => addCoordinateToStoreCart(false)}
              className="btn-secondary border-cnu-navy text-cnu-navy py-3 text-xs font-extrabold gap-1.5"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>이 코디 장바구니 담기</span>
            </button>
            <button
              type="button"
              onClick={() => addCoordinateToStoreCart(true)}
              className="btn-primary py-3 text-xs font-extrabold gap-1.5"
            >
              <CreditCard className="h-4 w-4" />
              <span>이 코디 바로 구매</span>
            </button>
          </div>
        </div>

        {/* Right: Wardrobe Selection Panel */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-900">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <span>차차 옷장 (ChaCha Wardrobe)</span>
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              원하는 의상, 모자, 액세서리를 클릭해 차차 인형에게 직접 입혀보세요!
            </p>
          </div>

          {/* Wardrobe Category Tabs */}
          <div className="flex gap-2 border-b border-slate-100 pb-3 text-xs font-extrabold">
            <button
              type="button"
              onClick={() => setActiveTab('outfit')}
              className={`rounded-xl px-4 py-2 transition-colors ${
                activeTab === 'outfit'
                  ? 'bg-cnu-navy text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              의상 (Outfit)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('hat')}
              className={`rounded-xl px-4 py-2 transition-colors ${
                activeTab === 'hat'
                  ? 'bg-cnu-navy text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              모자 (Headwear)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('acc')}
              className={`rounded-xl px-4 py-2 transition-colors ${
                activeTab === 'acc'
                  ? 'bg-cnu-navy text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              액세서리 (Acc)
            </button>
          </div>

          {/* 1. Outfit Items */}
          {activeTab === 'outfit' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {OUTFIT_ITEMS.map((item) => {
                const isSelected = selectedOutfit === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedOutfit(item.key)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-2 border-cnu-blue bg-sky-50/60 shadow-sm'
                        : 'border-slate-200 hover:border-cnu-blue/60 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-2xl mb-1.5">{item.emoji}</span>
                    <h4 className="text-xs font-black text-slate-900">{item.name}</h4>
                    <p className="mt-0.5 text-[11px] text-slate-400">{item.desc}</p>
                    <span className="mt-2 block text-xs font-extrabold text-cnu-blue">
                      {item.price === 0 ? '기본 포함' : `+${formatKRW(item.price)}`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. Hat Items */}
          {activeTab === 'hat' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {HAT_ITEMS.map((item) => {
                const isSelected = selectedHat === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedHat(item.key)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-2 border-cnu-blue bg-sky-50/60 shadow-sm'
                        : 'border-slate-200 hover:border-cnu-blue/60 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-2xl mb-1.5">{item.emoji}</span>
                    <h4 className="text-xs font-black text-slate-900">{item.name}</h4>
                    <p className="mt-0.5 text-[11px] text-slate-400">{item.desc}</p>
                    <span className="mt-2 block text-xs font-extrabold text-cnu-blue">
                      {item.price === 0 ? '미착용' : `+${formatKRW(item.price)}`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* 3. Accessory Items */}
          {activeTab === 'acc' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {ACC_ITEMS.map((item) => {
                const isSelected = selectedAcc === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setSelectedAcc(item.key)}
                    className={`rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-2 border-cnu-blue bg-sky-50/60 shadow-sm'
                        : 'border-slate-200 hover:border-cnu-blue/60 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-2xl mb-1.5">{item.emoji}</span>
                    <h4 className="text-xs font-black text-slate-900">{item.name}</h4>
                    <p className="mt-0.5 text-[11px] text-slate-400">{item.desc}</p>
                    <span className="mt-2 block text-xs font-extrabold text-cnu-blue">
                      {item.price === 0 ? '없음' : `+${formatKRW(item.price)}`}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Eco Upcycling Notice */}
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-xs text-emerald-950 flex items-start gap-3">
            <Leaf className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-black text-emerald-900">
                🌱 친환경 폐과잠 업사이클링 캠페인 안내
              </h4>
              <p className="mt-1 text-emerald-800 leading-relaxed">
                차차 인형 의상과 리폼 에코백은 충남대학교 졸업생들이 기부한 폐과잠 및 폐의류 원단을 100% 수작업으로 세척·재단하여 제작하는 친환경 업사이클링 굿즈입니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
