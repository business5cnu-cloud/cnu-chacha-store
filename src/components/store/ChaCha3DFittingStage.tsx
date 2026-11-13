'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  RotateCcw,
  Sparkles,
  Compass,
  Sun,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Ruler,
  Layers,
  Eye,
} from 'lucide-react';
import { buildChaChaSceneMeshes, type MeshBuffers } from './chacha3d/meshBuilder';
import {
  createInitialPlushTextures,
  loadRealPhotoSwatches,
  type TextureSlotKey,
} from './chacha3d/textureExtractor';

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

const VERTEX_SHADER = `
  attribute vec3 a_pos;
  attribute vec3 a_nor;
  attribute vec2 a_uv;
  attribute float a_texId;
  attribute vec3 a_col;
  attribute float a_fur;

  uniform mat4 u_mvp;
  uniform mat4 u_model;
  uniform float u_breath;

  varying vec3 v_worldPos;
  varying vec3 v_worldNor;
  varying vec2 v_uv;
  varying float v_texId;
  varying vec3 v_col;
  varying float v_fur;

  void main() {
    vec3 pos = a_pos;
    pos.y += u_breath;
    vec4 wp = u_model * vec4(pos, 1.0);
    v_worldPos = wp.xyz;
    v_worldNor = normalize((u_model * vec4(a_nor, 0.0)).xyz);
    v_uv = a_uv;
    v_texId = a_texId;
    v_col = a_col;
    v_fur = a_fur;
    gl_Position = u_mvp * vec4(pos, 1.0);
  }
`;

const FRAGMENT_SHADER = `
  precision highp float;

  varying vec3 v_worldPos;
  varying vec3 v_worldNor;
  varying vec2 v_uv;
  varying float v_texId;
  varying vec3 v_col;
  varying float v_fur;

  uniform sampler2D u_tex0; // velboaWhite
  uniform sampler2D u_tex1; // cyanFur
  uniform sampler2D u_tex2; // navyPlush
  uniform sampler2D u_tex3; // mintFleece
  uniform sampler2D u_tex4; // ivoryKnit
  uniform sampler2D u_tex5; // blueDenim
  uniform sampler2D u_texFurShell;

  uniform vec3 u_camPos;
  uniform int u_lighting;
  uniform int u_isFurPass;

  vec3 sampleMaterialTex(float id, vec2 uv) {
    if (id < 0.5) return texture2D(u_tex0, uv).rgb;
    if (id < 1.5) return texture2D(u_tex1, uv).rgb;
    if (id < 2.5) return texture2D(u_tex2, uv).rgb;
    if (id < 3.5) return texture2D(u_tex3, uv).rgb;
    if (id < 4.5) return texture2D(u_tex4, uv).rgb;
    if (id < 5.5) return texture2D(u_tex5, uv).rgb;
    return vec3(1.0);
  }

  void main() {
    vec3 n = normalize(v_worldNor);
    if (!gl_FrontFacing) n = -n;
    vec3 v = normalize(u_camPos - v_worldPos);

    vec3 baseCol = sampleMaterialTex(v_texId, v_uv) * v_col;

    if (u_isFurPass == 1) {
      // Multi-shell fur strand alpha & soft root-to-tip shading
      vec4 furSample = texture2D(u_texFurShell, v_uv * vec2(2.8, 2.4));
      float threshold = v_fur * 0.65;
      if (furSample.a < threshold) discard;

      // Darken deeper root shells slightly for realistic plush fur depth
      float rootOcc = mix(0.84, 1.00, v_fur);
      baseCol *= rootOcc;
    }

    // Camera-relative 360-degree Studio Softbox Lighting (so front, sides, and back are all bright & soft!)
    vec3 viewRight = normalize(cross(vec3(0.0, 1.0, 0.0), v));
    vec3 viewUp = normalize(cross(v, viewRight));
    vec3 keyDir = normalize(v * 0.72 - viewRight * 0.36 + viewUp * 0.58);
    vec3 fillDir = normalize(v * 0.65 + viewRight * 0.65 + viewUp * 0.25);
    vec3 rimDir = normalize(-v * 0.75 + viewUp * 0.65);

    vec3 keyCol = vec3(1.00, 0.99, 0.98);
    vec3 fillCol = vec3(0.92, 0.96, 1.00);
    vec3 ambCol = vec3(0.58, 0.60, 0.63);

    if (u_lighting == 1) {
      // Warm Gallery Spotlight
      keyCol = vec3(1.04, 0.95, 0.85);
      fillCol = vec3(0.96, 0.89, 0.80);
      ambCol = vec3(0.60, 0.56, 0.51);
    } else if (u_lighting == 2) {
      // Campus Daylight
      keyCol = vec3(0.98, 1.01, 1.04);
      fillCol = vec3(0.88, 0.96, 1.02);
      ambCol = vec3(0.60, 0.63, 0.66);
    }

    // Soft wrap-diffuse (subsurface-like plush cotton scattering)
    float wrap = 0.55;
    float keyDiff = clamp((dot(n, keyDir) + wrap) / (1.0 + wrap), 0.0, 1.0);
    float fillDiff = clamp((dot(n, fillDir) + wrap) / (1.0 + wrap), 0.0, 1.0);
    float rimLight = pow(1.0 - max(dot(n, v), 0.0), 3.0) * max(0.0, dot(n, rimDir) * 0.5 + 0.5);

    // Velvet / Velboa grazing-angle micro-fuzz sheen (disabled on outer fur shell pass to avoid neon halo)
    float velvet = (u_isFurPass == 1) ? 0.0 : pow(1.0 - max(dot(n, v), 0.0), 2.4) * (0.08 + v_fur * 0.10);

    // Subtle soft ground bounce occlusion
    float heightAO = smoothstep(-0.82, -0.35, v_worldPos.y) * 0.12 + 0.88;

    vec3 lit = baseCol * (ambCol + keyCol * keyDiff * 0.36 + fillCol * fillDiff * 0.14);
    lit += mix(baseCol, vec3(1.0), 0.30) * (velvet + rimLight * 0.08);
    lit *= heightAO;
    lit = clamp(lit, 0.0, 1.0);

    float alpha = 1.0;
    if (u_isFurPass == 1) {
      vec4 furSample = texture2D(u_texFurShell, v_uv * vec2(2.8, 2.4));
      alpha = clamp((furSample.a - v_fur * 0.58) * 1.4, 0.0, 0.62);
    }

    gl_FragColor = vec4(lit, alpha);
  }
`;

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

interface GpuMesh {
  vaoOrBuffers: {
    pos: WebGLBuffer;
    nor: WebGLBuffer;
    uv: WebGLBuffer;
    texId: WebGLBuffer;
    col: WebGLBuffer;
    fur: WebGLBuffer;
    idx: WebGLBuffer;
  };
  indexCount: number;
}

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
}

function uploadMesh(gl: WebGLRenderingContext, data: MeshBuffers): GpuMesh | null {
  const pos = gl.createBuffer();
  const nor = gl.createBuffer();
  const uv = gl.createBuffer();
  const texId = gl.createBuffer();
  const col = gl.createBuffer();
  const fur = gl.createBuffer();
  const idx = gl.createBuffer();
  if (!pos || !nor || !uv || !texId || !col || !fur || !idx) return null;

  gl.bindBuffer(gl.ARRAY_BUFFER, pos);
  gl.bufferData(gl.ARRAY_BUFFER, data.positions, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, nor);
  gl.bufferData(gl.ARRAY_BUFFER, data.normals, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, uv);
  gl.bufferData(gl.ARRAY_BUFFER, data.uvs, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, texId);
  gl.bufferData(gl.ARRAY_BUFFER, data.texIds, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, col);
  gl.bufferData(gl.ARRAY_BUFFER, data.colors, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, fur);
  gl.bufferData(gl.ARRAY_BUFFER, data.furs, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, idx);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.indices, gl.STATIC_DRAW);

  return {
    vaoOrBuffers: { pos, nor, uv, texId, col, fur, idx },
    indexCount: data.indices.length,
  };
}

function deleteGpuMesh(gl: WebGLRenderingContext, mesh: GpuMesh | null): void {
  if (!mesh) return;
  const b = mesh.vaoOrBuffers;
  gl.deleteBuffer(b.pos);
  gl.deleteBuffer(b.nor);
  gl.deleteBuffer(b.uv);
  gl.deleteBuffer(b.texId);
  gl.deleteBuffer(b.col);
  gl.deleteBuffer(b.fur);
  gl.deleteBuffer(b.idx);
}

// Column-major 4x4 matrix math helpers
function mat4Multiply(a: Float32Array, b: Float32Array): Float32Array {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] =
        a[0 * 4 + r] * b[c * 4 + 0] +
        a[1 * 4 + r] * b[c * 4 + 1] +
        a[2 * 4 + r] * b[c * 4 + 2] +
        a[3 * 4 + r] * b[c * 4 + 3];
    }
  }
  return out;
}

function mat4Perspective(fovRad: number, aspect: number, near: number, far: number): Float32Array {
  const f = 1.0 / Math.tan(fovRad / 2);
  const nf = 1 / (near - far);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) * nf, -1,
    0, 0, 2 * far * near * nf, 0,
  ]);
}

function mat4LookAt(eye: [number, number, number], target: [number, number, number]): Float32Array {
  let zx = eye[0] - target[0];
  let zy = eye[1] - target[1];
  let zz = eye[2] - target[2];
  const zLen = Math.hypot(zx, zy, zz) || 1;
  zx /= zLen; zy /= zLen; zz /= zLen;

  let xx = 1 * zz - 0 * zy;
  let xy = 0 * zx - 0 * zz;
  let xz = 0 * zy - 1 * zx;
  const xLen = Math.hypot(xx, xy, xz) || 1;
  xx /= xLen; xy /= xLen; xz /= xLen;

  const yx = zy * xz - zz * xy;
  const yy = zz * xx - zx * xz;
  const yz = zx * xy - zy * xx;

  return new Float32Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * eye[0] + xy * eye[1] + xz * eye[2]),
    -(yx * eye[0] + yy * eye[1] + yz * eye[2]),
    -(zx * eye[0] + zy * eye[1] + zz * eye[2]),
    1,
  ]);
}

function mat4RotateY(a: number): Float32Array {
  const c = Math.cos(a), s = Math.sin(a);
  return new Float32Array([
    c, 0, -s, 0,
    0, 1, 0, 0,
    s, 0, c, 0,
    0, 0, 0, 1,
  ]);
}

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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [internalZoom, setInternalZoom] = useState<number>(1.0);
  const [internalLighting, setInternalLighting] = useState<LightingMode>('studio');
  const [showSpecSheet, setShowSpecSheet] = useState<boolean>(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [angleDeg, setAngleDeg] = useState<number>(0);

  const zoom = propZoom ?? internalZoom;
  const lighting = propLighting ?? internalLighting;

  // Mutable camera state read by requestAnimationFrame loop
  const camRef = useRef({
    yaw: 0,
    targetYaw: 0,
    pitch: 0.08,
    targetPitch: 0.08,
    zoom,
    lighting,
    autoRotate,
  });

  useEffect(() => {
    camRef.current.zoom = zoom;
    camRef.current.lighting = lighting;
    camRef.current.autoRotate = autoRotate;
  }, [zoom, lighting, autoRotate]);

  // Dragging refs
  const dragRef = useRef({ active: false, startX: 0, startY: 0, startYaw: 0, startPitch: 0, dist: 0 });

  // WebGL context & GPU meshes refs
  const glStateRef = useRef<{
    gl: WebGLRenderingContext;
    program: WebGLProgram;
    solidMesh: GpuMesh | null;
    furMesh: GpuMesh | null;
    textures: Record<TextureSlotKey, WebGLTexture>;
    attribs: {
      pos: number;
      nor: number;
      uv: number;
      texId: number;
      col: number;
      fur: number;
    };
    uniforms: {
      mvp: WebGLUniformLocation | null;
      model: WebGLUniformLocation | null;
      breath: WebGLUniformLocation | null;
      camPos: WebGLUniformLocation | null;
      lighting: WebGLUniformLocation | null;
      isFurPass: WebGLUniformLocation | null;
      tex0: WebGLUniformLocation | null;
      tex1: WebGLUniformLocation | null;
      tex2: WebGLUniformLocation | null;
      tex3: WebGLUniformLocation | null;
      tex4: WebGLUniformLocation | null;
      tex5: WebGLUniformLocation | null;
      texFurShell: WebGLUniformLocation | null;
    };
  } | null>(null);

  // Initialize WebGL context, shaders, and photo-sampled textures once
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      (canvas.getContext('webgl2', { antialias: true, alpha: true }) as WebGLRenderingContext | null) ||
      canvas.getContext('webgl', { antialias: true, alpha: true });
    if (!gl) return;

    // Ensure 32-bit element indices work on WebGL1 if fallback was used
    if (typeof WebGL2RenderingContext === 'undefined' || !(gl instanceof WebGL2RenderingContext)) {
      gl.getExtension('OES_element_index_uint');
    }

    const vs = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const createTex = (source: HTMLCanvasElement): WebGLTexture => {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.generateMipmap(gl.TEXTURE_2D);
      return tex;
    };

    const initialSwatches = createInitialPlushTextures();
    const textures: Record<TextureSlotKey, WebGLTexture> = {
      velboaWhite: createTex(initialSwatches.velboaWhite),
      cyanFur: createTex(initialSwatches.cyanFur),
      navyPlush: createTex(initialSwatches.navyPlush),
      mintFleece: createTex(initialSwatches.mintFleece),
      ivoryKnit: createTex(initialSwatches.ivoryKnit),
      blueDenim: createTex(initialSwatches.blueDenim),
      furShell: createTex(initialSwatches.furShell),
    };

    // Upgrade textures seamlessly with real photo swatches from AI studio images
    const cancelLoad = loadRealPhotoSwatches((key, swatchCanvas) => {
      const tex = textures[key];
      if (!tex) return;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, swatchCanvas);
      gl.generateMipmap(gl.TEXTURE_2D);
    });

    glStateRef.current = {
      gl,
      program,
      solidMesh: null,
      furMesh: null,
      textures,
      attribs: {
        pos: gl.getAttribLocation(program, 'a_pos'),
        nor: gl.getAttribLocation(program, 'a_nor'),
        uv: gl.getAttribLocation(program, 'a_uv'),
        texId: gl.getAttribLocation(program, 'a_texId'),
        col: gl.getAttribLocation(program, 'a_col'),
        fur: gl.getAttribLocation(program, 'a_fur'),
      },
      uniforms: {
        mvp: gl.getUniformLocation(program, 'u_mvp'),
        model: gl.getUniformLocation(program, 'u_model'),
        breath: gl.getUniformLocation(program, 'u_breath'),
        camPos: gl.getUniformLocation(program, 'u_camPos'),
        lighting: gl.getUniformLocation(program, 'u_lighting'),
        isFurPass: gl.getUniformLocation(program, 'u_isFurPass'),
        tex0: gl.getUniformLocation(program, 'u_tex0'),
        tex1: gl.getUniformLocation(program, 'u_tex1'),
        tex2: gl.getUniformLocation(program, 'u_tex2'),
        tex3: gl.getUniformLocation(program, 'u_tex3'),
        tex4: gl.getUniformLocation(program, 'u_tex4'),
        tex5: gl.getUniformLocation(program, 'u_tex5'),
        texFurShell: gl.getUniformLocation(program, 'u_texFurShell'),
      },
    };

    let rafId = 0;
    const startTime = performance.now();

    const bindMeshAttributes = (mesh: GpuMesh) => {
      const st = glStateRef.current!;
      const b = mesh.vaoOrBuffers;

      gl.bindBuffer(gl.ARRAY_BUFFER, b.pos);
      gl.enableVertexAttribArray(st.attribs.pos);
      gl.vertexAttribPointer(st.attribs.pos, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, b.nor);
      gl.enableVertexAttribArray(st.attribs.nor);
      gl.vertexAttribPointer(st.attribs.nor, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, b.uv);
      gl.enableVertexAttribArray(st.attribs.uv);
      gl.vertexAttribPointer(st.attribs.uv, 2, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, b.texId);
      gl.enableVertexAttribArray(st.attribs.texId);
      gl.vertexAttribPointer(st.attribs.texId, 1, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, b.col);
      gl.enableVertexAttribArray(st.attribs.col);
      gl.vertexAttribPointer(st.attribs.col, 3, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ARRAY_BUFFER, b.fur);
      gl.enableVertexAttribArray(st.attribs.fur);
      gl.vertexAttribPointer(st.attribs.fur, 1, gl.FLOAT, false, 0, 0);

      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.idx);
    };

    const renderFrame = (now: number) => {
      const st = glStateRef.current;
      if (!st) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const dw = Math.floor(canvas.clientWidth * dpr);
      const dh = Math.floor(canvas.clientHeight * dpr);
      if (canvas.width !== dw || canvas.height !== dh) {
        canvas.width = dw;
        canvas.height = dh;
      }

      const cam = camRef.current;
      if (cam.autoRotate && !dragRef.current.active) {
        cam.targetYaw += 0.0085;
      }
      cam.yaw += (cam.targetYaw - cam.yaw) * 0.14;
      cam.pitch += (cam.targetPitch - cam.pitch) * 0.14;

      const normDeg = (((Math.round((cam.yaw * 180) / Math.PI) % 360) + 360) % 360);
      setAngleDeg(normDeg);

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);

      if (st.solidMesh) {
        gl.useProgram(st.program);

        const elapsed = (now - startTime) * 0.001;
        const breath = Math.sin(elapsed * 2.0) * 0.004;

        const dist = 2.45 / cam.zoom;
        const camX = Math.sin(cam.yaw) * Math.cos(cam.pitch) * dist;
        const camY = Math.sin(cam.pitch) * dist + 0.02;
        const camZ = Math.cos(cam.yaw) * Math.cos(cam.pitch) * dist;

        const aspect = canvas.width / Math.max(1, canvas.height);
        const proj = mat4Perspective(0.68, aspect, 0.1, 20.0);
        const view = mat4LookAt([camX, camY, camZ], [0, -0.02, 0]);
        const model = mat4RotateY(0);
        const mvp = mat4Multiply(proj, mat4Multiply(view, model));

        gl.uniformMatrix4fv(st.uniforms.mvp, false, mvp);
        gl.uniformMatrix4fv(st.uniforms.model, false, model);
        gl.uniform1f(st.uniforms.breath, breath);
        gl.uniform3f(st.uniforms.camPos, camX, camY, camZ);
        gl.uniform1i(
          st.uniforms.lighting,
          cam.lighting === 'warm' ? 1 : cam.lighting === 'daylight' ? 2 : 0
        );

        const texKeys: TextureSlotKey[] = [
          'velboaWhite',
          'cyanFur',
          'navyPlush',
          'mintFleece',
          'ivoryKnit',
          'blueDenim',
          'furShell',
        ];
        const texLocs = [
          st.uniforms.tex0,
          st.uniforms.tex1,
          st.uniforms.tex2,
          st.uniforms.tex3,
          st.uniforms.tex4,
          st.uniforms.tex5,
          st.uniforms.texFurShell,
        ];
        for (let i = 0; i < texKeys.length; i++) {
          gl.activeTexture(gl.TEXTURE0 + i);
          gl.bindTexture(gl.TEXTURE_2D, st.textures[texKeys[i]]);
          gl.uniform1i(texLocs[i], i);
        }

        // Pass 1: Opaque Solid Plush Body, Outfit, Hat & Accessory
        gl.disable(gl.BLEND);
        gl.depthMask(true);
        gl.disable(gl.CULL_FACE);
        gl.uniform1i(st.uniforms.isFurPass, 0);
        bindMeshAttributes(st.solidMesh);
        gl.drawElements(gl.TRIANGLES, st.solidMesh.indexCount, gl.UNSIGNED_INT, 0);

        // Pass 2: 3D Multi-Shell Fluffy Fur Tufts around Mane & Tail
        if (st.furMesh) {
          gl.enable(gl.BLEND);
          gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
          gl.depthMask(false);
          gl.disable(gl.CULL_FACE);
          gl.uniform1i(st.uniforms.isFurPass, 1);
          bindMeshAttributes(st.furMesh);
          gl.drawElements(gl.TRIANGLES, st.furMesh.indexCount, gl.UNSIGNED_INT, 0);
          gl.depthMask(true);
          gl.disable(gl.BLEND);
        }
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
      cancelLoad();
      const st = glStateRef.current;
      if (st) {
        deleteGpuMesh(st.gl, st.solidMesh);
        deleteGpuMesh(st.gl, st.furMesh);
        Object.values(st.textures).forEach((t) => st.gl.deleteTexture(t));
        st.gl.deleteProgram(st.program);
        glStateRef.current = null;
      }
    };
  }, []);

  // Rebuild 3D meshes whenever outfit / hat / acc changes
  useEffect(() => {
    const st = glStateRef.current;
    if (!st) return;
    const meshes = buildChaChaSceneMeshes(outfit, hat, acc);
    deleteGpuMesh(st.gl, st.solidMesh);
    deleteGpuMesh(st.gl, st.furMesh);
    st.solidMesh = uploadMesh(st.gl, meshes.solid);
    st.furMesh = uploadMesh(st.gl, meshes.furShell);
  }, [outfit, hat, acc, showSpecSheet]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setAutoRotate(false);
    dragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startYaw: camRef.current.targetYaw,
      startPitch: camRef.current.targetPitch,
      dist: 0,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    dragRef.current.dist = Math.hypot(dx, dy);

    camRef.current.targetYaw = dragRef.current.startYaw - dx * 0.011;
    camRef.current.targetPitch = Math.max(
      -0.45,
      Math.min(0.65, dragRef.current.startPitch + dy * 0.008)
    );
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (dragRef.current.dist < 6 && onSelectPart && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const relY = (e.clientY - rect.top) / rect.height;
      if (relY < 0.42) onSelectPart('hat');
      else onSelectPart('outfit');
    }
  };

  const setPresetAngle = (yawRad: number, pitchRad = 0.08) => {
    setAutoRotate(false);
    camRef.current.targetYaw = yawRad;
    camRef.current.targetPitch = pitchRad;
  };

  const backdropGrad =
    lighting === 'warm'
      ? 'radial-gradient(circle at 50% 42%, #fffdf9 0%, #fef7ed 62%, #ffedd5 100%)'
      : lighting === 'daylight'
      ? 'radial-gradient(circle at 50% 42%, #ffffff 0%, #f0f9ff 62%, #e0f2fe 100%)'
      : 'radial-gradient(circle at 50% 42%, #ffffff 0%, #f8fafc 62%, #eff6ff 100%)';

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
              <span>360° 실사 텍스처 3D 인형</span>
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
              CNU 공식 차차 봉제인형 360° 3D 스펙
            </span>
            <h3 className="mt-3 text-lg font-black text-slate-900">
              {coordinateSummaryName || '차차 25cm 스탠다드 봉제인형 & 커스텀 의상'}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-slate-600">
              실물 차차 AI 스튜디오 촬영본에서 추출한 벨보아(Velboa)·장모 퍼·케이블 니트·데님 원단 텍스처와 다중 셸(Multi-Shell) 털 결을 360° 실시간 3D 메시 위에 적용한 피팅 모델입니다.
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
              <p className="mt-0.5 text-[11px] text-slate-500">3중 입체 셸 퍼 실루엣 구현</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
              <span className="font-bold text-slate-400">현재 착용 의상</span>
              <p className="mt-1 font-black text-cnu-navy">{OUTFIT_LABELS[outfit]}</p>
              <p className="mt-0.5 text-[11px] text-slate-500">360° 앞·뒤·측면 패턴 완벽 구현</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
              <span className="font-bold text-slate-400">착용 모자 · 소품</span>
              <p className="mt-1 font-black text-cnu-navy">
                {HAT_LABELS[hat]} / {ACC_LABELS[acc]}
              </p>
              <p className="mt-0.5 text-[11px] text-slate-500">1:1 인형 전용 맞춤 입체 파츠</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSpecSheet(false)}
            className="w-full rounded-2xl bg-cnu-navy py-3 text-center text-xs font-extrabold text-white transition hover:bg-slate-800"
          >
            360° 3D 피팅 화면으로 돌아가기
          </button>
        </div>
      ) : (
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{
            background: backdropGrad,
            touchAction: 'none',
          }}
          className={`relative w-full overflow-hidden rounded-3xl border border-slate-200/80 shadow-inner ${
            compact ? 'h-[360px]' : 'h-[460px] sm:h-[500px]'
          } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          {/* Top-left Drag Guide Pill */}
          {!compact && (
            <div className="pointer-events-none absolute left-4 top-4 z-20 flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/92 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs ring-1 ring-slate-200/80 backdrop-blur-md">
                <Eye className="h-3.5 w-3.5 text-sky-500" />
                <span>360° 자유 회전 ({angleDeg}°) · 실물 원단 & 털 결 3D 확인</span>
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
                onClick={() => setInternalZoom((z) => Math.min(1.4, +(z + 0.1).toFixed(2)))}
                title="확대"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-slate-700 shadow-xs ring-1 ring-slate-200/80 backdrop-blur transition hover:bg-slate-100"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setInternalZoom((z) => Math.max(0.75, +(z - 0.1).toFixed(2)))}
                title="축소"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-slate-700 shadow-xs ring-1 ring-slate-200/80 backdrop-blur transition hover:bg-slate-100"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setInternalZoom((z) => (Math.abs(z - 1.25) < 0.05 ? 1.0 : 1.25))
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
                  setPresetAngle(0, 0.08);
                }}
                title="정면 초기화"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/92 text-slate-700 shadow-xs ring-1 ring-slate-200/80 backdrop-blur transition hover:bg-slate-100"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Soft Ground Contact Shadow */}
          <div className="pointer-events-none absolute bottom-[8%] left-1/2 h-10 w-[48%] -translate-x-1/2 rounded-full bg-slate-900/12 blur-xl" />

          {/* WebGL 360° 3D Canvas */}
          <canvas ref={canvasRef} className="h-full w-full block" />

          {/* Bottom 360° Angle Preset Bar */}
          {!compact && (
            <div
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full bg-white/92 p-1 shadow-md ring-1 ring-slate-200/90 backdrop-blur-md"
            >
              <button
                type="button"
                onClick={() => setPresetAngle(0, 0.08)}
                className="rounded-full px-3 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              >
                정면 (0°)
              </button>
              <button
                type="button"
                onClick={() => setPresetAngle(-Math.PI / 2, 0.08)}
                className="rounded-full px-3 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              >
                좌측 (90°)
              </button>
              <button
                type="button"
                onClick={() => setPresetAngle(Math.PI, 0.1)}
                className="rounded-full px-3 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              >
                뒷모습 (180°)
              </button>
              <button
                type="button"
                onClick={() => setPresetAngle(Math.PI / 2, 0.08)}
                className="rounded-full px-3 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-100"
              >
                우측 (270°)
              </button>
              <button
                type="button"
                onClick={() => setAutoRotate((prev) => !prev)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition ${
                  autoRotate
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Compass className="h-3 w-3" />
                <span>360° 자동회전</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
