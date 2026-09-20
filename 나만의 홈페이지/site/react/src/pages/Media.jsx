import usePageMeta from '../hooks/usePageMeta.js'

export default function Media() {
  usePageMeta(
    '미디어·채널 | 김승주 항해록',
    '김승주 선장의 방송·인터뷰 출연과 유튜브·인스타그램·블로그 채널',
  )

  return (
    <>
      <section className="section sea-texture" style={{ paddingTop: 56 }}>
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">ON AIR</div>
            <h2 className="section-title">미디어 &amp; 강연</h2>
            <p className="section-sub">방송과 인터뷰에서는 여성 항해사로 살아가는 이야기를, 강연에서는 해양산업 진로를 나눕니다.</p>
          </div>
          <div className="media-list">
            <div className="media-row">
              <div className="media-thumb">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" /></svg>
                <span>tvN</span>
              </div>
              <div className="media-kind">TV</div>
              <div className="media-info"><div className="media-title">유 퀴즈 온 더 블럭</div><div className="media-desc">여성 항해사의 삶과 커리어를 이야기하며 출연</div></div>
              <span className="media-link">방영분</span>
            </div>
            <div className="media-row">
              <div className="media-thumb">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" /></svg>
                <span>KBS</span>
              </div>
              <div className="media-kind">TV</div>
              <div className="media-info"><div className="media-title">KBS 아침마당</div><div className="media-desc">진로·직업 특집 코너 출연</div></div>
              <span className="media-link">방영분</span>
            </div>
            <div className="media-row">
              <div className="media-thumb">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 15a8 8 0 0116 0M7.5 15a4.5 4.5 0 019 0M12 15v5m-3 0h6" /></svg>
                <span>CBS</span>
              </div>
              <div className="media-kind">Radio</div>
              <div className="media-info"><div className="media-title">CBS 라디오</div><div className="media-desc">인터뷰 출연</div></div>
              <span className="media-link">다시듣기</span>
            </div>
            <div className="media-row">
              <div className="media-thumb">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="4" width="18" height="16" rx="1" /><path d="M3 9h18M7 4v5" /></svg>
                <span>경향</span>
              </div>
              <div className="media-kind">Interview</div>
              <div className="media-info"><div className="media-title">경향신문 [핀터뷰]</div><div className="media-desc">"나는 일등항해사입니다" — 93년생 항해사 인터뷰</div></div>
              <a className="media-link" href="https://www.khan.co.kr/article/202006251752001" target="_blank" rel="noopener">기사 보기 ↗</a>
            </div>
            <div className="media-row">
              <div className="media-thumb">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3v4M5 8l14 0M4 8l3 13h10l3-13" /></svg>
                <span>LIVE</span>
              </div>
              <div className="media-kind">Lecture</div>
              <div className="media-info"><div className="media-title">진로 강연 · 줌 특강</div><div className="media-desc">청소년·청년 대상 해양산업 진로 강연 다수 진행</div></div>
              <span className="media-link">문의 환영</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">CHANNELS</div>
            <h2 className="section-title">채널에서 더 만나기</h2>
            <p className="section-sub">승선 중의 일상과 항해 기록을 조금 더 가까이에서 나눕니다.</p>
          </div>
          <div className="social-grid">
            <a className="social-card" href="https://www.youtube.com/channel/UCIrObaBJ-x-XQ406oOEx8ug" target="_blank" rel="noopener">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" /></svg>
              <span><b>유튜브</b><small>꿈꾸는 항해사 채널 바로가기</small></span>
            </a>
            <a className="social-card" href="https://www.instagram.com/sealove_ksj" target="_blank" rel="noopener">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" /></svg>
              <span><b>인스타그램</b><small>@sealove_ksj</small></span>
            </a>
            <a className="social-card" href="https://blog.naver.com/powertmdwn" target="_blank" rel="noopener">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 19h16M4 15l5-5 3 3 6-6" /></svg>
              <span><b>블로그</b><small>항해 기록 &amp; 진로 이야기</small></span>
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
