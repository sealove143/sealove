import type { ShapeKey } from "./starShapes";

// 홈 프롤로그의 장면 구성. start/end는 프롤로그 전체 스크롤 진행도(0~1) 기준이며,
// 문장 타임라인(Prologue)과 별빛 캔버스(Starfield)가 같은 구간을 공유한다.

export type SceneEffect = "grid" | "horizon" | ShapeKey;

export type Scene = {
  key: string;
  start: number;
  end: number;
  effect: SceneEffect;
  chapter: string;
  title: string;
  lines: string[];
  placement: "top" | "bottom"; // 문장 위치 (별 모양을 가리지 않는 쪽)
  rank?: number; // 이 장면에서 달리는 견장 줄 (RANKS 인덱스)
};

export const RANKS = [
  { year: "2016", label: "삼등항해사" },
  { year: "2018", label: "이등항해사" },
  { year: "2020", label: "일등항해사" },
  { year: "2025", label: "선장" },
];

export const OPENING_END = 0.1;
export const FINALE_START = 0.89;

export const SCENES: Scene[] = [
  {
    key: "discipline",
    start: 0.1,
    end: 0.23,
    effect: "grid",
    chapter: "제1장 · 2012, 한국해양대학교",
    title: "규율의 시간",
    lines: [
      "새벽 여섯 시, 점호의 호각이 어둠을 갈랐다.",
      "각 잡힌 제복과 발맞춘 걸음 사이에서",
      "바다로 가는 길은 규율에서 시작된다는 것을 배웠다.",
    ],
    placement: "bottom",
  },
  {
    key: "solitude",
    start: 0.23,
    end: 0.37,
    effect: "horizon",
    chapter: "제2장 · 2016, 첫 승선",
    title: "수평선 위의 한 점",
    lines: [
      "처음 오른 배 위에서 알았다.",
      "바다는 끝없이 넓고, 그 한가운데 나는 혼자라는 것을.",
      "밤마다 별을 헤아리며 고독과 친해지는 법을 익혔다.",
    ],
    placement: "top",
    rank: 0,
  },
  {
    key: "pen",
    start: 0.37,
    end: 0.5,
    effect: "pen",
    chapter: "제3장 · 선실의 밤",
    title: "펜을 들다",
    lines: [
      "당직을 마친 새벽, 흔들리는 선실 책상에 앉았다.",
      "누구에게도 닿지 않던 외로움이",
      "한 줄, 또 한 줄 문장이 되어 갔다.",
    ],
    placement: "bottom",
  },
  {
    key: "book",
    start: 0.5,
    end: 0.63,
    effect: "book",
    chapter: "제4장 · 첫 책",
    title: "문장이 책이 되다",
    lines: [
      "바다 위에서 쓴 문장들이 마침내 육지에 닿았다.",
      "『나는 스물일곱, 2등 항해사입니다』를 시작으로",
      "세 권의 책이 세상에 나왔다.",
    ],
    placement: "bottom",
    rank: 1,
  },
  {
    key: "lighthouse",
    start: 0.63,
    end: 0.76,
    effect: "lighthouse",
    chapter: "제5장 · 글과 강연",
    title: "등대가 되어",
    lines: [
      "배 위에서 부딪히고 자라며 배운 것들을",
      "글로 적고, 강연장에서 목소리로 건넨다.",
      "혼자 견딘 밤들이 누군가의 항로를 비추도록.",
    ],
    placement: "bottom",
    rank: 2,
  },
  {
    key: "ship",
    start: 0.76,
    end: FINALE_START,
    effect: "ship",
    chapter: "제6장 · 2025, 선장",
    title: "배 전체의 항로",
    lines: [
      "2025년 4월, 선장이 되었다.",
      "삼등항해사로 첫발을 디딘 지 10년,",
      "이제 한 척의 배와 모든 선원의 항로를 책임진다.",
    ],
    placement: "bottom",
    rank: 3,
  },
];

// 캔버스가 쓰는 별 모양 구간. 피날레(나침반)는 끝까지 유지된다.
export const SHAPE_WINDOWS: { effect: SceneEffect; start: number; end: number }[] = [
  ...SCENES.map(({ effect, start, end }) => ({ effect, start, end })),
  { effect: "compass", start: FINALE_START, end: 1.01 },
];
