import Link from "next/link";

import Prologue from "@/components/Prologue";

// 홈은 layout의 기본 타이틀을 그대로 쓴다.
// 구성: 별빛 프롤로그(이야기) → 방문 목적별 두 갈래 → 짧은 이력 요약.

const COURSES = [
  {
    key: "curious",
    audience: "FOR THE CURIOUS",
    title: "항해사가 궁금해서 왔어요",
    body: "항해사는 어떤 일을 하고, 어떻게 선장이 될까요? 해양대 지망생과 진로를 고민하는 분들을 위해 선장님이 직접 답하는 질문 게시판과 11년의 항해 일지를 준비했습니다.",
    main: { href: "/mentor", label: "항해 상담실로" },
    subs: [
      { href: "/about#log", label: "항해 일지" },
      { href: "/books", label: "진로서 『해운 무역의 리더 항해사』" },
    ],
    icon: (
      <svg className="course-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <circle cx="24" cy="24" r="20" />
        <circle cx="24" cy="24" r="14" opacity=".45" />
        <path d="M24 6 L27.5 24 L24 42 L20.5 24 Z" fill="currentColor" fillOpacity=".25" />
        <path d="M6 24 L24 21 L42 24 L24 27 Z" opacity=".6" />
      </svg>
    ),
  },
  {
    key: "booking",
    audience: "FOR PRODUCERS & ORGANIZERS",
    title: "섭외·협업 문의로 왔어요",
    body: "강연, 방송, 인터뷰 섭외를 기다립니다. 유 퀴즈 온 더 블럭, KBS 아침마당, CBS 세바시에서 전한 바다 이야기를 여러분의 무대에서도 나눕니다.",
    main: { href: "/contact", label: "섭외 문의하기" },
    subs: [
      { href: "/books#media", label: "방송·출연 이력" },
      { href: "/books", label: "저서 3권" },
      { href: "/about", label: "프로필" },
    ],
    icon: (
      <svg className="course-icon" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
        <rect x="17" y="5" width="14" height="24" rx="7" fill="currentColor" fillOpacity=".2" />
        <path d="M11 22 a13 13 0 0 0 26 0" />
        <path d="M24 35 V43 M17 43 H31" />
        <path d="M17 14 H22 M17 19 H22" opacity=".6" />
      </svg>
    ),
  },
];

const PROOF = [
  { value: "11년", label: "대양을 건넌 승선 경력" },
  { value: "1%", label: "전 세계 여성 항해사" },
  { value: "3권", label: "바다에서 쓴 책" },
  { value: "40회", label: "누적 강연 횟수" },
];

export default function HomePage() {
  return (
    <>
      <Prologue skipTo="crossroads" />

      <section className="crossroads" id="crossroads" aria-labelledby="crossroads-title">
        <div className="container">
          <div className="crossroads-head">
            <div className="eyebrow">CHOOSE YOUR COURSE</div>
            <h2 id="crossroads-title">어떤 항로로 오셨나요?</h2>
            <p>찾아오신 이유에 맞는 길로 안내해 드릴게요.</p>
          </div>
          <div className="course-grid">
            {COURSES.map((course) => (
              <article key={course.key} className="course-card">
                {course.icon}
                <p className="course-for">{course.audience}</p>
                <h3>{course.title}</h3>
                <p>{course.body}</p>
                <Link className="course-main" href={course.main.href}>
                  {course.main.label} <span className="arrow">→</span>
                </Link>
                <nav className="course-sub" aria-label={`${course.title} 관련 페이지`}>
                  {course.subs.map((sub) => (
                    <Link key={sub.href} href={sub.href}>
                      {sub.label}
                    </Link>
                  ))}
                </nav>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="home-proof" aria-label="이력 요약">
        <div className="container">
          <div className="proof-grid">
            {PROOF.map((item) => (
              <div key={item.value}>
                <b>{item.value}</b>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <p className="proof-media">유 퀴즈 온 더 블럭 · KBS 아침마당 · CBS 세바시</p>
        </div>
      </section>
    </>
  );
}
