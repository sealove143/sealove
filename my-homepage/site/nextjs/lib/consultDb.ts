import "server-only";

import type { Viewer } from "@/lib/auth/session";
import {
  describeDbError,
  PAGE_SIZE,
  type Category,
  type Gender,
  type QuestionDetail,
  type QuestionListRow,
  type QuestionStatus,
  type Visibility,
} from "@/lib/consult";
import { supabaseAdmin } from "@/lib/supabase/admin";

// 게시판의 모든 DB 접근은 이 파일을 거친다. RLS가 없으므로 "누가 무엇을 볼 수 있는가"를
// 여기서 판단한다. 페이지나 서버 액션에서 supabaseAdmin을 직접 부르지 않는다.

export type DbResult<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const NOT_READY = "게시판을 준비하고 있어요. 잠시 후 다시 시도해 주세요.";

interface AccessRow {
  author_id: string;
  visibility: Visibility;
  status: QuestionStatus;
}

/** 이 방문자가 질문의 내용을 볼 수 있는가. 삭제된 글은 아무에게도 보이지 않는다. */
function canView(viewer: Viewer | null, row: AccessRow) {
  if (row.status === "deleted") return false;
  if (viewer?.isAdmin || viewer?.id === row.author_id) return true;
  return row.visibility === "public" && row.status !== "hidden";
}

export async function listQuestions(viewer: Viewer | null, category: Category | null, page: number) {
  if (!supabaseAdmin) return { rows: [] as QuestionListRow[], total: 0, failed: false };

  let query = supabaseAdmin
    .from("questions")
    .select("id, author_id, category, title, visibility, status, view_count, created_at, users(nickname)", {
      count: "exact",
    })
    .in("status", ["open", "answered"])
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (category) query = query.eq("category", category);

  const { data, count, error } = await query;
  if (error) {
    console.error("[consult] list failed:", error);
    return { rows: [] as QuestionListRow[], total: 0, failed: true };
  }

  type Row = AccessRow & Omit<QuestionListRow, "nickname" | "is_mine" | "title"> & {
    title: string;
    users: { nickname: string } | null;
  };
  const rows = ((data ?? []) as unknown as Row[]).map((row): QuestionListRow => {
    const isMine = viewer?.id === row.author_id;
    return {
      id: row.id,
      category: row.category,
      // 남의 비공개 글은 자리만 보이고 제목은 가린다.
      title: canView(viewer, row) ? row.title : null,
      visibility: row.visibility,
      status: row.status,
      nickname: row.users?.nickname ?? "알 수 없음",
      view_count: row.view_count,
      created_at: row.created_at,
      is_mine: isMine,
    };
  });
  return { rows, total: count ?? 0, failed: false };
}

/** 볼 권한이 없는 글은 "없는 글"과 똑같이 null을 돌려준다. 볼 수 있으면 조회수를 올린다. */
export async function getQuestion(viewer: Viewer | null, id: number): Promise<QuestionDetail | null> {
  if (!supabaseAdmin) return null;

  // 성별·성명·이메일은 선장이 볼 때만 DB에서 가져온다.
  const adminColumns = viewer?.isAdmin ? ", gender, users(nickname, email, name)" : ", users(nickname)";
  const { data, error } = await supabaseAdmin
    .from("questions")
    .select(
      `id, author_id, category, title, body, visibility, status, view_count, created_at, answers(body, created_at, updated_at)${adminColumns}`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) console.error("[consult] detail failed:", error);

  type Answer = NonNullable<QuestionDetail["answer"]>;
  const row = data as unknown as
    | (AccessRow & {
        id: number;
        category: Category;
        title: string;
        body: string;
        view_count: number;
        created_at: string;
        gender?: Gender;
        users: { nickname: string; email?: string; name?: string | null } | null;
        answers: Answer | Answer[] | null;
      })
    | null;
  if (!row || !canView(viewer, row)) return null;

  await supabaseAdmin.rpc("increment_question_view", { p_id: id });

  const answer = Array.isArray(row.answers) ? (row.answers[0] ?? null) : row.answers;
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    body: row.body,
    visibility: row.visibility,
    status: row.status,
    view_count: row.view_count,
    created_at: row.created_at,
    nickname: row.users?.nickname ?? "알 수 없음",
    is_mine: viewer?.id === row.author_id,
    answer,
    adminOnly:
      viewer?.isAdmin && row.gender && row.users?.email
        ? { gender: row.gender, email: row.users.email, name: row.users.name ?? null }
        : null,
  };
}

export interface NewQuestion {
  category: Category;
  title: string;
  body: string;
  gender: Gender;
  visibility: Visibility;
  ipHash: string | null;
  userAgent: string | null;
}

export async function insertQuestion(viewer: Viewer, input: NewQuestion): Promise<DbResult<{ id: number }>> {
  if (!supabaseAdmin) return { ok: false, error: NOT_READY };

  const { data, error } = await supabaseAdmin
    .from("questions")
    .insert({
      author_id: viewer.id,
      category: input.category,
      title: input.title,
      body: input.body,
      gender: input.gender,
      visibility: input.visibility,
      ip_hash: input.ipHash,
      user_agent: input.userAgent,
    })
    .select("id")
    .single();
  if (error || !data) {
    console.error("[consult] insert failed:", error);
    return {
      ok: false,
      error: describeDbError(error?.message, "질문을 저장하지 못했어요. 잠시 후 다시 시도해 주세요."),
    };
  }
  return { ok: true, id: data.id as number };
}

/** 작성자 본인만 지울 수 있다. 행은 남기고 상태만 바꾼다(소프트 삭제). */
export async function softDeleteQuestion(viewer: Viewer, id: number): Promise<DbResult> {
  if (!supabaseAdmin) return { ok: false, error: NOT_READY };

  const { data, error } = await supabaseAdmin
    .from("questions")
    .update({ status: "deleted" })
    .eq("id", id)
    .eq("author_id", viewer.id)
    .neq("status", "deleted")
    .select("id");
  if (error || !data?.length) return { ok: false, error: "질문을 삭제하지 못했어요." };
  return { ok: true };
}

export async function upsertAnswer(viewer: Viewer, questionId: number, body: string): Promise<DbResult> {
  if (!supabaseAdmin) return { ok: false, error: NOT_READY };
  if (!viewer.isAdmin) return { ok: false, error: "관리자만 답변할 수 있어요." };

  const { error } = await supabaseAdmin
    .from("answers")
    .upsert({ question_id: questionId, author_id: viewer.id, body }, { onConflict: "question_id" });
  if (error) {
    console.error("[consult] answer failed:", error);
    return { ok: false, error: "답변을 저장하지 못했어요." };
  }
  return { ok: true };
}

export async function setQuestionHidden(viewer: Viewer, questionId: number, hidden: boolean): Promise<DbResult> {
  if (!supabaseAdmin) return { ok: false, error: NOT_READY };
  if (!viewer.isAdmin) return { ok: false, error: "관리자만 할 수 있어요." };

  // 숨김을 풀 때는 답변 여부에 맞는 상태로 돌려놓는다.
  let status: QuestionStatus = "hidden";
  if (!hidden) {
    const { count } = await supabaseAdmin
      .from("answers")
      .select("id", { count: "exact", head: true })
      .eq("question_id", questionId);
    status = count ? "answered" : "open";
  }

  const { error } = await supabaseAdmin
    .from("questions")
    .update({ status })
    .eq("id", questionId)
    .neq("status", "deleted");
  if (error) return { ok: false, error: "상태를 바꾸지 못했어요." };

  await supabaseAdmin.from("moderation_logs").insert({
    admin_id: viewer.id,
    target_type: "question",
    target_id: String(questionId),
    action: hidden ? "hide" : "unhide",
  });
  return { ok: true };
}

export async function insertReport(viewer: Viewer, questionId: number, reason: string): Promise<DbResult> {
  if (!supabaseAdmin) return { ok: false, error: NOT_READY };

  // 볼 수 없는 글(남의 비공개 글 등)은 신고도 할 수 없다.
  const { data: target } = await supabaseAdmin
    .from("questions")
    .select("author_id, visibility, status")
    .eq("id", questionId)
    .maybeSingle();
  if (!target || !canView(viewer, target as AccessRow)) return { ok: false, error: "신고를 접수하지 못했어요." };

  const { error } = await supabaseAdmin
    .from("question_reports")
    .insert({ question_id: questionId, reporter_id: viewer.id, reason });
  if (error) {
    // unique 제약 위반 = 이미 신고한 글
    if (error.code === "23505") return { ok: false, error: "이미 신고한 질문이에요." };
    return { ok: false, error: "신고를 접수하지 못했어요." };
  }
  return { ok: true };
}
