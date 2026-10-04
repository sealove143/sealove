// 항해 상담실 게시판의 공용 타입·라벨. 값은 supabase/migrations의 열거형과 1:1로 맞춘다.

export const CATEGORIES = {
  career: "진로",
  school: "해양대·입시",
  onboard: "승선 생활",
  license: "면허·자격",
  life: "여성 항해사·생활",
  etc: "기타",
} as const;

export const GENDERS = {
  male: "남성",
  female: "여성",
  other: "기타",
} as const;

export type Category = keyof typeof CATEGORIES;
export type Gender = keyof typeof GENDERS;
export type Visibility = "public" | "private";
export type QuestionStatus = "open" | "answered" | "hidden" | "deleted";

export const TITLE_MAX = 100;
export const BODY_MIN = 10;
export const BODY_MAX = 5000;
export const PAGE_SIZE = 15;
export const NAME_MIN = 2;
export const NAME_MAX = 30;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 72;

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && value in CATEGORIES;
}

export function isGender(value: unknown): value is Gender {
  return typeof value === "string" && value in GENDERS;
}

/** 목록의 한 행. 남의 비공개 글은 title이 null로 온다. */
export interface QuestionListRow {
  id: number;
  category: Category;
  title: string | null;
  visibility: Visibility;
  status: QuestionStatus;
  nickname: string;
  view_count: number;
  created_at: string;
  is_mine: boolean;
}

export interface QuestionDetail {
  id: number;
  category: Category;
  title: string;
  body: string;
  visibility: Visibility;
  status: QuestionStatus;
  view_count: number;
  created_at: string;
  nickname: string;
  is_mine: boolean;
  answer: { body: string; created_at: string; updated_at: string } | null;
  /** 선장(관리자)이 볼 때만 채워진다. 다른 사람에게는 서버가 아예 내려보내지 않는다. */
  adminOnly: { gender: Gender; email: string; name: string | null; birthDate: string | null } | null;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

// DB 트리거가 던지는 오류 코드를 방문자에게 보여줄 문장으로 바꾼다.
const DB_ERRORS: Record<string, string> = {
  banned: "이용이 제한된 계정입니다. 문의가 필요하면 섭외 문의 페이지로 연락해 주세요.",
  rate_limited_short: "질문을 너무 빠르게 올리고 있어요. 10분 뒤에 다시 시도해 주세요.",
  rate_limited_daily: "하루에 올릴 수 있는 질문 수(10개)를 넘었어요. 내일 다시 시도해 주세요.",
};

export function describeDbError(message: string | undefined, fallback: string) {
  return (message && DB_ERRORS[message]) || fallback;
}
