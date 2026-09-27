import "server-only";

import Anthropic from "@anthropic-ai/sdk";

// 기본 자격 증명 해석 순서(ANTHROPIC_API_KEY 등)를 그대로 사용한다.
export const anthropic = new Anthropic();

// 개인 홈페이지의 짧은 상담 답변(3~6문장) 용도이므로 비용 대비 효율이 좋은
// claude-sonnet-5를 기본값으로 사용한다. 더 정교한 답변이 필요하면 배포
// 환경변수 ANTHROPIC_MODEL을 claude-opus-5 등으로 바꾸기만 하면 된다.
export const MENTOR_MODEL = process.env.ANTHROPIC_MODEL?.trim() || "claude-sonnet-5";

export const MENTOR_MAX_TOKENS = 700;
