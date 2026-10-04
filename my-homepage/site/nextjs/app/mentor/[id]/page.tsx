import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminAnswerForm, AdminModeration, DeleteQuestionButton, ReportForm } from "@/components/QuestionActions";
import { getViewer } from "@/lib/auth/session";
import { CATEGORIES, formatDate, GENDERS } from "@/lib/consult";
import { getQuestion } from "@/lib/consultDb";

export const metadata: Metadata = {
  title: "질문 | 항해 상담실",
};

export default async function QuestionPage({ params }: PageProps<"/mentor/[id]">) {
  const { id } = await params;
  const questionId = Number(id);
  if (!Number.isInteger(questionId) || questionId < 1) notFound();

  const viewer = await getViewer();
  // 볼 권한이 없는 비공개 글은 "없는 글"과 똑같이 null로 온다.
  const question = await getQuestion(viewer, questionId);

  if (!question) {
    return (
      <section className="section" style={{ paddingTop: 56 }}>
        <div className="container">
          <div className="board-panel board-empty">
            <p>
              <span aria-hidden="true">🔒 </span>비공개 질문이거나 삭제된 질문이에요.
            </p>
            <p style={{ marginTop: 8 }}>
              {viewer
                ? "비공개 질문은 작성한 본인과 선장님만 볼 수 있어요."
                : "내가 쓴 비공개 질문이라면 항해 상담실에서 로그인한 뒤 다시 열어 주세요."}
            </p>
            <Link className="btn btn-ghost" href="/mentor" style={{ marginTop: 18 }}>
              {viewer ? "목록으로" : "로그인하러 가기"}
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const answer = question.answer;

  return (
    <section className="section sea-texture" style={{ paddingTop: 56 }}>
      <div className="container">
        <article className="board-panel question-article">
          {question.status === "hidden" && (
            <div className="form-status is-error" role="status" style={{ marginTop: 0, marginBottom: 18 }}>
              <strong>숨김 처리된 질문입니다.</strong>
              신고가 누적되었거나 운영 원칙에 따라 다른 방문자에게는 보이지 않아요.
            </div>
          )}
          <div className="question-head">
            <span className="board-cat">{CATEGORIES[question.category]}</span>
            {question.visibility === "private" && <span className="board-mine">🔒 비공개</span>}
            <span className={`board-state${question.status === "answered" ? " is-answered" : ""}`}>
              {question.status === "answered" ? "답변 완료" : question.status === "hidden" ? "숨김" : "답변 대기"}
            </span>
          </div>
          <h1 className="question-title">{question.title}</h1>
          <div className="board-meta">
            <span>{question.nickname}</span>
            <span>{formatDate(question.created_at)}</span>
            <span>조회 {question.view_count + 1}</span>
          </div>
          <div className="question-body">{question.body}</div>

          {answer ? (
            <div className="question-answer">
              <b className="who">CAPTAIN&apos;S ANSWER · 김승주 선장</b>
              <div className="question-body">{answer.body}</div>
              <div className="board-meta" style={{ marginTop: 10 }}>
                <span>{formatDate(answer.updated_at)}</span>
              </div>
            </div>
          ) : (
            <p className="board-note" style={{ marginTop: 28 }}>
              아직 답변이 달리지 않았어요. 승선 일정에 따라 답변이 늦어질 수 있습니다.
            </p>
          )}

          <div className="board-actions">
            <Link className="btn btn-ghost" href="/mentor">
              목록으로
            </Link>
            {question.is_mine && <DeleteQuestionButton questionId={question.id} />}
          </div>

          {viewer && !question.is_mine && !viewer.isAdmin && <ReportForm questionId={question.id} />}
        </article>

        {viewer?.isAdmin && (
          <div className="board-panel admin-panel">
            <div className="eyebrow">ADMIN</div>
            {question.adminOnly && (
              <p className="board-note">
                {question.adminOnly.name && (
                  <>
                    성명 <b>{question.adminOnly.name}</b> ·{" "}
                  </>
                )}
                성별 <b>{GENDERS[question.adminOnly.gender]}</b> · 질문자 이메일{" "}
                <a href={`mailto:${question.adminOnly.email}`} style={{ color: "var(--sea-bright)" }}>
                  {question.adminOnly.email}
                </a>{" "}
                (이 정보는 선장님에게만 보입니다)
              </p>
            )}
            <AdminAnswerForm questionId={question.id} initialBody={answer?.body ?? ""} />
            <AdminModeration questionId={question.id} hidden={question.status === "hidden"} />
          </div>
        )}
      </div>
    </section>
  );
}
