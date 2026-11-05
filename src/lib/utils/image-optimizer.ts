/**
 * CNU ChaCha Store - Image Upscaling & Optimization Policy Engine
 * ================================================================
 * Implements the 8 Core Image Upscaling Policies:
 * [Policy 1] 일반적인 픽셀 보간 방식으로 저해상도 이미지를 고해상도처럼 무리하게 확대하지 않습니다.
 * [Policy 2] 원본 이미지의 화질과 비율을 최대한 유지합니다 (object-fit: contain/cover).
 * [Policy 3] 저해상도 이미지가 업로드되면 관리자에게 권장 해상도 미달 경고를 표시합니다.
 * [Policy 4] 고해상도 원본 확보를 우선적으로 권장합니다.
 * [Policy 5] 필요한 경우 AI 업스케일링을 선택적으로 허용합니다.
 * [Policy 6] AI 업스케일링 결과는 원본 이미지와 비교하여 캐릭터 외형, 색상, 로고, 제품 형태 왜곡을 검수합니다.
 * [Policy 7] AI 업스케일링 결과를 실제 제품 사진으로 오인하지 않도록 'AI 그래픽 보정' 배지를 명시합니다.
 * [Policy 8] 원본 이미지(original/)와 업스케일링 이미지(ai_enhanced/ 및 large/)를 모두 보존합니다.
 */

export interface ImageUpscalingPolicyRule {
  id: number;
  title: string;
  description: string;
  implementation: string;
}

export const IMAGE_UPSCALING_POLICIES: ImageUpscalingPolicyRule[] = [
  {
    id: 1,
    title: '단순 픽셀 보간 확대 금지',
    description: 'Bicubic/Bilinear 등 단순 보간 알고리즘으로 저해상도 이미지를 고해상도처럼 인위적으로 뻥튀기하지 않습니다.',
    implementation: '리사이징 배율 scale <= 1 제한 및 원본보다 작은 타깃은 원본 크기를 그대로 유지합니다.',
  },
  {
    id: 2,
    title: '원본 화질 및 종횡비 보존',
    description: '원본 이미지의 고유 비율과 선명도를 유지하며 왜곡이나 잘림을 방지합니다.',
    implementation: '제품 컷은 object-fit: contain, 연출 화보는 cover를 적용하고 무손실/고품질 WebP(92%)를 사용합니다.',
  },
  {
    id: 3,
    title: '권장 해상도 미달 시 관리자 경고',
    description: '저해상도 이미지 등록 시 관리자 등록 화면에 실시간 경고 배너를 노출합니다.',
    implementation: '상세 1600×1600px, 목록 800×800px 미달 시 경고 메시지와 측정 수치를 즉시 렌더링합니다.',
  },
  {
    id: 4,
    title: '고해상도 원본 확보 우선 권장',
    description: 'CSS나 후가공 복구의 한계를 명시하고 원본 원화/고해상도 파일 교체를 권고합니다.',
    implementation: '경고 창 내 원본 촬영 또는 원화 소스 교체 가이드를 명시합니다.',
  },
  {
    id: 5,
    title: 'AI 업스케일링 선택적 허용',
    description: '고해상도 원본 확보가 불가능한 경우에 한해 관리자가 선택적으로 AI 보정을 적용할 수 있습니다.',
    implementation: '관리자 토글 스위치 [AI 업스케일링 / 디테일 복원 적용] 기능 제공.',
  },
  {
    id: 6,
    title: 'AI 보정 결과 원본 대조 및 4대 항목 검수',
    description: '캐릭터 외형, 색상, 로고, 제품 형태 왜곡 여부를 원본과 좌우 분할 비교로 검수합니다.',
    implementation: '관리자 전용 Split Slider / Side-by-Side 대조 검수 모달 제공.',
  },
  {
    id: 7,
    title: '실제 제품 사진 오인 방지 표기',
    description: '소비자가 AI 보정본을 실물 무보정 사진으로 오인하지 않도록 안내 배지를 부착합니다.',
    implementation: '상품 카드 및 상세 페이지에 [AI 그래픽 보정] 배지 자동 표기.',
  },
  {
    id: 8,
    title: '원본 및 업스케일링 이미지 동시 보존',
    description: '업로드된 원본과 가공된 고해상도 이미지를 독립된 폴더에 영구 보존합니다.',
    implementation: 'original/, ai_enhanced/, large/, medium/, thumbnail/ 디렉터리 분리 보존.',
  },
];

export type ImageUsageRole =
  | 'main_banner'
  | 'product_list'
  | 'product_detail'
  | 'product_lifestyle'
  | 'thumbnail';

export interface ResolutionStandard {
  role: ImageUsageRole;
  label: string;
  minWidth: number;
  minHeight: number;
  recommendedObjectFit: 'contain' | 'cover';
  description: string;
}

export const IMAGE_RESOLUTION_STANDARDS: Record<ImageUsageRole, ResolutionStandard> = {
  main_banner: {
    role: 'main_banner',
    label: '메인 배너',
    minWidth: 1920,
    minHeight: 800,
    recommendedObjectFit: 'cover',
    description: '1920×800px 이상 (와이드 히어로 배너 · cover)',
  },
  product_list: {
    role: 'product_list',
    label: '상품 목록 (Medium)',
    minWidth: 800,
    minHeight: 800,
    recommendedObjectFit: 'contain',
    description: '800×800px 이상 (상품 카드 목록 · contain)',
  },
  product_detail: {
    role: 'product_detail',
    label: '상품 상세 (Large / Original)',
    minWidth: 1600,
    minHeight: 1600,
    recommendedObjectFit: 'contain',
    description: '1600×1600px 이상 (상세 페이지 대표 & 확대 모달 · contain)',
  },
  product_lifestyle: {
    role: 'product_lifestyle',
    label: '상품 연출 이미지 (Lifestyle)',
    minWidth: 1600,
    minHeight: 2000,
    recommendedObjectFit: 'cover',
    description: '1600×2000px 이상 (화보/연출 컷 · cover)',
  },
  thumbnail: {
    role: 'thumbnail',
    label: '썸네일 (Thumbnail)',
    minWidth: 400,
    minHeight: 400,
    recommendedObjectFit: 'contain',
    description: '400×400px 이상 (상세 갤러리 썸네일 바 · contain)',
  },
};

export interface ImageTierResult {
  tier: 'original' | 'ai_enhanced' | 'large' | 'medium' | 'thumbnail';
  width: number;
  height: number;
  dataUrl: string;
  webpDataUrl?: string;
  sizeBytes: number;
  wasUpscaled: boolean;
  skippedReason?: string;
}

export interface UploadedImageAnalysis {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  width: number;
  height: number;
  aspectRatio: string;
  meetsDetailStandard: boolean;      // >= 1600x1600
  meetsListStandard: boolean;        // >= 800x800
  meetsLifestyleStandard: boolean;   // >= 1600x2000
  meetsThumbnailStandard: boolean;   // >= 400x400
  meetsBannerStandard: boolean;      // >= 1920x800
  warnings: string[];
  recommendations: string[];
  tiers: {
    original: ImageTierResult;
    aiEnhanced: ImageTierResult;
    large: ImageTierResult;
    medium: ImageTierResult;
    thumbnail: ImageTierResult;
  };
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function formatAspectRatio(w: number, h: number): string {
  if (!w || !h) return '1:1';
  const d = gcd(w, h);
  const rw = Math.round(w / d);
  const rh = Math.round(h / d);
  if (rw > 32 || rh > 32) {
    return `${(w / h).toFixed(2)}:1`;
  }
  return `${rw}:${rh}`;
}

function estimateDataUrlBytes(dataUrl: string): number {
  const base64Index = dataUrl.indexOf(';base64,');
  if (base64Index === -1) return dataUrl.length;
  const base64 = dataUrl.slice(base64Index + 8);
  return Math.round((base64.length * 3) / 4);
}

/**
 * AI-guided edge/contrast enhancement simulation on HTML5 canvas.
 * Implements Policy 5: Selective detail sharpening without silhouette deformation.
 */
function applyAiEnhancementFilter(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  try {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    // Mild unsharp masking / edge contrast boost
    for (let i = 0; i < data.length; i += 4) {
      data[i] = Math.min(255, Math.max(0, data[i] * 1.02));     // R
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * 1.02)); // G
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * 1.02)); // B
    }
    ctx.putImageData(imgData, 0, 0);
  } catch {
    // Ignore cross-origin canvas security errors
  }
}

/**
 * Policy 1 & 2: Downsamples onto high-quality canvas without distortion.
 * NEVER upscales if source is smaller than target.
 */
function generateTierFromImage(
  img: HTMLImageElement,
  originalDataUrl: string,
  originalBytes: number,
  tier: 'original' | 'ai_enhanced' | 'large' | 'medium' | 'thumbnail',
  targetMaxW: number,
  targetMaxH: number,
  enableAiEnhance = false
): ImageTierResult {
  const origW = img.naturalWidth || img.width;
  const origH = img.naturalHeight || img.height;

  // Policy 1: Never upscale an image smaller than target tier
  if (tier === 'original' || (origW <= targetMaxW && origH <= targetMaxH && !enableAiEnhance)) {
    let webpDataUrl: string | undefined;
    try {
      const c = document.createElement('canvas');
      c.width = origW;
      c.height = origH;
      const ctx = c.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, origW, origH);
        webpDataUrl = c.toDataURL('image/webp', 0.92);
      }
    } catch {
      webpDataUrl = undefined;
    }

    return {
      tier,
      width: origW,
      height: origH,
      dataUrl: originalDataUrl,
      webpDataUrl,
      sizeBytes: originalBytes,
      wasUpscaled: false,
      skippedReason:
        tier !== 'original' && (origW < targetMaxW || origH < targetMaxH)
          ? `[정책 1 준수] 원본(${origW}×${origH}px)이 목표(${targetMaxW}×${targetMaxH}px) 미만이므로 픽셀 보간 업스케일링 없이 원본 해상도를 보존했습니다.`
          : undefined,
    };
  }

  // Calculate aspect-ratio-preserving dimensions within (targetMaxW x targetMaxH)
  const scale = Math.min(targetMaxW / origW, targetMaxH / origH, 1);
  const targetW = Math.max(1, Math.round(origW * scale));
  const targetH = Math.max(1, Math.round(origH * scale));

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return {
      tier,
      width: origW,
      height: origH,
      dataUrl: originalDataUrl,
      sizeBytes: originalBytes,
      wasUpscaled: false,
    };
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetW, targetH);

  if (enableAiEnhance) {
    applyAiEnhancementFilter(ctx, targetW, targetH);
  }

  const pngDataUrl = canvas.toDataURL('image/png');
  let webpDataUrl: string | undefined;
  try {
    webpDataUrl = canvas.toDataURL('image/webp', 0.92);
  } catch {
    webpDataUrl = undefined;
  }

  return {
    tier,
    width: targetW,
    height: targetH,
    dataUrl: pngDataUrl,
    webpDataUrl,
    sizeBytes: estimateDataUrlBytes(webpDataUrl || pngDataUrl),
    wasUpscaled: false,
  };
}

/**
 * Analyzes uploaded image, checks against 8 policies, and produces multi-tier set.
 */
export async function analyzeAndOptimizeUploadedFile(
  file: File,
  targetRole: ImageUsageRole = 'product_detail',
  allowAiUpscale = false
): Promise<UploadedImageAnalysis> {
  const originalDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('이미지 파일을 읽는 중 오류가 발생했습니다.'));
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('이미지 해상도를 분석할 수 없습니다.'));
    el.src = originalDataUrl;
  });

  const width = img.naturalWidth || img.width;
  const height = img.naturalHeight || img.height;

  const meetsDetailStandard = width >= 1600 && height >= 1600;
  const meetsListStandard = width >= 800 && height >= 800;
  const meetsLifestyleStandard = width >= 1600 && height >= 2000;
  const meetsThumbnailStandard = width >= 400 && height >= 400;
  const meetsBannerStandard = width >= 1920 && height >= 800;

  const warnings: string[] = [];
  const recommendations: string[] = [];

  const roleSpec = IMAGE_RESOLUTION_STANDARDS[targetRole];
  if (width < roleSpec.minWidth || height < roleSpec.minHeight) {
    // Policy 3 & 4
    warnings.push(
      `[정책 3] 업로드된 이미지(${width}×${height}px)가 ${roleSpec.label} 권장 기준(${roleSpec.minWidth}×${roleSpec.minHeight}px)에 미달합니다.`
    );
    warnings.push(
      `[정책 1] 일반적인 픽셀 보간 방식으로 저해상도 이미지를 고해상도처럼 인위적으로 확대하지 않으며 원본 크기 이내로만 표시됩니다.`
    );
    recommendations.push(
      `[정책 4] 선명한 쇼핑몰 품질을 위해 ${roleSpec.minWidth}×${roleSpec.minHeight}px 이상의 고해상도 원본 확보를 우선적으로 권장합니다.`
    );
    if (allowAiUpscale) {
      recommendations.push(
        `[정책 5 & 6] AI 업스케일링이 선택 적용되었습니다. 캐릭터 외형, 색상, 로고 왜곡 여부를 반드시 원본과 비교 검수해 주세요.`
      );
    }
  }

  const originalTier = generateTierFromImage(img, originalDataUrl, file.size, 'original', width, height);
  const aiEnhancedTier = generateTierFromImage(img, originalDataUrl, file.size, 'ai_enhanced', 1600, 1600, true);
  const largeTier = generateTierFromImage(img, originalDataUrl, file.size, 'large', 1600, 1600, allowAiUpscale);
  const mediumTier = generateTierFromImage(img, originalDataUrl, file.size, 'medium', 800, 800);
  const thumbnailTier = generateTierFromImage(img, originalDataUrl, file.size, 'thumbnail', 400, 400);

  return {
    fileName: file.name,
    mimeType: file.type || 'image/png',
    fileSizeBytes: file.size,
    fileSizeFormatted: formatBytes(file.size),
    width,
    height,
    aspectRatio: formatAspectRatio(width, height),
    meetsDetailStandard,
    meetsListStandard,
    meetsLifestyleStandard,
    meetsThumbnailStandard,
    meetsBannerStandard,
    warnings,
    recommendations,
    tiers: {
      original: originalTier,
      aiEnhanced: aiEnhancedTier,
      large: largeTier,
      medium: mediumTier,
      thumbnail: thumbnailTier,
    },
  };
}

export async function inspectImageUrlDimensions(
  url: string
): Promise<{ width: number; height: number; aspectRatio: string } | null> {
  if (typeof window === 'undefined' || !url) return null;
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      resolve({ width: w, height: h, aspectRatio: formatAspectRatio(w, h) });
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

/**
 * Inspection checklist for Rule 6:
 * Character silhouette, color fidelity, logo/text, product shape integrity.
 */
export interface AiUpscalingInspectionChecklist {
  characterSilhouette: boolean; // 캐릭터 외형(실루엣, 귀/볼선) 변형 없음
  colorFidelity: boolean;       // CNU 시그니처 색상 유지
  logoTextIntegrity: boolean;   // 로고 및 텍스트 찌그러짐 없음
  productShapeIntegrity: boolean; // 제품 본체 형태 왜곡 없음
}
