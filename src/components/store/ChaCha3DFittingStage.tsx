'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Sun,
  Sparkles,
  Move3d,
  Eye,
  Ruler,
} from 'lucide-react';

export type OutfitKey = 'none' | 'varsity' | 'graduation' | 'hoodie' | 'vest' | 'dungarees';
export type HatKey = 'none' | 'grad_cap' | 'ballcap' | 'cherry';
export type AccKey = 'none' | 'crossbag' | 'diploma';
export type LightingPreset = 'studio' | 'gallery' | 'warm';

interface ChaCha3DFittingStageProps {
  outfit: OutfitKey;
  hat: HatKey;
  acc: AccKey;
  coordinateSummaryName: string;
}

const OUTFIT_ID_MAP: Record<OutfitKey, number> = {
  none: 0,
  varsity: 1,
  graduation: 2,
  hoodie: 3,
  vest: 4,
  dungarees: 5,
};

const HAT_ID_MAP: Record<HatKey, number> = {
  none: 0,
  grad_cap: 1,
  ballcap: 2,
  cherry: 3,
};

const ACC_ID_MAP: Record<AccKey, number> = {
  none: 0,
  crossbag: 1,
  diploma: 2,
};

const LIGHTING_ID_MAP: Record<LightingPreset, number> = {
  studio: 0,
  gallery: 1,
  warm: 2,
};

const VERTEX_SHADER_SRC = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SRC = `
precision highp float;

varying vec2 v_uv;
uniform vec2 u_resolution;
uniform float u_yaw;
uniform float u_pitch;
uniform float u_zoom;
uniform float u_time;
uniform int u_outfit;
uniform int u_hat;
uniform int u_acc;
uniform int u_lighting;

// --- 3D Hash & Procedural Fur Noise Functions ---
float hash31(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}

float noise3D(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(
      mix(hash31(i + vec3(0, 0, 0)), hash31(i + vec3(1, 0, 0)), f.x),
      mix(hash31(i + vec3(0, 1, 0)), hash31(i + vec3(1, 1, 0)), f.x),
      f.y
    ),
    mix(
      mix(hash31(i + vec3(0, 0, 1)), hash31(i + vec3(1, 0, 1)), f.x),
      mix(hash31(i + vec3(0, 1, 1)), hash31(i + vec3(1, 1, 1)), f.x),
      f.y
    ),
    f.z
  );
}

// Multi-octave directional fur strand field
float furStrandField(vec3 p, vec3 stretch) {
  vec3 q = p * stretch;
  float n = 0.55 * noise3D(q);
  n += 0.30 * noise3D(q * 2.15 + vec3(1.7, 3.2, 5.1));
  n += 0.15 * noise3D(q * 4.30);
  return n;
}

// --- SDF Primitives ---
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float sdSphere(vec3 p, float s) {
  return length(p) - s;
}

float sdEllipsoid(vec3 p, vec3 r) {
  float k0 = length(p / r);
  float k1 = length(p / (r * r));
  return k0 * (k0 - 1.0) / max(k1, 0.0001);
}

float sdRoundBox(vec3 p, vec3 b, float r) {
  vec3 q = abs(p) - b;
  return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0) - r;
}

float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
  vec3 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

float sdCylinder(vec3 p, float r, float h) {
  vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h);
  return min(max(d.x, d.y), 0.0) + length(max(d, 0.0));
}

float sdCappedCone(vec3 p, float h, float r1, float r2) {
  vec2 q = vec2(length(p.xz), p.y);
  vec2 k1 = vec2(r2, h);
  vec2 k2 = vec2(r2 - r1, 2.0 * h);
  vec2 ca = vec2(q.x - min(q.x, (q.y < 0.0) ? r1 : r2), abs(q.y) - h);
  vec2 cb = q - k1 + k2 * clamp(dot(k1 - q, k2) / dot(k2, k2), 0.0, 1.0);
  float s = (cb.x < 0.0 && ca.y < 0.0) ? -1.0 : 1.0;
  return s * sqrt(min(dot(ca, ca), dot(cb, cb)));
}

mat2 rot2(float a) {
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c);
}

// Material IDs:
// 1.0 = Soft Studio Floor Pad
// 2.0 = ChaCha White Velboa Plush Body, Face, Ears, Paws, Feet
// 3.0 = ChaCha Shaggy Long-Pile Cyan Mane & Tail
// 4.0 = Embroidered Navy Eyes & Nostrils
// 6.0 = Outfit Layer
// 7.0 = Headwear Layer
// 8.0 = Accessory Layer

vec2 opU(vec2 a, vec2 b) {
  return (a.x < b.x) ? a : b;
}

vec2 mapScene(vec3 p) {
  // Subtle plush breathing motion
  float breath = sin(u_time * 1.8) * 0.005;
  vec3 q = p - vec3(0.0, breath, 0.0);

  // 1. Soft Studio Plush Cushion / Shadow Floor
  float floorDisc = sdCylinder(p - vec3(0.0, -0.82, 0.0), 0.85, 0.025);
  vec2 res = vec2(floorDisc, 1.0);

  // 2. ChaCha 2-Head-Ratio Chubby Stuffed Plush Head & Snout (matching uploaded photos)
  // Wide cuddly right/center head + large rounded left snout
  vec3 headRPos = q - vec3(0.06, 0.22, 0.0);
  float headRight = sdEllipsoid(headRPos, vec3(0.42, 0.34, 0.36));

  vec3 snoutPos = q - vec3(-0.18, 0.25, 0.06);
  snoutPos.xy *= rot2(-0.12);
  snoutPos.xz *= rot2(-0.10);
  float snout = sdEllipsoid(snoutPos, vec3(0.33, 0.27, 0.33));

  float head = smin(headRight, snout, 0.16);

  // Top-Right Upright Ear (peeking behind the cyan mane)
  vec3 earTopPos = q - vec3(0.22, 0.63, -0.03);
  earTopPos.xy *= rot2(-0.28);
  float earTop = sdEllipsoid(earTopPos, vec3(0.11, 0.16, 0.065));

  // Right Side Horizontal Plush Ear (with folded inner groove)
  vec3 earSidePos = q - vec3(0.41, 0.34, 0.02);
  earSidePos.xy *= rot2(0.18);
  float earSide = sdEllipsoid(earSidePos, vec3(0.15, 0.095, 0.075));
  float earGroove = sdCapsule(q, vec3(0.34, 0.34, 0.07), vec3(0.48, 0.36, 0.07), 0.028);
  earSide = max(earSide, -earGroove * 0.55);

  head = smin(head, min(earTop, earSide), 0.035);

  // 3. Chubby Stuffed Torso, Stubby Arms, Wide Legs & Round Feet
  vec3 torsoPos = q - vec3(0.0, -0.25, 0.0);
  float torso = sdCappedCone(torsoPos, 0.23, 0.29, 0.23);
  torso = smin(torso, sdEllipsoid(q - vec3(0.0, -0.28, 0.01), vec3(0.28, 0.23, 0.25)), 0.06);

  // Plump Outstretched Plush Arms / Paws
  float armL = sdCapsule(q, vec3(-0.22, -0.10, 0.0), vec3(-0.34, -0.28, 0.07), 0.105);
  float armR = sdCapsule(q, vec3(0.22, -0.10, 0.0), vec3(0.34, -0.28, 0.07), 0.105);

  // Chubby Plush Legs & Stubby Round Feet with Toe Pads
  float legL = sdCapsule(q, vec3(-0.13, -0.44, 0.0), vec3(-0.14, -0.68, 0.02), 0.125);
  float footL = sdEllipsoid(q - vec3(-0.14, -0.70, 0.07), vec3(0.135, 0.085, 0.155));
  legL = smin(legL, footL, 0.045);

  float legR = sdCapsule(q, vec3(0.13, -0.44, 0.0), vec3(0.14, -0.68, 0.02), 0.125);
  float footR = sdEllipsoid(q - vec3(0.14, -0.70, 0.07), vec3(0.135, 0.085, 0.155));
  legR = smin(legR, footR, 0.045);

  float plushBody = smin(head, torso, 0.045);
  plushBody = smin(plushBody, min(armL, armR), 0.035);
  plushBody = smin(plushBody, min(legL, legR), 0.035);

  // Subtle plush surface fuzz displacement on white velboa body
  float whiteFuzz = (noise3D(q * 42.0) - 0.5) * 0.0035;
  res = opU(res, vec2(plushBody + whiteFuzz, 2.0));

  // 4. Shaggy Long-Pile 3-Lobe Cyan Mane & Fluffy Tail (matching uploaded plush photos)
  // 3 thick sweeping diagonal lobes across top of head + side/back drape
  float mLobe1 = sdCapsule(q, vec3(0.18, 0.44, 0.18), vec3(-0.04, 0.49, 0.25), 0.115);
  float mLobe2 = sdCapsule(q, vec3(0.16, 0.53, 0.10), vec3(-0.11, 0.62, 0.16), 0.125);
  float mLobe3 = sdCapsule(q, vec3(0.12, 0.63, 0.02), vec3(-0.07, 0.74, 0.06), 0.120);
  float mCrown = sdEllipsoid(q - vec3(0.08, 0.55, -0.05), vec3(0.26, 0.22, 0.24));
  float mBack = sdCapsule(q, vec3(0.22, 0.42, -0.10), vec3(0.25, 0.02, -0.16), 0.145);

  float mane = smin(mLobe1, mLobe2, 0.045);
  mane = smin(mane, mLobe3, 0.045);
  mane = smin(mane, smin(mCrown, mBack, 0.06), 0.055);

  // Fluffy Cyan Tail sweeping out to the right-back
  float tail = sdCapsule(q, vec3(0.08, -0.52, -0.18), vec3(0.38, -0.48, -0.22), 0.105);
  tail = smin(tail, sdEllipsoid(q - vec3(0.43, -0.44, -0.22), vec3(0.13, 0.10, 0.11)), 0.05);

  float cyanPlush = min(mane, tail);
  // Pronounced 3D shaggy fur tuft displacement on cyan mane & tail
  float cyanFurDisp = (noise3D(q * vec3(28.0, 38.0, 28.0)) - 0.5) * 0.009;
  res = opU(res, vec2(cyanPlush + cyanFurDisp, 3.0));

  // 5. Embroidered Navy Eye & Two Snout Nostrils (matching reference photo layout)
  vec3 eyePos = q - vec3(0.14, 0.22, 0.345);
  float rightEye = sdEllipsoid(eyePos, vec3(0.036, 0.048, 0.025));
  float nostrilUpper = sdSphere(q - vec3(-0.29, 0.35, 0.295), 0.022);
  float nostrilLower = sdSphere(q - vec3(-0.20, 0.27, 0.345), 0.020);
  float faceEmb = min(rightEye, min(nostrilUpper, nostrilLower));
  res = opU(res, vec2(faceEmb, 4.0));

  // 6. 3D Stuffed Doll Outfits (modeled after uploaded photos)
  if (u_outfit == 0) {
    // Basic White T-Shirt & Shorts Setup (with raised collar & hem seams)
    float teeBody = sdCappedCone(q - vec3(0.0, -0.22, 0.0), 0.185, 0.305, 0.245);
    float teeCollar = sdCylinder(q - vec3(0.0, -0.04, 0.01), 0.21, 0.018);
    float teeHem = sdCylinder(q - vec3(0.0, -0.39, 0.0), 0.312, 0.016);
    float teeSleeveL = sdCapsule(q, vec3(-0.22, -0.09, 0.0), vec3(-0.31, -0.21, 0.05), 0.116);
    float teeSleeveR = sdCapsule(q, vec3(0.22, -0.09, 0.0), vec3(0.31, -0.21, 0.05), 0.116);
    float shortsL = sdCapsule(q, vec3(-0.13, -0.41, 0.0), vec3(-0.135, -0.58, 0.01), 0.136);
    float shortsR = sdCapsule(q, vec3(0.13, -0.41, 0.0), vec3(0.135, -0.58, 0.01), 0.136);
    float basicSet = smin(teeBody, min(teeSleeveL, teeSleeveR), 0.025);
    basicSet = smin(basicSet, min(teeCollar, teeHem), 0.015);
    basicSet = min(basicSet, min(shortsL, shortsR));
    float clothWrinkle = sin(q.x * 26.0 + q.y * 12.0) * 0.0025;
    res = opU(res, vec2(basicSet + clothWrinkle, 6.0));
  } else if (u_outfit == 1) {
    // CNU Navy Plush Varsity Jacket (matching 2nd photo: navy body + navy sleeves with white stripes)
    float vTorso = sdCappedCone(q - vec3(0.0, -0.24, 0.0), 0.21, 0.318, 0.252);
    float vSleeveL = sdCapsule(q, vec3(-0.22, -0.09, 0.0), vec3(-0.34, -0.26, 0.06), 0.120);
    float vSleeveR = sdCapsule(q, vec3(0.22, -0.09, 0.0), vec3(0.34, -0.26, 0.06), 0.120);
    float varsity = smin(vTorso, min(vSleeveL, vSleeveR), 0.03);
    float fleeceNoise = (noise3D(q * 36.0) - 0.5) * 0.004;
    res = opU(res, vec2(varsity + fleeceNoise, 6.0));
  } else if (u_outfit == 2) {
    // Pleated Academic Graduation Gown with V-Stole Collar (matching 3rd photo)
    float angle = atan(q.x, q.z);
    float pleatWave = smoothstep(-0.18, -0.45, q.y) * sin(angle * 14.0) * 0.012;
    float gownSkirt = sdCappedCone(q - vec3(0.0, -0.29, 0.0), 0.25, 0.365 + pleatWave, 0.245);
    float gSleeveL = sdCapsule(q, vec3(-0.22, -0.10, 0.0), vec3(-0.35, -0.27, 0.06), 0.128);
    float gSleeveR = sdCapsule(q, vec3(0.22, -0.10, 0.0), vec3(0.35, -0.27, 0.06), 0.128);
    // Raised V-Stole collar layer over shoulders
    float stoleCone = sdCappedCone(q - vec3(0.0, -0.13, 0.01), 0.09, 0.295, 0.255);
    float gown = smin(gownSkirt, min(gSleeveL, gSleeveR), 0.035);
    gown = smin(gown, stoleCone, 0.02);
    res = opU(res, vec2(gown, 6.0));
  } else if (u_outfit == 3) {
    // CNU Sky Plush Hoodie
    float hTorso = sdCappedCone(q - vec3(0.0, -0.24, 0.0), 0.21, 0.318, 0.25);
    float hSleeveL = sdCapsule(q, vec3(-0.22, -0.09, 0.0), vec3(-0.34, -0.26, 0.06), 0.118);
    float hSleeveR = sdCapsule(q, vec3(0.22, -0.09, 0.0), vec3(0.34, -0.26, 0.06), 0.118);
    float hPocket = sdRoundBox(q - vec3(0.0, -0.32, 0.27), vec3(0.14, 0.06, 0.04), 0.025);
    float hBackHood = sdEllipsoid(q - vec3(0.0, -0.01, -0.26), vec3(0.23, 0.11, 0.12));
    float hoodie = smin(hTorso, min(hSleeveL, hSleeveR), 0.035);
    hoodie = smin(hoodie, min(hPocket, hBackHood), 0.025);
    float fleece = (noise3D(q * 35.0) - 0.5) * 0.0035;
    res = opU(res, vec2(hoodie + fleece, 6.0));
  } else if (u_outfit == 4) {
    // Preppy Cable-Knit Vest & Shirt
    float vTorso = sdCappedCone(q - vec3(0.0, -0.24, 0.0), 0.21, 0.312, 0.248);
    float vSleeveL = sdCapsule(q, vec3(-0.22, -0.09, 0.0), vec3(-0.31, -0.22, 0.05), 0.114);
    float vSleeveR = sdCapsule(q, vec3(0.22, -0.09, 0.0), vec3(0.31, -0.22, 0.05), 0.114);
    float vest = smin(vTorso, min(vSleeveL, vSleeveR), 0.028);
    res = opU(res, vec2(vest, 6.0));
  } else if (u_outfit == 5) {
    // Retro Denim Dungarees (Overalls)
    float dTorso = sdCappedCone(q - vec3(0.0, -0.25, 0.0), 0.21, 0.315, 0.248);
    float dLegL = sdCapsule(q, vec3(-0.13, -0.41, 0.0), vec3(-0.14, -0.60, 0.01), 0.138);
    float dLegR = sdCapsule(q, vec3(0.13, -0.41, 0.0), vec3(0.14, -0.60, 0.01), 0.138);
    float dPocket = sdRoundBox(q - vec3(0.0, -0.24, 0.275), vec3(0.09, 0.065, 0.03), 0.02);
    float dungarees = smin(dTorso, min(dLegL, dLegR), 0.03);
    dungarees = smin(dungarees, dPocket, 0.02);
    res = opU(res, vec2(dungarees, 6.0));
  }

  // 7. 3D Headwear Layer (matching 3rd photo's tilted mortarboard & long vertical gold tassel)
  if (u_hat == 1) {
    vec3 capP = q - vec3(0.09, 0.72, 0.02);
    capP.xy *= rot2(-0.20);
    capP.yz *= rot2(0.08);
    float skullCap = sdCylinder(capP - vec3(0.0, -0.055, 0.0), 0.21, 0.065);
    vec3 boardP = capP - vec3(0.0, 0.015, 0.0);
    boardP.xz *= rot2(0.65);
    float board = sdRoundBox(boardP, vec3(0.28, 0.018, 0.28), 0.012);
    // Hanging Golden Tassel on the right side (in world-aligned q space so it hangs vertically)
    float cord = sdCapsule(q, vec3(0.16, 0.73, 0.12), vec3(0.27, 0.62, 0.18), 0.014);
    float tasselKnot = sdSphere(q - vec3(0.27, 0.60, 0.185), 0.032);
    float tasselFringe = sdCappedCone(q - vec3(0.275, 0.49, 0.19), 0.10, 0.042, 0.024);
    float gradCap = min(min(skullCap, board), min(cord, min(tasselKnot, tasselFringe)));
    res = opU(res, vec2(gradCap, 7.0));
  } else if (u_hat == 2) {
    // CNU Signature Ballcap
    vec3 bcP = q - vec3(0.05, 0.58, 0.02);
    float dome = sdEllipsoid(bcP, vec3(0.29, 0.20, 0.29));
    dome = max(dome, -bcP.y);
    vec3 visorP = bcP - vec3(-0.04, 0.02, 0.27);
    visorP.xz *= rot2(-0.12);
    float visor = sdRoundBox(visorP, vec3(0.21, 0.018, 0.16), 0.015);
    float topBtn = sdSphere(bcP - vec3(0.0, 0.20, 0.0), 0.028);
    float ballCap = smin(dome, visor, 0.025);
    ballCap = min(ballCap, topBtn);
    res = opU(res, vec2(ballCap, 7.0));
  } else if (u_hat == 3) {
    // Cherry Blossom Flower Crown
    vec3 crP = q - vec3(0.04, 0.55, 0.02);
    crP.yz *= rot2(0.10);
    float ringDist = length(vec2(length(crP.xz) - 0.32, crP.y)) - 0.032;
    float blossoms = ringDist;
    for (int i = 0; i < 8; i++) {
      float ang = float(i) * 0.785398;
      vec3 flPos = vec3(cos(ang) * 0.32, 0.01 * sin(ang * 2.0), sin(ang) * 0.32);
      float fl = sdSphere(crP - flPos, 0.068);
      blossoms = smin(blossoms, fl, 0.02);
    }
    res = opU(res, vec2(blossoms, 7.0));
  }

  // 8. 3D Accessories Layer
  if (u_acc == 1) {
    vec3 bagPos = q - vec3(0.27, -0.35, 0.15);
    bagPos.xz *= rot2(-0.35);
    float pouch = sdRoundBox(bagPos, vec3(0.095, 0.075, 0.045), 0.025);
    vec3 stP = q - vec3(0.0, -0.22, 0.0);
    stP.xy *= rot2(-0.68);
    float strapRing = max(
      abs(length(stP.xz) - 0.295) - 0.022,
      abs(stP.y) - 0.028
    );
    float crossbag = min(pouch, strapRing);
    res = opU(res, vec2(crossbag, 8.0));
  } else if (u_acc == 2) {
    vec3 dipPos = q - vec3(0.36, -0.27, 0.18);
    dipPos.xy *= rot2(0.42);
    dipPos.xz *= rot2(-0.30);
    float scroll = sdCapsule(dipPos, vec3(-0.13, 0.0, 0.0), vec3(0.13, 0.0, 0.0), 0.038);
    res = opU(res, vec2(scroll, 8.0));
  }

  return res;
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.0022, -0.0022);
  return normalize(
    e.xyy * mapScene(p + e.xyy).x +
    e.yyx * mapScene(p + e.yyx).x +
    e.yxy * mapScene(p + e.yxy).x +
    e.xxx * mapScene(p + e.xxx).x
  );
}

float calcSoftShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
  float res = 1.0;
  float t = mint;
  for (int i = 0; i < 22; i++) {
    float h = mapScene(ro + rd * t).x;
    res = min(res, k * h / t);
    t += clamp(h, 0.02, 0.12);
    if (res < 0.005 || t > maxt) break;
  }
  return clamp(res, 0.0, 1.0);
}

float calcAO(vec3 pos, vec3 nor) {
  float occ = 0.0;
  float sca = 1.0;
  for (int i = 0; i < 5; i++) {
    float h = 0.012 + 0.085 * float(i) / 4.0;
    float d = mapScene(pos + h * nor).x;
    occ += (h - d) * sca;
    sca *= 0.82;
  }
  return clamp(1.0 - 2.3 * occ, 0.0, 1.0);
}

// Compute surface color, directional fur fibers, stitches & fabric weave
vec3 getMaterialColor(vec3 p, inout vec3 n, float matId, out float roughness, out float plushFuzz) {
  float breath = sin(u_time * 1.8) * 0.005;
  vec3 q = p - vec3(0.0, breath, 0.0);

  roughness = 0.80;
  plushFuzz = 0.65;
  vec3 col = vec3(0.98, 0.98, 0.99);

  if (matId < 1.5) {
    // Soft Studio Floor Pad
    roughness = 0.60;
    plushFuzz = 0.10;
    float r = length(p.xz);
    col = mix(vec3(0.94, 0.95, 0.97), vec3(0.98, 0.99, 1.0), smoothstep(0.0, 0.85, r));
    return col;
  }

  if (matId < 2.5) {
    // ChaCha Soft White Velboa Plush Body, Face, Ears, Paws & Sky-Blue Toe Pads
    roughness = 0.85;
    plushFuzz = 0.85;

    // Fine velboa short-pile fur fiber texture
    float velboaFiber = furStrandField(q, vec3(55.0, 68.0, 55.0));
    col = mix(vec3(0.94, 0.95, 0.97), vec3(1.0, 1.0, 1.0), velboaFiber);

    // Perturb normal with fine plush fur fibers
    vec3 fiberGrad = vec3(
      furStrandField(q + vec3(0.004, 0.0, 0.0), vec3(55.0, 68.0, 55.0)) - velboaFiber,
      furStrandField(q + vec3(0.0, 0.004, 0.0), vec3(55.0, 68.0, 55.0)) - velboaFiber,
      furStrandField(q + vec3(0.0, 0.0, 0.004), vec3(55.0, 68.0, 55.0)) - velboaFiber
    );
    n = normalize(n + fiberGrad * 1.15);

    // Subtle plush sewing seam lines on snout & forehead (like the real stuffed toy)
    float seamSnout = abs(q.x + 0.08 - q.y * 0.22);
    if (q.z > 0.15 && q.y > 0.02 && q.y < 0.42 && seamSnout < 0.007) {
      col *= 0.94;
    }

    // Top-Right Upright Ear light blue-grey stitched edge
    vec3 earTopRel = q - vec3(0.22, 0.63, -0.03);
    if (length(earTopRel) < 0.19 && earTopRel.y > -0.05) {
      float earEdge = length(earTopRel.xy * vec2(1.1, 0.75));
      if (earEdge > 0.095) {
        col = vec3(0.66, 0.80, 0.88);
      }
    }

    // Round Peach-Pink Plush Cheek Patch with stitched border (below right eye)
    vec3 cheekRel = q - vec3(0.185, 0.115, 0.34);
    float cheekDist = length(cheekRel * vec3(1.0, 0.92, 0.7));
    if (cheekDist < 0.068 && q.z > 0.22) {
      col = vec3(0.98, 0.78, 0.74); // Soft peach-pink felt patch
      if (cheekDist > 0.056) {
        col = vec3(0.91, 0.65, 0.61); // Stitched border ring
      }
    }

    // Embroidered Dark-Navy Smile Curve on front face
    if (q.z > 0.28) {
      vec2 smUV = q.xy - vec2(-0.025, 0.135);
      float smArc = length(smUV - vec2(0.0, 0.028)) - 0.052;
      if (smUV.y < 0.012 && abs(smUV.x) < 0.052 && abs(smArc) < 0.012) {
        col = vec3(0.05, 0.15, 0.38);
        roughness = 0.45;
      }
    }

    // Sky-Blue Front Toe Pads on both feet (matching reference photos!)
    if (q.y < -0.62 && q.z > 0.14) {
      float padL = length((q.xy - vec2(-0.15, -0.71)) * vec2(1.0, 1.25));
      float padR = length((q.xy - vec2(0.15, -0.71)) * vec2(1.0, 1.25));
      float padDist = min(padL, padR);
      if (padDist < 0.068) {
        col = mix(vec3(0.32, 0.72, 0.88), vec3(0.45, 0.80, 0.93), velboaFiber);
        if (padDist > 0.058) {
          col = vec3(0.24, 0.60, 0.78); // Toe pad stitch seam
        }
      }
    }

    return col;
  }

  if (matId < 3.5) {
    // ChaCha Long-Pile Shaggy Cyan Mane & Tail (with directional combed fur strands!)
    roughness = 0.88;
    plushFuzz = 1.15;

    // Directional fur strands combed along the diagonal sweep of the mane
    vec3 furCoord = q;
    furCoord.xy *= rot2(0.42);
    float longStrands = furStrandField(furCoord, vec3(24.0, 82.0, 32.0));
    float fineStrands = noise3D(furCoord * vec3(48.0, 140.0, 48.0));
    float furPattern = mix(longStrands, fineStrands, 0.35);

    // Rich teal-cyan root-to-tip fur color gradient (matching photo 2, 3, 4)
    vec3 rootCol = vec3(0.06, 0.48, 0.66);
    vec3 midCol  = vec3(0.14, 0.65, 0.82);
    vec3 tipCol  = vec3(0.32, 0.79, 0.92);
    col = mix(rootCol, midCol, smoothstep(0.25, 0.60, furPattern));
    col = mix(col, tipCol, smoothstep(0.58, 0.85, furPattern));

    // Strong fur strand normal perturbation so hair texture is visibly tactile
    vec3 furNormalShift = vec3(
      furStrandField(furCoord + vec3(0.003, 0.0, 0.0), vec3(24.0, 82.0, 32.0)) - longStrands,
      furStrandField(furCoord + vec3(0.0, 0.003, 0.0), vec3(24.0, 82.0, 32.0)) - longStrands,
      furStrandField(furCoord + vec3(0.0, 0.0, 0.003), vec3(24.0, 82.0, 32.0)) - longStrands
    );
    n = normalize(n + furNormalShift * 2.4);
    return col;
  }

  if (matId < 4.5) {
    // Embroidered Dark Navy Eye & Nostrils (satin thread sheen)
    roughness = 0.32;
    plushFuzz = 0.15;
    float threadTex = sin(q.y * 220.0) * 0.04;
    col = vec3(0.04, 0.13, 0.34) + threadTex;
    return col;
  }

  if (matId < 6.5) {
    // 3D Outfit Materials
    roughness = 0.78;
    plushFuzz = 0.65;
    float clothFiber = furStrandField(q, vec3(60.0, 60.0, 60.0));

    if (u_outfit == 0) {
      // Basic White Cotton T-Shirt & Pants (matching 4th photo)
      col = mix(vec3(0.93, 0.95, 0.98), vec3(0.99, 0.99, 1.0), clothFiber);
      // Ribbed collar & bottom hem stitch lines
      if (abs(q.y - (-0.055)) < 0.016 || abs(q.y - (-0.385)) < 0.016) {
        col = vec3(0.90, 0.92, 0.95);
      }
      // Subtle leg hem line on shorts
      if (abs(q.y - (-0.56)) < 0.012) {
        col = vec3(0.88, 0.90, 0.94);
      }
    } else if (u_outfit == 1) {
      // CNU Navy Plush Varsity Jacket (matching 2nd photo: all-navy jacket + double white stripes)
      vec3 navyRoot = vec3(0.03, 0.11, 0.30);
      vec3 navyTip  = vec3(0.07, 0.21, 0.48);
      col = mix(navyRoot, navyTip, clothFiber);

      bool isSleeve = abs(q.x) > 0.215;
      if (isSleeve) {
        // Double white stripes on upper/mid sleeves & cuff border (matching 2nd photo!)
        float armDist = length(vec2(abs(q.x) - 0.22, q.y + 0.12));
        if (abs(armDist - 0.075) < 0.011 || abs(armDist - 0.105) < 0.011) {
          col = vec3(0.96, 0.98, 1.0);
        }
      } else {
        // Center front placket seam & 3 White Snap Buttons
        if (q.z > 0.16 && abs(q.x - (-0.03)) < 0.008) {
          col *= 0.75; // Placket seam
        }
        if (q.z > 0.18) {
          vec2 b1 = q.xy - vec2(-0.025, -0.14);
          vec2 b2 = q.xy - vec2(-0.025, -0.23);
          vec2 b3 = q.xy - vec2(-0.025, -0.32);
          if (min(length(b1), min(length(b2), length(b3))) < 0.019) {
            col = vec3(0.98, 0.99, 1.0);
            roughness = 0.25;
          }
        }
        // White striped V-neck collar & bottom waistband stripes
        if (q.y > -0.08 && abs(abs(q.x) - 0.06) < 0.022) {
          col = vec3(0.96, 0.98, 1.0);
        }
        if (q.y < -0.38 && abs(q.x) > 0.04) {
          if (abs(q.y - (-0.395)) < 0.009 || abs(q.y - (-0.42)) < 0.009) {
            col = vec3(0.96, 0.98, 1.0);
          }
        }
        // Cyan 'C' Chenille Patch with White Border on Right Chest (matching 2nd photo)
        if (q.z > 0.16) {
          vec2 cUV = (q.xy - vec2(0.105, -0.21)) * vec2(1.15, 0.92);
          float cR = length(cUV);
          bool inGap = (cUV.x > 0.012 && abs(cUV.y) < 0.024);
          if (cR > 0.028 && cR < 0.072 && !inGap) {
            col = vec3(0.06, 0.68, 0.88); // Cyan chenille C
            if (cR > 0.060 || cR < 0.038) {
              col = vec3(0.98, 0.99, 1.0); // Crisp white border
            }
          }
        }
        // Back 'CNU' Embroidery
        if (q.z < -0.15 && abs(q.y - (-0.19)) < 0.045 && abs(q.x) < 0.14) {
          if (sin(q.x * 65.0) > 0.15) {
            col = vec3(0.14, 0.72, 0.90);
          }
        }
      }
    } else if (u_outfit == 2) {
      // Pleated Graduation Gown & Blue/White V-Stole (matching 3rd photo!)
      col = mix(vec3(0.05, 0.09, 0.18), vec3(0.10, 0.15, 0.26), clothFiber);

      // Pleat shadow folds on lower skirt
      float angle = atan(q.x, q.z);
      if (q.y < -0.18) {
        col *= 0.90 + 0.10 * sin(angle * 14.0);
      }

      // Royal Blue & White Double V-Stole Collar across chest and back
      float vStole = abs(q.x) * 0.95 - (q.y + 0.19);
      if (q.y > -0.21 && vStole < 0.085 && vStole > -0.025) {
        col = vec3(0.08, 0.30, 0.64); // CNU Royal Blue stole
        if (abs(vStole - 0.022) < 0.014) {
          col = vec3(0.96, 0.98, 1.0); // Crisp white inner V-stripe (exact match to 3rd photo!)
        }
      }

      // Cyan 'C' Emblem on Right Chest of Gown (matching 3rd photo!)
      if (q.z > 0.16) {
        vec2 cUV = (q.xy - vec2(0.10, -0.22)) * vec2(1.15, 0.92);
        float cR = length(cUV);
        bool inGap = (cUV.x > 0.012 && abs(cUV.y) < 0.022);
        if (cR > 0.026 && cR < 0.066 && !inGap) {
          col = vec3(0.06, 0.68, 0.88);
          if (cR > 0.055 || cR < 0.035) {
            col = vec3(0.96, 0.98, 1.0);
          }
        }
      }
    } else if (u_outfit == 3) {
      // CNU Sky Plush Hoodie
      col = mix(vec3(0.06, 0.62, 0.82), vec3(0.18, 0.76, 0.92), clothFiber);
      if (q.z > 0.23 && q.y < -0.25) {
        col *= 0.88;
      }
      if (q.z > 0.18 && q.y > -0.20 && q.y < -0.06 && abs(abs(q.x) - 0.055) < 0.012) {
        col = vec3(0.98, 0.99, 1.0);
      }
      if (q.z > 0.20 && abs(q.y - (-0.18)) < 0.032 && abs(q.x) < 0.12) {
        col = vec3(0.04, 0.15, 0.42);
      }
    } else if (u_outfit == 4) {
      // Preppy Cable-Knit Vest & Navy Tie
      bool isSleeve = abs(q.x) > 0.215;
      if (isSleeve) {
        col = vec3(0.97, 0.98, 1.0);
      } else {
        float knit = sin(q.x * 110.0) * sin(q.y * 110.0) * 0.03;
        col = vec3(0.97, 0.94, 0.86) + knit;
        float vNeck = abs(q.x) * 1.5 - (q.y + 0.18);
        if (q.z > 0.12 && q.y > -0.19 && vNeck < 0.0) {
          col = vec3(0.98, 0.99, 1.0);
          if (abs(q.x) < 0.032) col = vec3(0.05, 0.16, 0.44);
        } else if (q.z > 0.12 && q.y > -0.21 && abs(vNeck) < 0.024) {
          col = vec3(0.05, 0.16, 0.44);
        }
        if (abs(q.y - (-0.41)) < 0.02) col = vec3(0.05, 0.16, 0.44);
      }
    } else if (u_outfit == 5) {
      // Retro Denim Dungarees (Overalls)
      bool isDenim = (q.y < -0.21) || (abs(q.x) < 0.14 && q.y < -0.09) || (abs(abs(q.x) - 0.10) < 0.038 && q.y >= -0.21);
      if (isDenim) {
        float twill = sin((q.x + q.y) * 140.0) * 0.025;
        col = vec3(0.24, 0.46, 0.76) + twill;
        if (q.z > 0.18 && abs(q.y - (-0.12)) < 0.024 && abs(abs(q.x) - 0.10) < 0.024) {
          col = vec3(0.98, 0.82, 0.28);
        }
        if (q.z > 0.25 && abs(q.x) < 0.085 && abs(q.y - (-0.24)) < 0.06) {
          col = vec3(0.18, 0.37, 0.65);
        }
      } else {
        col = vec3(0.97, 0.98, 1.0);
      }
    }

    // Apply soft fabric micro-normal
    vec3 clothGrad = vec3(clothFiber - 0.5) * 0.12;
    n = normalize(n + clothGrad);
    return col;
  }

  if (matId < 7.5) {
    // 3D Headwear Layer
    roughness = 0.72;
    plushFuzz = 0.55;
    if (u_hat == 1) {
      // Graduation Cap + Hanging Braided Gold Tassel (matching 3rd photo!)
      if (q.x > 0.15 && q.z > 0.08 && q.y < 0.73) {
        // Golden Thread Tassel with vertical strand texture
        float strand = sin(q.x * 260.0 + q.z * 260.0) * 0.06;
        col = vec3(0.96, 0.78, 0.26) + strand;
      } else {
        col = vec3(0.08, 0.12, 0.22); // Deep navy-black mortarboard felt
      }
    } else if (u_hat == 2) {
      vec3 bcP = q - vec3(0.05, 0.58, 0.02);
      if (bcP.z > 0.20 && bcP.y < 0.06) {
        col = vec3(0.14, 0.72, 0.90);
      } else if (bcP.y > 0.17) {
        col = vec3(0.14, 0.72, 0.90);
      } else {
        col = vec3(0.05, 0.16, 0.44);
        if (bcP.z > 0.18 && abs(bcP.x) < 0.065 && abs(bcP.y - 0.09) < 0.055) {
          col = vec3(0.14, 0.72, 0.90);
        }
      }
    } else if (u_hat == 3) {
      vec3 crP = q - vec3(0.04, 0.55, 0.02);
      crP.yz *= rot2(0.10);
      float ang = atan(crP.z, crP.x);
      float sector = mod(ang + 3.14159, 0.785398) - 0.392699;
      if (abs(sector) < 0.11 && abs(crP.y) < 0.03) {
        col = vec3(0.98, 0.84, 0.28);
      } else {
        col = vec3(0.99, 0.70, 0.80);
      }
    }
    return col;
  }

  // Accessory Layer
  roughness = 0.65;
  plushFuzz = 0.40;
  if (u_acc == 1) {
    if (q.x > 0.16 && q.y < -0.25) {
      col = vec3(0.14, 0.72, 0.90);
      if (abs(q.y - (-0.34)) < 0.022 && q.z > 0.14) {
        col = vec3(0.98, 0.84, 0.28);
      }
    } else {
      col = vec3(0.05, 0.16, 0.44);
    }
  } else if (u_acc == 2) {
    vec3 dipPos = q - vec3(0.36, -0.27, 0.18);
    dipPos.xy *= rot2(0.42);
    dipPos.xz *= rot2(-0.30);
    if (abs(dipPos.x) < 0.032) {
      col = vec3(0.88, 0.22, 0.22);
    } else {
      col = vec3(0.99, 0.98, 0.92);
    }
  }
  return col;
}

void main() {
  vec2 uv = v_uv;
  uv.x *= u_resolution.x / max(u_resolution.y, 1.0);

  // Clean White Studio Background (matching the uploaded plush product photos!)
  vec3 bgTop = vec3(0.99, 0.995, 1.0);
  vec3 bgBot = vec3(0.95, 0.965, 0.985);
  if (u_lighting == 1) {
    bgTop = vec3(0.10, 0.15, 0.28);
    bgBot = vec3(0.18, 0.26, 0.44);
  } else if (u_lighting == 2) {
    bgTop = vec3(1.0, 0.98, 0.94);
    bgBot = vec3(0.96, 0.91, 0.85);
  }
  vec3 bgCol = mix(bgBot, bgTop, clamp(v_uv.y * 0.5 + 0.5, 0.0, 1.0));

  // Camera Orbit
  float dist = 2.60 / clamp(u_zoom, 0.65, 1.65);
  vec3 target = vec3(0.0, -0.02, 0.0);
  vec3 ro = target + vec3(
    dist * cos(u_pitch) * sin(u_yaw),
    dist * sin(u_pitch),
    dist * cos(u_pitch) * cos(u_yaw)
  );

  vec3 fw = normalize(target - ro);
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(rt, fw);
  vec3 rd = normalize(fw * 1.68 + uv.x * rt + uv.y * up);

  // Raymarch
  float t = 0.0;
  float matId = -1.0;
  for (int i = 0; i < 88; i++) {
    vec3 p = ro + rd * t;
    vec2 h = mapScene(p);
    if (h.x < 0.0016) {
      matId = h.y;
      break;
    }
    t += h.x * 0.85;
    if (t > 5.5) break;
  }

  vec3 finalColor = bgCol;

  if (matId > 0.0) {
    vec3 pos = ro + rd * t;
    vec3 nor = calcNormal(pos);

    float roughness, plushFuzz;
    vec3 baseCol = getMaterialColor(pos, nor, matId, roughness, plushFuzz);

    // Soft Studio Plush Lighting (High-key softbox lighting like product photography)
    vec3 keyLightDir = normalize(vec3(0.42, 0.82, 0.72));
    vec3 fillLightDir = normalize(vec3(-0.68, 0.40, 0.50));
    vec3 backLightDir = normalize(vec3(0.0, 0.55, -0.85));

    vec3 keyCol = vec3(1.0, 0.99, 0.98);
    vec3 fillCol = vec3(0.84, 0.91, 1.0);
    if (u_lighting == 1) {
      keyCol = vec3(0.94, 0.97, 1.05);
      fillCol = vec3(0.45, 0.72, 0.98);
    } else if (u_lighting == 2) {
      keyCol = vec3(1.05, 0.97, 0.88);
      fillCol = vec3(0.95, 0.88, 0.78);
    }

    float occ = calcAO(pos, nor);
    float sha = calcSoftShadow(pos + nor * 0.008, keyLightDir, 0.02, 2.2, 8.0);

    // Plush Subsurface Wrap Diffuse (softens shadows across fuzzy fur)
    float wrapKey = clamp((dot(nor, keyLightDir) + 0.45) / 1.45, 0.0, 1.0);
    float wrapFill = clamp((dot(nor, fillLightDir) + 0.55) / 1.55, 0.0, 1.0);

    // Plush Fur Fresnel Rim Scattering (creates the fuzzy halo on plush edges!)
    float ndotv = clamp(dot(nor, -rd), 0.0, 1.0);
    float fuzzRim = pow(1.0 - ndotv, 2.2) * plushFuzz;

    // Subtle specular (only on embroidered eyes/snap buttons)
    vec3 hal = normalize(keyLightDir - rd);
    float specPower = mix(48.0, 6.0, roughness);
    float specStrength = mix(0.55, 0.04, roughness);
    float spec = pow(clamp(dot(nor, hal), 0.0, 1.0), specPower) * specStrength * sha;

    vec3 lin = vec3(0.0);
    lin += baseCol * keyCol * wrapKey * (0.52 + 0.48 * sha);
    lin += baseCol * fillCol * wrapFill * 0.36 * occ;
    // Soft plush fiber rim sheen
    lin += mix(baseCol, vec3(1.0), 0.55) * fuzzRim * 0.42 * (0.4 + 0.6 * occ);
    lin += vec3(1.0) * spec;

    // Seamless blend of floor pad edges into background
    if (matId < 1.5) {
      float floorFade = smoothstep(0.82, 0.35, length(pos.xz));
      lin = mix(bgCol, lin, floorFade);
    }

    finalColor = clamp(lin, 0.0, 1.0);
  }

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

const CAMERA_PRESETS = [
  { label: '정면', yaw: 0.08, pitch: 0.08 },
  { label: '좌측 45°', yaw: -0.68, pitch: 0.12 },
  { label: '우측 45°', yaw: 0.72, pitch: 0.12 },
  { label: '후면 180°', yaw: 3.14, pitch: 0.12 },
  { label: '상단 뷰', yaw: 0.15, pitch: 0.58 },
];

export default function ChaCha3DFittingStage({
  outfit,
  hat,
  acc,
  coordinateSummaryName,
}: ChaCha3DFittingStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [yaw, setYaw] = useState<number>(0.08);
  const [pitch, setPitch] = useState<number>(0.08);
  const [zoom, setZoom] = useState<number>(1.04);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [lighting, setLighting] = useState<LightingPreset>('studio');
  const [showSpecs, setShowSpecs] = useState<boolean>(false);
  const [webglReady, setWebglReady] = useState<boolean>(true);

  const dragRef = useRef<{
    active: boolean;
    lastX: number;
    lastY: number;
  }>({ active: false, lastX: 0, lastY: 0 });

  const stateRef = useRef({
    yaw,
    pitch,
    zoom,
    autoRotate,
    outfit,
    hat,
    acc,
    lighting,
  });

  useEffect(() => {
    stateRef.current = {
      yaw,
      pitch,
      zoom,
      autoRotate,
      outfit,
      hat,
      acc,
      lighting,
    };
  }, [yaw, pitch, zoom, autoRotate, outfit, hat, acc, lighting]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl =
        canvas.getContext('webgl', { antialias: true, preserveDrawingBuffer: false }) ||
        (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
    } catch {
      gl = null;
    }

    if (!gl) {
      setWebglReady(false);
      return;
    }

    const compileShader = (type: number, source: string) => {
      if (!gl) return null;
      const shader = gl.createShader(type);
      if (!shader) return null;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    };

    const vs = compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SRC);
    const fs = compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SRC);
    if (!vs || !fs) {
      setWebglReady(false);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      setWebglReady(false);
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setWebglReady(false);
      return;
    }
    gl.useProgram(program);

    const posBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(program, 'u_resolution');
    const uYaw = gl.getUniformLocation(program, 'u_yaw');
    const uPitch = gl.getUniformLocation(program, 'u_pitch');
    const uZoom = gl.getUniformLocation(program, 'u_zoom');
    const uTime = gl.getUniformLocation(program, 'u_time');
    const uOutfit = gl.getUniformLocation(program, 'u_outfit');
    const uHat = gl.getUniformLocation(program, 'u_hat');
    const uAcc = gl.getUniformLocation(program, 'u_acc');
    const uLighting = gl.getUniformLocation(program, 'u_lighting');

    let animId = 0;
    const startTime = performance.now();

    const renderFrame = (now: number) => {
      if (!gl || !canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const displayW = Math.max(1, Math.floor(canvas.clientWidth * dpr));
      const displayH = Math.max(1, Math.floor(canvas.clientHeight * dpr));
      if (canvas.width !== displayW || canvas.height !== displayH) {
        canvas.width = displayW;
        canvas.height = displayH;
        gl.viewport(0, 0, displayW, displayH);
      }

      const st = stateRef.current;
      if (st.autoRotate && !dragRef.current.active) {
        const nextYaw = st.yaw + 0.0065;
        stateRef.current.yaw = nextYaw;
      }

      const elapsed = (now - startTime) * 0.001;
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uYaw, stateRef.current.yaw);
      gl.uniform1f(uPitch, stateRef.current.pitch);
      gl.uniform1f(uZoom, stateRef.current.zoom);
      gl.uniform1f(uTime, elapsed);
      gl.uniform1i(uOutfit, OUTFIT_ID_MAP[st.outfit]);
      gl.uniform1i(uHat, HAT_ID_MAP[st.hat]);
      gl.uniform1i(uAcc, ACC_ID_MAP[st.acc]);
      gl.uniform1i(uLighting, LIGHTING_ID_MAP[st.lighting]);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      active: true,
      lastX: e.clientX,
      lastY: e.clientY,
    };
    setAutoRotate(false);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragRef.current.active) return;
    const dx = e.clientX - dragRef.current.lastX;
    const dy = e.clientY - dragRef.current.lastY;
    dragRef.current.lastX = e.clientX;
    dragRef.current.lastY = e.clientY;

    const nextYaw = stateRef.current.yaw - dx * 0.011;
    const nextPitch = Math.max(-0.25, Math.min(0.85, stateRef.current.pitch + dy * 0.009));
    stateRef.current.yaw = nextYaw;
    stateRef.current.pitch = nextPitch;
    setYaw(nextYaw);
    setPitch(nextPitch);
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    dragRef.current.active = false;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setZoom((prev) => {
      const next = Math.max(0.75, Math.min(1.5, prev - e.deltaY * 0.001));
      stateRef.current.zoom = next;
      return next;
    });
  }, []);

  const applyCameraPreset = (presetYaw: number, presetPitch: number) => {
    setAutoRotate(false);
    stateRef.current.yaw = presetYaw;
    stateRef.current.pitch = presetPitch;
    setYaw(presetYaw);
    setPitch(presetPitch);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Top 3D Controls Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cnu-navy text-white px-3 py-1 text-xs font-extrabold shadow-xs">
            <Move3d className="h-3.5 w-3.5 text-sky-300" />
            <span>3D 극세사 털·봉제 질감 모델</span>
          </span>
          <button
            type="button"
            onClick={() => setShowSpecs((prev) => !prev)}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold border transition-colors ${
              showSpecs
                ? 'bg-sky-100 border-sky-300 text-cnu-navy'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Ruler className="h-3 w-3" />
            <span>실물 규격·원단 정보</span>
          </button>
        </div>

        {/* Lighting Preset Selector */}
        <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1 text-[11px] font-bold">
          <Sun className="h-3.5 w-3.5 text-amber-500 ml-1.5 mr-0.5" />
          {(
            [
              { key: 'studio', label: '스튜디오' },
              { key: 'gallery', label: '전시관 조명' },
              { key: 'warm', label: '자연광' },
            ] as { key: LightingPreset; label: string }[]
          ).map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setLighting(item.key)}
              className={`rounded-full px-2.5 py-0.5 transition-all ${
                lighting === item.key
                  ? 'bg-white text-cnu-navy shadow-xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main 3D Stage Viewport */}
      <div className="relative flex aspect-square w-full max-w-[460px] items-center justify-center rounded-3xl border border-sky-100 bg-white shadow-inner overflow-hidden select-none">
        {webglReady ? (
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onWheel={handleWheel}
            aria-label={`3D 피팅 프리뷰: ${coordinateSummaryName}`}
            className="h-full w-full cursor-grab active:cursor-grabbing touch-none"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <Sparkles className="h-8 w-8 text-sky-500 mb-2" />
            <p className="text-sm font-bold text-slate-700">{coordinateSummaryName}</p>
            <p className="text-xs text-slate-400 mt-1">3D 그래픽 렌더링 스테이지</p>
          </div>
        )}

        {/* Top-Left Drag Hint Badge */}
        <div className="pointer-events-none absolute left-3.5 top-3.5 rounded-full bg-white/90 backdrop-blur-xs border border-slate-200/80 px-3 py-1 text-[11px] font-bold text-slate-700 shadow-xs flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-sky-600" />
          <span>드래그하여 360° 회전 · 털 결 & 봉제 디테일 확인</span>
        </div>

        {/* Floating Zoom & Auto-Spin Controls (Right Side) */}
        <div className="absolute right-3.5 top-3.5 flex flex-col gap-1.5">
          <button
            type="button"
            title="확대"
            onClick={() => {
              const next = Math.min(1.5, zoom + 0.12);
              stateRef.current.zoom = next;
              setZoom(next);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 backdrop-blur-xs border border-slate-200 text-slate-700 shadow-xs hover:bg-white hover:text-cnu-navy"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="축소"
            onClick={() => {
              const next = Math.max(0.75, zoom - 0.12);
              stateRef.current.zoom = next;
              setZoom(next);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 backdrop-blur-xs border border-slate-200 text-slate-700 shadow-xs hover:bg-white hover:text-cnu-navy"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="기본 배율"
            onClick={() => {
              stateRef.current.zoom = 1.04;
              setZoom(1.04);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/90 backdrop-blur-xs border border-slate-200 text-slate-700 shadow-xs hover:bg-white hover:text-cnu-navy"
          >
            <Maximize2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="자동 턴테이블 회전"
            onClick={() => setAutoRotate((prev) => !prev)}
            className={`flex h-8 w-8 items-center justify-center rounded-xl border shadow-xs transition-colors ${
              autoRotate
                ? 'bg-cnu-navy border-cnu-navy text-white'
                : 'bg-white/90 border-slate-200 text-slate-700 hover:bg-white'
            }`}
          >
            <RotateCw className={`h-4 w-4 ${autoRotate ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Physical Doll Specification Overlay */}
        {showSpecs && (
          <div className="absolute inset-x-4 bottom-14 rounded-2xl bg-slate-900/90 backdrop-blur-md p-3.5 text-white shadow-lg border border-white/15 text-xs space-y-1.5">
            <div className="flex items-center justify-between border-b border-white/15 pb-1.5">
              <span className="font-extrabold text-sky-300">
                실물 완성본 예상 스펙 (Pre-Order Guide)
              </span>
              <button
                type="button"
                onClick={() => setShowSpecs(false)}
                className="text-[11px] text-slate-300 hover:text-white"
              >
                닫기 ✕
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-200">
              <div>
                <span className="text-slate-400 block">인형 본체 크기</span>
                <span className="font-bold">높이 22cm × 폭 15cm × 두께 13cm</span>
              </div>
              <div>
                <span className="text-slate-400 block">갈기 / 바디 원단</span>
                <span className="font-bold">장모 극세사 퍼(갈기) + 5mm 벨보아</span>
              </div>
              <div>
                <span className="text-slate-400 block">커스텀 의상 제작</span>
                <span className="font-bold">기부 폐과잠·학사복 원단 탈부착형 봉제</span>
              </div>
              <div>
                <span className="text-slate-400 block">매장 수령 / 배송</span>
                <span className="font-bold">방문 수령 시 현장에서 피팅 확인 가능</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Camera Angle Quick Bar */}
        <div className="absolute bottom-3 inset-x-3 flex items-center justify-center gap-1.5 flex-wrap">
          {CAMERA_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => applyCameraPreset(preset.yaw, preset.pitch)}
              className="rounded-full bg-white/90 backdrop-blur-xs border border-slate-200/90 px-2.5 py-1 text-[11px] font-extrabold text-slate-700 shadow-xs hover:bg-cnu-navy hover:text-white hover:border-cnu-navy transition-colors"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
