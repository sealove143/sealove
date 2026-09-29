"use client";

import { useEffect, useRef } from "react";

// 선교(브릿지)에서 선수 쪽을 내려다본 항해 장면을 캔버스로 그려 페이지 뒤에 워터마크처럼 옅게 깐다.
// 배(해치 커버가 늘어선 갑판, 선수루, 앞 돛대)는 카메라와 함께 고정되고, 바다와 하늘만
// 피칭·롤링한다. 물의 흐름은 세 겹으로 보여 준다:
//   파도 마루 — 수평선에서 배 쪽으로 다가오는 물결 줄
//   물결 자국 — 배 양옆을 스쳐 화면 아래로 흘러가는 짧은 거품 줄무늬
//   선수파   — 선수에서 갈라져 V자로 퍼지는 흰 물살
// 색은 CSS color(테마 토큰) 한 가지를 농도만 달리해 쓴다. 라이트 테마에서는 거품을
// 바다에서 "지워" 밝게, 다크 테마에서는 토큰 색으로 "칠해" 밝게 만든다.

// 세계 좌표(m): X 우현+, Y 눈높이 기준 위+, Z 전방+.
const HALF_BEAM = 22;
const BOW_Z = 270; // 선수 끝
const TAPER = 100; // 선수에서 선폭이 좁아지기 시작하는 거리
const FCLE = 28; // 선수루 길이
const SPEED = 11; // m/s. 실제(약 14노트)보다 조금 빠르게 해 흐름이 잘 보이게 한다.
const CREST_GAP = 9; // 파도 마루 간격
const SEA_FAR = 1500;
const FPS = 30;

type Palette = {
  skyTop: number;
  skyHorizon: number;
  haze: number;
  seaNear: number;
  seaFar: number;
  foam: number;
  foamErase: boolean;
  cloud: number;
  hull: number; // 0이면 실루엣만 지운다 (다크: 밝은 바다 앞 어두운 배)
  hullEdge: number;
  hatch: number;
  hatchEdge: number;
};

const LIGHT: Palette = {
  skyTop: 0.02,
  skyHorizon: 0.1,
  haze: 0.14,
  seaNear: 0.5,
  seaFar: 0.28,
  foam: 0.9,
  foamErase: true,
  cloud: 0.07,
  hull: 0.4,
  hullEdge: 0.65,
  hatch: 0.6,
  hatchEdge: 0.8,
};

const DARK: Palette = {
  skyTop: 0.03,
  skyHorizon: 0.18,
  haze: 0.28,
  seaNear: 0.05,
  seaFar: 0.1,
  foam: 0.65,
  foamErase: false,
  cloud: 0.1,
  hull: 0,
  hullEdge: 0.4,
  hatch: 0.05,
  hatchEdge: 0.36,
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const clamp01 = (v: number) => clamp(v, 0, 1);
// 0~1의 고정 난수 — 같은 i에는 늘 같은 값을 준다.
const hash = (i: number) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};

// 선폭의 반. 선수 쪽은 둥글게 좁아진다.
const beamAt = (z: number) => (z < BOW_Z - TAPER ? HALF_BEAM : HALF_BEAM * Math.sqrt(clamp01((BOW_Z - z) / TAPER)));

export default function BridgeWatermark() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // ship: 배의 모습, mask: 그 실루엣(바다를 지우는 데 쓴다)
    const ship = document.createElement("canvas");
    const mask = document.createElement("canvas");
    const sctx = ship.getContext("2d");
    const mctx = mask.getContext("2d");
    if (!sctx || !mctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let f = 1; // 초점거리(px)
    let cx = 0;
    let y0 = 0; // 수평선 화면 높이 (배 기준)
    let deck = -18; // 갑판 높이 (눈 기준)
    let sea = -28; // 해수면 높이 (눈 기준)
    let tone = "14,58,92";
    let pal = LIGHT;
    let raf = 0;
    let last = 0;
    const start = performance.now();

    const ink = (a: number) => `rgba(${tone},${a})`;
    const project = (X: number, Y: number, Z: number): [number, number] => [cx + (f * X) / Z, y0 - (f * Y) / Z];

    const readTone = () => {
      const m = getComputedStyle(canvas).color.match(/[\d.]+/g);
      if (!m) return;
      const [r, g, b] = m.map(Number);
      tone = `${r},${g},${b}`;
      // 토큰 색이 밝으면 다크 테마다.
      pal = (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? DARK : LIGHT;
    };

    type PathFn = (c: CanvasRenderingContext2D) => void;

    // 실루엣을 마스크에 새기고, 배 캔버스에선 먼저 그린 뒤쪽 것을 지운 뒤 채우고 테두리를 긋는다.
    const solid = (path: PathFn, fill: number, edge: number, lw = 1) => {
      mctx.beginPath();
      path(mctx);
      mctx.fill();
      const c = sctx;
      c.beginPath();
      path(c);
      c.save();
      c.globalCompositeOperation = "destination-out";
      c.fillStyle = "#000";
      c.fill();
      c.restore();
      if (fill > 0) {
        c.fillStyle = ink(fill);
        c.fill();
      }
      if (edge > 0) {
        c.strokeStyle = ink(edge);
        c.lineWidth = lw;
        c.stroke();
      }
    };

    const poly = (pts: [number, number][]): PathFn => (c) => {
      c.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
      c.closePath();
    };

    // 한쪽 뱃전을 따라 z0→z1 구간의 점들 (side: -1 좌현, 1 우현)
    const edgeLine = (side: number, y: number, z0: number, z1: number, inset = 0) => {
      const pts: [number, number][] = [];
      const n = 40;
      for (let i = 0; i <= n; i++) {
        const z = z0 + ((z1 - z0) * i) / n;
        pts.push(project(side * Math.max(0, beamAt(z) - inset), y, z));
      }
      return pts;
    };

    // 배는 움직이지 않으므로 오프스크린 캔버스에 한 번만 그린다.
    const renderShip = () => {
      ship.width = mask.width = canvas.width;
      ship.height = mask.height = canvas.height;
      mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      mctx.fillStyle = "#000";
      mctx.strokeStyle = "#000";
      const c = sctx;
      c.setTransform(dpr, 0, 0, dpr, 0, 0);
      c.clearRect(0, 0, width, height);
      c.lineJoin = "round";
      c.lineCap = "round";

      // 갑판
      const near = 6;
      solid(
        poly([...edgeLine(-1, deck, near, BOW_Z), ...edgeLine(1, deck, BOW_Z, near)]),
        pal.hull,
        pal.hullEdge,
        1.2,
      );

      // 우현 쪽 배관과 좌우 통로선
      c.strokeStyle = ink(pal.hullEdge * 0.5);
      c.lineWidth = 0.8;
      c.beginPath();
      for (const X of [13.5, 14.5]) {
        const [ax, ay] = project(X, deck + 0.6, near + 4);
        const [bx, by] = project(X, deck + 0.6, BOW_Z - TAPER);
        c.moveTo(ax, ay);
        c.lineTo(bx, by);
      }
      for (const side of [-1, 1]) {
        const pts = edgeLine(side, deck, near, BOW_Z - FCLE, 4);
        c.moveTo(pts[0][0], pts[0][1]);
        for (const [x, y] of pts) c.lineTo(x, y);
      }
      c.stroke();

      // 해치 커버: 먼 것부터 가까운 것 순서로
      const hatches: number[] = [];
      for (let z = 22; z + 19 < BOW_Z - FCLE - 6; z += 27) hatches.push(z);
      for (let i = hatches.length - 1; i >= 0; i--) {
        const zn = hatches[i];
        const zf = zn + 19;
        const half = Math.min(10.5, beamAt(zf) - 5);
        if (half < 3) continue;
        const top = deck + 1.9;
        const tl = project(-half, top, zf);
        const tr = project(half, top, zf);
        const bl = project(-half, top, zn);
        const br = project(half, top, zn);
        solid(poly([bl, br, tr, tl]), pal.hatch * 0.85, pal.hatchEdge * 0.7, 0.8);
        const [, fy] = project(0, deck, zn);
        solid(poly([bl, br, [br[0], fy], [bl[0], fy]]), pal.hatch, pal.hatchEdge, 0.8);
        // 가운데 이음선
        const [mx0, my0] = project(0, top, zn);
        const [mx1, my1] = project(0, top, zf);
        c.strokeStyle = ink(pal.hatchEdge * 0.6);
        c.lineWidth = 0.8;
        c.setLineDash([3, 4]);
        c.beginPath();
        c.moveTo(mx0, my0);
        c.lineTo(mx1, my1);
        c.stroke();
        c.setLineDash([]);
      }

      // 선수루: 앞 격벽과 윗면
      const fz = BOW_Z - FCLE;
      const fh = 2.6;
      const fb = beamAt(fz);
      solid(
        poly([...edgeLine(-1, deck + fh, fz, BOW_Z), ...edgeLine(1, deck + fh, BOW_Z, fz)]),
        pal.hull * 1.1,
        pal.hullEdge,
        1,
      );
      solid(
        poly([project(-fb, deck, fz), project(-fb, deck + fh, fz), project(fb, deck + fh, fz), project(fb, deck, fz)]),
        pal.hatch,
        pal.hatchEdge,
        0.8,
      );

      // 난간: 뱃전을 따라 이어진 줄과 기둥
      c.strokeStyle = ink(pal.hullEdge * 0.8);
      c.lineWidth = 0.8;
      c.beginPath();
      for (const side of [-1, 1]) {
        const rail = edgeLine(side, deck + 1.1, near, fz);
        c.moveTo(rail[0][0], rail[0][1]);
        for (const [x, y] of rail) c.lineTo(x, y);
        for (let z = near + 2; z < fz; z += 5) {
          const [px, py] = project(side * beamAt(z), deck, z);
          const [, qy] = project(0, deck + 1.1, z);
          c.moveTo(px, py);
          c.lineTo(px, qy);
        }
      }
      c.stroke();

      // 앞 돛대
      const mastZ = BOW_Z - 12;
      const [mx, mBase] = project(0, deck + fh, mastZ);
      const [, mTop] = project(0, deck + 16, mastZ);
      const [armL] = project(-1.8, 0, mastZ);
      const [, armY] = project(0, deck + 13.5, mastZ);
      for (const k of [c, mctx]) {
        k.strokeStyle = k === c ? ink(Math.max(pal.hullEdge, pal.hull)) : "#000";
        k.lineWidth = Math.max(1.2, (f / mastZ) * 0.5);
        k.beginPath();
        k.moveTo(mx, mBase);
        k.lineTo(mx, mTop);
        k.moveTo(armL, armY);
        k.lineTo(mx * 2 - armL, armY);
        k.stroke();
      }
    };

    // 거품 색: 라이트는 바다를 지워 밝히고, 다크는 토큰 색으로 칠한다.
    const foam = (a: number) => {
      ctx.globalCompositeOperation = pal.foamErase ? "destination-out" : "source-over";
      ctx.strokeStyle = pal.foamErase ? `rgba(0,0,0,${a})` : ink(a);
    };

    const drawSea = (t: number) => {
      const pitch = Math.sin((t * Math.PI * 2) / 9) * height * 0.005;
      const roll = Math.sin((t * Math.PI * 2) / 13 + 1) * 0.008;
      const pad = Math.max(width, height) * 0.2;

      ctx.save();
      ctx.translate(cx, y0);
      ctx.rotate(roll);
      ctx.translate(-cx, -y0 + pitch);

      // 하늘
      const sky = ctx.createLinearGradient(0, -pad, 0, y0);
      sky.addColorStop(0, ink(pal.skyTop));
      sky.addColorStop(1, ink(pal.skyHorizon));
      ctx.fillStyle = sky;
      ctx.fillRect(-pad, -pad, width + pad * 2, y0 + pad);

      // 천천히 흐르는 옅은 구름 띠 (blur를 지원하지 않는 브라우저에선 가는 띠로 보인다)
      ctx.fillStyle = ink(pal.cloud);
      ctx.filter = "blur(12px)";
      for (let i = 0; i < 7; i++) {
        const span = width + 900;
        const x = ((hash(i) * span + t * (3 + i)) % span) - 450;
        const y = y0 * (0.12 + hash(i + 20) * 0.7);
        ctx.beginPath();
        ctx.ellipse(x, y, 180 + hash(i + 40) * 220, 6 + hash(i + 60) * 14, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.filter = "none";

      // 바다
      const water = ctx.createLinearGradient(0, y0, 0, height + pad);
      water.addColorStop(0, ink(pal.seaFar));
      water.addColorStop(1, ink(pal.seaNear));
      ctx.fillStyle = water;
      ctx.fillRect(-pad, y0, width + pad * 2, height - y0 + pad);

      const haze = ctx.createLinearGradient(0, y0 - height * 0.04, 0, y0 + height * 0.015);
      haze.addColorStop(0, ink(0));
      haze.addColorStop(0.75, ink(pal.haze));
      haze.addColorStop(1, ink(0));
      ctx.fillStyle = haze;
      ctx.fillRect(-pad, y0 - height * 0.04, width + pad * 2, height * 0.055);

      // 수평선의 먼 배 두 척
      ctx.fillStyle = ink(Math.max(pal.hull, pal.hullEdge) * 0.5);
      for (const [off, v] of [
        [0.25, 4],
        [0.7, -2.5],
      ]) {
        const span = width + 200;
        const sx = (((off * span - t * v) % span) + span) % span - 100;
        ctx.fillRect(sx - 12, y0 - 2.5, 24, 2.5);
        ctx.fillRect(sx + 5, y0 - 5.5, 5, 3);
      }

      const travelled = t * SPEED;

      // 파도 마루: 먼 줄부터 가까운 줄까지
      const phase = travelled % CREST_GAP;
      const baseRow = Math.floor(travelled / CREST_GAP);
      const step = Math.max(4, width / 260);
      for (let k = Math.floor(SEA_FAR / CREST_GAP); k >= 0; k--) {
        const z = 8 + k * CREST_GAP - phase;
        if (z < 6) continue;
        const row = baseRow + k;
        const fade = clamp01((SEA_FAR - z) / (SEA_FAR * 0.75)) * clamp01((z - 6) / 12);
        const alpha = pal.foam * fade;
        if (alpha < 0.01) continue;
        const lw = clamp((f * 0.1) / z, 0.4, 2.6);
        const amp = 0.7;
        const dx = z > 300 ? step * 2 : step;
        const line: [number, number][] = [];
        const caps: number[] = [];
        for (let px = -pad; px <= width + pad; px += dx) {
          const X = ((px - cx) * z) / f;
          const Y =
            sea + amp * Math.sin(X * 0.07 + row * 1.7 + t * 0.7) + amp * 0.5 * Math.sin(X * 0.21 - row * 0.9 - t * 1.1);
          line.push([px, y0 - (f * Y) / z]);
          const white = Math.sin(X * 0.05 + row * 2.3 + t * 0.2) * Math.sin(X * 0.13 + row * 0.7 - t * 0.35);
          if (white > 0.3 && z < 700) caps.push(line.length - 1);
        }
        foam(alpha * 0.18);
        ctx.lineWidth = lw;
        ctx.beginPath();
        line.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.stroke();
        if (caps.length) {
          foam(alpha);
          ctx.lineWidth = lw * 1.4;
          ctx.beginPath();
          for (const i of caps) {
            if (i === 0) continue;
            ctx.moveTo(line[i - 1][0], line[i - 1][1]);
            ctx.lineTo(line[i][0], line[i][1]);
          }
          ctx.stroke();
        }
      }

      // 물결 자국: 배 양옆 수면에 떠 있는 거품 줄무늬가 배 속도로 뒤로 흘러간다.
      const STREAK_FAR = 700;
      ctx.lineCap = "round";
      for (let i = 0; i < 440; i++) {
        const side = i % 2 ? 1 : -1;
        const X = side * (HALF_BEAM + 6 + hash(i) ** 1.6 * 260);
        const z = STREAK_FAR - ((hash(i + 500) * STREAK_FAR + travelled) % STREAK_FAR);
        if (z < 8) continue;
        const len = 2 + hash(i + 900) * 5;
        const [ax, ay] = project(X, sea, z + len);
        const [bx, by] = project(X, sea, z);
        const a = pal.foam * 0.8 * clamp01(z / 30) * clamp01((STREAK_FAR - z) / 200);
        foam(a);
        ctx.lineWidth = clamp((f * 0.12) / z, 0.4, 3);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }

      // 선수파: 선수에서 갈라진 흰 물살이 뱃전을 따라 뒤로 퍼진다.
      for (let i = 0; i < 480; i++) {
        const side = i % 2 ? 1 : -1;
        const s = (hash(i + 1300) + t * 0.09) % 1; // 0: 선수, 1: 화면 아래
        const z = BOW_Z + 4 - s * (BOW_Z - 8);
        const spread = 3 + s * (24 + hash(i + 1700) * 70);
        const X = side * (beamAt(Math.min(z, BOW_Z)) + spread);
        const [ax, ay] = project(X, sea, z);
        const [bx, by] = project(X + side * 0.6, sea, z - 3);
        const a = pal.foam * clamp01(s * 12) * (1 - s) ** 1.5;
        if (a < 0.02) continue;
        foam(a);
        ctx.lineWidth = clamp((f * 0.16) / z, 0.6, 3.5);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
    };

    const draw = (now: number) => {
      raf = reduceMotion ? 0 : requestAnimationFrame(draw);
      if (!reduceMotion && now - last < 1000 / FPS) return;
      last = now;
      const t = reduceMotion ? 0 : (now - start) / 1000;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      drawSea(t);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalCompositeOperation = "destination-out";
      ctx.drawImage(mask, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(ship, 0, 0);
    };

    const layout = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      f = Math.max(width * 0.62, height * 1.05);
      cx = width / 2;
      y0 = height * 0.47;
      // 화면 아래 끝에서 갑판 폭이 화면의 약 78%가 되도록 눈높이를 맞춘다 (좁은 화면에선 제한).
      deck = -clamp(((height - y0) * HALF_BEAM) / (0.39 * width), 14, 30);
      sea = deck - 10;
      readTone();
      renderShip();
      last = 0;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };

    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(canvas);
    // 테마가 바뀌면 색을 다시 읽는다.
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener("change", layout);
    const mo = new MutationObserver(layout);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mo.disconnect();
      scheme.removeEventListener("change", layout);
    };
  }, []);

  return <canvas ref={canvasRef} className="bridge-watermark" aria-hidden="true" />;
}
