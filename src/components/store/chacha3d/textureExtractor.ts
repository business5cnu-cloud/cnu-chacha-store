// Extracts seamless tileable real-photo plush & fabric textures from the AI studio images
// and builds a multi-shell fur strand alpha texture for 3D silhouette fluffiness.

export type TextureSlotKey =
  | 'velboaWhite'
  | 'cyanFur'
  | 'navyPlush'
  | 'mintFleece'
  | 'ivoryKnit'
  | 'blueDenim'
  | 'furShell';

export interface PlushTextureSet {
  velboaWhite: HTMLCanvasElement;
  cyanFur: HTMLCanvasElement;
  navyPlush: HTMLCanvasElement;
  mintFleece: HTMLCanvasElement;
  ivoryKnit: HTMLCanvasElement;
  blueDenim: HTMLCanvasElement;
  furShell: HTMLCanvasElement;
}

function createCanvas(size: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return c;
}

// Deterministic pseudo-random for crisp fallback & fur shell alpha
function hash2(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return n - Math.floor(n);
}

// Builds a procedural fallback swatch (used immediately before images finish loading)
function makeProceduralSwatch(
  baseRgb: [number, number, number],
  grainAmp: number,
  streakY = 1,
  weave = false
): HTMLCanvasElement {
  const size = 256;
  const c = createCanvas(size);
  const ctx = c.getContext('2d');
  if (!ctx) return c;
  const img = ctx.createImageData(size, size);
  const d = img.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const n1 = hash2(Math.floor(x / 2), Math.floor(y / (2 * streakY)));
      const n2 = hash2(x, Math.floor(y / streakY));
      let delta = ((n1 * 0.6 + n2 * 0.4) - 0.5) * grainAmp;
      if (weave) {
        const w = Math.sin(x * 0.35) * Math.sin(y * 0.25) * 10;
        delta += w;
      }
      d[idx] = Math.max(0, Math.min(255, baseRgb[0] + delta));
      d[idx + 1] = Math.max(0, Math.min(255, baseRgb[1] + delta));
      d[idx + 2] = Math.max(0, Math.min(255, baseRgb[2] + delta));
      d[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

// Builds a seamless 256x256 fur-strand alpha & shading texture for 3D multi-shell fur
function makeFurShellTexture(): HTMLCanvasElement {
  const size = 256;
  const c = createCanvas(size);
  const ctx = c.getContext('2d');
  if (!ctx) return c;

  ctx.clearRect(0, 0, size, size);
  // Draw dense overlapping soft fur tufts that tile cleanly
  for (let i = 0; i < 3600; i++) {
    const x = hash2(i, 1.3) * size;
    const y = hash2(i, 7.9) * size;
    const len = 6 + hash2(i, 3.1) * 10;
    const rad = 1.2 + hash2(i, 5.7) * 1.8;
    const tipBright = 0.72 + hash2(i, 9.2) * 0.28;

    // Wrap across edges for seamless tiling
    for (const ox of [-size, 0, size]) {
      for (const oy of [-size, 0, size]) {
        const px = x + ox;
        const py = y + oy;
        if (px < -16 || px > size + 16 || py < -16 || py > size + 16) continue;
        const grad = ctx.createLinearGradient(px, py, px + 2, py + len);
        const v = Math.round(tipBright * 255);
        grad.addColorStop(0, `rgba(${v},${v},${v},0.92)`);
        grad.addColorStop(1, `rgba(${v},${v},${v},0.0)`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = rad;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + (hash2(i, 2.4) - 0.5) * 4, py + len);
        ctx.stroke();
      }
    }
  }
  return c;
}

// Extracts a region from a loaded image, normalizes brightness subtly, and mirror-tiles it 2x2 for zero seams
function extractMirrorTiledSwatch(
  img: HTMLImageElement,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  brightnessBoost = 1.04
): HTMLCanvasElement {
  const tile = 128;
  const out = createCanvas(tile * 2);
  const ctx = out.getContext('2d');
  if (!ctx) return out;

  // Draw source region into a 128x128 scratch canvas
  const patch = createCanvas(tile);
  const pCtx = patch.getContext('2d');
  if (!pCtx) return out;
  pCtx.drawImage(img, sx, sy, sw, sh, 0, 0, tile, tile);

  // Subtle brightness/contrast polish so studio lighting in WebGL never looks muddy
  if (brightnessBoost !== 1.0) {
    const id = pCtx.getImageData(0, 0, tile, tile);
    const d = id.data;
    for (let i = 0; i < d.length; i += 4) {
      d[i] = Math.min(255, d[i] * brightnessBoost);
      d[i + 1] = Math.min(255, d[i + 1] * brightnessBoost);
      d[i + 2] = Math.min(255, d[i + 2] * brightnessBoost);
    }
    pCtx.putImageData(id, 0, 0);
  }

  // Mirror-tile 2x2 (TL normal, TR flipX, BL flipY, BR flipXY) -> 100% seamless wrap!
  ctx.drawImage(patch, 0, 0);

  ctx.save();
  ctx.translate(tile * 2, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(patch, 0, 0);
  ctx.restore();

  ctx.save();
  ctx.translate(0, tile * 2);
  ctx.scale(1, -1);
  ctx.drawImage(patch, 0, 0);
  ctx.restore();

  ctx.save();
  ctx.translate(tile * 2, tile * 2);
  ctx.scale(-1, -1);
  ctx.drawImage(patch, 0, 0);
  ctx.restore();

  return out;
}

export function createInitialPlushTextures(): PlushTextureSet {
  return {
    velboaWhite: makeProceduralSwatch([248, 249, 252], 14, 1),
    cyanFur: makeProceduralSwatch([40, 158, 196], 36, 3),
    navyPlush: makeProceduralSwatch([16, 42, 88], 22, 1),
    mintFleece: makeProceduralSwatch([188, 226, 232], 18, 1),
    ivoryKnit: makeProceduralSwatch([236, 229, 218], 16, 1, true),
    blueDenim: makeProceduralSwatch([64, 98, 138], 24, 1, true),
    furShell: makeFurShellTexture(),
  };
}

interface SwatchSpec {
  key: Exclude<TextureSlotKey, 'furShell'>;
  src: string;
  sx: number;
  sy: number;
  sw: number;
  sh: number;
  boost: number;
}

const SWATCH_SPECS: SwatchSpec[] = [
  { key: 'velboaWhite', src: '/images/chacha/ai_outfit_basic.jpg', sx: 460, sy: 365, sw: 80, sh: 70, boost: 1.07 },
  { key: 'cyanFur', src: '/images/chacha/ai_outfit_basic.jpg', sx: 490, sy: 210, sw: 80, sh: 70, boost: 1.05 },
  { key: 'navyPlush', src: '/images/chacha/ai_outfit_varsity.jpg', sx: 350, sy: 640, sw: 70, sh: 70, boost: 1.12 },
  { key: 'mintFleece', src: '/images/chacha/ai_outfit_hoodie.jpg', sx: 360, sy: 660, sw: 70, sh: 70, boost: 1.04 },
  { key: 'ivoryKnit', src: '/images/chacha/ai_outfit_vest.jpg', sx: 540, sy: 680, sw: 70, sh: 70, boost: 1.06 },
  { key: 'blueDenim', src: '/images/chacha/ai_outfit_dungarees.jpg', sx: 530, sy: 720, sw: 70, sh: 70, boost: 1.08 },
];

export function loadRealPhotoSwatches(
  onSwatchReady: (key: Exclude<TextureSlotKey, 'furShell'>, canvas: HTMLCanvasElement) => void
): () => void {
  let cancelled = false;

  // Group specs by image src so each image loads once
  const bySrc = new Map<string, SwatchSpec[]>();
  for (const spec of SWATCH_SPECS) {
    const arr = bySrc.get(spec.src) ?? [];
    arr.push(spec);
    bySrc.set(spec.src, arr);
  }

  bySrc.forEach((specs, src) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      for (const spec of specs) {
        const swatch = extractMirrorTiledSwatch(
          img,
          spec.sx,
          spec.sy,
          spec.sw,
          spec.sh,
          spec.boost
        );
        onSwatchReady(spec.key, swatch);
      }
    };
    img.src = src;
  });

  return () => {
    cancelled = true;
  };
}
