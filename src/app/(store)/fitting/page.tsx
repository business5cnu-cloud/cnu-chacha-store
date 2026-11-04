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
  Wand2,
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
  thumb?: string;
  name: string;
  desc: string;
  price: number;
  badge?: string;
}[] = [
  {
    key: 'none',
    emoji: '🤍',
    thumb: '/images/chacha/fitting_basic.jpg',
    name: '기본 화이트 셋업',
    desc: '화이트 티셔츠 & 팬츠 기본룩',
    price: 0,
    badge: 'OFFICIAL',
  },
  {
    key: 'varsity',
    emoji: '⚾',
    thumb: '/images/chacha/fitting_varsity.jpg',
    name: '충남대 과잠',
    desc: '네이비 & C 엠블럼 스타디움 재킷',
    price: 14000,
    badge: 'BEST',
  },
  {
    key: 'graduation',
    emoji: '🎓',
    thumb: '/images/chacha/fitting_graduation.jpg',
    name: '학사복 & 스톨',
    desc: 'CNU 블루 스톨 졸업 가운',
    price: 16000,
    badge: 'OFFICIAL',
  },
  {
    key: 'hoodie',
    emoji: '👕',
    name: 'CNU 스카이 후드티',
    desc: '시그니처 민트블루 데일리 후드',
    price: 12000,
  },
  {
    key: 'vest',
    emoji: '🦺',
    name: '프레피 니트 조끼',
    desc: '아이보리 V넥 조끼 & 타이',
    price: 13000,
  },
  {
    key: 'dungarees',
    emoji: '👖',
    name: '레트로 데님 멜빵',
    desc: '워싱 데님 오버롤 팬츠',
    price: 12500,
  },
];

const HAT_ITEMS: {
  key: HatKey;
  emoji: string;
  thumb?: string;
  name: string;
  desc: string;
  price: number;
  badge?: string;
}[] = [
  {
    key: 'none',
    emoji: '❌',
    name: '모자 미착용',
    desc: '기본 민트 갈기 & 귀 노출',
    price: 0,
  },
  {
    key: 'grad_cap',
    emoji: '🎓',
    thumb: '/images/chacha/fitting_graduation.jpg',
    name: '골드 태슬 학사모',
    desc: '졸업 기념 골드 수술 사각모',
    price: 7000,
    badge: 'OFFICIAL',
  },
  {
    key: 'ballcap',
    emoji: '🧢',
    name: 'CNU 시그니처 볼캡',
    desc: '네이비 & 민트 C 로고 캡',
    price: 6000,
  },
  {
    key: 'cherry',
    emoji: '🌸',
    name: '캠퍼스 벚꽃 화관',
    desc: '봄 축제 벚꽃 크라운',
    price: 5000,
  },
];

const ACC_ITEMS: {
  key: AccKey;
  emoji: string;
  name: string;
  desc: string;
  price: number;
}[] = [
  { key: 'none', emoji: '❌', name: '소품 없음', desc: '기본 차차 포즈', price: 0 },
  {
    key: 'crossbag',
    emoji: '👜',
    name: '차차 미니 크로스백',
    desc: '네이비 & 민트 C 로고 메신저백',
    price: 5500,
  },
  {
    key: 'diploma',
    emoji: '📜',
    name: '충남대학교 학위기',
    desc: '레드 리본 졸업장 롤 소품',
    price: 4000,
  },
];

const OFFICIAL_PRESETS: {
  id: string;
  label: string;
  sub: string;
  thumb: string;
  outfit: OutfitKey;
  hat: HatKey;
  acc: AccKey;
}[] = [
  {
    id: 'preset-basic',
    label: '화이트 데일리 셋업',
    sub: '기본 티셔츠 & 팬츠',
    thumb: '/images/chacha/fitting_basic.jpg',
    outfit: 'none',
    hat: 'none',
    acc: 'none',
  },
  {
    id: 'preset-varsity',
    label: '충남대 새내기 과잠룩',
    sub: '네이비 C 로고 과잠',
    thumb: '/images/chacha/fitting_varsity.jpg',
    outfit: 'varsity',
    hat: 'none',
    acc: 'none',
  },
  {
    id: 'preset-graduation',
    label: '학위수여식 졸업 에디션',
    sub: '학사복 가운 + 골드 태슬 학사모',
    thumb: '/images/chacha/fitting_graduation.jpg',
    outfit: 'graduation',
    hat: 'grad_cap',
    acc: 'none',
  },
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

  const coordinateParts = ['NEW 차차 인형'];
  if (selectedOutfit !== 'none') coordinateParts.push(outfitObj.name);
  else coordinateParts.push('기본 화이트 셋업');
  if (selectedHat !== 'none') coordinateParts.push(hatObj.name);
  if (selectedAcc !== 'none') coordinateParts.push(accObj.name);
  const coordinateSummaryName = coordinateParts.join(' + ');

  // Select which official New ChaCha base illustration to render
  const baseImageSrc =
    selectedOutfit === 'varsity'
      ? '/images/chacha/fitting_varsity.jpg'
      : selectedOutfit === 'graduation' && selectedHat === 'grad_cap'
        ? '/images/chacha/fitting_graduation.jpg'
        : '/images/chacha/fitting_basic.jpg';

  const handleSelectOutfit = (key: OutfitKey) => {
    setSelectedOutfit(key);
    // When clicking Graduation Gown, automatically equip the matching Graduation Cap for the official look
    if (key === 'graduation' && selectedHat === 'none') {
      setSelectedHat('grad_cap');
    } else if (key !== 'graduation' && selectedOutfit === 'graduation' && selectedHat === 'grad_cap') {
      setSelectedHat('none');
    }
  };

  const handleApplyPreset = (preset: (typeof OFFICIAL_PRESETS)[number]) => {
    setSelectedOutfit(preset.outfit);
    setSelectedHat(preset.hat);
    setSelectedAcc(preset.acc);
  };

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
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-extrabold text-sky-700 border border-sky-200">
              <span className="h-2 w-2 rounded-full bg-sky-500 animate-ping" />
              NEW CHACHA VR FITTING ROOM
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              NEW 차차 가상 피팅룸 & 커스텀 옷장
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            새로워진 공식 차차(ChaCha) 캐릭터에게 화이트 데일리 셋업, 충남대 과잠, 학사복·학사모와 다양한 커스텀 아이템을 입혀보세요.
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
        {/* Left: Interactive New ChaCha Mascot Stage */}
        <div className="lg:col-span-6 rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm flex flex-col items-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-cnu-navy/10 px-3 py-1 text-xs font-extrabold text-cnu-navy">
              🦄 NEW CHACHA STAGE
            </span>
            <span className="text-xs font-semibold text-slate-400">
              실시간 캐릭터 피팅 프리뷰
            </span>
          </div>

          {/* Stage Canvas (1:1 aspect ratio matching 1024x1024 official artwork) */}
          <div className="relative flex aspect-square w-full max-w-[440px] items-center justify-center rounded-3xl border border-sky-100 bg-white shadow-inner overflow-hidden">
            {/* 1. Official New ChaCha Artwork Base */}
            <img
              src={baseImageSrc}
              alt={coordinateSummaryName}
              className="h-full w-full object-contain select-none transition-all duration-300"
              draggable={false}
            />

            {/* 2. Custom Outfit SVG Layer (Aligned to 1024x1024 New ChaCha proportions & #001A66 18px line-art) */}
            <svg
              viewBox="0 0 1024 1024"
              className="pointer-events-none absolute inset-0 h-full w-full"
            >
              {/* Graduation gown when worn WITHOUT the graduation cap */}
              {selectedOutfit === 'graduation' && selectedHat !== 'grad_cap' && (
                <g>
                  {/* Gown Flared Body */}
                  <path
                    d="M355,578 L296,832 Q468,864 654,832 L582,576 Z"
                    fill="#1F242B"
                    stroke="#001A66"
                    strokeWidth="18"
                    strokeLinejoin="round"
                  />
                  {/* Gown Sleeve Left */}
                  <path
                    d="M358,584 Q305,625 298,690 L355,705 L368,610 Z"
                    fill="#1F242B"
                    stroke="#001A66"
                    strokeWidth="18"
                    strokeLinejoin="round"
                  />
                  {/* Gown Sleeve Right */}
                  <path
                    d="M555,580 Q618,615 632,688 L525,688 L525,605 Z"
                    fill="#1F242B"
                    stroke="#001A66"
                    strokeWidth="18"
                    strokeLinejoin="round"
                  />
                  {/* Center Pleat Line */}
                  <line
                    x1="505"
                    y1="665"
                    x2="518"
                    y2="842"
                    stroke="#11151C"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  {/* Blue V-Stole with Gold Trim */}
                  <polygon
                    points="356,576 404,705 516,580"
                    fill="#0056B3"
                    stroke="#F7D046"
                    strokeWidth="14"
                    strokeLinejoin="round"
                  />
                  <polygon
                    points="350,572 404,715 524,576"
                    fill="none"
                    stroke="#001A66"
                    strokeWidth="16"
                    strokeLinejoin="round"
                  />
                  {/* 'C' Emblem on Stole */}
                  <text
                    x="408"
                    y="646"
                    textAnchor="middle"
                    fontFamily="Arial, sans-serif"
                    fontWeight="900"
                    fontSize="58"
                    fill="#00BCEB"
                    stroke="#FFFFFF"
                    strokeWidth="8"
                    paintOrder="stroke"
                  >
                    C
                  </text>
                  {/* White Paws */}
                  <ellipse
                    cx="315"
                    cy="708"
                    rx="24"
                    ry="34"
                    fill="#FFFFFF"
                    stroke="#001A66"
                    strokeWidth="18"
                  />
                  <ellipse
                    cx="562"
                    cy="724"
                    rx="56"
                    ry="46"
                    fill="#FFFFFF"
                    stroke="#001A66"
                    strokeWidth="18"
                  />
                </g>
              )}

              {/* CNU Sky Hoodie */}
              {selectedOutfit === 'hoodie' && (
                <g>
                  {/* Left Sleeve */}
                  <path
                    d="M368,582 Q305,620 296,685 L356,705 L375,620 Z"
                    fill="#0095D9"
                    stroke="#001A66"
                    strokeWidth="18"
                    strokeLinejoin="round"
                  />
                  {/* Hoodie Torso */}
                  <path
                    d="M365,578 Q455,612 555,574 L588,756 Q460,782 340,756 Z"
                    fill="#00BCEB"
                    stroke="#001A66"
                    strokeWidth="18"
                    strokeLinejoin="round"
                  />
                  {/* Right Sleeve */}
                  <path
                    d="M542,578 Q610,615 632,684 L535,702 L518,622 Z"
                    fill="#0095D9"
                    stroke="#001A66"
                    strokeWidth="18"
                    strokeLinejoin="round"
                  />
                  {/* Kangaroo Pocket */}
                  <path
                    d="M375,695 L515,695 L528,752 Q445,765 362,752 Z"
                    fill="#0086C3"
                    stroke="#001A66"
                    strokeWidth="14"
                    strokeLinejoin="round"
                  />
                  {/* Hoodie Strings */}
                  <line
                    x1="422"
                    y1="598"
                    x2="416"
                    y2="652"
                    stroke="#FFFFFF"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  <line
                    x1="468"
                    y1="598"
                    x2="472"
                    y2="652"
                    stroke="#FFFFFF"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  {/* CNU Arch Logo */}
                  <text
                    x="446"
                    y="675"
                    textAnchor="middle"
                    fontFamily="Arial, sans-serif"
                    fontWeight="900"
                    fontSize="44"
                    fill="#001A66"
                    stroke="#FFFFFF"
                    strokeWidth="10"
                    paintOrder="stroke"
                  >
                    CNU
                  </text>
                  {/* White Paws */}
                  <ellipse
                    cx="325"
                    cy="710"
                    rx="28"
                    ry="34"
                    fill="#FFFFFF"
                    stroke="#001A66"
                    strokeWidth="18"
                  />
                  <ellipse
                    cx="575"
                    cy="714"
                    rx="48"
                    ry="38"
                    fill="#FFFFFF"
                    stroke="#001A66"
                    strokeWidth="18"
                  />
                </g>
              )}

              {/* Preppy Knit Vest & Tie */}
              {selectedOutfit === 'vest' && (
                <g>
                  {/* Ivory Knit Vest Torso */}
                  <path
                    d="M372,580 L446,668 L538,576 L576,756 Q458,782 344,756 Z"
                    fill="#FDF6E2"
                    stroke="#001A66"
                    strokeWidth="18"
                    strokeLinejoin="round"
                  />
                  {/* Navy Tie */}
                  <polygon
                    points="436,595 458,595 466,652 446,672 428,652"
                    fill="#0A2972"
                    stroke="#001A66"
                    strokeWidth="12"
                    strokeLinejoin="round"
                  />
                  {/* V-Neck Navy & Gold Stripe Trim */}
                  <path
                    d="M372,580 L446,668 L538,576"
                    fill="none"
                    stroke="#0A2972"
                    strokeWidth="16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Bottom Ribbing Stripe */}
                  <path
                    d="M348,738 Q458,762 572,738"
                    fill="none"
                    stroke="#0A2972"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  {/* C Crest Patch */}
                  <circle
                    cx="505"
                    cy="678"
                    r="26"
                    fill="#0A2972"
                    stroke="#001A66"
                    strokeWidth="10"
                  />
                  <text
                    x="505"
                    y="690"
                    textAnchor="middle"
                    fontFamily="Arial, sans-serif"
                    fontWeight="900"
                    fontSize="34"
                    fill="#00BCEB"
                  >
                    C
                  </text>
                </g>
              )}

              {/* Retro Denim Dungarees (Overalls) */}
              {selectedOutfit === 'dungarees' && (
                <g>
                  {/* Shoulder Straps */}
                  <rect
                    x="378"
                    y="582"
                    width="34"
                    height="95"
                    rx="10"
                    fill="#3B74C4"
                    stroke="#001A66"
                    strokeWidth="16"
                  />
                  <rect
                    x="492"
                    y="580"
                    width="34"
                    height="95"
                    rx="10"
                    fill="#3B74C4"
                    stroke="#001A66"
                    strokeWidth="16"
                  />
                  {/* Overall Bib & Pants */}
                  <path
                    d="M366,650 L542,650 L556,745 L612,865 Q540,885 480,872 L455,795 L435,872 Q382,882 338,865 L350,745 Z"
                    fill="#3B74C4"
                    stroke="#001A66"
                    strokeWidth="18"
                    strokeLinejoin="round"
                  />
                  {/* Front Bib Pocket */}
                  <rect
                    x="408"
                    y="682"
                    width="88"
                    height="64"
                    rx="12"
                    fill="#2B5EA8"
                    stroke="#001A66"
                    strokeWidth="14"
                  />
                  {/* Brass Buttons */}
                  <circle
                    cx="395"
                    cy="668"
                    r="12"
                    fill="#FFE055"
                    stroke="#001A66"
                    strokeWidth="8"
                  />
                  <circle
                    cx="509"
                    cy="668"
                    r="12"
                    fill="#FFE055"
                    stroke="#001A66"
                    strokeWidth="8"
                  />
                </g>
              )}

              {/* 3. Custom Hat SVG Layer */}
              {/* Graduation Cap when worn on non-graduation outfits */}
              {selectedHat === 'grad_cap' && selectedOutfit !== 'graduation' && (
                <g>
                  {/* Skullcap Base */}
                  <path
                    d="M456,148 L448,205 Q535,215 620,232 L632,182 Z"
                    fill="#1F242B"
                    stroke="#001A66"
                    strokeWidth="18"
                    strokeLinejoin="round"
                  />
                  {/* Mortarboard Diamond Top */}
                  <polygon
                    points="555,65 730,152 575,212 400,112"
                    fill="#1F242B"
                    stroke="#001A66"
                    strokeWidth="18"
                    strokeLinejoin="round"
                  />
                  {/* Gold Center Button */}
                  <circle
                    cx="562"
                    cy="142"
                    r="16"
                    fill="#FFE055"
                    stroke="#001A66"
                    strokeWidth="12"
                  />
                  {/* Gold Tassel */}
                  <path
                    d="M574,148 Q638,175 662,218"
                    fill="none"
                    stroke="#FFE055"
                    strokeWidth="18"
                    strokeLinecap="round"
                  />
                  <path
                    d="M574,148 Q638,175 662,218"
                    fill="none"
                    stroke="#001A66"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                  <circle
                    cx="664"
                    cy="222"
                    r="16"
                    fill="#FFE055"
                    stroke="#001A66"
                    strokeWidth="12"
                  />
                  <polygon
                    points="652,235 682,232 698,288 648,292"
                    fill="#FFE055"
                    stroke="#001A66"
                    strokeWidth="14"
                    strokeLinejoin="round"
                  />
                </g>
              )}

              {/* CNU Signature Ballcap */}
              {selectedHat === 'ballcap' && (
                <g>
                  {/* Curved Visor (pointing left) */}
                  <path
                    d="M395,168 Q285,172 268,212 Q345,228 455,198 Z"
                    fill="#00BCEB"
                    stroke="#001A66"
                    strokeWidth="18"
                    strokeLinejoin="round"
                  />
                  {/* Navy Cap Crown */}
                  <path
                    d="M385,175 Q415,72 545,82 Q655,92 658,195 Q525,212 385,175 Z"
                    fill="#0A2972"
                    stroke="#001A66"
                    strokeWidth="18"
                    strokeLinejoin="round"
                  />
                  {/* Top Button */}
                  <circle
                    cx="532"
                    cy="78"
                    r="12"
                    fill="#00BCEB"
                    stroke="#001A66"
                    strokeWidth="10"
                  />
                  {/* 'C' Emblem on Cap */}
                  <text
                    x="505"
                    y="165"
                    textAnchor="middle"
                    fontFamily="Arial, sans-serif"
                    fontWeight="900"
                    fontSize="56"
                    fill="#00BCEB"
                    stroke="#FFFFFF"
                    strokeWidth="8"
                    paintOrder="stroke"
                  >
                    C
                  </text>
                </g>
              )}

              {/* Cherry Blossom Flower Crown */}
              {selectedHat === 'cherry' && (
                <g>
                  {/* Vine */}
                  <path
                    d="M355,215 Q495,145 648,205"
                    fill="none"
                    stroke="#2E7D32"
                    strokeWidth="16"
                    strokeLinecap="round"
                  />
                  {[
                    { cx: 380, cy: 198, r: 32, fill: '#FFB7CE' },
                    { cx: 455, cy: 175, r: 36, fill: '#FF8FB1' },
                    { cx: 535, cy: 168, r: 40, fill: '#FFB7CE' },
                    { cx: 615, cy: 188, r: 34, fill: '#FF8FB1' },
                  ].map((f, idx) => (
                    <g key={idx}>
                      <circle
                        cx={f.cx}
                        cy={f.cy}
                        r={f.r}
                        fill={f.fill}
                        stroke="#001A66"
                        strokeWidth="14"
                      />
                      <circle
                        cx={f.cx}
                        cy={f.cy}
                        r={11}
                        fill="#FFE055"
                        stroke="#001A66"
                        strokeWidth="8"
                      />
                    </g>
                  ))}
                </g>
              )}

              {/* 4. Custom Accessory SVG Layer */}
              {/* Mini Crossbag */}
              {selectedAcc === 'crossbag' && (
                <g>
                  {/* Crossbody Strap */}
                  <path
                    d="M372,585 Q445,675 538,742"
                    fill="none"
                    stroke="#001A66"
                    strokeWidth="26"
                    strokeLinecap="round"
                  />
                  <path
                    d="M372,585 Q445,675 538,742"
                    fill="none"
                    stroke="#FFE055"
                    strokeWidth="10"
                    strokeLinecap="round"
                  />
                  {/* Messenger Bag Pouch */}
                  <rect
                    x="478"
                    y="705"
                    width="110"
                    height="82"
                    rx="24"
                    fill="#00BCEB"
                    stroke="#001A66"
                    strokeWidth="16"
                  />
                  <path
                    d="M478,730 Q533,758 588,730"
                    fill="none"
                    stroke="#001A66"
                    strokeWidth="14"
                  />
                  <circle
                    cx="533"
                    cy="744"
                    r="11"
                    fill="#FFE055"
                    stroke="#001A66"
                    strokeWidth="8"
                  />
                </g>
              )}

              {/* CNU Diploma Scroll */}
              {selectedAcc === 'diploma' && (
                <g transform="rotate(-24 565 712)">
                  <rect
                    x="495"
                    y="690"
                    width="145"
                    height="44"
                    rx="18"
                    fill="#FFFDF2"
                    stroke="#001A66"
                    strokeWidth="16"
                  />
                  <rect
                    x="555"
                    y="686"
                    width="24"
                    height="52"
                    rx="6"
                    fill="#E53935"
                    stroke="#001A66"
                    strokeWidth="12"
                  />
                  <circle
                    cx="567"
                    cy="712"
                    r="10"
                    fill="#FFE055"
                    stroke="#001A66"
                    strokeWidth="8"
                  />
                </g>
              )}
            </svg>
          </div>

          {/* Official 3-Look Quick Presets */}
          <div className="mt-5 w-full">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-slate-600 mb-2.5">
              <Wand2 className="h-3.5 w-3.5 text-sky-600" />
              <span>공식 NEW 차차 룩북 원클릭 프리셋</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {OFFICIAL_PRESETS.map((preset) => {
                const isCurrent =
                  selectedOutfit === preset.outfit &&
                  selectedHat === preset.hat &&
                  selectedAcc === preset.acc;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className={`flex items-center gap-2.5 rounded-2xl border p-2 text-left transition-all ${
                      isCurrent
                        ? 'border-2 border-sky-500 bg-sky-50/70 shadow-xs'
                        : 'border-slate-200 bg-slate-50/60 hover:border-sky-300 hover:bg-white'
                    }`}
                  >
                    <img
                      src={preset.thumb}
                      alt={preset.label}
                      className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 bg-white object-contain"
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-black text-slate-900">
                        {preset.label}
                      </p>
                      <p className="truncate text-[10px] text-slate-500">
                        {preset.sub}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Coordinate Summary & Price */}
          <div className="mt-5 flex w-full items-center justify-between border-t border-slate-100 pt-4">
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
              <span>기본 화이트룩 초기화</span>
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
              <span>NEW 차차 옷장 (ChaCha Wardrobe)</span>
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              공식 일러스트 코디(화이트 셋업, 충남대 과잠, 학사복·학사모)와 커스텀 의상·소품을 자유롭게 조합해보세요!
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
                    onClick={() => handleSelectOutfit(item.key)}
                    className={`relative rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-2 border-cnu-blue bg-sky-50/60 shadow-sm'
                        : 'border-slate-200 hover:border-cnu-blue/60 hover:bg-slate-50'
                    }`}
                  >
                    {item.badge && (
                      <span className="absolute right-3 top-3 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-black text-sky-800">
                        {item.badge}
                      </span>
                    )}
                    {item.thumb ? (
                      <img
                        src={item.thumb}
                        alt={item.name}
                        className="mb-2 h-14 w-14 rounded-xl border border-slate-200 bg-white object-contain"
                      />
                    ) : (
                      <span className="block text-2xl mb-2">{item.emoji}</span>
                    )}
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
                    className={`relative rounded-2xl border p-4 text-left transition-all ${
                      isSelected
                        ? 'border-2 border-cnu-blue bg-sky-50/60 shadow-sm'
                        : 'border-slate-200 hover:border-cnu-blue/60 hover:bg-slate-50'
                    }`}
                  >
                    {item.badge && (
                      <span className="absolute right-3 top-3 rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-black text-sky-800">
                        {item.badge}
                      </span>
                    )}
                    {item.thumb ? (
                      <img
                        src={item.thumb}
                        alt={item.name}
                        className="mb-2 h-14 w-14 rounded-xl border border-slate-200 bg-white object-contain"
                      />
                    ) : (
                      <span className="block text-2xl mb-2">{item.emoji}</span>
                    )}
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
