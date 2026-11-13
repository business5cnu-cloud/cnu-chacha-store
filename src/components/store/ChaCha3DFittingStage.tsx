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

// Smooth union / subtraction primitives
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float smax(float a, float b, float k) {
  return -smin(-a, -b, k);
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
// 1.0 = Pedestal base
// 2.0 = ChaCha Plush White Body & Head
// 3.0 = ChaCha Cyan Mane & Tail
// 4.0 = Eyes / Nostrils / Dark Navy Details
// 5.0 = Pink Blush / Inner Ear
// 6.0 = Outfit Primary
// 7.0 = Hat Primary
// 8.0 = Accessory Primary

vec2 opU(vec2 a, vec2 b) {
  return (a.x < b.x) ? a : b;
}

// Evaluate ChaCha 3D Plush Model SDF & Material ID
vec2 mapScene(vec3 p) {
  // Subtle breathing idle motion on the doll
  float breath = sin(u_time * 2.2) * 0.008;
  vec3 q = p - vec3(0.0, breath, 0.0);

  // 1. Turntable Pedestal (stays stationary vertically)
  float pedBase = sdCylinder(p - vec3(0.0, -0.86, 0.0), 0.78, 0.055);
  float pedTop = sdCylinder(p - vec3(0.0, -0.80, 0.0), 0.70, 0.02);
  float ped = min(pedBase, pedTop);
  vec2 res = vec2(ped, 1.0);

  // 2. ChaCha Plush Head & Snout
  // Main head centered at y=0.28, snout projecting forward (+z) and slightly left (-x)
  vec3 headPos = q - vec3(0.02, 0.30, -0.02);
  float headMain = sdEllipsoid(headPos, vec3(0.39, 0.34, 0.36));
  vec3 snoutPos = q - vec3(-0.08, 0.24, 0.24);
  snoutPos.xz *= rot2(-0.18);
  float snout = sdEllipsoid(snoutPos, vec3(0.27, 0.21, 0.26));
  float head = smin(headMain, snout, 0.14);

  // Plush Ears (Left & Right)
  vec3 earRPos = q - vec3(0.35, 0.39, -0.04);
  earRPos.xy *= rot2(-0.45);
  float earR = sdEllipsoid(earRPos, vec3(0.18, 0.095, 0.09));

  vec3 earLPos = q - vec3(-0.28, 0.44, -0.10);
  earLPos.xy *= rot2(0.55);
  float earL = sdEllipsoid(earLPos, vec3(0.16, 0.085, 0.08));

  head = smin(head, min(earR, earL), 0.04);

  // 3. Plush Torso, Arms, and Legs
  vec3 torsoPos = q - vec3(0.0, -0.25, 0.0);
  float torso = sdCappedCone(torsoPos, 0.24, 0.29, 0.21);
  torso = smin(torso, sdSphere(q - vec3(0.0, -0.28, 0.02), 0.27), 0.08);

  // Left & Right Plush Arms
  float armL = sdCapsule(q, vec3(-0.21, -0.08, 0.0), vec3(-0.33, -0.32, 0.08), 0.095);
  float armR = sdCapsule(q, vec3(0.21, -0.08, 0.0), vec3(0.32, -0.30, 0.10), 0.095);

  // Left & Right Plush Legs & Feet
  float legL = sdCapsule(q, vec3(-0.12, -0.45, 0.0), vec3(-0.12, -0.71, 0.02), 0.115);
  float footL = sdEllipsoid(q - vec3(-0.12, -0.73, 0.08), vec3(0.12, 0.075, 0.15));
  legL = smin(legL, footL, 0.05);

  float legR = sdCapsule(q, vec3(0.12, -0.45, 0.0), vec3(0.12, -0.71, 0.02), 0.115);
  float footR = sdEllipsoid(q - vec3(0.12, -0.73, 0.08), vec3(0.12, 0.075, 0.15));
  legR = smin(legR, footR, 0.05);

  float plushBody = smin(head, torso, 0.05);
  plushBody = smin(plushBody, min(armL, armR), 0.04);
  plushBody = smin(plushBody, min(legL, legR), 0.04);

  res = opU(res, vec2(plushBody, 2.0));

  // 4. ChaCha Signature 3-Crest Fluffy Cyan Mane & Tail
  float mane1 = sdEllipsoid(q - vec3(-0.02, 0.56, 0.12), vec3(0.22, 0.13, 0.20));
  float mane2 = sdEllipsoid(q - vec3(0.03, 0.65, 0.01), vec3(0.21, 0.14, 0.21));
  float mane3 = sdEllipsoid(q - vec3(0.06, 0.72, -0.10), vec3(0.18, 0.13, 0.19));
  float maneBack = sdCapsule(q, vec3(0.05, 0.52, -0.18), vec3(0.08, 0.02, -0.28), 0.16);
  float mane = smin(smin(mane1, mane2, 0.06), smin(mane3, maneBack, 0.07), 0.06);

  // Fluffy Cyan Tail at back
  vec3 tailPos = q - vec3(0.12, -0.52, -0.32);
  tailPos.xz *= rot2(0.35);
  float tail = sdCapsule(q, vec3(0.02, -0.48, -0.22), vec3(0.24, -0.46, -0.44), 0.095);
  tail = smin(tail, sdEllipsoid(q - vec3(0.28, -0.44, -0.46), vec3(0.12, 0.09, 0.14)), 0.06);

  res = opU(res, vec2(min(mane, tail), 3.0));

  // 5. 3D Beaded Eyes & Nostrils
  float eyeR = sdSphere(q - vec3(0.06, 0.29, 0.335), 0.042);
  float eyeL = sdSphere(q - vec3(-0.24, 0.30, 0.36), 0.032);
  float nostril1 = sdSphere(q - vec3(-0.22, 0.33, 0.455), 0.016);
  float nostril2 = sdSphere(q - vec3(-0.16, 0.29, 0.475), 0.016);
  float faceBeads = min(min(eyeR, eyeL), min(nostril1, nostril2));
  res = opU(res, vec2(faceBeads, 4.0));

  // 6. 3D Outfit Geometry Layer (wraps volumetrically over torso/arms/legs)
  if (u_outfit == 0) {
    // White Basic T-shirt & Pants shell
    float shirt = sdCappedCone(q - vec3(0.0, -0.22, 0.0), 0.19, 0.295, 0.225);
    float sleeveL = sdCapsule(q, vec3(-0.21, -0.08, 0.0), vec3(-0.30, -0.24, 0.05), 0.108);
    float sleeveR = sdCapsule(q, vec3(0.21, -0.08, 0.0), vec3(0.29, -0.23, 0.07), 0.108);
    float pantsL = sdCapsule(q, vec3(-0.12, -0.42, 0.0), vec3(-0.12, -0.65, 0.02), 0.128);
    float pantsR = sdCapsule(q, vec3(0.12, -0.42, 0.0), vec3(0.12, -0.65, 0.02), 0.128);
    float basicOutfit = smin(shirt, min(sleeveL, sleeveR), 0.03);
    basicOutfit = min(basicOutfit, min(pantsL, pantsR));
    res = opU(res, vec2(basicOutfit, 6.0));
  } else if (u_outfit == 1) {
    // CNU Varsity Jacket (padded torso + puffy sleeves + collar)
    float jTorso = sdCappedCone(q - vec3(0.0, -0.24, 0.0), 0.22, 0.315, 0.24);
    float jSleeveL = sdCapsule(q, vec3(-0.22, -0.08, 0.0), vec3(-0.33, -0.31, 0.08), 0.112);
    float jSleeveR = sdCapsule(q, vec3(0.22, -0.08, 0.0), vec3(0.32, -0.29, 0.10), 0.112);
    float varsity = smin(jTorso, min(jSleeveL, jSleeveR), 0.035);
    res = opU(res, vec2(varsity, 6.0));
  } else if (u_outfit == 2) {
    // Academic Graduation Gown (flared A-line robe + wide bell sleeves)
    float gownBody = sdCappedCone(q - vec3(0.0, -0.34, 0.0), 0.31, 0.38, 0.23);
    float gSleeveL = sdCapsule(q, vec3(-0.22, -0.09, 0.0), vec3(-0.35, -0.33, 0.08), 0.125);
    float gSleeveR = sdCapsule(q, vec3(0.22, -0.09, 0.0), vec3(0.34, -0.31, 0.10), 0.125);
    float gown = smin(gownBody, min(gSleeveL, gSleeveR), 0.04);
    res = opU(res, vec2(gown, 6.0));
  } else if (u_outfit == 3) {
    // CNU Sky Hoodie (cozy pullover + kangaroo pocket + back hood)
    float hTorso = sdCappedCone(q - vec3(0.0, -0.24, 0.0), 0.22, 0.315, 0.24);
    float hSleeveL = sdCapsule(q, vec3(-0.22, -0.08, 0.0), vec3(-0.33, -0.30, 0.08), 0.112);
    float hSleeveR = sdCapsule(q, vec3(0.22, -0.08, 0.0), vec3(0.32, -0.29, 0.10), 0.112);
    float hPocket = sdRoundBox(q - vec3(0.0, -0.33, 0.26), vec3(0.14, 0.065, 0.04), 0.025);
    float hBackHood = sdEllipsoid(q - vec3(0.0, 0.02, -0.25), vec3(0.22, 0.11, 0.12));
    float hoodie = smin(hTorso, min(hSleeveL, hSleeveR), 0.04);
    hoodie = smin(hoodie, min(hPocket, hBackHood), 0.03);
    res = opU(res, vec2(hoodie, 6.0));
  } else if (u_outfit == 4) {
    // Preppy Knit Vest & Shirt
    float vTorso = sdCappedCone(q - vec3(0.0, -0.24, 0.0), 0.22, 0.31, 0.235);
    float vSleeveL = sdCapsule(q, vec3(-0.21, -0.08, 0.0), vec3(-0.30, -0.24, 0.05), 0.106);
    float vSleeveR = sdCapsule(q, vec3(0.21, -0.08, 0.0), vec3(0.29, -0.23, 0.07), 0.106);
    float vest = smin(vTorso, min(vSleeveL, vSleeveR), 0.03);
    res = opU(res, vec2(vest, 6.0));
  } else if (u_outfit == 5) {
    // Retro Denim Dungarees (overalls covering legs + torso bib + shoulder straps)
    float dTorso = sdCappedCone(q - vec3(0.0, -0.25, 0.0), 0.22, 0.312, 0.235);
    float dLegL = sdCapsule(q, vec3(-0.12, -0.42, 0.0), vec3(-0.12, -0.66, 0.02), 0.13);
    float dLegR = sdCapsule(q, vec3(0.12, -0.42, 0.0), vec3(0.12, -0.66, 0.02), 0.13);
    float dPocket = sdRoundBox(q - vec3(0.0, -0.24, 0.265), vec3(0.09, 0.07, 0.03), 0.02);
    float dungarees = smin(dTorso, min(dLegL, dLegR), 0.035);
    dungarees = smin(dungarees, dPocket, 0.02);
    res = opU(res, vec2(dungarees, 6.0));
  }

  // 7. 3D Headwear Layer
  if (u_hat == 1) {
    // Graduation Cap (Mortarboard + Skullcap + Tassel)
    vec3 capP = q - vec3(0.04, 0.72, -0.02);
    capP.xy *= rot2(-0.12);
    capP.yz *= rot2(0.10);
    float skullCap = sdCylinder(capP - vec3(0.0, -0.06, 0.0), 0.22, 0.06);
    vec3 boardP = capP - vec3(0.0, 0.01, 0.0);
    boardP.xz *= rot2(0.785);
    float board = sdRoundBox(boardP, vec3(0.30, 0.018, 0.30), 0.01);
    float button = sdSphere(capP - vec3(0.0, 0.035, 0.0), 0.03);
    float tassel = sdCapsule(capP, vec3(0.0, 0.03, 0.0), vec3(0.28, -0.14, 0.12), 0.022);
    float gradCap = min(min(skullCap, board), min(button, tassel));
    res = opU(res, vec2(gradCap, 7.0));
  } else if (u_hat == 2) {
    // CNU Signature Ballcap (Dome crown + curved forward visor)
    vec3 bcP = q - vec3(0.02, 0.58, 0.02);
    float dome = sdEllipsoid(bcP, vec3(0.29, 0.20, 0.29));
    dome = max(dome, -bcP.y);
    vec3 visorP = bcP - vec3(-0.05, 0.02, 0.27);
    visorP.xz *= rot2(-0.15);
    float visor = sdRoundBox(visorP, vec3(0.21, 0.018, 0.16), 0.015);
    float topBtn = sdSphere(bcP - vec3(0.0, 0.20, 0.0), 0.028);
    float ballCap = smin(dome, visor, 0.025);
    ballCap = min(ballCap, topBtn);
    res = opU(res, vec2(ballCap, 7.0));
  } else if (u_hat == 3) {
    // Cherry Blossom Flower Crown (360 ring of 3D blossoms around head)
    vec3 crP = q - vec3(0.02, 0.55, 0.0);
    crP.yz *= rot2(0.12);
    float ringDist = length(vec2(length(crP.xz) - 0.31, crP.y)) - 0.032;
    float blossoms = ringDist;
    for (int i = 0; i < 8; i++) {
      float ang = float(i) * 0.785398;
      vec3 flPos = vec3(cos(ang) * 0.31, 0.01 * sin(ang * 2.0), sin(ang) * 0.31);
      float fl = sdSphere(crP - flPos, 0.068);
      blossoms = smin(blossoms, fl, 0.02);
    }
    res = opU(res, vec2(blossoms, 7.0));
  }

  // 8. 3D Accessories Layer
  if (u_acc == 1) {
    // Mini Crossbag (3D pouch on right hip + diagonal strap across torso)
    vec3 bagPos = q - vec3(0.26, -0.36, 0.14);
    bagPos.xz *= rot2(-0.35);
    float pouch = sdRoundBox(bagPos, vec3(0.095, 0.075, 0.045), 0.025);
    // Diagonal strap ring wrapped around torso
    vec3 stP = q - vec3(0.0, -0.22, 0.0);
    stP.xy *= rot2(-0.68);
    float strapRing = max(
      abs(length(stP.xz) - 0.285) - 0.022,
      abs(stP.y) - 0.028
    );
    float crossbag = min(pouch, strapRing);
    res = opU(res, vec2(crossbag, 8.0));
  } else if (u_acc == 2) {
    // CNU Diploma Scroll held by right paw
    vec3 dipPos = q - vec3(0.35, -0.28, 0.18);
    dipPos.xy *= rot2(0.42);
    dipPos.xz *= rot2(-0.30);
    float scroll = sdCapsule(dipPos, vec3(-0.13, 0.0, 0.0), vec3(0.13, 0.0, 0.0), 0.038);
    res = opU(res, vec2(scroll, 8.0));
  }

  return res;
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.002, -0.002);
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
  for (int i = 0; i < 24; i++) {
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
    float h = 0.01 + 0.08 * float(i) / 4.0;
    float d = mapScene(pos + h * nor).x;
    occ += (h - d) * sca;
    sca *= 0.85;
  }
  return clamp(1.0 - 2.2 * occ, 0.0, 1.0);
}

// Compute surface albedo & roughness based on 3D coordinates and material ID
vec3 getMaterialColor(vec3 p, vec3 n, float matId, out float roughness, out float plushSheen) {
  float breath = sin(u_time * 2.2) * 0.008;
  vec3 q = p - vec3(0.0, breath, 0.0);

  roughness = 0.65;
  plushSheen = 0.35;
  vec3 col = vec3(0.98, 0.98, 0.99);

  if (matId < 1.5) {
    // Pedestal Turntable
    roughness = 0.25;
    plushSheen = 0.05;
    float r = length(p.xz);
    col = vec3(0.94, 0.96, 0.99);
    if (abs(r - 0.63) < 0.016) {
      col = vec3(0.0, 0.74, 0.92); // Glowing cyan ring
    } else if (abs(r - 0.67) < 0.008) {
      col = vec3(0.04, 0.16, 0.45); // Navy accent ring
    } else if (p.y < -0.82) {
      col = vec3(0.84, 0.88, 0.94);
    }
    return col;
  }

  if (matId < 2.5) {
    // ChaCha Plush White Body & Face Details
    roughness = 0.75;
    plushSheen = 0.55;
    col = vec3(0.99, 0.99, 1.0);

    // Pink Blush Cheeks
    float blushR = length(q - vec3(0.11, 0.19, 0.31));
    float blushL = length(q - vec3(-0.27, 0.20, 0.34));
    float blushMask = smoothstep(0.085, 0.035, min(blushR, blushL));
    col = mix(col, vec3(1.0, 0.72, 0.78), blushMask * 0.85);

    // Cute Smile Curve on Snout
    vec2 smileUV = q.xy - vec2(-0.07, 0.19);
    if (q.z > 0.25) {
      float smileDist = abs(length(smileUV - vec2(0.0, 0.02)) - 0.045);
      if (smileUV.y < 0.015 && abs(smileUV.x) < 0.045 && smileDist < 0.011) {
        col = vec3(0.04, 0.12, 0.38);
      }
    }

    // Inner Ear Navy/Soft Blue Hollow
    float inEarR = length((q - vec3(0.35, 0.39, 0.01)) * vec3(0.7, 1.3, 1.0));
    if (inEarR < 0.085 && q.z > -0.05) {
      col = vec3(0.05, 0.18, 0.48);
    }

    // Cyan Paw Pads under feet
    if (q.y < -0.70 && q.z > 0.10) {
      float padL = length(q.xy - vec2(-0.12, -0.73));
      float padR = length(q.xy - vec2(0.12, -0.73));
      if (min(padL, padR) < 0.05) {
        col = vec3(0.0, 0.74, 0.92);
      }
    }
    return col;
  }

  if (matId < 3.5) {
    // ChaCha Cyan-Mint Mane & Tail
    roughness = 0.70;
    plushSheen = 0.60;
    col = mix(vec3(0.0, 0.68, 0.88), vec3(0.05, 0.82, 0.96), clamp(q.y + 0.4, 0.0, 1.0));
    return col;
  }

  if (matId < 4.5) {
    // Glossy Dark Navy Eyes & Nostrils
    roughness = 0.10;
    plushSheen = 0.0;
    col = vec3(0.02, 0.08, 0.26);
    return col;
  }

  if (matId < 6.5) {
    // Outfit Layer Coloring
    roughness = 0.60;
    plushSheen = 0.45;

    if (u_outfit == 0) {
      // Basic White Setup with subtle ice-blue collar & hem trim
      col = vec3(0.96, 0.98, 1.0);
      if (abs(q.y - (-0.05)) < 0.018 || abs(q.y - (-0.40)) < 0.012) {
        col = vec3(0.82, 0.89, 0.96);
      }
    } else if (u_outfit == 1) {
      // CNU Varsity Jacket
      bool isSleeve = abs(q.x) > 0.21;
      if (isSleeve) {
        col = vec3(0.98, 0.99, 1.0); // White leather sleeves
        // Sleeve cuff navy/white stripes
        if (q.y < -0.24 && sin(q.y * 120.0) > 0.0) {
          col = vec3(0.04, 0.16, 0.45);
        }
      } else {
        col = vec3(0.04, 0.16, 0.45); // CNU Navy Wool Body
        // White center placket snap buttons
        if (q.z > 0.15 && abs(q.x) < 0.022) {
          float btnMod = mod(q.y + 0.42, 0.095);
          if (abs(btnMod - 0.045) < 0.018 && q.y > -0.40 && q.y < -0.08) {
            col = vec3(0.98, 0.99, 1.0);
          }
        }
        // Bottom ribbed hem stripes
        if (q.y < -0.41 && sin(q.y * 130.0) > 0.0) {
          col = vec3(0.98, 0.99, 1.0);
        }
        // Collar white V-stripe
        if (q.y > -0.07 && abs(q.x) < 0.14) {
          col = vec3(0.98, 0.99, 1.0);
        }
        // Left chest 'C' Chenille Patch (at x ~ 0.10, y ~ -0.21, front +z)
        if (q.z > 0.15) {
          vec2 cUV = q.xy - vec2(0.10, -0.20);
          float cR = length(cUV);
          if (cR > 0.032 && cR < 0.068 && !(cUV.x > 0.015 && abs(cUV.y) < 0.025)) {
            col = vec3(0.0, 0.74, 0.92); // Cyan C patch
            if (cR > 0.058 || cR < 0.040) col = vec3(1.0); // White chenille border
          }
        }
        // Back 'CNU' Arch Embroidery (when viewing back, q.z < -0.15)
        if (q.z < -0.15 && abs(q.y - (-0.18)) < 0.045 && abs(q.x) < 0.14) {
          if (sin(q.x * 65.0) > 0.15) {
            col = vec3(0.0, 0.74, 0.92);
          }
        }
      }
    } else if (u_outfit == 2) {
      // Academic Graduation Gown & Blue/Gold V-Stole
      col = vec3(0.13, 0.15, 0.19); // Matte black robe
      // Center pleat line
      if (abs(q.x) < 0.015 && q.z > 0.0) {
        col = vec3(0.08, 0.09, 0.12);
      }
      // V-Stole on front & back shoulders
      float vLine = abs(q.x) * 1.45 - (q.y + 0.25);
      if (q.y > -0.26 && vLine < 0.12 && vLine > -0.02) {
        col = vec3(0.0, 0.34, 0.70); // CNU Blue stole
        if (vLine > 0.09 || vLine < 0.005) {
          col = vec3(0.97, 0.82, 0.27); // Gold trim
        }
      }
    } else if (u_outfit == 3) {
      // CNU Sky Hoodie
      col = vec3(0.0, 0.72, 0.90);
      // Darker pocket shading
      if (q.z > 0.23 && q.y < -0.26) {
        col = vec3(0.0, 0.58, 0.78);
      }
      // White hoodie strings
      if (q.z > 0.18 && q.y > -0.21 && q.y < -0.06 && abs(abs(q.x) - 0.055) < 0.012) {
        col = vec3(0.99, 0.99, 1.0);
      }
      // Navy chest stripe / CNU badge
      if (q.z > 0.20 && abs(q.y - (-0.19)) < 0.032 && abs(q.x) < 0.12) {
        col = vec3(0.04, 0.16, 0.45);
      }
    } else if (u_outfit == 4) {
      // Preppy Knit Vest & Navy Tie
      bool isSleeve = abs(q.x) > 0.21;
      if (isSleeve) {
        col = vec3(0.98, 0.99, 1.0); // White dress shirt sleeves
      } else {
        col = vec3(0.98, 0.95, 0.87); // Ivory cable-knit vest
        // Subtle knit texture pattern
        col -= 0.025 * sin(q.x * 90.0) * sin(q.y * 90.0);
        // V-neck navy trim & tie at center top
        float vNeck = abs(q.x) * 1.6 - (q.y + 0.18);
        if (q.z > 0.12 && q.y > -0.19 && vNeck < 0.0) {
          col = vec3(0.99, 0.99, 1.0); // White shirt collar
          if (abs(q.x) < 0.032) {
            col = vec3(0.04, 0.16, 0.45); // Navy necktie
          }
        } else if (q.z > 0.12 && q.y > -0.21 && abs(vNeck) < 0.025) {
          col = vec3(0.04, 0.16, 0.45); // Navy V-neck trim
        }
        // Bottom navy stripe
        if (abs(q.y - (-0.42)) < 0.02) {
          col = vec3(0.04, 0.16, 0.45);
        }
      }
    } else if (u_outfit == 5) {
      // Retro Denim Dungarees (Overalls)
      // White undershirt visible on upper chest & sides
      bool isDenim = (q.y < -0.22) || (abs(q.x) < 0.14 && q.y < -0.09) || (abs(abs(q.x) - 0.10) < 0.038 && q.y >= -0.22);
      if (isDenim) {
        col = vec3(0.23, 0.45, 0.76); // Indigo denim
        // Brass buttons on straps
        if (q.z > 0.18 && abs(q.y - (-0.12)) < 0.024 && abs(abs(q.x) - 0.10) < 0.024) {
          col = vec3(1.0, 0.86, 0.28);
        }
        // Darker front bib pocket
        if (q.z > 0.25 && abs(q.x) < 0.085 && abs(q.y - (-0.24)) < 0.06) {
          col = vec3(0.17, 0.36, 0.65);
        }
      } else {
        col = vec3(0.98, 0.99, 1.0); // White tee underneath
      }
    }
    return col;
  }

  if (matId < 7.5) {
    // Hat Layer Coloring
    roughness = 0.55;
    plushSheen = 0.35;
    if (u_hat == 1) {
      // Grad Cap: Matte black + gold button/tassel
      vec3 capP = q - vec3(0.04, 0.72, -0.02);
      if (capP.x > 0.08 || (length(capP.xz) < 0.05 && capP.y > 0.01)) {
        col = vec3(1.0, 0.85, 0.28); // Gold tassel & center button
      } else {
        col = vec3(0.12, 0.14, 0.18); // Black mortarboard
      }
    } else if (u_hat == 2) {
      // CNU Ballcap: Navy crown + Cyan visor & C logo
      vec3 bcP = q - vec3(0.02, 0.58, 0.02);
      if (bcP.z > 0.20 && bcP.y < 0.06) {
        col = vec3(0.0, 0.74, 0.92); // Cyan visor
      } else if (bcP.y > 0.17) {
        col = vec3(0.0, 0.74, 0.92); // Top button
      } else {
        col = vec3(0.04, 0.16, 0.45); // Navy crown
        // Front 'C' emblem
        if (bcP.z > 0.18 && abs(bcP.x) < 0.065 && abs(bcP.y - 0.09) < 0.055) {
          col = vec3(0.0, 0.74, 0.92);
        }
      }
    } else if (u_hat == 3) {
      // Cherry Blossom Crown: Pastel pink petals + yellow centers + green vine
      vec3 crP = q - vec3(0.02, 0.55, 0.0);
      crP.yz *= rot2(0.12);
      float ang = atan(crP.z, crP.x);
      float sector = mod(ang + 3.14159, 0.785398) - 0.392699;
      if (abs(sector) < 0.11 && abs(crP.y) < 0.03) {
        col = vec3(1.0, 0.86, 0.28); // Yellow stamen center
      } else {
        col = vec3(1.0, 0.68, 0.80); // Pink cherry blossom petals
      }
    }
    return col;
  }

  // Accessory Layer Coloring (matId ~ 8.0)
  roughness = 0.50;
  plushSheen = 0.25;
  if (u_acc == 1) {
    // Mini Crossbag: Cyan pouch with gold clasp + navy/gold strap
    if (q.x > 0.16 && q.y < -0.26) {
      col = vec3(0.0, 0.74, 0.92); // Cyan messenger pouch
      if (abs(q.y - (-0.35)) < 0.022 && q.z > 0.14) {
        col = vec3(1.0, 0.86, 0.28); // Gold clasp
      }
    } else {
      col = vec3(0.04, 0.16, 0.45); // Navy strap
    }
  } else if (u_acc == 2) {
    // Diploma Scroll: Warm ivory scroll + red ribbon band
    vec3 dipPos = q - vec3(0.35, -0.28, 0.18);
    dipPos.xy *= rot2(0.42);
    dipPos.xz *= rot2(-0.30);
    if (abs(dipPos.x) < 0.032) {
      col = vec3(0.90, 0.22, 0.21); // Red ribbon
    } else {
      col = vec3(1.0, 0.99, 0.93); // Ivory scroll paper
    }
  }
  return col;
}

void main() {
  vec2 uv = v_uv;
  uv.x *= u_resolution.x / max(u_resolution.y, 1.0);

  // Studio background gradient based on lighting preset
  vec3 bgTop = vec3(0.94, 0.97, 1.0);
  vec3 bgBot = vec3(0.86, 0.91, 0.97);
  if (u_lighting == 1) {
    // VR Gallery Dark Spotlight
    bgTop = vec3(0.08, 0.13, 0.26);
    bgBot = vec3(0.16, 0.24, 0.42);
  } else if (u_lighting == 2) {
    // Warm Campus Daylight
    bgTop = vec3(1.0, 0.97, 0.92);
    bgBot = vec3(0.95, 0.89, 0.81);
  }
  vec3 bgCol = mix(bgBot, bgTop, clamp(v_uv.y * 0.5 + 0.5, 0.0, 1.0));
  // Subtle radial spotlight behind ChaCha
  float rad = length(uv);
  bgCol += (u_lighting == 1 ? vec3(0.08, 0.16, 0.30) : vec3(0.06, 0.07, 0.08)) * exp(-rad * rad * 1.8);

  // Camera setup (Orbit around target)
  float dist = 2.65 / clamp(u_zoom, 0.65, 1.65);
  vec3 target = vec3(0.0, -0.06, 0.0);
  vec3 ro = target + vec3(
    dist * cos(u_pitch) * sin(u_yaw),
    dist * sin(u_pitch),
    dist * cos(u_pitch) * cos(u_yaw)
  );

  vec3 fw = normalize(target - ro);
  vec3 rt = normalize(cross(fw, vec3(0.0, 1.0, 0.0)));
  vec3 up = cross(rt, fw);
  vec3 rd = normalize(fw * 1.65 + uv.x * rt + uv.y * up);

  // Raymarching loop
  float t = 0.0;
  float matId = -1.0;
  for (int i = 0; i < 84; i++) {
    vec3 p = ro + rd * t;
    vec2 h = mapScene(p);
    if (h.x < 0.0018) {
      matId = h.y;
      break;
    }
    t += h.x;
    if (t > 6.0) break;
  }

  vec3 finalColor = bgCol;

  if (matId > 0.0) {
    vec3 pos = ro + rd * t;
    vec3 nor = calcNormal(pos);

    // Subtle plush micro-bump normal perturbation
    float roughness, plushSheen;
    vec3 baseCol = getMaterialColor(pos, nor, matId, roughness, plushSheen);
    if (plushSheen > 0.2) {
      vec3 micro = sin(pos * 140.0) * cos(pos.yzx * 140.0);
      nor = normalize(nor + micro * 0.018 * plushSheen);
    }

    // Studio 3-Point Lighting
    vec3 keyLightDir = normalize(vec3(0.55, 0.78, 0.65));
    vec3 fillLightDir = normalize(vec3(-0.70, 0.35, 0.40));
    vec3 rimLightDir = normalize(vec3(0.0, 0.45, -0.88));

    vec3 keyLightCol = vec3(1.0, 0.99, 0.97);
    vec3 fillLightCol = vec3(0.75, 0.86, 1.0);
    if (u_lighting == 1) {
      keyLightCol = vec3(0.92, 0.96, 1.05);
      fillLightCol = vec3(0.35, 0.68, 0.98);
    } else if (u_lighting == 2) {
      keyLightCol = vec3(1.06, 0.96, 0.86);
      fillLightCol = vec3(0.95, 0.85, 0.75);
    }

    float occ = calcAO(pos, nor);
    float sha = calcSoftShadow(pos + nor * 0.006, keyLightDir, 0.02, 2.5, 10.0);

    // Half-Lambert soft wrap diffuse for plush toy softness
    float difKey = clamp(dot(nor, keyLightDir) * 0.65 + 0.35, 0.0, 1.0);
    float difFill = clamp(dot(nor, fillLightDir) * 0.5 + 0.5, 0.0, 1.0);
    float rim = pow(clamp(1.0 - max(dot(nor, -rd), 0.0), 0.0, 1.0), 2.6);

    // Specular highlight (sharp on eyes/buttons, soft on plush)
    vec3 hal = normalize(keyLightDir - rd);
    float specPower = mix(64.0, 8.0, roughness);
    float specStrength = mix(0.85, 0.08, roughness);
    float spec = pow(clamp(dot(nor, hal), 0.0, 1.0), specPower) * specStrength * sha;

    vec3 lin = vec3(0.0);
    lin += baseCol * keyLightCol * difKey * (0.45 + 0.55 * sha);
    lin += baseCol * fillLightCol * difFill * 0.32 * occ;
    // Plush velvet Fresnel rim sheen
    lin += mix(baseCol, vec3(1.0), 0.65) * rim * (0.25 + 0.55 * plushSheen) * occ;
    lin += vec3(1.0) * spec;

    finalColor = clamp(lin, 0.0, 1.0);
  }

  gl_FragColor = vec4(finalColor, 1.0);
}
`;

const CAMERA_PRESETS = [
  { label: '정면', yaw: 0.25, pitch: 0.14 },
  { label: '좌측 45°', yaw: -0.72, pitch: 0.16 },
  { label: '우측 45°', yaw: 0.82, pitch: 0.16 },
  { label: '후면 180°', yaw: 3.14, pitch: 0.15 },
  { label: '상단 뷰', yaw: 0.3, pitch: 0.62 },
];

export default function ChaCha3DFittingStage({
  outfit,
  hat,
  acc,
  coordinateSummaryName,
}: ChaCha3DFittingStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [yaw, setYaw] = useState<number>(0.28);
  const [pitch, setPitch] = useState<number>(0.14);
  const [zoom, setZoom] = useState<number>(1.0);
  const [autoRotate, setAutoRotate] = useState<boolean>(true);
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
            <span>360° 3D 봉제인형 프리뷰</span>
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
      <div className="relative flex aspect-square w-full max-w-[460px] items-center justify-center rounded-3xl border border-sky-100 bg-slate-50 shadow-inner overflow-hidden select-none">
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
        <div className="pointer-events-none absolute left-3.5 top-3.5 rounded-full bg-white/85 backdrop-blur-xs border border-slate-200/80 px-3 py-1 text-[11px] font-bold text-slate-700 shadow-xs flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-sky-600" />
          <span>드래그하여 360° 회전 · 스크롤 확대/축소</span>
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
              stateRef.current.zoom = 1.0;
              setZoom(1.0);
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

        {/* Physical Doll Specification Overlay (For Pre-Purchase Expectation Check) */}
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
                <span className="text-slate-400 block">인형 원단 소재</span>
                <span className="font-bold">5mm 소프트 벨보아 극세사 + 고밀도 솜</span>
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
