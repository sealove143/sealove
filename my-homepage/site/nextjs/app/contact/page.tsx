import type { Metadata } from "next";

import ContactForm from "@/components/ContactForm";
import FaqList from "@/components/FaqList";

export const metadata: Metadata = {
  title: "섭외 문의",
  description: "김승주 선장 강연·방송 섭외 문의 — 연락처는 페이지에 공개되지 않습니다",
};

const FAQ = [
  {
    question: "어떤 주제로 강연이 가능한가요?",
    answer: "청소년·청년 대상 해양산업 진로 강연을 중심으로 진행합니다.",
  },
  {
    question: "온라인(줌) 강연도 가능한가요?",
    answer: "네, 오프라인 강연 외에 줌 특강 형태로도 다수 진행해왔습니다.",
  },
  {
    question: "방송·인터뷰 문의도 받으시나요?",
    answer: "네, 방송·인터뷰는 일정 확인 후 개별로 회신드립니다.",
  },
  {
    question: "회신은 얼마나 걸리나요?",
    answer:
      "승선 일정에 따라 회신이 다소 지연될 수 있습니다. 6개월 승선 / 1개월 휴가 주기로 근무하고 있어 휴가 기간에 확인이 더 원활합니다.",
  },
  {
    question: "연락처를 바로 알 수 있나요?",
    answer: "페이지에는 연락처를 공개하지 않습니다. 문의 폼을 제출하시면 남겨주신 연락처로만 회신드립니다.",
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="section" style={{ paddingTop: 56 }}>
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">CHARTER REQUEST</div>
            <h2 className="section-title">강연 · 방송 섭외 문의</h2>
            <p className="section-sub">목적과 희망 날짜를 남겨주시면 검토 후 회신드립니다. 연락처는 페이지에 공개되지 않습니다.</p>
          </div>
          <div className="contact-grid">
            <ContactForm />
            <div className="contact-side">
              <h3>섭외 전 확인해 주세요</h3>
              <ul>
                <li>강연은 청소년·청년 대상 해양산업 진로 강연을 중심으로 진행합니다.</li>
                <li>방송·인터뷰는 일정 확인 후 개별 회신드립니다.</li>
                <li>승선 일정에 따라 회신이 다소 지연될 수 있습니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section sea-texture">
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
