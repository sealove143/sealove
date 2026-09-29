import type { Metadata } from "next";
import Image from "next/image";

import BridgeWatermark from "@/components/BridgeWatermark";

export const metadata: Metadata = {
  title: "저서·미디어",
  description: "김승주 선장이 쓴 세 권의 책과 방송·강연 출연, 유튜브·인스타그램·블로그 채널",
};

const BOOKS = [
  {
    title: "나는 스물일곱, 2등 항해사입니다",
    tag: "Essay · 1st Book",
    cover: { src: "/images/books/essay-27.jpg", width: 484, height: 717 },
    body: "이등항해사 시절, 바다 위에서 보낸 스물일곱의 하루하루를 담은 항해 에세이입니다. 당직과 항해 실무, 여성 항해사로서 마주한 순간들을 담담한 문장으로 기록했습니다.",
    link: {
      href: "https://search.shopping.naver.com/book/catalog/32441199358",
      label: "네이버 도서 ↗",
    },
  },
  {
    title: "오진다 오력",
    tag: "Self-development · 2nd Book",
    cover: { src: "/images/books/ojinda-oryeok.jpg", width: 1000, height: 1500 },
    body: "세상의 중심에 서는 다섯 가지 힘을 이야기하는 자기계발서입니다. 바다 위에서 얻은 경험을 바탕으로 누구나 자신의 자리에서 중심을 잡는 법을 이야기하며, 큰글자도서판으로도 출간되었습니다.",
    link: {
      href: "https://product.kyobobook.co.kr/detail/S000200818232",
      label: "교보문고 ↗",
    },
  },
  {
    title: "해운 무역의 리더 항해사",
    tag: "Career Guide · 3rd Book",
    cover: { src: "/images/books/navigator-leader.png", width: 228, height: 314 },
    body: "해양산업의 미래를 꿈꾸는 청소년을 위한 진로 지침서입니다. 해운·무역 현장의 실무를 항해사의 시선으로 안내하며, 청소년 진로 도서 시리즈 '미래탐색'의 한 권으로 출간되었습니다.",
    link: {
      href: "https://search.shopping.naver.com/book/catalog/55396542990",
      label: "네이버 도서 ↗",
    },
  },
];

// 썸네일은 각 영상의 대표 이미지를 public/images/media에 받아 둔 것이다.
const MEDIA = [
  {
    kind: "TV · tvN",
    title: "유 퀴즈 온 더 블럭",
    desc: "전 세계 0.1% 여성 항해사, 나의 항해 일지",
    href: "https://www.youtube.com/watch?v=yKflhdpaLaU&t=99s",
    thumb: { src: "/images/media/you-quiz.png", width: 368, height: 205 },
  },
  {
    kind: "Lecture · CBS",
    title: "세상을 바꾸는 시간, 15분 (세바시)",
    desc: "세계 0.1% 여성 항해사가 폭풍과 파도와 싸우는 법",
    href: "https://www.youtube.com/watch?v=F94N_IgMqsE",
    thumb: { src: "/images/media/sebasi.png", width: 344, height: 193 },
  },
  {
    kind: "TV · KBS",
    title: "KBS 아침마당",
    desc: "진로·직업 특집 코너 출연",
    href: "https://www.youtube.com/watch?v=7P7Tv-PoHx0&t=67s",
    thumb: { src: "/images/media/achim-madang.jpg", width: 364, height: 217 },
  },
  {
    kind: "Interview · 여성조선",
    title: "공식 밖의 여자들 — 김승주 선장 인터뷰",
    desc: "파도와 '맞짱' 뜨는 승부사, 11년 차 항해사가 선장이 되기까지",
    href: "https://www.youtube.com/watch?v=mgaMCO5QVNM",
    thumb: { src: "/images/media/woman-chosun.png", width: 818, height: 454 },
  },
  {
    kind: "Interview · 샐리의 마린잡",
    title: "국내 최초 여성 선장 룸 투어",
    desc: "선교와 선장실을 직접 소개하는 샐리의 마린잡 인터뷰",
    href: "https://www.youtube.com/watch?v=vBOW1hQC8OY&t=32s",
    thumb: { src: "/images/media/sally-marine-job.png", width: 817, height: 453 },
  },
];

export default function BooksPage() {
  return (
    <div className="voyage-page">
      <BridgeWatermark />

      <section className="section" style={{ paddingTop: 56 }}>
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">BOOKS</div>
            <h2 className="section-title">저서</h2>
            <p className="section-sub">
              2등항해사 시절의 기록을 담은 에세이로 시작해, 자신을 지키는 다섯 가지 힘을 이야기하는 자기계발서를
              거쳐, 다음 세대 항해사를 위한 진로 지침서로 이어집니다. 바다에서 쌓은 경험이 점점 더 많은 사람을
              향하는 흐름입니다.
            </p>
          </div>

          <div>
            {BOOKS.map((book) => (
              <div key={book.title} className="book-feature">
                <div className="book-cover-img">
                  <Image
                    src={book.cover.src}
                    alt={`『${book.title}』 표지`}
                    width={book.cover.width}
                    height={book.cover.height}
                    sizes="(max-width: 700px) 60vw, 200px"
                  />
                </div>
                <div>
                  <div className="book-tag">{book.tag}</div>
                  <h3>{book.title}</h3>
                  <p>{book.body}</p>
                  <a className="book-link" href={book.link.href} target="_blank" rel="noopener">
                    {book.link.label}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="media" className="section sea-texture">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">ON AIR</div>
            <h2 className="section-title">미디어 &amp; 강연</h2>
            <p className="section-sub">방송과 인터뷰에서는 여성 항해사로 살아가는 이야기를, 강연에서는 해양산업 진로를 나눕니다.</p>
          </div>
          <div className="media-list">
            {MEDIA.map((m) => (
              <a key={m.href} className="media-row" href={m.href} target="_blank" rel="noopener">
                <div className="media-thumb">
                  <Image
                    src={m.thumb.src}
                    alt={`${m.title} 영상 썸네일`}
                    width={m.thumb.width}
                    height={m.thumb.height}
                    sizes="(max-width: 700px) 40vw, 220px"
                  />
                  <span className="media-play" aria-hidden="true">
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" fill="currentColor" />
                    </svg>
                  </span>
                </div>
                <div className="media-info">
                  <div className="media-kind">{m.kind}</div>
                  <div className="media-title">{m.title}</div>
                  <div className="media-desc">{m.desc}</div>
                </div>
                <span className="media-link">다시보기 ↗</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="channels" className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">CHANNELS</div>
            <h2 className="section-title">채널에서 더 만나기</h2>
            <p className="section-sub">승선 중의 일상과 항해 기록을 조금 더 가까이에서 나눕니다.</p>
          </div>
          <div className="social-grid">
            <a className="social-card" href="https://www.youtube.com/channel/UCIrObaBJ-x-XQ406oOEx8ug" target="_blank" rel="noopener">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="2" y="5" width="20" height="14" rx="3" />
                <path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
              </svg>
              <span>
                <b>유튜브</b>
                <small>꿈꾸는 항해사 채널 바로가기</small>
              </span>
            </a>
            <a className="social-card" href="https://www.instagram.com/sealove_ksj" target="_blank" rel="noopener">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <rect x="3" y="3" width="18" height="18" rx="5" />
                <circle cx="12" cy="12" r="4" />
                <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
              </svg>
              <span>
                <b>인스타그램</b>
                <small>@sealove_ksj</small>
              </span>
            </a>
            <a className="social-card" href="https://blog.naver.com/powertmdwn" target="_blank" rel="noopener">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M4 19h16M4 15l5-5 3 3 6-6" />
              </svg>
              <span>
                <b>블로그</b>
                <small>항해 기록 &amp; 진로 이야기</small>
              </span>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
