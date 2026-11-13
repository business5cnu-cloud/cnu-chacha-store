'use client';

import React, { useState, useRef } from 'react';
import {
  RotateCcw,
  Sparkles,
  Eye,
  Compass,
  Sun,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Ruler,
  Layers,
} from 'lucide-react';

export type OutfitKey = 'none' | 'varsity' | 'graduation' | 'hoodie' | 'vest' | 'dungarees';
export type HatKey = 'none' | 'grad_cap' | 'ballcap' | 'cherry';
export type AccKey = 'none' | 'crossbag' | 'diploma';
export type LightingMode = 'studio' | 'warm' | 'daylight';

interface ChaCha3DFittingStageProps {
  outfit: OutfitKey;
  hat: HatKey;
  acc: AccKey;
  coordinateSummaryName?: string;
  zoom?: number;
  lighting?: LightingMode;
  onSelectPart?: (tab: 'outfit' | 'hat' | 'acc') => void;
  compact?: boolean;
}

const OUTFIT_IMAGES: Record<OutfitKey, string> = {
  none: '/images/chacha/ai_outfit_basic.jpg',
  varsity: '/images/chacha/ai_outfit_varsity.jpg',
  graduation: '/images/chacha/ai_outfit_graduation.jpg',
  hoodie: '/images/chacha/ai_outfit_hoodie.jpg',
  vest: '/images/chacha/ai_outfit_vest.jpg',
  dungarees: '/images/chacha/ai_outfit_dungarees.jpg',
};

const HAT_LAYERS: Record<Exclude<HatKey, 'none'>, string> = {
  grad_cap: '/images/chacha/layer_hat_grad_cap.png',
  ballcap: '/images/chacha/layer_hat_ballcap.png',
  cherry: '/images/chacha/layer_hat_cherry.png',
};

const ACC_LAYERS: Record<Exclude<AccKey, 'none'>, string> = {
  crossbag: '/images/chacha/layer_acc_crossbag.png',
  diploma: '/images/chacha/layer_acc_diploma.png',
};

const OUTFIT_LABELS: Record<OutfitKey, string> = {
  none: '기본 화이트 셋업',
  varsity: '충남대 네이비 과잠',
  graduation: '학사 가운 & 스톨',
  hoodie: 'CNU 스카이 후드티',
  vest: '프레피 니트 베스트',
  dungarees: '레트로 데님 멜빵',
};

const HAT_LABELS: Record<HatKey, string> = {
  none: '기본 민트 갈기',
  grad_cap: '골드 태슬 학사모',
  ballcap: 'CNU 시그니처 볼캡',
  cherry: '캠퍼스 벚꽃 화관',
};

const ACC_LABELS: Record<AccKey, string> = {
  none: '소품 미착용',
  crossbag: '차차 미니 크로스백',
  diploma: '충남대학교 학위기',
};

export default function ChaCha3DFittingStage({
  outfit,
  hat,
  acc,
  coordinateSummaryName,
  zoom: propZoom,
  lighting: propLighting,
  onSelectPart,
  compact = false,
}: ChaCha3DFittingStageProps) {
  const stageRef = useRef<HTMLDivElement | null>(null);

  const [internalZoom, setInternalZoom] = useState<number>(1.0);
  const [internalLighting, setInternalLighting] = useState<LightingMode>('studio');
  const [showSpecSheet, setShowSpecSheet] = useState<boolean>(false);

  const zoom = propZoom ?? internalZoom;
  const lighting = propLighting ?? internalLighting;

  // Interactive 3D perspective tilt state (clamped to smooth studio viewing angles so nothing tears or distorts)
  const [rotY, setRotY] = useState<number>(0);
  const [rotX, setRotX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [autoSwing, setAutoSwing] = useState<boolean>(false);
  const [activeView, setActiveView] = useState<'front' | 'left' | 'right' | 'closeup'>('front');

  const dragStartRef = useRef<{ x: number; y: number; startRotY: number; startRotX: number }>({
    x: 0,
    y: 0,
    startRotY: 0,
    startRotX: 0,
  });
  const dragDistRef = useRef<number>(0);

  const lightingConfig = {
    studio: {
      bg: 'radial-gradient(circle at 50% 42%, #ffffff 0%, #f8fafc 62%, #eff6ff 100%)',
      filter: 'contrast(1.02) saturate(1.04)',
      tint: 'rgba(255, 255, 255, 0)',
    },
    warm: {
      bg: 'radial-gradient(circle at 50% 42%, #fffdf9 0%, #fef7ed 62%, #ffedd5 100%)',
      filter: 'contrast(1.03) saturate(1.08) sepia(0.06)',
      tint: 'rgba(251, 191, 36, 0.05)',
    },
    daylight: {
      bg: 'radial-gradient(circle at 50% 42%, #ffffff 0%, #f0f9ff 62%, #e0f2fe 100%)',
      filter: 'brightness(1.03) contrast(1.02) saturate(1.06)',
      tint: 'rgba(56, 189, 248, 0.04)',
    },
  }[lighting];

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setAutoSwing(false);
    dragDistRef.current = 0;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startRotY: rotY,
      startRotX: rotX,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    dragDistRef.current = Math.hypot(dx, dy);

    const nextY = Math.max(-26, Math.min(26, dragStartRef.current.startRotY + dx * 0.18));
    const nextX = Math.max(-15, Math.min(15, dragStartRef.current.startRotX - dy * 0.14));
    setRotY(nextY);
    setRotX(nextX);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (dragDistRef.current < 6 && onSelectPart && stageRef.current) {
      const rect = stageRef.current.getBoundingClientRect();
      const relY = (e.clientY - rect.top) / rect.height;
      const relX = (e.clientX - rect.left) / rect.width;
      if (relY < 0.44) {
        onSelectPart('hat');
      } else if (
        (acc === 'diploma' && relX < 0.46 && relY > 0.48 && relY < 0.84) ||
        (acc === 'crossbag' && relX > 0.50 && relY > 0.65 && relY < 0.88)
      ) {
        onSelectPart('acc');
      } else {
        onSelectPart('outfit');
      }
    }
  };

  const applyPresetView = (view: 'front' | 'left' | 'right' | 'closeup') => {
    setAutoSwing(false);
    setActiveView(view);
    if (view === 'front') {
      setRotY(0);
      setRotX(0);
    } else if (view === 'left') {
      setRotY(-22);
      setRotX(4);
    } else if (view === 'right') {
      setRotY(22);
      setRotX(4);
    } else if (view === 'closeup') {
      setRotY(0);
      setRotX(-10);
    }
  };

  const parallaxX = (rotY / 26) * 8;
  const parallaxY = (-rotX / 15) * 5;
  const viewScale = activeView === 'closeup' ? zoom * 1.12 : zoom;

  const lightSpotX = 50 - (rotY / 26) * 28;
  const lightSpotY = 38 + (rotX / 15) * 22;

  return (
    <div className="relative w-full select-none space-y-3">
      {/* Top Toolbar: Mode Switch + Lighting Controls */}
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowSpecSheet(false)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold transition ${
                !showSpecSheet
                  ? 'bg-cnu-navy text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI 실물 스튜디오 모델</span>
            </button>
            <button
              type="button"
              onClick={() => setShowSpecSheet(true)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-extrabold transition ${
                showSpecSheet
                  ? 'bg-cnu-navy text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Ruler className="h-3.5 w-3.5" />
              <span>실물 규격·원단 정보</span>
            </button>
          </div>

          <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1 text-[11px] font-bold">
            <Sun className="ml-1.5 h-3.5 w-3.5 text-amber-500" />
            {(
              [
                { key: 'studio', label: '스튜디오' },
                { key: 'warm', label: '전시관 조명' },
                { key: 'daylight', label: '자연광' },
              ] as const
            ).map((mode) => (
              <button
                key={mode.key}
                type="button"
                onClick={() => setInternalLighting(mode.key)}
                className={`rounded-full px-2.5 py-1 transition ${
                  lighting === mode.key
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {showSpecSheet ? (
        <div className="flex h-[460px] w-full flex-col justify-between rounded-3xl border border-slate-200 bg-slate-50/70 p-6 text-left">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-100 px-3 py-1 text-xs font-extrabold text-sky-900">
              <Layers className="h-3.5 w-3.5" />
              CNU 공식 차차 봉제인형 스튜디오 스펙
            </span>
            <h3 className="mt-3 text-lg font-black text-slate-900">
              {coordinateSummaryName || '차차 25cm 스탠다드 봉제인형 & 커스텀 의상'}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              실물 차차 봉제인형 촬영본을 AI 스튜디오 보정·정합하여 실제 극세사 벨보아(Velboa) 원단 결, 장모 민트 갈기, 업사이클링 의상 핏을 그대로 재현한 피팅 모델입니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
              <span className="font-bold text-slate-400">인형 본체 규격</span>
              <p className="mt-1 font-black text-slate-900">25cm × 19cm × 15cm</p>
              <p className="mt-0.5 text-[11px] text-slate-500">5mm 소프트 벨보아 & 고탄성 구름솜</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
              <span className="font-bold text-slate-400">갈기·꼬리 원단</span>
              <p className="mt-1 font-black text-slate-900">12mm 샤기 플러시 퍼</p>
              <p className="mt-0.5 text-[11px] text-slate-500">CNU 시그니처 민트-시안 염색모</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
              <span className="font-bold text-slate-400">현재 착용 의상</span>
              <p className="mt-1 font-black text-cnu-navy">{OUTFIT_LABELS[outfit]}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">탈부착 스냅/벨크로 마감</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
              <span className="font-bold text-slate-400">착용 모자 · 소품</span>
              <p className="mt-1 font-black text-cnu-navy">
                {HAT_LABELS[hat]} / {ACC_LABELS[acc]}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">1:1 인형 전용 맞춤 패턴</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSpecSheet(false)}
            className="w-full rounded-2xl bg-cnu-navy py-3 text-center text-xs font-extrabold text-white transition hover:bg-slate-800"
          >
            스튜디오 피팅 화면으로 돌아가기
          </button>
        </div>
      ) : (
        /* Main Interactive AI Studio Plush Stage */
        <div
          ref={stageRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            background: lightingConfig.bg,
            touchAction: 'none',
          }}
          className={`relative w-full overflow-hidden rounded-3xl border border-slate-200/80 shadow-inner transition-colors duration-300 ${
            compact ? 'h-[360px]' : 'h-[460px] sm:h-[500px]'
          } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          {/* Top-left Drag Guide Pill */}
          {!compact && (
            <div className="pointer-events-none absolute left-4 top-4 z-20 flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs ring-1 ring-slate-200/80 backdrop-blur-md">
                <Eye className="h-3.5 w-3.5 text-sky-500" />
                <span>드래그하여 입체 틸트 · 실물 털 결 & 파츠 핏 확인</span>
              </div>
            </div>
          )}

          {/* Right-side Zoom & Reset Floating Buttons */}
          {!compact && (
            <div
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute right-4 top-4 z-20 flex flex-col gap-1.5"
            >
              <button
                type="button"
                onClick={() => setInternalZoom((z) => Math.min(1.35, +(z + 0.1).toFixed(2)))}
                title="확대"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-slate-700 shadow-xs ring-1 ring-slate-200/80 backdrop-blur transition hover:bg-slate-100"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setInternalZoom((z) => Math.max(0.8, +(z - 0.1).toFixed(2)))}
                title="축소"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-slate-700 shadow-xs ring-1 ring-slate-200/80 backdrop-blur transition hover:bg-slate-100"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setInternalZoom((z) => (Math.abs(z - 1.2) < 0.05 ? 1.0 : 1.2))
                }
                title="클로즈업 토글"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-slate-700 shadow-xs ring-1 ring-slate-200/80 backdrop-blur transition hover:bg-slate-100"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setInternalZoom(1.0);
                  applyPresetView('front');
                }}
                title="정면 초기화"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-slate-700 shadow-xs ring-1 ring-slate-200/80 backdrop-blur transition hover:bg-slate-100"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Active Parts Status Pills (Bottom-Left) */}
          {!compact && (
            <div className="absolute bottom-14 left-4 z-20 hidden flex-wrap items-center gap-1.5 sm:flex">
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow-xs ring-1 ring-slate-200/80 backdrop-blur">
                👕 {OUTFIT_LABELS[outfit]}
              </span>
              {hat !== 'none' && (
                <span className="rounded-full bg-sky-50/95 px-2.5 py-1 text-[11px] font-bold text-sky-800 shadow-xs ring-1 ring-sky-200 backdrop-blur">
                  🧢 {HAT_LABELS[hat]}
                </span>
              )}
              {acc !== 'none' && (
                <span className="rounded-full bg-indigo-50/95 px-2.5 py-1 text-[11px] font-bold text-indigo-800 shadow-xs ring-1 ring-indigo-200 backdrop-blur">
                  👜 {ACC_LABELS[acc]}
                </span>
              )}
            </div>
          )}

          {/* 3D Perspective Container */}
          <div
            className="relative flex h-full w-full items-center justify-center"
            style={{
              perspective: '1100px',
            }}
          >
            {/* Dynamic Floor Contact Shadow */}
            <div
              className="pointer-events-none absolute bottom-[6%] h-9 w-[54%] rounded-full bg-slate-900/10 blur-xl transition-transform duration-150"
              style={{
                transform: `translate3d(${-parallaxX * 1.4}px, ${parallaxY * 0.5}px, 0) scale(${viewScale})`,
              }}
            />

            {/* 3D Tilted Plush Doll Stage Plane */}
            <div
              className={`relative aspect-square h-[88%] max-h-[440px] w-auto transition-transform ${
                isDragging ? 'duration-0' : 'duration-300 ease-out'
              } ${autoSwing ? 'animate-[plushSwing_5s_ease-in-out_infinite]' : ''}`}
              style={{
                transformStyle: 'preserve-3d',
                transform: `scale(${viewScale}) rotateX(${rotX}deg) rotateY(${rotY}deg)`,
                filter: lightingConfig.filter,
              }}
            >
              {/* Layer 1: Canonical 1024x1024 AI Studio Plush Doll + Selected Outfit */}
              <img
                src={OUTFIT_IMAGES[outfit]}
                alt={coordinateSummaryName || `차차 실물 봉제인형 - ${OUTFIT_LABELS[outfit]}`}
                draggable={false}
                className="pointer-events-none h-full w-full select-none rounded-2xl object-contain"
                style={{
                  transform: 'translateZ(0px)',
                }}
              />

              {/* Layer 2: Seamless 1:1 Aligned Real-Photo Hat Layer */}
              {hat !== 'none' && (
                <img
                  src={HAT_LAYERS[hat]}
                  alt={`차차 모자 - ${HAT_LABELS[hat]}`}
                  draggable={false}
                  className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain transition-opacity duration-200"
                  style={{
                    transform: `translate3d(${parallaxX * 0.18}px, ${parallaxY * 0.15}px, 8px)`,
                  }}
                />
              )}

              {/* Layer 3: Seamless 1:1 Aligned Real-Photo Accessory Layer with Subtle 3D Depth Shadow */}
              {acc !== 'none' && (
                <img
                  src={ACC_LAYERS[acc]}
                  alt={`차차 소품 - ${ACC_LABELS[acc]}`}
                  draggable={false}
                  className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain transition-transform duration-150"
                  style={{
                    transform: `translate3d(${parallaxX * 0.42}px, ${parallaxY * 0.35}px, 16px)`,
                    filter: `drop-shadow(${-parallaxX * 0.35 + 2}px ${4 - parallaxY * 0.25}px 5px rgba(15, 23, 42, 0.22))`,
                  }}
                />
              )}

              {/* Interactive Studio Key-Light & Velboa Fur Sheen Overlay */}
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl mix-blend-soft-light transition-opacity duration-200"
                style={{
                  background: `radial-gradient(circle at ${lightSpotX}% ${lightSpotY}%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.0) 58%)`,
                }}
              />

              {/* Ambient Lighting Mode Tint */}
              <div
                className="pointer-events-none absolute inset-0 rounded-2xl"
                style={{ backgroundColor: lightingConfig.tint }}
              />
            </div>
          </div>

          {/* Bottom Camera & Tilt Preset Bar */}
          {!compact && (
            <div
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/92 p-1 shadow-md ring-1 ring-slate-200/90 backdrop-blur-md"
            >
              <button
                type="button"
                onClick={() => applyPresetView('front')}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  activeView === 'front' && !autoSwing
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                정면 뷰
              </button>
              <button
                type="button"
                onClick={() => applyPresetView('left')}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  activeView === 'left' && !autoSwing
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                좌측 입체
              </button>
              <button
                type="button"
                onClick={() => applyPresetView('right')}
                className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                  activeView === 'right' && !autoSwing
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                우측 입체
              </button>
              <button
                type="button"
                onClick={() => applyPresetView('closeup')}
                className={`hidden items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition sm:inline-flex ${
                  activeView === 'closeup' && !autoSwing
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <span>디테일 줌</span>
              </button>
              <button
                type="button"
                onClick={() => setAutoSwing((prev) => !prev)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition ${
                  autoSwing
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Compass className="h-3 w-3" />
                <span>입체 모션</span>
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes plushSwing {
          0%,
          100% {
            transform: scale(${viewScale}) rotateX(2deg) rotateY(-18deg);
          }
          50% {
            transform: scale(${viewScale}) rotateX(-3deg) rotateY(18deg);
          }
        }
      `}</style>
    </div>
  );
}
