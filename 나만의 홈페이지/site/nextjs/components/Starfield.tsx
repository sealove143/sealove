"use client";

import { useEffect, useRef, type RefObject } from "react";

import { SHAPE_WINDOWS, type SceneEffect } from "@/lib/prologueScenes";
import { SHAPES, sampleShape, type SampledPoint } from "@/lib/starShapes";

// 프롤로그 배경의 별빛 캔버스. 스크롤 진행도(progressRef, 0~1)에 따라 별들이
// 장면별 모양으로 모였다가 다시 하늘로 흩어진다.
//   grid    : 격자 대오로 정렬해 줄마다 차례로 밝아진다 (점호).
//   horizon : 하늘이 넓어지고 수평선 위에 배 불빛 하나만 남는다 (고독).
//   그 외   : lib/starShapes의 별자리(펜, 책, 등대, 배, 나침반)를 그린다.

type Star = {
  x: number; // 0~1 기본 위치
  y: number;
  r: number;
  depth: number; // 0~1, 클수록 가깝고 밝다
  phase: number;
  speed: number;
};

// 화면 좌표로 옮긴 모양의 한 점. u는 모양 안의 가로 위치(0~1, 파도 위상용).
type Target = Omit<SampledPoint, "x" | "y"> & { x: number; y: number; u: number; row?: number; col?: number };
type Layout = { points: Target[]; unit: number };

// 대오를 이루는 별의 수. 넓은 화면은 16×6, 좁은 화면은 8×12로 선다.
const GRID_SIZE = 96;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function createStars(count: number): Star[] {
  return Array.from({ length: count }, () => {
    const depth = Math.random() ** 2;
    return {
      x: Math.random(),
      y: Math.random() * 0.95,
      r: 0.35 + depth * 1.25,
      depth,
      phase: Math.random() * Math.PI * 2,
      speed: 0.6 + Math.random() * 1.6,
    };
  });
}

function layoutGrid(width: number, height: number): Layout {
  const cols = width < 640 ? 8 : 16;
  const rows = GRID_SIZE / cols;
  // 칸 간격(px)은 화면에 맞추되, 대오가 문장 영역(아래쪽)을 침범하지 않게 제한한다.
  const gap = Math.min((width * 0.78) / (cols - 1), (height * 0.36) / (rows - 1), 50);
  const points = Array.from({ length: GRID_SIZE }, (_, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    return {
      x: width / 2 + (col - (cols - 1) / 2) * gap,
      y: height * 0.32 + (row - (rows - 1) / 2) * gap,
      u: col / (cols - 1),
      row,
      col,
      stroke: 0,
      link: false,
    };
  });
  return { points, unit: gap };
}

// 별자리를 화면 위쪽 영역(문장과 겹치지 않는 곳)에 비율을 유지한 채 맞춘다.
function layoutShape(effect: keyof typeof SHAPES, width: number, height: number, budget: number): Layout {
  const shape = SHAPES[effect];
  const scale = shape.scale ?? 1;
  const boxW = Math.min(width * 0.84, 760 * scale, (height * 0.42 * scale) / shape.aspect);
  const cx = width / 2;
  const cy = height * 0.34;
  const points = sampleShape(shape, budget).map((p) => ({
    ...p,
    u: p.x,
    x: cx + (p.x - 0.5) * boxW,
    y: cy + (p.y - shape.aspect / 2) * boxW,
  }));
  return { points, unit: boxW };
}

export default function Starfield({ progressRef }: { progressRef: RefObject<number> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let stars: Star[] = [];
    let layouts = new Map<SceneEffect, Layout>();
    let px = new Float32Array(0);
    let py = new Float32Array(0);
    let raf = 0;
    let shown = 0; // 화면에 반영된(부드럽게 따라가는) 진행도
    const start = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // 너비로만 정해 모바일 주소창이 접힐 때 별이 다시 뿌려지지 않게 한다.
      const count = Math.round(Math.min(520, Math.max(220, width * 0.36)));
      if (stars.length !== count) {
        stars = createStars(count);
        px = new Float32Array(count);
        py = new Float32Array(count);
      }
      const budget = Math.min(300, Math.floor(count * 0.68));
      layouts = new Map<SceneEffect, Layout>([["grid", layoutGrid(width, height)]]);
      for (const key of Object.keys(SHAPES) as (keyof typeof SHAPES)[]) {
        layouts.set(key, layoutShape(key, width, height, budget));
      }
    };

    const drawHorizon = (drift: number, t: number) => {
      const horizonY = height * 0.74;
      const sea = ctx.createLinearGradient(0, horizonY, 0, height);
      sea.addColorStop(0, `rgba(3,6,14,${0.92 * drift})`);
      sea.addColorStop(1, `rgba(1,2,6,${drift})`);
      ctx.fillStyle = sea;
      ctx.fillRect(0, horizonY, width, height - horizonY);

      const glow = ctx.createLinearGradient(0, horizonY - 40, 0, horizonY + 2);
      glow.addColorStop(0, "rgba(120,150,190,0)");
      glow.addColorStop(1, `rgba(120,150,190,${0.14 * drift})`);
      ctx.fillStyle = glow;
      ctx.fillRect(0, horizonY - 40, width, 42);

      ctx.fillStyle = `rgba(170,190,215,${0.35 * drift})`;
      ctx.fillRect(0, horizonY, width, 1);

      // 수평선 위 배 한 척의 불빛과 물에 비친 빛기둥
      const shipX = width * (0.66 + Math.sin(t * 0.05) * 0.01);
      const shipY = horizonY - 3 + Math.sin(t * 0.9) * 1.2;
      const halo = ctx.createRadialGradient(shipX, shipY, 0, shipX, shipY, 26);
      halo.addColorStop(0, `rgba(255,205,130,${0.5 * drift})`);
      halo.addColorStop(1, "rgba(255,205,130,0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(shipX, shipY, 26, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255,228,180,${drift})`;
      ctx.beginPath();
      ctx.arc(shipX, shipY, 1.8, 0, Math.PI * 2);
      ctx.fill();

      for (let i = 0; i < 14; i++) {
        const w = (10 - i * 0.5) * (0.7 + 0.3 * Math.sin(t * 2 + i));
        ctx.fillStyle = `rgba(255,200,130,${0.22 * drift * (1 - i / 14)})`;
        ctx.fillRect(shipX - w / 2, horizonY + 4 + i * 5, w, 1);
      }
      return horizonY;
    };

    const draw = (now: number) => {
      const t = reduceMotion ? 0 : (now - start) / 1000;
      shown = reduceMotion ? progressRef.current : lerp(shown, progressRef.current, 0.08);
      const p = shown;

      // 지금 가장 강하게 드러난 장면 하나만 별을 끌어모은다 (구간은 서로 겹치지 않는다).
      let active: SceneEffect | null = null;
      let weight = 0;
      for (const w of SHAPE_WINDOWS) {
        const v = smooth(w.start, w.start + 0.045, p) * (1 - smooth(w.end - 0.035, w.end, p));
        if (v > weight) {
          weight = v;
          active = w.effect;
        }
      }
      const drift = active === "horizon" ? weight : 0;
      const layout = active && active !== "horizon" ? layouts.get(active) : undefined;
      const form = layout ? weight : 0;

      ctx.clearRect(0, 0, width, height);
      const horizonY = drift > 0 ? drawHorizon(drift, t) : height;

      const cx = width / 2;
      const cy = height * 0.4;
      const bob = Math.sin(t * 0.9);

      const alphas: number[] = [];
      const warms: number[] = [];
      const radii: number[] = [];

      stars.forEach((s, i) => {
        // 기본 위치 + 깊이에 따른 아주 느린 흐름
        let x = ((s.x + t * 0.0025 * (0.3 + s.depth)) % 1) * width;
        let y = s.y * height;
        let alpha = (0.25 + s.depth * 0.6) * (0.65 + 0.35 * Math.sin(t * s.speed + s.phase));
        let radius = s.r;
        let warm = 0;

        const target = layout?.points[i];
        if (layout && target) {
          const tx = target.x;
          let ty = target.y;
          if (target.motion === "wave") ty += Math.sin(t * 1.2 + target.u * 18) * layout.unit * 0.007;
          if (target.motion === "bob") ty += bob * layout.unit * 0.006;

          // 모양을 따라 빛이 흐른다. 대오는 앞줄부터 점호하듯, 나머지는 획을 따라.
          const glint =
            target.row !== undefined
              ? Math.max(0, Math.sin(t * 1.6 - target.row * 0.9 - (target.col ?? 0) * 0.12)) ** 6
              : Math.max(0, Math.sin(t * 1.1 - i * 0.07)) ** 10;
          x = lerp(x, tx, form);
          y = lerp(y, ty, form);
          alpha = lerp(alpha, 0.6 + 0.4 * glint, form);
          radius = lerp(radius, 1.2, form);
          warm = form * glint;
        } else if (form > 0) {
          alpha *= 1 - form * 0.6; // 모양 밖의 별은 잠시 물러난다
        }

        if (drift > 0) {
          // 중심에서 멀어지며 하늘이 넓어지는 느낌
          x = cx + (x - cx) * (1 + drift * 0.45);
          y = cy + (y - cy) * (1 + drift * 0.3) - drift * height * 0.06;
          alpha *= 1 - drift * 0.35;
          if (y > horizonY - 2) alpha = 0;
        }

        px[i] = x;
        py[i] = y;
        alphas.push(clamp01(alpha));
        warms.push(warm);
        radii.push(radius);
      });

      // 별자리 선: 모양이 거의 완성됐을 때만 옅게 잇는다.
      if (layout && form > 0.6) {
        const lineAlpha = 0.2 * smooth(0.6, 1, form);
        ctx.strokeStyle = `rgba(214,196,150,${lineAlpha})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        layout.points.forEach((pt, i) => {
          if (i >= stars.length) return;
          if (pt.link) {
            ctx.moveTo(px[i - 1], py[i - 1]);
            ctx.lineTo(px[i], py[i]);
          }
          if (pt.closeTo !== undefined) {
            ctx.moveTo(px[i], py[i]);
            ctx.lineTo(px[pt.closeTo], py[pt.closeTo]);
          }
        });
        ctx.stroke();
      }

      for (let i = 0; i < stars.length; i++) {
        const x = px[i];
        const y = py[i];
        const alpha = alphas[i];
        if (alpha <= 0 || x < -4 || x > width + 4 || y < -4) continue;
        const r = Math.round(lerp(226, 255, warms[i]));
        const g = Math.round(lerp(232, 214, warms[i]));
        const b = Math.round(lerp(245, 150, warms[i]));
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, radii[i], 0, Math.PI * 2);
        ctx.fill();

        if (radii[i] > 1.1 && alpha > 0.7) {
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.12})`;
          ctx.beginPath();
          ctx.arc(x, y, radii[i] * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!reduceMotion || Math.abs(shown - progressRef.current) > 0.001) {
        raf = requestAnimationFrame(draw);
      }
    };

    const kick = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    };

    resize();
    kick();
    const ro = new ResizeObserver(() => {
      resize();
      kick();
    });
    ro.observe(canvas);
    // 동작 줄이기 모드에서는 스크롤할 때만 다시 그린다.
    if (reduceMotion) window.addEventListener("scroll", kick, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", kick);
    };
  }, [progressRef]);

  return <canvas ref={canvasRef} className="starfield" aria-hidden="true" />;
}
