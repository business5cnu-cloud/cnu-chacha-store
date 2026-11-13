import type { OutfitKey, HatKey, AccKey } from '../ChaCha3DFittingStage';

export interface MeshBuffers {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  texIds: Float32Array;
  colors: Float32Array;
  furs: Float32Array;
  indices: Uint32Array;
}

export interface ChaChaSceneMeshes {
  solid: MeshBuffers;
  furShell: MeshBuffers;
}

class MeshAccumulator {
  pos: number[] = [];
  nor: number[] = [];
  uv: number[] = [];
  texId: number[] = [];
  col: number[] = [];
  fur: number[] = [];
  idx: number[] = [];

  get vertexCount(): number {
    return this.pos.length / 3;
  }

  addVertex(
    px: number,
    py: number,
    pz: number,
    nx: number,
    ny: number,
    nz: number,
    u: number,
    v: number,
    texId: number,
    rgb: [number, number, number],
    furAmount: number
  ): number {
    const id = this.vertexCount;
    this.pos.push(px, py, pz);
    this.nor.push(nx, ny, nz);
    this.uv.push(u, v);
    this.texId.push(texId);
    this.col.push(rgb[0], rgb[1], rgb[2]);
    this.fur.push(furAmount);
    return id;
  }

  addTri(a: number, b: number, c: number): void {
    this.idx.push(a, b, c);
  }

  addQuad(a: number, b: number, c: number, d: number): void {
    this.idx.push(a, b, c, a, c, d);
  }

  // Recomputes smooth area-weighted vertex normals for a range of newly added triangles
  recomputeNormals(startVert: number, startIdx: number): void {
    const endVert = this.vertexCount;
    for (let v = startVert; v < endVert; v++) {
      this.nor[v * 3] = 0;
      this.nor[v * 3 + 1] = 0;
      this.nor[v * 3 + 2] = 0;
    }
    for (let i = startIdx; i < this.idx.length; i += 3) {
      const ia = this.idx[i];
      const ib = this.idx[i + 1];
      const ic = this.idx[i + 2];

      const ax = this.pos[ia * 3], ay = this.pos[ia * 3 + 1], az = this.pos[ia * 3 + 2];
      const bx = this.pos[ib * 3], by = this.pos[ib * 3 + 1], bz = this.pos[ib * 3 + 2];
      const cx = this.pos[ic * 3], cy = this.pos[ic * 3 + 1], cz = this.pos[ic * 3 + 2];

      const abx = bx - ax, aby = by - ay, abz = bz - az;
      const acx = cx - ax, acy = cy - ay, acz = cz - az;

      const nx = aby * acz - abz * acy;
      const ny = abz * acx - abx * acz;
      const nz = abx * acy - aby * acx;

      this.nor[ia * 3] += nx; this.nor[ia * 3 + 1] += ny; this.nor[ia * 3 + 2] += nz;
      this.nor[ib * 3] += nx; this.nor[ib * 3 + 1] += ny; this.nor[ib * 3 + 2] += nz;
      this.nor[ic * 3] += nx; this.nor[ic * 3 + 1] += ny; this.nor[ic * 3 + 2] += nz;
    }
    for (let v = startVert; v < endVert; v++) {
      const x = this.nor[v * 3];
      const y = this.nor[v * 3 + 1];
      const z = this.nor[v * 3 + 2];
      const len = Math.hypot(x, y, z) || 1;
      this.nor[v * 3] = x / len;
      this.nor[v * 3 + 1] = y / len;
      this.nor[v * 3 + 2] = z / len;
    }
  }

  toBuffers(): MeshBuffers {
    return {
      positions: new Float32Array(this.pos),
      normals: new Float32Array(this.nor),
      uvs: new Float32Array(this.uv),
      texIds: new Float32Array(this.texId),
      colors: new Float32Array(this.col),
      furs: new Float32Array(this.fur),
      indices: new Uint32Array(this.idx),
    };
  }
}

type Vec3 = [number, number, number];

function normalize3(v: Vec3): Vec3 {
  const len = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / len, v[1] / len, v[2] / len];
}

function cross3(a: Vec3, b: Vec3): Vec3 {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

function addEllipsoid(
  acc: MeshAccumulator,
  center: Vec3,
  radii: Vec3,
  texId: number,
  rgb: [number, number, number],
  fur: number,
  uRepeat = 2,
  vRepeat = 2,
  rings = 20,
  segs = 28,
  rotZ = 0,
  rotX = 0
): void {
  const startVert = acc.vertexCount;
  const startIdx = acc.idx.length;
  const cz = Math.cos(rotZ), sz = Math.sin(rotZ);
  const cx = Math.cos(rotX), sx = Math.sin(rotX);

  for (let r = 0; r <= rings; r++) {
    const v = r / rings;
    const phi = v * Math.PI;
    const sp = Math.sin(phi);
    const cp = Math.cos(phi);

    for (let s = 0; s <= segs; s++) {
      const u = s / segs;
      const theta = u * Math.PI * 2;
      const ct = Math.cos(theta);
      const st = Math.sin(theta);

      let lx = sp * ct * radii[0];
      let ly = cp * radii[1];
      let lz = sp * st * radii[2];

      if (rotZ !== 0) {
        const nx = lx * cz - ly * sz;
        const ny = lx * sz + ly * cz;
        lx = nx;
        ly = ny;
      }
      if (rotX !== 0) {
        const ny = ly * cx - lz * sx;
        const nz = ly * sx + lz * cx;
        ly = ny;
        lz = nz;
      }

      const norm = normalize3([lx, ly, lz]);
      acc.addVertex(
        center[0] + lx,
        center[1] + ly,
        center[2] + lz,
        norm[0],
        norm[1],
        norm[2],
        u * uRepeat,
        v * vRepeat,
        texId,
        rgb,
        fur
      );
    }
  }

  const stride = segs + 1;
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < segs; s++) {
      const a = startVert + r * stride + s;
      const b = a + stride;
      const c = b + 1;
      const d = a + 1;
      acc.addQuad(a, d, c, b);
    }
  }
  acc.recomputeNormals(startVert, startIdx);
}

// Smooth tapered tube along a 3D spline of points with per-point radius & rounded end-caps
function addSplineTube(
  acc: MeshAccumulator,
  points: Vec3[],
  radii: number[],
  texId: number,
  rgb: [number, number, number],
  fur: number,
  uRepeat = 1.5,
  vRepeat = 2.0,
  radialSegs = 20,
  capStart = true,
  capEnd = true,
  rxScale = 1.0,
  rzScale = 1.0
): void {
  const startVert = acc.vertexCount;
  const startIdx = acc.idx.length;
  const nPts = points.length;

  // Build smooth frames along the spline
  const tangents: Vec3[] = [];
  for (let i = 0; i < nPts; i++) {
    const pPrev = points[Math.max(0, i - 1)];
    const pNext = points[Math.min(nPts - 1, i + 1)];
    tangents.push(
      normalize3([pNext[0] - pPrev[0], pNext[1] - pPrev[1], pNext[2] - pPrev[2]])
    );
  }

  let prevNormal: Vec3 = Math.abs(tangents[0][1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  prevNormal = normalize3(cross3(tangents[0], prevNormal));

  const ringStartVerts: number[] = [];

  for (let i = 0; i < nPts; i++) {
    const t = tangents[i];
    // Parallel transport frame to prevent twisting
    const dot = t[0] * prevNormal[0] + t[1] * prevNormal[1] + t[2] * prevNormal[2];
    let n: Vec3 = [
      prevNormal[0] - t[0] * dot,
      prevNormal[1] - t[1] * dot,
      prevNormal[2] - t[2] * dot,
    ];
    n = normalize3(n);
    prevNormal = n;
    const b = normalize3(cross3(t, n));

    const rad = radii[i];
    const vCoord = (i / Math.max(1, nPts - 1)) * vRepeat;
    ringStartVerts.push(acc.vertexCount);

    for (let s = 0; s <= radialSegs; s++) {
      const u = s / radialSegs;
      const ang = u * Math.PI * 2;
      const ca = Math.cos(ang) * rxScale;
      const sa = Math.sin(ang) * rzScale;

      const ox = (n[0] * ca + b[0] * sa) * rad;
      const oy = (n[1] * ca + b[1] * sa) * rad;
      const oz = (n[2] * ca + b[2] * sa) * rad;

      const nm = normalize3([ox, oy, oz]);
      acc.addVertex(
        points[i][0] + ox,
        points[i][1] + oy,
        points[i][2] + oz,
        nm[0],
        nm[1],
        nm[2],
        u * uRepeat,
        vCoord,
        texId,
        rgb,
        fur
      );
    }
  }

  const stride = radialSegs + 1;
  for (let i = 0; i < nPts - 1; i++) {
    const r0 = ringStartVerts[i];
    const r1 = ringStartVerts[i + 1];
    for (let s = 0; s < radialSegs; s++) {
      acc.addQuad(r0 + s, r0 + s + 1, r1 + s + 1, r1 + s);
    }
  }

  // Rounded hemispherical end caps
  if (capStart && radii[0] > 0.001) {
    const p0 = points[0];
    const t0 = tangents[0];
    const r0 = radii[0];
    const capCenter = acc.addVertex(
      p0[0] - t0[0] * r0 * 0.72,
      p0[1] - t0[1] * r0 * 0.72,
      p0[2] - t0[2] * r0 * 0.72,
      -t0[0],
      -t0[1],
      -t0[2],
      0.5,
      0.0,
      texId,
      rgb,
      fur
    );
    const ring0 = ringStartVerts[0];
    for (let s = 0; s < radialSegs; s++) {
      acc.addTri(capCenter, ring0 + s, ring0 + s + 1);
    }
  }

  if (capEnd && radii[nPts - 1] > 0.001) {
    const pn = points[nPts - 1];
    const tn = tangents[nPts - 1];
    const rn = radii[nPts - 1];
    const capCenter = acc.addVertex(
      pn[0] + tn[0] * rn * 0.72,
      pn[1] + tn[1] * rn * 0.72,
      pn[2] + tn[2] * rn * 0.72,
      tn[0],
      tn[1],
      tn[2],
      0.5,
      vRepeat,
      texId,
      rgb,
      fur
    );
    const ringLast = ringStartVerts[nPts - 1];
    for (let s = 0; s < radialSegs; s++) {
      acc.addTri(capCenter, ringLast + s + 1, ringLast + s);
    }
  }

  acc.recomputeNormals(startVert, startIdx);
}

// Smooth torus ring (for collars, hems, cap brim trim)
function addTorus(
  acc: MeshAccumulator,
  center: Vec3,
  majorR: number,
  minorR: number,
  texId: number,
  rgb: [number, number, number],
  fur: number,
  majorSegs = 32,
  minorSegs = 12,
  rotX = 0,
  rotZ = 0,
  scaleX = 1.0,
  scaleZ = 1.0
): void {
  const startVert = acc.vertexCount;
  const startIdx = acc.idx.length;
  const cx = Math.cos(rotX), sx = Math.sin(rotX);
  const cz = Math.cos(rotZ), sz = Math.sin(rotZ);

  for (let i = 0; i <= majorSegs; i++) {
    const u = i / majorSegs;
    const theta = u * Math.PI * 2;
    const ct = Math.cos(theta), st = Math.sin(theta);

    for (let j = 0; j <= minorSegs; j++) {
      const v = j / minorSegs;
      const phi = v * Math.PI * 2;
      const cp = Math.cos(phi), sp = Math.sin(phi);

      let lx = (majorR + minorR * cp) * ct * scaleX;
      let ly = minorR * sp;
      let lz = (majorR + minorR * cp) * st * scaleZ;

      if (rotX !== 0) {
        const ny = ly * cx - lz * sx;
        const nz = ly * sx + lz * cx;
        ly = ny;
        lz = nz;
      }
      if (rotZ !== 0) {
        const nx = lx * cz - ly * sz;
        const ny = lx * sz + ly * cz;
        lx = nx;
        ly = ny;
      }

      const norm = normalize3([ct * cp, sp, st * cp]);
      acc.addVertex(
        center[0] + lx,
        center[1] + ly,
        center[2] + lz,
        norm[0],
        norm[1],
        norm[2],
        u * 4,
        v,
        texId,
        rgb,
        fur
      );
    }
  }

  const stride = minorSegs + 1;
  for (let i = 0; i < majorSegs; i++) {
    for (let j = 0; j < minorSegs; j++) {
      const a = startVert + i * stride + j;
      const b = a + stride;
      acc.addQuad(a, b, b + 1, a + 1);
    }
  }
  acc.recomputeNormals(startVert, startIdx);
}

// Sculpted plush head surface evaluator (wide cushion head with asymmetric snout & chubby cheeks)
function evalHeadPoint(dx: number, dy: number, dz: number, lift = 0): Vec3 {
  const len = Math.hypot(dx, dy, dz) || 1;
  const nx = dx / len;
  const ny = dy / len;
  const nz = dz / len;

  // Base cushion proportions matching ai_outfit_basic.jpg
  let rx = 0.405;
  let ry = 0.295;
  let rz = 0.285;

  // Lower cheek chubbiness (widens gently below eye line)
  const lowerFactor = Math.max(0, -ny);
  rx += lowerFactor * 0.032;
  rz += lowerFactor * 0.018;

  // Gentle flat-top crown
  if (ny > 0.3) {
    ry -= (ny - 0.3) * 0.025;
  }

  // Asymmetric left snout bulge (ChaCha's signature rounded horse-pony muzzle on -X, +Z)
  const snoutMask = Math.max(0, -nx * 0.78 + nz * 0.55 + ny * 0.12);
  const snoutPush = Math.pow(snoutMask, 2.2) * 0.068;

  const px = nx * (rx + lift) - snoutPush * 0.72;
  const py = 0.215 + ny * (ry + lift) + snoutPush * 0.12;
  const pz = nz * (rz + lift) + snoutPush * 0.52;

  return [px, py, pz];
}

function addSculptedHead(acc: MeshAccumulator): void {
  const startVert = acc.vertexCount;
  const startIdx = acc.idx.length;
  const rings = 34;
  const segs = 48;

  for (let r = 0; r <= rings; r++) {
    const v = r / rings;
    const phi = v * Math.PI;
    const sp = Math.sin(phi);
    const cp = Math.cos(phi);

    for (let s = 0; s <= segs; s++) {
      const u = s / segs;
      const theta = u * Math.PI * 2;
      const dx = sp * Math.cos(theta);
      const dy = cp;
      const dz = sp * Math.sin(theta);

      const p = evalHeadPoint(dx, dy, dz, 0);
      acc.addVertex(p[0], p[1], p[2], dx, dy, dz, u * 3.0, v * 2.0, 0, [1, 1, 1], 0.35);
    }
  }

  const stride = segs + 1;
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < segs; s++) {
      const a = startVert + r * stride + s;
      const b = a + stride;
      acc.addQuad(a, a + 1, b + 1, b);
    }
  }
  acc.recomputeNormals(startVert, startIdx);
}

// Sculpted torso & flared/pleated garment body helper
function addLatheBody(
  acc: MeshAccumulator,
  center: Vec3,
  yProfile: number[],
  rxProfile: number[],
  rzProfile: number[],
  texId: number,
  rgb: [number, number, number],
  fur: number,
  segs = 36,
  pleatAmp = 0,
  pleatCount = 12,
  uRepeat = 2.5,
  vRepeat = 2.0,
  capBottom = true
): void {
  const startVert = acc.vertexCount;
  const startIdx = acc.idx.length;
  const rows = yProfile.length;

  for (let r = 0; r < rows; r++) {
    const v = r / Math.max(1, rows - 1);
    const y = center[1] + yProfile[r];
    const rx = rxProfile[r];
    const rz = rzProfile[r];
    const pleatScale = pleatAmp * Math.pow(v, 1.35);

    for (let s = 0; s <= segs; s++) {
      const u = s / segs;
      const theta = u * Math.PI * 2;
      const ct = Math.cos(theta);
      const st = Math.sin(theta);
      const ripple = pleatScale > 0 ? Math.cos(theta * pleatCount) * pleatScale : 0;

      const x = center[0] + (rx + ripple) * ct;
      const z = center[2] + (rz + ripple) * st;
      acc.addVertex(x, y, z, ct, 0, st, u * uRepeat, v * vRepeat, texId, rgb, fur);
    }
  }

  const stride = segs + 1;
  for (let r = 0; r < rows - 1; r++) {
    for (let s = 0; s < segs; s++) {
      const a = startVert + r * stride + s;
      const b = a + stride;
      acc.addQuad(a, a + 1, b + 1, b);
    }
  }

  if (capBottom) {
    const botY = center[1] + yProfile[rows - 1];
    const cVert = acc.addVertex(center[0], botY, center[2], 0, -1, 0, 0.5, 1, texId, rgb, fur);
    const lastRow = startVert + (rows - 1) * stride;
    for (let s = 0; s < segs; s++) {
      acc.addTri(cVert, lastRow + s, lastRow + s + 1);
    }
  }
  acc.recomputeNormals(startVert, startIdx);
}

// Box helper for graduation mortarboard & pockets
function addRoundedBox(
  acc: MeshAccumulator,
  center: Vec3,
  halfExtents: Vec3,
  texId: number,
  rgb: [number, number, number],
  fur: number,
  rotZ = 0,
  rotX = 0,
  rotY = 0
): void {
  const startVert = acc.vertexCount;
  const startIdx = acc.idx.length;
  const [hx, hy, hz] = halfExtents;

  const cz = Math.cos(rotZ), sz = Math.sin(rotZ);
  const cx = Math.cos(rotX), sx = Math.sin(rotX);
  const cy = Math.cos(rotY), sy = Math.sin(rotY);

  const transform = (x: number, y: number, z: number): Vec3 => {
    let tx = x, ty = y, tz = z;
    if (rotZ !== 0) {
      const nx = tx * cz - ty * sz;
      const ny = tx * sz + ty * cz;
      tx = nx; ty = ny;
    }
    if (rotX !== 0) {
      const ny = ty * cx - tz * sx;
      const nz = ty * sx + tz * cx;
      ty = ny; tz = nz;
    }
    if (rotY !== 0) {
      const nx = tx * cy + tz * sy;
      const nz = -tx * sy + tz * cy;
      tx = nx; tz = nz;
    }
    return [center[0] + tx, center[1] + ty, center[2] + tz];
  };

  const faces: { corners: Vec3[]; norm: Vec3 }[] = [
    { corners: [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]], norm: [0, 0, 1] },
    { corners: [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]], norm: [0, 0, -1] },
    { corners: [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]], norm: [0, 1, 0] },
    { corners: [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]], norm: [0, -1, 0] },
    { corners: [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]], norm: [1, 0, 0] },
    { corners: [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]], norm: [-1, 0, 0] },
  ];

  const uvs: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];
  for (const f of faces) {
    const base = acc.vertexCount;
    for (let i = 0; i < 4; i++) {
      const p = transform(f.corners[i][0], f.corners[i][1], f.corners[i][2]);
      acc.addVertex(p[0], p[1], p[2], f.norm[0], f.norm[1], f.norm[2], uvs[i][0], uvs[i][1], texId, rgb, fur);
    }
    acc.addQuad(base, base + 1, base + 2, base + 3);
  }
  acc.recomputeNormals(startVert, startIdx);
}

// 3D Letter 'C' Chenille Patch (open on right) placed on chest
function addEmblemC(acc: MeshAccumulator, center: Vec3, radius: number, rotY = -0.18): void {
  const ptsOuter: Vec3[] = [];
  const radsOuter: number[] = [];
  const ptsInner: Vec3[] = [];
  const radsInner: number[] = [];
  const steps = 16;
  const cy = Math.cos(rotY), sy = Math.sin(rotY);

  for (let i = 0; i <= steps; i++) {
    const ang = 0.55 + (i / steps) * (Math.PI * 2 - 1.10);
    const lx = Math.cos(ang) * radius * 0.92;
    const ly = Math.sin(ang) * radius * 1.12;
    const lz = 0;
    const wx = center[0] + lx * cy + lz * sy;
    const wy = center[1] + ly;
    const wz = center[2] - lx * sy + lz * cy;
    ptsOuter.push([wx, wy, wz]);
    radsOuter.push(radius * 0.34);
    ptsInner.push([wx, wy, wz + 0.004]);
    radsInner.push(radius * 0.22);
  }
  // White felt backing border + cyan chenille top
  addSplineTube(acc, ptsOuter, radsOuter, 6, [0.98, 0.99, 1.0], 0.25, 1, 1, 10, true, true);
  addSplineTube(acc, ptsInner, radsInner, 6, [0.06, 0.67, 0.91], 0.35, 1, 1, 10, true, true);
}

function buildBody(acc: MeshAccumulator, hat: HatKey, accProp: AccKey): void {
  // 1. Sculpted Plush Head
  addSculptedHead(acc);

  // 2. Face Embroidery & Plush Cheek Patch (projected onto exact deformed head surface)
  const navyInk: [number, number, number] = [0.05, 0.14, 0.34];
  const eyePos = evalHeadPoint(0.36, 0.03, 0.93, 0.004);
  addEllipsoid(acc, eyePos, [0.029, 0.034, 0.015], 6, navyInk, 0.1, 1, 1, 10, 16, 0, 0);

  const nos1Pos = evalHeadPoint(-0.62, 0.33, 0.71, 0.004);
  const nos2Pos = evalHeadPoint(-0.44, 0.13, 0.89, 0.004);
  addEllipsoid(acc, nos1Pos, [0.018, 0.020, 0.012], 6, navyInk, 0.1, 1, 1, 8, 12);
  addEllipsoid(acc, nos2Pos, [0.014, 0.016, 0.011], 6, navyInk, 0.1, 1, 1, 8, 12);

  // Curved smile projected onto front face
  const smilePts: Vec3[] = [];
  const smileRads: number[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const dx = -0.14 + t * 0.28;
    const dy = -0.14 - Math.sin(t * Math.PI) * 0.09;
    const dz = Math.sqrt(Math.max(0.1, 1 - dx * dx - dy * dy));
    smilePts.push(evalHeadPoint(dx, dy, dz, 0.004));
    smileRads.push(0.010);
  }
  addSplineTube(acc, smilePts, smileRads, 6, navyInk, 0.1, 1, 1, 8, true, true);

  // Peach-pink plush cheek patch below right eye
  const cheekPos = evalHeadPoint(0.45, -0.25, 0.85, 0.003);
  addEllipsoid(acc, cheekPos, [0.054, 0.052, 0.014], 6, [0.98, 0.75, 0.69], 0.3, 1, 1, 10, 18, 0, 0.15);

  // 3. Ears
  // Left small ear tip
  addEllipsoid(acc, [-0.33, 0.41, -0.02], [0.062, 0.068, 0.052], 0, [1, 1, 1], 0.35, 1, 1, 12, 16, 0.35);

  // Top-right upright ear (tucks slightly when wearing Ballcap)
  const earTopHeight = hat === 'ballcap' ? 0.60 : 0.67;
  addSplineTube(
    acc,
    [[0.17, 0.42, -0.04], [0.22, 0.54, -0.035], [0.26, earTopHeight, -0.025]],
    [0.088, 0.082, 0.052],
    0,
    [1, 1, 1],
    0.35,
    1.5,
    1.5,
    18,
    true,
    true,
    1.0,
    0.72
  );
  // Soft blue-grey stitched border accent on top ear tip (matching reference photos)
  addSplineTube(
    acc,
    [[0.18, 0.45, -0.045], [0.23, 0.56, -0.04], [0.26, earTopHeight + 0.005, -0.03]],
    [0.089, 0.083, 0.053],
    6,
    [0.72, 0.84, 0.92],
    0.3,
    1.5,
    1.5,
    16,
    false,
    true,
    1.02,
    0.60
  );

  // Right-side horizontal cupped ear
  addSplineTube(
    acc,
    [[0.33, 0.31, 0.0], [0.43, 0.33, 0.015], [0.50, 0.35, 0.025]],
    [0.082, 0.078, 0.058],
    0,
    [1, 1, 1],
    0.35,
    1.5,
    1.5,
    18,
    true,
    true,
    1.0,
    0.76
  );

  // 4. Chubby Stuffed Torso
  addLatheBody(
    acc,
    [0, 0, 0],
    [-0.03, -0.10, -0.22, -0.34, -0.43],
    [0.195, 0.225, 0.245, 0.258, 0.225],
    [0.175, 0.205, 0.220, 0.230, 0.200],
    0,
    [1, 1, 1],
    0.35,
    32
  );

  // 5. Curved Plush Arms (Right arm lifts forward slightly when holding Diploma)
  addSplineTube(
    acc,
    [[-0.19, -0.11, 0.0], [-0.28, -0.20, 0.025], [-0.33, -0.28, 0.055]],
    [0.086, 0.088, 0.086],
    0,
    [1, 1, 1],
    0.35,
    1.5,
    1.5,
    18,
    true,
    true
  );

  const armRPoints: Vec3[] =
    accProp === 'diploma'
      ? [[0.19, -0.11, 0.0], [0.27, -0.18, 0.07], [0.31, -0.22, 0.14]]
      : [[0.19, -0.11, 0.0], [0.28, -0.20, 0.025], [0.33, -0.28, 0.055]];
  addSplineTube(acc, armRPoints, [0.086, 0.088, 0.086], 0, [1, 1, 1], 0.35, 1.5, 1.5, 18, true, true);

  // 6. Chubby Legs, Rounded Feet & Sky-Blue Front Toe Pads
  for (const side of [-1, 1] as const) {
    addSplineTube(
      acc,
      [[side * 0.135, -0.39, 0.0], [side * 0.14, -0.54, 0.015], [side * 0.14, -0.66, 0.025]],
      [0.118, 0.114, 0.108],
      0,
      [1, 1, 1],
      0.35,
      1.5,
      1.5,
      20,
      true,
      true
    );
    addSplineTube(
      acc,
      [[side * 0.14, -0.67, 0.00], [side * 0.14, -0.675, 0.095]],
      [0.106, 0.102],
      0,
      [1, 1, 1],
      0.35,
      1.5,
      1.5,
      18,
      true,
      true
    );
    // Sky-blue oval toe pad
    addEllipsoid(
      acc,
      [side * 0.14, -0.675, 0.172],
      [0.058, 0.052, 0.032],
      6,
      [0.24, 0.72, 0.90],
      0.3,
      1,
      1,
      10,
      16
    );
  }
}

// Builds the 3-Lobe Shaggy Cyan Forehead Mane, Back Mane & Fluffy Tail
// Called for both solid base (shellOffset = 0) and 3 concentric fur shells!
function buildCyanFur(acc: MeshAccumulator, hat: HatKey, shellOffset: number, furVal: number): void {
  const compress = hat === 'ballcap' ? 0.065 : 0;

  // Front-lower bang lobe (peeks out neatly under the ballcap visor!)
  addSplineTube(
    acc,
    [[0.20, 0.36, 0.13], [0.08, 0.40, 0.21], [-0.04, 0.39, 0.23]],
    [0.086 + shellOffset, 0.102 + shellOffset, 0.094 + shellOffset],
    1,
    [1, 1, 1],
    furVal,
    2.0,
    2.5,
    20,
    true,
    true,
    1.0,
    0.88
  );

  // Middle bang lobe
  addSplineTube(
    acc,
    [
      [0.19, 0.46 - compress * 0.4, 0.06],
      [0.04, 0.51 - compress * 0.45, 0.15],
      [-0.10, 0.50 - compress * 0.5, 0.16],
    ],
    [0.092 + shellOffset, 0.108 + shellOffset, 0.096 + shellOffset],
    1,
    [1, 1, 1],
    furVal,
    2.0,
    2.5,
    20,
    true,
    true,
    1.0,
    0.88
  );

  // Top crown lobe
  addSplineTube(
    acc,
    [
      [0.15, 0.55 - compress * 0.85, -0.02],
      [0.02, 0.61 - compress * 0.95, 0.05],
      [-0.08, 0.60 - compress * 1.0, 0.08],
    ],
    [0.088 + shellOffset, 0.102 + shellOffset, 0.090 + shellOffset],
    1,
    [1, 1, 1],
    furVal,
    2.0,
    2.5,
    20,
    true,
    true,
    1.0,
    0.88
  );

  // Full 360-degree Back Mane cascading down the back of the head & neck
  addSplineTube(
    acc,
    [
      [0.08, 0.51 - compress * 0.5, -0.09],
      [0.17, 0.36, -0.15],
      [0.21, 0.16, -0.16],
      [0.20, -0.01, -0.13],
    ],
    [0.175 + shellOffset, 0.185 + shellOffset, 0.160 + shellOffset, 0.115 + shellOffset],
    1,
    [1, 1, 1],
    furVal,
    2.5,
    3.0,
    22,
    true,
    true
  );

  // Fluffy upturned Cyan Tail at lower back-right (rounded plush puff)
  addSplineTube(
    acc,
    [[0.07, -0.45, -0.14], [0.22, -0.43, -0.20], [0.33, -0.34, -0.21]],
    [0.068 + shellOffset, 0.104 + shellOffset, 0.062 + shellOffset],
    1,
    [1, 1, 1],
    furVal,
    2.0,
    2.0,
    20,
    true,
    true
  );
}

function buildOutfit(acc: MeshAccumulator, outfit: OutfitKey, accProp: AccKey): void {
  const armREnd: Vec3 =
    accProp === 'diploma' ? [0.29, -0.20, 0.10] : [0.30, -0.22, 0.04];

  if (outfit === 'none') {
    // Basic White Setup: White cotton T-shirt + ribbed collar/hem + white shorts
    addLatheBody(
      acc,
      [0, 0, 0],
      [-0.035, -0.10, -0.22, -0.36],
      [0.206, 0.236, 0.256, 0.270],
      [0.186, 0.216, 0.232, 0.244],
      0,
      [1.0, 1.0, 1.0],
      0.2,
      36
    );
    addSplineTube(acc, [[-0.19, -0.11, 0], [-0.28, -0.19, 0.035]], [0.098, 0.106], 0, [1, 1, 1], 0.2, 1.5, 1.5, 18);
    addSplineTube(acc, [[0.19, -0.11, 0], armREnd], [0.098, 0.106], 0, [1, 1, 1], 0.2, 1.5, 1.5, 18);
    addTorus(acc, [0, -0.035, 0.005], 0.182, 0.022, 6, [0.97, 0.98, 0.99], 0.15, 32, 10, 0.08, 0, 1.08, 0.95);
    addTorus(acc, [0, -0.36, 0.0], 0.252, 0.018, 6, [0.97, 0.98, 0.99], 0.15, 32, 10, 0, 0, 1.04, 0.94);

    // White shorts legs
    for (const side of [-1, 1] as const) {
      addSplineTube(
        acc,
        [[side * 0.135, -0.37, 0.0], [side * 0.14, -0.53, 0.015]],
        [0.132, 0.130],
        0,
        [0.99, 0.995, 1.0],
        0.2,
        1.5,
        1.5,
        20
      );
    }
    return;
  }

  if (outfit === 'varsity') {
    // CNU Navy Plush Varsity Jacket
    addLatheBody(
      acc,
      [0, 0, 0],
      [-0.035, -0.10, -0.22, -0.36],
      [0.212, 0.244, 0.264, 0.276],
      [0.192, 0.224, 0.240, 0.250],
      2,
      [1, 1, 1],
      0.3,
      36
    );
    addSplineTube(acc, [[-0.19, -0.11, 0], [-0.29, -0.20, 0.038]], [0.102, 0.110], 2, [1, 1, 1], 0.3, 1.5, 1.5, 18);
    addSplineTube(acc, [[0.19, -0.11, 0], armREnd], [0.102, 0.110], 2, [1, 1, 1], 0.3, 1.5, 1.5, 18);

    // White ribbed collar & bottom hem stripes
    addTorus(acc, [0, -0.035, 0.005], 0.186, 0.022, 6, [0.97, 0.98, 1.0], 0.15, 32, 10, 0.08, 0, 1.08, 0.95);
    addTorus(acc, [0, -0.358, 0.0], 0.262, 0.018, 6, [0.97, 0.98, 1.0], 0.15, 32, 10, 0, 0, 1.04, 0.94);

    // White double sleeve cuff rings
    addTorus(acc, [-0.27, -0.18, 0.03], 0.098, 0.014, 6, [0.97, 0.98, 1.0], 0.1, 20, 8, 0.2, 0.78);
    addTorus(acc, [0.27, -0.18, accProp === 'diploma' ? 0.08 : 0.03], 0.098, 0.014, 6, [0.97, 0.98, 1.0], 0.1, 20, 8, 0.2, -0.78);

    // 3 White Snap Buttons down front center
    for (const [by, bz] of [[-0.13, 0.228], [-0.22, 0.242], [-0.31, 0.250]]) {
      addEllipsoid(acc, [-0.018, by, bz], [0.017, 0.017, 0.012], 6, [0.98, 0.99, 1.0], 0.05, 1, 1, 8, 12);
    }

    // 3D 'C' Chenille Patch on chest
    addEmblemC(acc, [0.105, -0.20, 0.228], 0.044, -0.32);
    return;
  }

  if (outfit === 'graduation') {
    // Pleated Academic Graduation Gown (flares outward with 14 real 3D pleats!)
    addLatheBody(
      acc,
      [0, 0, 0],
      [-0.035, -0.12, -0.26, -0.44],
      [0.210, 0.245, 0.285, 0.325],
      [0.190, 0.225, 0.260, 0.295],
      2,
      [0.95, 1.0, 1.1],
      0.2,
      48,
      0.018,
      14
    );
    addSplineTube(acc, [[-0.19, -0.11, 0], [-0.30, -0.22, 0.04]], [0.105, 0.118], 2, [0.95, 1.0, 1.1], 0.2, 1.5, 1.5, 18);
    addSplineTube(acc, [[0.19, -0.11, 0], armREnd], [0.105, 0.118], 2, [0.95, 1.0, 1.1], 0.2, 1.5, 1.5, 18);

    // 360-degree CNU Blue & White Academic V-Stole wrapping front V-neck over shoulders to back
    const stolePts: Vec3[] = [
      [-0.16, -0.05, 0.10],
      [-0.09, -0.13, 0.20],
      [0.0, -0.21, 0.238],
      [0.09, -0.13, 0.20],
      [0.16, -0.05, 0.10],
      [0.15, -0.05, -0.08],
      [0.0, -0.18, -0.218],
      [-0.15, -0.05, -0.08],
      [-0.16, -0.05, 0.10],
    ];
    addSplineTube(
      acc,
      stolePts,
      stolePts.map(() => 0.038),
      6,
      [0.08, 0.34, 0.72],
      0.15,
      1.5,
      2.0,
      12,
      false,
      false
    );
    // Crisp white inner V-stripe on the stole
    const whitePts = stolePts.map((p): Vec3 => [p[0] * 0.94, p[1] + 0.012, p[2] * 1.02]);
    addSplineTube(
      acc,
      whitePts,
      whitePts.map(() => 0.016),
      6,
      [0.98, 0.99, 1.0],
      0.1,
      1.5,
      2.0,
      8,
      false,
      false
    );

    addEmblemC(acc, [0.11, -0.22, 0.242], 0.040, -0.30);
    return;
  }

  if (outfit === 'hoodie') {
    // CNU Sky-Mint Plush Fleece Hoodie + 3D Back Hood + Kangaroo Pocket + Drawstrings
    addLatheBody(
      acc,
      [0, 0, 0],
      [-0.035, -0.10, -0.22, -0.35],
      [0.212, 0.244, 0.264, 0.272],
      [0.192, 0.224, 0.240, 0.246],
      3,
      [1, 1, 1],
      0.3,
      36
    );
    addSplineTube(acc, [[-0.19, -0.11, 0], [-0.29, -0.20, 0.038]], [0.102, 0.108], 3, [1, 1, 1], 0.3, 1.5, 1.5, 18);
    addSplineTube(acc, [[0.19, -0.11, 0], armREnd], [0.102, 0.108], 3, [1, 1, 1], 0.3, 1.5, 1.5, 18);

    // 3D Draped Hood Collar wrapping around neck and resting on back
    addTorus(acc, [0, -0.04, -0.03], 0.195, 0.048, 3, [1, 1, 1], 0.3, 32, 12, -0.25, 0, 1.08, 1.15);
    // White ribbed cuffs & hem
    addTorus(acc, [0, -0.356, 0.0], 0.260, 0.020, 6, [0.97, 0.98, 1.0], 0.15, 32, 10, 0, 0, 1.04, 0.94);

    // Front Kangaroo Pocket
    addRoundedBox(acc, [0, -0.27, 0.222], [0.115, 0.060, 0.025], 3, [0.97, 0.99, 1.0], 0.25, 0, -0.12);

    // Two White Hood Drawstrings
    addSplineTube(acc, [[-0.045, -0.055, 0.195], [-0.05, -0.12, 0.232], [-0.05, -0.19, 0.242]], [0.012, 0.012, 0.014], 6, [0.98, 0.99, 1.0], 0.1, 1, 1, 8);
    addSplineTube(acc, [[0.045, -0.055, 0.195], [0.05, -0.12, 0.232], [0.05, -0.19, 0.242]], [0.012, 0.012, 0.014], 6, [0.98, 0.99, 1.0], 0.1, 1, 1, 8);
    return;
  }

  if (outfit === 'vest') {
    // Preppy Ivory Cable-Knit Vest over White Collared Shirt & Navy Tie
    // White shirt sleeves & collar
    addSplineTube(acc, [[-0.19, -0.11, 0], [-0.28, -0.19, 0.035]], [0.098, 0.104], 0, [1, 1, 1], 0.15, 1.5, 1.5, 18);
    addSplineTube(acc, [[0.19, -0.11, 0], armREnd], [0.098, 0.104], 0, [1, 1, 1], 0.15, 1.5, 1.5, 18);
    addTorus(acc, [0, -0.035, 0.005], 0.180, 0.024, 6, [0.98, 0.99, 1.0], 0.1, 32, 10, 0.08, 0, 1.08, 0.95);

    // Ivory Cable-Knit Vest Torso
    addLatheBody(
      acc,
      [0, 0, 0],
      [-0.045, -0.11, -0.22, -0.35],
      [0.208, 0.238, 0.258, 0.270],
      [0.188, 0.218, 0.234, 0.244],
      4,
      [1, 1, 1],
      0.2,
      36
    );
    // Navy V-neck trim & bottom hem trim
    addSplineTube(
      acc,
      [[-0.11, -0.045, 0.165], [0, -0.165, 0.232], [0.11, -0.045, 0.165]],
      [0.018, 0.018, 0.018],
      6,
      [0.05, 0.15, 0.38],
      0.1,
      1,
      1,
      10
    );
    addTorus(acc, [0, -0.345, 0.0], 0.260, 0.018, 6, [0.05, 0.15, 0.38], 0.1, 32, 10, 0, 0, 1.04, 0.94);

    // Small Navy Necktie
    addSplineTube(
      acc,
      [[0.0, -0.055, 0.195], [0.0, -0.105, 0.218], [0.0, -0.15, 0.230]],
      [0.026, 0.022, 0.030],
      6,
      [0.05, 0.15, 0.38],
      0.1,
      1,
      1,
      10
    );
    return;
  }

  // outfit === 'dungarees' — Retro Washed Denim Overalls over White T-Shirt
  addLatheBody(
    acc,
    [0, 0, 0],
    [-0.035, -0.10, -0.20],
    [0.206, 0.232, 0.248],
    [0.186, 0.212, 0.226],
    0,
    [1, 1, 1],
    0.15,
    32
  );
  addSplineTube(acc, [[-0.19, -0.11, 0], [-0.28, -0.19, 0.035]], [0.098, 0.104], 0, [1, 1, 1], 0.15, 1.5, 1.5, 18);
  addSplineTube(acc, [[0.19, -0.11, 0], armREnd], [0.098, 0.104], 0, [1, 1, 1], 0.15, 1.5, 1.5, 18);

  // Denim shorts & lower waist
  addLatheBody(
    acc,
    [0, 0, 0],
    [-0.22, -0.31, -0.41],
    [0.258, 0.270, 0.240],
    [0.234, 0.244, 0.215],
    5,
    [1, 1, 1],
    0.15,
    36
  );
  for (const side of [-1, 1] as const) {
    addSplineTube(
      acc,
      [[side * 0.135, -0.37, 0.0], [side * 0.14, -0.53, 0.015]],
      [0.132, 0.130],
      5,
      [1, 1, 1],
      0.15,
      1.5,
      1.5,
      20
    );
    // 360-degree Shoulder straps (front bib -> over shoulders -> back waist)
    addSplineTube(
      acc,
      [
        [side * 0.105, -0.22, 0.222],
        [side * 0.125, -0.09, 0.185],
        [side * 0.125, -0.03, 0.0],
        [side * 0.115, -0.09, -0.185],
        [side * 0.085, -0.23, -0.215],
      ],
      [0.022, 0.022, 0.022, 0.022, 0.022],
      5,
      [1, 1, 1],
      0.15,
      1,
      2,
      10
    );
    // Brass overall buttons
    addEllipsoid(acc, [side * 0.105, -0.11, 0.214], [0.019, 0.019, 0.012], 6, [0.92, 0.74, 0.24], 0.05, 1, 1, 8, 12);
  }
  // Front denim bib & center pocket
  addRoundedBox(acc, [0, -0.165, 0.212], [0.105, 0.068, 0.022], 5, [1, 1, 1], 0.15, 0, -0.14);
  addRoundedBox(acc, [0, -0.175, 0.232], [0.058, 0.042, 0.010], 5, [0.92, 0.96, 1.0], 0.15, 0, -0.14);
}

function buildHat(acc: MeshAccumulator, hat: HatKey): void {
  if (hat === 'none') return;

  if (hat === 'grad_cap') {
    // Academic Mortarboard Cap + Hanging Gold Tassel
    addLatheBody(
      acc,
      [0.06, 0.62, -0.02],
      [0.0, -0.07, -0.12],
      [0.16, 0.175, 0.185],
      [0.16, 0.175, 0.185],
      2,
      [0.95, 1.0, 1.1],
      0.15,
      28
    );
    // Tilted square mortarboard
    addRoundedBox(acc, [0.06, 0.635, -0.02], [0.225, 0.016, 0.225], 2, [0.95, 1.0, 1.1], 0.15, -0.12, 0.10, 0.35);
    // Top button + hanging golden cord & tassel
    addEllipsoid(acc, [0.06, 0.655, -0.02], [0.022, 0.014, 0.022], 6, [0.96, 0.78, 0.24], 0.05, 1, 1, 8, 12);
    addSplineTube(
      acc,
      [[0.06, 0.655, -0.02], [0.24, 0.615, 0.05], [0.26, 0.52, 0.08], [0.26, 0.40, 0.09]],
      [0.008, 0.009, 0.016, 0.028],
      6,
      [0.96, 0.78, 0.24],
      0.25,
      1,
      1,
      10
    );
    return;
  }

  if (hat === 'ballcap') {
    // CNU Signature Navy & Sky-Blue Baseball Cap
    addEllipsoid(acc, [0.02, 0.50, 0.0], [0.265, 0.205, 0.255], 2, [1.0, 1.05, 1.15], 0.15, 2, 2, 18, 28, 0, -0.08);
    // Top sky-blue button
    addEllipsoid(acc, [0.02, 0.705, -0.015], [0.026, 0.016, 0.026], 6, [0.16, 0.74, 0.92], 0.1, 1, 1, 8, 12);
    // Curved Sky-Blue Visor extending forward
    addEllipsoid(acc, [0.01, 0.435, 0.21], [0.215, 0.028, 0.145], 6, [0.18, 0.75, 0.93], 0.15, 1, 1, 10, 22, 0, 0.18);
    // Embroidered 'C' Emblem on Front Crown
    addEmblemC(acc, [0.02, 0.56, 0.235], 0.056, 0);
    return;
  }

  // hat === 'cherry' — 360-degree Campus Cherry Blossom Flower Crown
  addTorus(acc, [0.02, 0.47, 0.01], 0.285, 0.016, 6, [0.22, 0.58, 0.28], 0.2, 36, 8, -0.18, -0.06, 1.08, 0.98);
  const blossomCount = 8;
  for (let i = 0; i < blossomCount; i++) {
    const ang = (i / blossomCount) * Math.PI * 2 + 0.32;
    const bx = 0.02 + Math.cos(ang) * 0.305;
    const bz = 0.01 + Math.sin(ang) * 0.280;
    const by = 0.47 - bz * 0.18 - bx * 0.06;
    const outDir = normalize3([Math.cos(ang), 0.22, Math.sin(ang)]);

    // 5 Pastel Pink Petals per flower
    for (let p = 0; p < 5; p++) {
      const pa = (p / 5) * Math.PI * 2;
      const tang = normalize3([-Math.sin(ang), 0, Math.cos(ang)]);
      const up = normalize3(cross3(tang, outDir));
      const px = bx + outDir[0] * 0.022 + (tang[0] * Math.cos(pa) + up[0] * Math.sin(pa)) * 0.032;
      const py = by + outDir[1] * 0.022 + (tang[1] * Math.cos(pa) + up[1] * Math.sin(pa)) * 0.032;
      const pz = bz + outDir[2] * 0.022 + (tang[2] * Math.cos(pa) + up[2] * Math.sin(pa)) * 0.032;
      addEllipsoid(acc, [px, py, pz], [0.026, 0.026, 0.018], 6, [0.99, 0.72, 0.82], 0.2, 1, 1, 8, 12);
    }
    // Yellow stamen center
    addEllipsoid(
      acc,
      [bx + outDir[0] * 0.030, by + outDir[1] * 0.030, bz + outDir[2] * 0.030],
      [0.018, 0.018, 0.018],
      6,
      [0.99, 0.85, 0.25],
      0.1,
      1,
      1,
      6,
      10
    );
    // Small green leaf beside flower
    const lAng = ang + 0.22;
    addEllipsoid(
      acc,
      [0.02 + Math.cos(lAng) * 0.29, 0.46 - Math.sin(lAng) * 0.05, 0.01 + Math.sin(lAng) * 0.27],
      [0.028, 0.018, 0.016],
      6,
      [0.32, 0.68, 0.34],
      0.2,
      1,
      1,
      6,
      10
    );
  }
}

function buildAccessory(acc: MeshAccumulator, accProp: AccKey): void {
  if (accProp === 'none') return;

  if (accProp === 'crossbag') {
    // 360-degree Body-Hugging Navy Crossbody Strap + Cream Canvas Messenger Bag + Gold Clasp
    const strapPts: Vec3[] = [
      [-0.17, -0.05, 0.14],
      [-0.04, -0.17, 0.245],
      [0.10, -0.27, 0.248],
      [0.21, -0.35, 0.175],
      [0.26, -0.38, 0.02],
      [0.18, -0.30, -0.185],
      [0.02, -0.18, -0.232],
      [-0.14, -0.06, -0.145],
      [-0.17, -0.05, 0.14],
    ];
    addSplineTube(
      acc,
      strapPts,
      strapPts.map(() => 0.018),
      2,
      [1, 1, 1],
      0.1,
      1,
      4,
      10,
      false,
      false
    );

    // Rounded Cream Canvas Pouch + Navy Flap + Gold Clasp at right hip
    addRoundedBox(acc, [0.21, -0.39, 0.165], [0.088, 0.072, 0.036], 6, [0.96, 0.94, 0.89], 0.15, 0.12, 0.05, -0.45);
    addRoundedBox(acc, [0.21, -0.35, 0.175], [0.090, 0.036, 0.039], 2, [1, 1, 1], 0.15, 0.12, 0.05, -0.45);
    addEllipsoid(acc, [0.22, -0.385, 0.212], [0.018, 0.022, 0.014], 6, [0.95, 0.78, 0.26], 0.05, 1, 1, 8, 12);
    return;
  }

  // accProp === 'diploma' — Cream Parchment Diploma Scroll + Crimson Satin Ribbon & Gold Seal
  addSplineTube(
    acc,
    [[0.23, -0.31, 0.21], [0.30, -0.21, 0.20], [0.37, -0.11, 0.19]],
    [0.038, 0.038, 0.038],
    6,
    [0.95, 0.90, 0.78],
    0.1,
    1,
    1,
    16,
    true,
    true
  );
  // Crimson satin ribbon wrap + hanging ribbon tails + gold seal
  addSplineTube(
    acc,
    [[0.285, -0.23, 0.205], [0.315, -0.19, 0.198]],
    [0.042, 0.042],
    6,
    [0.78, 0.08, 0.16],
    0.1,
    1,
    1,
    14,
    false,
    false
  );
  addSplineTube(acc, [[0.305, -0.21, 0.238], [0.28, -0.29, 0.245]], [0.013, 0.014], 6, [0.78, 0.08, 0.16], 0.1, 1, 1, 8);
  addSplineTube(acc, [[0.305, -0.21, 0.238], [0.34, -0.285, 0.245]], [0.013, 0.014], 6, [0.78, 0.08, 0.16], 0.1, 1, 1, 8);
  addEllipsoid(acc, [0.305, -0.21, 0.242], [0.020, 0.020, 0.012], 6, [0.95, 0.77, 0.22], 0.05, 1, 1, 8, 12);
}

export function buildChaChaSceneMeshes(
  outfit: OutfitKey,
  hat: HatKey,
  accProp: AccKey
): ChaChaSceneMeshes {
  const solid = new MeshAccumulator();
  const furShell = new MeshAccumulator();

  buildBody(solid, hat, accProp);
  buildCyanFur(solid, hat, 0, 1.0);
  buildOutfit(solid, outfit, accProp);
  buildHat(solid, hat);
  buildAccessory(solid, accProp);

  // Add 3 concentric 3D fur shells around the shaggy cyan mane & tail
  // so the 360-degree silhouette shows soft fluffy fur tufts!
  buildCyanFur(furShell, hat, 0.009, 0.35);
  buildCyanFur(furShell, hat, 0.018, 0.68);
  buildCyanFur(furShell, hat, 0.027, 1.0);

  return {
    solid: solid.toBuffers(),
    furShell: furShell.toBuffers(),
  };
}
