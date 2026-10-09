import type { Metadata } from "next";
import Link from "next/link";

import AuthForm from "@/components/AuthForm";
import BoardViewerBar from "@/components/BoardViewerBar";
import FaqList from "@/components/FaqList";
import QuestionForm from "@/components/QuestionForm";
import { getViewer } from "@/lib/auth/session";
import { CATEGORIES, formatDate, isCategory, PAGE_SIZE } from "@/lib/consult";
import { listQuestions } from "@/lib/consultDb";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "항해 상담실",
  description: "항해사·해양대 진로 고민을 남기면 김승주 선장이 직접 답하는 질문 게시판, 그리고 자주 묻는 질문",
};

const FAQ = [
  {
    question: "어떻게 항해사가 되셨나요?",
    answer:
      "한국해양대학교 해사수송과학부를 졸업하고 2016년 2월 삼등항해사로 첫 승선했습니다. 오빠가 같은 학교에 다니고 있었던 것이 진로에 자연스러운 영향을 주었습니다.",
  },
  {
    question: "여성 항해사로 일하며 흔치 않았던 점은 무엇인가요?",
    answer:
      "승선 당시 회사 소속 항해사 500명 중 여성은 단 3명뿐이었습니다. 흔치 않은 환경이었지만 삼등항해사부터 선장까지 모든 계급을 차례로 거쳤습니다.",
  },
  {
    question: "선장이 되기까지 얼마나 걸렸나요?",
    answer: (
      <>
        2016년 삼등항해사로 시작해 2025년 4월 선장이 되기까지 10년이 걸렸습니다. 계급별 승선 기록은{" "}
        <Link href="/about#log" style={{ color: "var(--sea-bright)" }}>
          항해 일지
        </Link>
        에서 볼 수 있습니다.
      </>
    ),
  },
  {
    question: "책은 어떤 순서로 읽으면 좋을까요?",
    answer:
      "출간 순서대로 『나는 스물일곱, 2등 항해사입니다』 → 『오진다 오력』 → 『해운 무역의 리더 항해사』 순으로 읽으면 커리어의 흐름을 따라갈 수 있습니다.",
  },
  {
    question: "답변은 언제쯤 달리나요?",
    answer:
      "6개월 승선 / 1개월 휴가 주기로 근무하고 있어, 승선 중에는 답변이 늦어질 수 있습니다. 휴가 기간에 모아서 답변하는 경우가 많습니다. 답변은 게시판에 달리고, 가입하신 이메일로 답장을 보내 드리기도 합니다.",
  },
  {
    question: "비공개 질문은 누가 볼 수 있나요?",
    answer:
      "비공개 질문은 작성한 본인과 김승주 선장만 볼 수 있습니다. 목록에는 ‘비공개 질문입니다’라는 자리만 표시되고 제목과 내용은 가려집니다.",
  },
];

function listHref(category: string | null, page: number) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/mentor?${query}` : "/mentor";
}

export default async function MentorPage({ searchParams }: PageProps<"/mentor">) {
  const params = await searchParams;
  const category = isCategory(params.category) ? params.category : null;
  const page = Math.max(1, Number(params.page) || 1);

  const enabled = Boolean(supabaseAdmin);
  const viewer = await getViewer();
  const { rows, total, failed: loadFailed } = await listQuestions(viewer, category, page);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <>
      <section className="section sea-texture" style={{ paddingTop: 56 }}>
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">NAVIGATION CONSULTATION</div>
            <h2 className="section-title">항해 상담실</h2>
            <p className="section-sub">
              항해사의 일, 해양대 진학, 승선 생활까지 궁금한 것을 남겨 주세요. 김승주 선장이 승선 일정 사이사이
              직접 답변합니다. 남에게 보이기 싫은 고민은 비공개로 올릴 수 있고, 답장은 가입하신 이메일로도 보내
              드립니다.
            </p>
          </div>

          {enabled && (
            <div className="board-panel board-write">
              {viewer ? (
                <>
                  <BoardViewerBar viewer={viewer} />
                  <QuestionForm nickname={viewer.nickname} email={viewer.email} defaultGender={viewer.gender} />
                </>
              ) : (
                <AuthForm />
              )}
            </div>
          )}

          <div className="board-panel">
            <h3 className="board-heading">올라온 질문</h3>

            <nav className="board-tabs" aria-label="질문 분류">
              <Link href={listHref(null, 1)} aria-current={category === null ? "page" : undefined}>
                전체
              </Link>
              {Object.entries(CATEGORIES).map(([key, label]) => (
                <Link key={key} href={listHref(key, 1)} aria-current={category === key ? "page" : undefined}>
                  {label}
                </Link>
              ))}
            </nav>

            {!enabled ? (
              <p className="board-empty">게시판을 준비하고 있어요. 조금만 기다려 주세요.</p>
            ) : loadFailed ? (
              <p className="board-empty">질문 목록을 불러오지 못했어요. 잠시 후 새로고침해 주세요.</p>
            ) : rows.length === 0 ? (
              <p className="board-empty">아직 올라온 질문이 없어요. 첫 질문을 남겨 주세요.</p>
            ) : (
              <ol className="board-list">
                {rows.map((row) => (
                  <li key={row.id} className="board-row">
                    <span className="board-cat">{CATEGORIES[row.category]}</span>
                    <span className="board-title">
                      {row.title === null ? (
                        <span className="board-locked">
                          <span aria-hidden="true">🔒 </span>비공개 질문입니다
                        </span>
                      ) : (
                        <Link href={`/mentor/${row.id}`}>
                          {row.visibility === "private" && (
                            <span className="board-lock" aria-label="비공개">
                              🔒
                            </span>
                          )}
                          {row.title}
                        </Link>
                      )}
                      {row.is_mine && <span className="board-mine">내 질문</span>}
                    </span>
                    <span className="board-meta">
                      <span>{row.nickname}</span>
                      <span>{formatDate(row.created_at)}</span>
                      <span>조회 {row.view_count}</span>
                    </span>
                    <span className={`board-state${row.status === "answered" ? " is-answered" : ""}`}>
                      {row.status === "answered" ? "답변 완료" : "답변 대기"}
                    </span>
                  </li>
                ))}
              </ol>
            )}

            {totalPages > 1 && (
              <nav className="board-pages" aria-label="페이지">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <Link key={n} href={listHref(category, n)} aria-current={n === page ? "page" : undefined}>
                    {n}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">FAQ</div>
            <h2 className="section-title">자주 묻는 질문</h2>
          </div>
          <FaqList items={FAQ} />
        </div>
      </section>
    </>
  );
}
