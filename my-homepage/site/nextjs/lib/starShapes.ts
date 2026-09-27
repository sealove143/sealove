// 프롤로그에서 별들이 모여 그리는 "별자리" 모양들.
// 좌표는 가로 0~1, 세로 0~aspect 단위이며, 화면에 맞춰 Starfield가 확대해 배치한다.
// 각 획(stroke)을 따라 별을 고르게 흩뿌리고, lines가 켜진 획은 별 사이를 옅은 선으로 잇는다.

export type Pt = [number, number];

export type Stroke = {
  pts: Pt[];
  closed?: boolean;
  lines?: boolean; // 기본 true. false면 점선처럼 별만 찍힌다.
  motion?: "wave" | "bob"; // 파도처럼 일렁이거나, 배처럼 오르내린다.
};

export type ShapeDef = {
  aspect: number;
  scale?: number;
  strokes: Stroke[];
};

const line = (a: Pt, b: Pt): Pt[] => [a, b];

const rect = (x0: number, y0: number, x1: number, y1: number): Pt[] => [
  [x0, y0],
  [x1, y0],
  [x1, y1],
  [x0, y1],
];

const qbez = (p0: Pt, p1: Pt, p2: Pt, steps = 16): Pt[] =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps;
    const u = 1 - t;
    return [
      u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0],
      u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1],
    ];
  });

const curve = (from: number, to: number, fy: (x: number) => number, steps = 40): Pt[] =>
  Array.from({ length: steps + 1 }, (_, i) => {
    const x = from + ((to - from) * i) / steps;
    return [x, fy(x)];
  });

const mirror = (pts: Pt[]): Pt[] => pts.map(([x, y]) => [1 - x, y]);

// 3장 · 만년필과 그 펜이 써 내려가는 한 줄
function pen(): ShapeDef {
  const tip: Pt = [0.22, 0.46];
  const top: Pt = [0.7, 0.04];
  const len = Math.hypot(top[0] - tip[0], top[1] - tip[1]);
  const d: Pt = [(top[0] - tip[0]) / len, (top[1] - tip[1]) / len];
  const q: Pt = [-d[1], d[0]];
  const at = (along: number, side: number): Pt => [
    tip[0] + d[0] * along + q[0] * side,
    tip[1] + d[1] * along + q[1] * side,
  ];
  return {
    aspect: 0.62,
    strokes: [
      { pts: [tip, at(0.1, 0.03), at(len, 0.03), at(len, -0.03), at(0.1, -0.03)], closed: true },
      { pts: line(at(0.3, 0.032), at(0.3, -0.032)) },
      { pts: line(tip, at(0.06, 0)) },
      {
        pts: [tip, ...curve(0.24, 0.96, (x) => 0.5 + 0.022 * Math.sin((x - 0.24) * 55) * (0.6 + 0.4 * Math.sin(x * 9)), 70)],
      },
      { pts: line([0.18, 0.58], [0.98, 0.58]), lines: false },
    ],
  };
}

// 4장 · 펼쳐진 책
function book(): ShapeDef {
  const left: Stroke[] = [
    { pts: [...qbez([0.5, 0.14], [0.28, 0.04], [0.04, 0.1]), [0.04, 0.52], ...qbez([0.04, 0.52], [0.28, 0.46], [0.5, 0.58]).slice(1)] },
    { pts: qbez([0.07, 0.56], [0.28, 0.5], [0.5, 0.62]) },
    ...[0, 1, 2, 3].map((k) => ({
      pts: qbez([0.1, 0.18 + k * 0.075], [0.26, 0.13 + k * 0.075], [0.43, 0.2 + k * 0.078], 8),
      lines: false,
    })),
  ];
  return {
    aspect: 0.66,
    strokes: [
      ...left,
      ...left.map((s) => ({ ...s, pts: mirror(s.pts) })),
      { pts: line([0.5, 0.14], [0.5, 0.62]) },
    ],
  };
}

// 5장 · 빛을 건네는 등대
function lighthouse(): ShapeDef {
  const halfAt = (y: number) => 0.035 + ((y - 0.24) / (0.6 - 0.24)) * (0.06 - 0.035);
  const band = (y: number): Pt[] => line([0.5 - halfAt(y), y], [0.5 + halfAt(y), y]);
  return {
    aspect: 0.66,
    strokes: [
      { pts: [[0.465, 0.24], [0.535, 0.24], [0.56, 0.6], [0.44, 0.6]], closed: true },
      { pts: band(0.36) },
      { pts: band(0.48) },
      { pts: rect(0.465, 0.16, 0.535, 0.24), closed: true },
      { pts: [[0.455, 0.16], [0.5, 0.1], [0.545, 0.16]] },
      { pts: line([0.46, 0.19], [0.02, 0.06]), lines: false },
      { pts: line([0.46, 0.21], [0.02, 0.32]), lines: false },
      { pts: line([0.54, 0.19], [0.98, 0.06]), lines: false },
      { pts: line([0.54, 0.21], [0.98, 0.32]), lines: false },
      { pts: curve(0, 1, (x) => 0.62 + 0.01 * Math.sin(x * 30), 40), motion: "wave" },
    ],
  };
}

// 6장 · 파도 위의 컨테이너선
function ship(): ShapeDef {
  const bob = (pts: Pt[], closed = false): Stroke => ({ pts, closed, motion: "bob" });
  return {
    aspect: 0.58,
    strokes: [
      bob([[0.06, 0.34], [0.92, 0.34], [0.97, 0.29], [0.88, 0.46], [0.13, 0.46]], true),
      bob(rect(0.3, 0.2, 0.84, 0.34), true),
      bob(line([0.3, 0.27], [0.84, 0.27])),
      ...[0.39, 0.48, 0.57, 0.66, 0.75].map((x) => bob(line([x, 0.2], [x, 0.34]))),
      bob(rect(0.12, 0.1, 0.24, 0.34), true),
      { ...bob(line([0.135, 0.15], [0.225, 0.15])), lines: false },
      bob(rect(0.16, 0.03, 0.2, 0.1), true),
      bob(line([0.9, 0.34], [0.9, 0.2])),
      { pts: curve(0, 1, (x) => 0.5 + 0.012 * Math.sin(x * 28), 40), motion: "wave" },
      { pts: curve(0.05, 0.95, (x) => 0.55 + 0.01 * Math.sin(x * 22 + 2), 36), motion: "wave", lines: false },
    ],
  };
}

// 피날레 · 나침반 장미 (북극성)
function compass(): ShapeDef {
  const c = 0.5;
  const rose: Pt[] = [];
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4 - Math.PI / 2;
    const r = k % 2 === 0 ? 0.48 : 0.26;
    rose.push([c + Math.cos(a) * r, c + Math.sin(a) * r]);
    const b = a + Math.PI / 8;
    rose.push([c + Math.cos(b) * 0.07, c + Math.sin(b) * 0.07]);
  }
  const ring: Pt[] = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * Math.PI * 2;
    return [c + Math.cos(a) * 0.35, c + Math.sin(a) * 0.35];
  });
  return {
    aspect: 1,
    scale: 0.82,
    strokes: [{ pts: rose, closed: true }, { pts: ring, closed: true }],
  };
}

export const SHAPES = { pen: pen(), book: book(), lighthouse: lighthouse(), ship: ship(), compass: compass() };
export type ShapeKey = keyof typeof SHAPES;

export type SampledPoint = {
  x: number;
  y: number;
  stroke: number;
  motion?: Stroke["motion"];
  link: boolean;
  closeTo?: number; // 닫힌 도형의 마지막 점이 다시 이어질 첫 점의 인덱스
};

// 획 길이에 비례해 n개 안팎의 별 자리를 고르게 뽑는다. link는 "이전 점과 선으로 이을지".
export function sampleShape(shape: ShapeDef, n: number): SampledPoint[] {
  const segs = shape.strokes.map((s) => {
    const pts = s.closed ? [...s.pts, s.pts[0]] : s.pts;
    let length = 0;
    for (let i = 1; i < pts.length; i++) length += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    return { s, pts, length };
  });
  const total = segs.reduce((sum, g) => sum + g.length, 0);
  const out: SampledPoint[] = [];

  segs.forEach(({ s, pts, length }, strokeIndex) => {
    const first = out.length;
    const count = Math.max(2, Math.round((n * length) / total));
    const last = s.closed ? count : count - 1; // 닫힌 도형은 시작점을 중복하지 않는다
    let seg = 1;
    let segStart = 0;
    for (let k = 0; k <= last; k++) {
      if (s.closed && k === count) break;
      const target = (length * k) / (s.closed ? count : count - 1);
      while (seg < pts.length - 1) {
        const segLen = Math.hypot(pts[seg][0] - pts[seg - 1][0], pts[seg][1] - pts[seg - 1][1]);
        if (segStart + segLen >= target) break;
        segStart += segLen;
        seg++;
      }
      const a = pts[seg - 1];
      const b = pts[seg];
      const segLen = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
      const t = Math.min(1, Math.max(0, (target - segStart) / segLen));
      out.push({
        x: a[0] + (b[0] - a[0]) * t,
        y: a[1] + (b[1] - a[1]) * t,
        stroke: strokeIndex,
        motion: s.motion,
        link: k > 0 && s.lines !== false,
      });
    }
    if (s.closed && s.lines !== false) out[out.length - 1].closeTo = first;
  });
  return out;
}
