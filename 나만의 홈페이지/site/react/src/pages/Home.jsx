import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'
import heroImg from '../assets/hero.jpg'

const COMPASS_TICKS = Array.from({ length: 72 }, (_, i) => {
  const cx = 160
  const cy = 160
  const rOuter = 150
  const major = i % 18 === 0
  const rInner = major ? 136 : 143
  const angle = ((i * 5) * Math.PI) / 180

  return {
    key: i,
    x1: (cx + rOuter * Math.sin(angle)).toFixed(1),
    y1: (cy - rOuter * Math.cos(angle)).toFixed(1),
    x2: (cx + rInner * Math.sin(angle)).toFixed(1),
    y2: (cy - rInner * Math.cos(angle)).toFixed(1),
    strokeWidth: major ? '1.4' : '0.7',
  }
})

export default function Home() {
  usePageMeta(
    '김승주 항해록',
    '김승주 선장의 경력, 저서, 방송 출연을 소개하고 강연·섭외 문의를 받는 개인 브랜딩 홈페이지',
  )

  return (
    <>
      <section className="hero">
        <div className="hero-atmosphere" aria-hidden="true">
          <div className="hero-shimmer"></div>
          <div className="hero-swell"></div>
          <svg className="hero-ship" viewBox="0 0 140 60" aria-hidden="true">
            <path d="M6 42 L134 42 L120 54 L20 54 Z" fill="#eef4f6" opacity=".9" />
            <rect x="38" y="18" width="8" height="24" fill="#eef4f6" opacity=".9" />
            <rect x="60" y="10" width="8" height="32" fill="#eef4f6" opacity=".9" />
            <rect x="86" y="22" width="8" height="20" fill="#eef4f6" opacity=".9" />
            <line x1="60" y1="10" x2="60" y2="4" stroke="#eef4f6" strokeWidth="2" />
          </svg>
        </div>
        <div className="hero-inner">
          <div>
            <div className="hero-eyebrow">MASTER MARINER · 코리아쉽메니져스</div>
            <h1>김승주</h1>
            <p className="role">삼등항해사에서 선장까지 — 바다에서 쓴 9년의 항해기</p>
            <p className="lede">
              한국해양대학교 해사수송과학부를 졸업하고 2016년 삼등항해사로 첫 승선한 이래, 컨테이너선의 갑판을
              지키며 항해사의 모든 계급을 거쳐 2025년 4월 선장이 되었습니다. 바다에서 배운 것들을 책과 강연,
              방송으로 나눕니다.
            </p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to="/career">항해 일지 보기</Link>
              <Link className="btn btn-ghost" to="/mentor">항해 상담 받기</Link>
            </div>
            <dl className="readout">
              <div><span>CURRENT RANK</span><b>선장 (Master)</b></div>
              <div><span>VESSEL OPERATOR</span><b>코리아쉽메니져스</b></div>
              <div><span>SEA SERVICE</span><b>2016 – 현재</b></div>
            </dl>
          </div>
          <div className="hero-visual">
            <div className="hero-photo-frame" id="heroPhotoFrame">
              <img src={heroImg} alt="김승주 선장이 컨테이너선 갑판에서 수평선을 바라보며 서 있는 모습" />
              <div className="frame-fade" aria-hidden="true"></div>
              <div className="hero-photo-caption">AT SEA · Container Vessel Deck</div>
            </div>
            <div className="hero-compass-badge" aria-hidden="true">
              <svg className="compass" viewBox="0 0 320 320">
                <circle cx="160" cy="160" r="150" fill="none" stroke="#3f5f70" strokeWidth="1" />
                <circle cx="160" cy="160" r="118" fill="none" stroke="#33505f" strokeWidth="1" />
                <g stroke="#4c6d7d" strokeWidth="1">
                  {COMPASS_TICKS.map((t) => (
                    <line key={t.key} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} strokeWidth={t.strokeWidth} />
                  ))}
                </g>
                <text x="160" y="34" textAnchor="middle" fill="#e7eff1" fontFamily="IBM Plex Mono, monospace" fontSize="15" fontWeight="600">N</text>
                <text x="160" y="296" textAnchor="middle" fill="#7d95a1" fontFamily="IBM Plex Mono, monospace" fontSize="13">S</text>
                <text x="290" y="165" textAnchor="middle" fill="#7d95a1" fontFamily="IBM Plex Mono, monospace" fontSize="13">E</text>
                <text x="30" y="165" textAnchor="middle" fill="#7d95a1" fontFamily="IBM Plex Mono, monospace" fontSize="13">W</text>
                <g className="compass-needle">
                  <polygon points="160,52 170,160 160,150 150,160" fill="#c99a4f" />
                  <polygon points="160,268 170,160 160,170 150,160" fill="#3f5f70" />
                </g>
                <circle cx="160" cy="160" r="6" fill="#f2e6cf" />
              </svg>
            </div>
          </div>
        </div>
        <svg className="wave-divider" viewBox="0 0 1200 60" preserveAspectRatio="none">
          <path d="M0,32 C150,60 350,0 600,26 C850,52 1050,4 1200,30 L1200,60 L0,60 Z" fill="currentColor" />
        </svg>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">EXPLORE</div>
            <h2 className="section-title">항해록 둘러보기</h2>
            <p className="section-sub">프로필부터 섭외 문의까지, 필요한 페이지로 바로 이동하세요.</p>
          </div>
          <div className="dashboard-grid">
            <Link className="dashboard-card" to="/about">
              <div className="eyebrow">PROFILE</div>
              <h3>프로필</h3>
              <p>여성 항해사 500명 중 3명, 그리고 선장. 부산에서 나고 자라 한국해양대학교를 거쳐 오늘의 항로에 이르기까지.</p>
              <span className="card-link">자세히 보기 →</span>
            </Link>
            <Link className="dashboard-card" to="/career">
              <div className="eyebrow">SHIP'S LOG</div>
              <h3>항해 일지</h3>
              <p>삼등항해사부터 선장까지, 9년의 승선 기록을 계급장·항로와 함께 확인하세요.</p>
              <span className="card-link">자세히 보기 →</span>
            </Link>
            <Link className="dashboard-card" to="/books">
              <div className="eyebrow">BOOKS</div>
              <h3>저서</h3>
              <p>에세이부터 청소년 진로 지침서까지, 현장의 언어로 쓴 세 권의 기록.</p>
              <span className="card-link">자세히 보기 →</span>
            </Link>
            <Link className="dashboard-card" to="/media">
              <div className="eyebrow">ON AIR</div>
              <h3>미디어·채널</h3>
              <p>유 퀴즈 온 더 블럭부터 유튜브·블로그까지, 방송과 채널에서 만나는 이야기.</p>
              <span className="card-link">자세히 보기 →</span>
            </Link>
            <Link className="dashboard-card" to="/mentor">
              <div className="eyebrow">CONSULTATION</div>
              <h3>항해 상담실</h3>
              <p>지금 상황을 들려주시면, 실제 경력을 바탕으로 AI가 답해드립니다.</p>
              <span className="card-link">상담 받기 →</span>
            </Link>
            <Link className="dashboard-card" to="/contact">
              <div className="eyebrow">CHARTER REQUEST</div>
              <h3>섭외 문의</h3>
              <p>강연·방송 섭외는 이곳에서. 연락처는 페이지에 공개되지 않습니다.</p>
              <span className="card-link">문의하기 →</span>
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
