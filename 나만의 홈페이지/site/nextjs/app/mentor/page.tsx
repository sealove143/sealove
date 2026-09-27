import type { Metadata } from "next";
import Link from "next/link";

import MentorChat from "@/components/MentorChat";

export const metadata: Metadata = {
  title: "항해 상담실",
  description: "김승주 선장의 실제 경력을 바탕으로 AI가 답하는 진로 상담, 그리고 자주 묻는 질문",
};

export default function MentorPage() {
  return (
    <>
      <section className="section sea-texture" style={{ paddingTop: 56 }}>
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">NAVIGATION CONSULTATION</div>
            <h2 className="section-title">항해 상담실</h2>
            <p className="section-sub">
              지금 상황을 몇 줄만 알려주시면, 김승주 선장의 실제 경력을 바탕으로 AI가 선장님을 대신해
              답해드립니다.
            </p>
          </div>
          <MentorChat />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">FAQ</div>
            <h2 className="section-title">자주 묻는 질문</h2>
          </div>
          <div className="faq-list">
            <details className="faq-item">
              <summary>어떻게 항해사가 되셨나요?</summary>
              <p>
                한국해양대학교 해사수송과학부를 졸업하고 2016년 2월 삼등항해사로 첫 승선했습니다. 오빠가 같은
                학교에 다니고 있었던 것이 진로에 자연스러운 영향을 주었습니다.
              </p>
            </details>
            <details className="faq-item">
              <summary>여성 항해사로 일하며 흔치 않았던 점은 무엇인가요?</summary>
              <p>
                승선 당시 회사 소속 항해사 500명 중 여성은 단 3명뿐이었습니다. 흔치 않은 환경이었지만
                삼등항해사부터 선장까지 모든 계급을 차례로 거쳤습니다.
              </p>
            </details>
            <details className="faq-item">
              <summary>선장이 되기까지 얼마나 걸렸나요?</summary>
              <p>
                2016년 삼등항해사로 시작해 2025년 4월 선장이 되기까지 10년이 걸렸습니다. 계급별 승선 기록은{" "}
                <Link href="/career" style={{ color: "var(--sea-bright)" }}>
                  항해 일지
                </Link>
                에서 볼 수 있습니다.
              </p>
            </details>
            <details className="faq-item">
              <summary>책은 어떤 순서로 읽으면 좋을까요?</summary>
              <p>
                출간 순서대로 『나는 스물일곱, 2등 항해사입니다』 → 『오진다 오력』 → 『해운 무역의 리더
                항해사』 순으로 읽으면 커리어의 흐름을 따라갈 수 있습니다.
              </p>
            </details>
            <details className="faq-item">
              <summary>이 AI 상담은 어떻게 작동하나요?</summary>
              <p>
                방문자가 남긴 상황을 바탕으로, 김승주 선장의 실제 경력 정보를 참고해 서버에서 Claude(AI)가
                답변을 생성합니다. 실제 선장님이 직접 작성한 답변은 아니며, 참고용으로만 활용해 주세요.
              </p>
            </details>
          </div>
        </div>
      </section>
    </>
  );
}
