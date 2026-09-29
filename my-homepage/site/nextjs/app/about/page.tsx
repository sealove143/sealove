import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";

import BridgeWatermark from "@/components/BridgeWatermark";

export const metadata: Metadata = {
  title: "프로필·항해 일지",
  description: "김승주 선장의 성장 배경과 커리어 서사, 삼등항해사부터 선장까지 11년 승선 기록",
};

const linkStyle: CSSProperties = { color: "var(--sea-bright)", textDecoration: "underline" };

type Rank = 1 | 2 | 3 | 4;

const LOG: { date: string; place: string; title: string; body: string; rank: Rank }[] = [
  {
    date: "2016.02",
    place: "첫 승선",
    title: "삼등항해사로 첫 항해",
    body: "한국해양대학교 해사수송과학부 졸업 후 삼등항해사로 첫 승선. 갑판 당직과 항해 실무를 처음부터 익히며 항해사로서의 경력을 시작했습니다. 당시 승선 회사 소속 항해사 500명 중 여성은 단 3명뿐, 흔치 않은 환경에서 시작한 커리어였습니다.",
    rank: 1,
  },
  {
    date: "2021.04–2023.12",
    place: "지마린서비스",
    title: "일등항해사",
    body: "2020년 1월 일등항해사로 승진한 뒤, 현대자동차 계열 지마린서비스에서 근무를 이어갔습니다. 십만 톤급 이상의 선박을 운항하며 하급 사관들을 지휘하는 경험을 쌓았습니다.",
    rank: 3,
  },
  {
    date: "2024.06–2025.04",
    place: "코리아쉽메니져스",
    title: "일등항해사",
    body: "코리아쉽메니져스로 이적해 일등항해사로 승선. 선장 승격을 앞두고 선박 운항 전반을 총괄하는 역할을 맡으며 다음 계급을 준비했습니다.",
    rank: 3,
  },
  {
    date: "2025.04–현재",
    place: "코리아쉽메니져스",
    title: "선장 (Master)",
    body: "2025년 4월, 코리아쉽메니져스 소속 선장으로 승격했습니다. 삼등항해사로 시작한 지 10년 만에 선박의 최종 책임자가 되었습니다.",
    rank: 4,
  },
];

const RANKS: { rank: Rank; label: string }[] = [
  { rank: 1, label: "삼등항해사" },
  { rank: 2, label: "이등항해사" },
  { rank: 3, label: "일등항해사" },
  { rank: 4, label: "선장 (Master)" },
];

const ROUTE = [
  ["부산", "출항"],
  ["광양", "기항"],
  ["홍콩", "기항"],
  ["베트남", "기항"],
  ["태국", "기항"],
  ["부산", "귀항"],
];

function Stripes({ rank, hidden }: { rank: Rank; hidden?: boolean }) {
  return (
    <div className="stripes" aria-hidden={hidden || undefined}>
      {[1, 2, 3, 4].map((n) => (
        <span key={n} className={n > rank ? "stripe-off" : undefined}></span>
      ))}
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="voyage-page">
      <BridgeWatermark />

      <section className="section" style={{ paddingTop: 56 }}>
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">PROFILE</div>
            <h2 className="section-title">여성 항해사 500명 중 3명, 그리고 선장</h2>
          </div>
          <div className="profile-grid">
            <div className="profile-text">
              <h3 style={{ fontSize: 18, marginBottom: 8 }}>바다를 선택하다</h3>
              <p>
                1993년 3월 19일 부산광역시에서 태어났습니다. 오빠가 한국해양대학교에 다니고 있었던 것이 자연스럽게
                진로에 영향을 주었고, 같은 학교 해사수송과학부에 진학했습니다. 입학 당시 동기 400명 중 여학생은 약
                60명이었습니다.
              </p>

              <h3 style={{ fontSize: 18, margin: "26px 0 8px" }}>3%의 항해사로</h3>
              <p>
                졸업 후 승선한 회사에서는 항해사 500명 중 여성이 단 3명뿐이었습니다. 흔치 않은 환경에서 2016년 2월
                삼등항해사로 첫 승선해 이등항해사를 거쳐 2020년 1월 일등항해사로 승진했습니다.
              </p>

              <h3 style={{ fontSize: 18, margin: "26px 0 8px" }}>삼등항해사에서 선장까지</h3>
              <p>
                부산·광양·홍콩·베트남·태국을 잇는 항로에서 6개월 승선, 1개월 휴가를 반복하며 컨테이너선의 갑판을
                지켰고, 2025년 4월 코리아쉽메니져스 소속 선장으로 승격했습니다. 승선 회사별 이력은 아래{" "}
                <a href="#log" style={linkStyle}>
                  항해 일지
                </a>
                에서 계급장과 함께 확인할 수 있습니다.
              </p>

              <h3 style={{ fontSize: 18, margin: "26px 0 8px" }}>기록하는 항해사</h3>
              <p>
                현장의 기록은 세 권의 책으로 남겼고, 진로 고민을 나누는 자리는 방송과 강연으로 이어지고 있습니다.{" "}
                <Link href="/books" style={linkStyle}>
                  저서
                </Link>
                와{" "}
                <Link href="/books#media" style={linkStyle}>
                  미디어 출연
                </Link>
                에서 더 볼 수 있고, 진로 고민은{" "}
                <Link href="/mentor" style={linkStyle}>
                  항해 상담실
                </Link>
                에서 나눌 수 있습니다.
              </p>
            </div>
            <div className="profile-side">
              <figure className="bridge-photo">
                <Image
                  src="/images/bridge.jpg"
                  alt="김승주 선장이 선교(브릿지)에서 항해 계기들과 함께 서 있는 모습"
                  fill
                  sizes="(max-width: 820px) 90vw, 380px"
                  style={{ objectFit: "cover" }}
                />
              </figure>
              <div className="bridge-caption">ON THE BRIDGE · 선교에서</div>
              <div className="seaman-card mono">
                <div className="seaman-photo">
                  <Image src="/images/portrait-1.jpg" alt="김승주 선장 증명사진" fill sizes="72px" style={{ objectFit: "cover" }} />
                </div>
                <dl>
                  <dt>NAME</dt>
                  <dd style={{ fontFamily: "var(--font-body)" }}>김승주</dd>
                  <dt>BORN</dt>
                  <dd>1993.03.19 · 부산광역시</dd>
                  <dt>EDUCATION</dt>
                  <dd style={{ fontFamily: "var(--font-body)" }}>한국해양대학교 해사수송과학부 학사</dd>
                  <dt>COMPANY</dt>
                  <dd style={{ fontFamily: "var(--font-body)" }}>코리아쉽메니져스</dd>
                  <dt>RANK</dt>
                  <dd style={{ fontFamily: "var(--font-body)" }}>선장 (Master Mariner)</dd>
                  <dt>SINCE</dt>
                  <dd>2025.04</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="log" className="section sea-texture">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">SHIP&apos;S LOG</div>
            <h2 className="section-title">항해 일지 — 승선 기록</h2>
            <p className="section-sub">
              계급장의 줄 수는 실제 상선 항해사 계급을 따릅니다 — 삼등항해사 1줄, 일등항해사 3줄, 선장 4줄. 자세한
              계급 체계는 오른쪽 안내를 참고하세요.
            </p>
          </div>

          <div className="career-grid">
            <div className="logbook">
              {LOG.map((entry) => (
                <div key={entry.date} className="log-entry">
                  <div className="log-date">
                    {entry.date}
                    <b>{entry.place}</b>
                  </div>
                  <div className="log-body">
                    <h3>{entry.title}</h3>
                    <p>{entry.body}</p>
                    <Stripes rank={entry.rank} hidden />
                  </div>
                </div>
              ))}
            </div>

            <aside className="career-aside">
              <div className="aside-card">
                <h3>계급장 안내</h3>
                {RANKS.map(({ rank, label }) => (
                  <div key={rank} className="rank-row">
                    <Stripes rank={rank} />
                    {label}
                  </div>
                ))}
                <p className="note">상선 항해사 계급은 소매의 금줄 수로 구분됩니다. 줄이 많을수록 높은 직급입니다.</p>
              </div>
              <div className="aside-card">
                <h3>주요 항로</h3>
                <ul className="route-list">
                  {ROUTE.map(([port, kind], i) => (
                    <li key={i}>
                      <span>{port}</span>
                      <span>{kind}</span>
                    </li>
                  ))}
                </ul>
                <p className="note">6개월 승선 / 1개월 휴가를 반복하는 컨테이너선 항로입니다.</p>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
