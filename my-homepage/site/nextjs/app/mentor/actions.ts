"use server";

import { createHash } from "node:crypto";

import { refresh } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";

import { getViewer } from "@/lib/auth/session";
import { BODY_MAX, BODY_MIN, isCategory, isGender, TITLE_MAX } from "@/lib/consult";
import { insertQuestion, insertReport, setQuestionHidden, softDeleteQuestion, upsertAnswer } from "@/lib/consultDb";
import { notifyNewQuestion } from "@/lib/notifyQuestion";

export type ActionState = { error?: string; ok?: string };

const MAX_LINKS = 2;
const URL_PATTERN = /https?:\/\/|www\./gi;

// 원본 IP는 저장하지 않는다. 같은 IP의 반복 공격을 묶어 볼 수 있을 만큼만 남긴다.
async function readClientFingerprint() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  const salt = process.env.IP_HASH_SALT;
  return {
    ipHash: ip && salt ? createHash("sha256").update(`${salt}:${ip}`).digest("hex") : null,
    userAgent: h.get("user-agent")?.slice(0, 300) ?? null,
  };
}

export async function createQuestion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "로그인이 필요해요. 다시 로그인한 뒤 작성해 주세요." };

  // 봇 차단용 숨김 필드. 사람은 비워두고, 자동 입력 봇만 값을 채운다.
  if (formData.get("website")) return { ok: "질문이 올라갔어요." };

  const category = formData.get("category");
  const gender = formData.get("gender");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const visibility = formData.get("visibility") === "private" ? "private" : "public";

  if (title.length < 2 || title.length > TITLE_MAX) {
    return { error: `궁금증 한마디는 2~${TITLE_MAX}자로 입력해 주세요.` };
  }
  if (!isGender(gender)) return { error: "성별을 선택해 주세요." };
  if (!isCategory(category)) return { error: "분류를 선택해 주세요." };
  if (body.length < BODY_MIN || body.length > BODY_MAX) {
    return { error: `내용은 ${BODY_MIN}~${BODY_MAX}자로 입력해 주세요.` };
  }
  if ((`${title} ${body}`.match(URL_PATTERN)?.length ?? 0) > MAX_LINKS) {
    return { error: `링크는 ${MAX_LINKS}개까지만 넣을 수 있어요.` };
  }

  const { ipHash, userAgent } = await readClientFingerprint();
  const result = await insertQuestion(viewer, { category, title, body, gender, visibility, ipHash, userAgent });
  if (!result.ok) return { error: result.error };

  // 메일은 응답을 보낸 뒤에 발송한다. 메일이 실패해도 질문은 이미 저장되어 있다.
  after(() => notifyNewQuestion(viewer, { id: result.id, title, body, category, gender, visibility }));

  refresh();
  return { ok: "질문이 올라갔어요. 아래 목록에서 확인할 수 있어요." };
}

export async function deleteQuestion(questionId: number): Promise<ActionState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "로그인이 필요해요." };

  const result = await softDeleteQuestion(viewer, questionId);
  if (!result.ok) return { error: result.error };

  redirect("/mentor");
}

export async function saveAnswer(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return { error: "관리자만 답변할 수 있어요." };

  const questionId = Number(formData.get("questionId"));
  const body = String(formData.get("body") ?? "").trim();
  if (!Number.isInteger(questionId) || !body) return { error: "답변 내용을 입력해 주세요." };

  const result = await upsertAnswer(viewer, questionId, body);
  if (!result.ok) return { error: result.error };

  refresh();
  return { ok: "답변을 저장했어요." };
}

export async function moderateQuestion(questionId: number, action: "hide" | "unhide"): Promise<ActionState> {
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return { error: "관리자만 할 수 있어요." };

  const result = await setQuestionHidden(viewer, questionId, action === "hide");
  if (!result.ok) return { error: result.error };

  refresh();
  return { ok: action === "hide" ? "질문을 숨겼어요." : "질문을 다시 공개했어요." };
}

export async function reportQuestion(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const viewer = await getViewer();
  if (!viewer) return { error: "로그인한 뒤 신고할 수 있어요." };

  const questionId = Number(formData.get("questionId"));
  const reason = String(formData.get("reason") ?? "").trim();
  if (!Number.isInteger(questionId) || reason.length < 2 || reason.length > 500) {
    return { error: "신고 사유를 2~500자로 적어 주세요." };
  }

  const result = await insertReport(viewer, questionId, reason);
  if (!result.ok) return { error: result.error };

  return { ok: "신고가 접수되었어요. 검토 후 조치하겠습니다." };
}
