import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'

const linkStyle = { color: 'var(--sea-bright)', textDecoration: 'underline' }

export default function Career() {
  usePageMeta(
    '항해 일지 | 김승주 항해록',
    '삼등항해사부터 선장까지, 김승주 선장의 9년 승선 기록',
  )

  return (
    <section className="section sea-texture" style={{ paddingTop: 56 }}>
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">SHIP'S LOG</div>
          <h2 className="section-title">항해 일지 — 승선 기록</h2>
          <p className="section-sub">
            계급장의 줄 수는 실제 상선 항해사 계급을 따릅니다 — 삼등항해사 1줄, 일등항해사 3줄, 선장 4줄. 자세한
            계급 체계는 오른쪽 안내를 참고하세요.
          </p>
        </div>

        <div className="career-grid">
          <div className="logbook">
            <div className="log-entry">
              <div className="log-date">2016.02<b>첫 승선</b></div>
              <div className="log-body">
                <h3>삼등항해사로 첫 항해</h3>
                <p>
                  한국해양대학교 해사수송과학부 졸업 후 삼등항해사로 첫 승선. 갑판 당직과 항해 실무를 처음부터
                  익히며 항해사로서의 경력을 시작했습니다. 당시 승선 회사 소속 항해사 500명 중 여성은 단 3명뿐,
                  흔치 않은 환경에서 시작한 커리어였습니다.
                </p>
                <div className="stripes" aria-hidden="true"><span></span><span className="stripe-off"></span><span className="stripe-off"></span><span className="stripe-off"></span></div>
              </div>
            </div>
            <div className="log-entry">
              <div className="log-date">2021.04–2023.12<b>지마린서비스</b></div>
              <div className="log-body">
                <h3>일등항해사</h3>
                <p>
                  2020년 1월 일등항해사로 승진한 뒤, 현대자동차 계열 지마린서비스에서 근무를 이어갔습니다.
                  십만 톤급 이상의 선박을 운항하며 하급 사관들을 지휘하는 경험을 쌓았습니다.
                </p>
                <div className="stripes" aria-hidden="true"><span></span><span></span><span></span><span className="stripe-off"></span></div>
              </div>
            </div>
            <div className="log-entry">
              <div className="log-date">2024.06–2025.04<b>코리아쉽메니져스</b></div>
              <div className="log-body">
                <h3>일등항해사</h3>
                <p>
                  코리아쉽메니져스로 이적해 일등항해사로 승선. 선장 승격을 앞두고 선박 운항 전반을 총괄하는
                  역할을 맡으며 다음 계급을 준비했습니다.
                </p>
                <div className="stripes" aria-hidden="true"><span></span><span></span><span></span><span className="stripe-off"></span></div>
              </div>
            </div>
            <div className="log-entry">
              <div className="log-date">2025.04–현재<b>코리아쉽메니져스</b></div>
              <div className="log-body">
                <h3>선장 (Master)</h3>
                <p>
                  2025년 4월, 코리아쉽메니져스 소속 선장으로 승격했습니다. 삼등항해사로 시작한 지 9년 만에
                  선박의 최종 책임자가 되었습니다. 커리어의 배경 이야기는{' '}
                  <Link to="/about" style={linkStyle}>프로필</Link>에서 볼 수 있습니다.
                </p>
                <div className="stripes" aria-hidden="true"><span></span><span></span><span></span><span></span></div>
              </div>
            </div>
          </div>

          <aside className="career-aside">
            <div className="aside-card">
              <h3>계급장 안내</h3>
              <div className="rank-row"><div className="stripes"><span></span><span className="stripe-off"></span><span className="stripe-off"></span><span className="stripe-off"></span></div>삼등항해사</div>
              <div className="rank-row"><div className="stripes"><span></span><span></span><span className="stripe-off"></span><span className="stripe-off"></span></div>이등항해사</div>
              <div className="rank-row"><div className="stripes"><span></span><span></span><span></span><span className="stripe-off"></span></div>일등항해사</div>
              <div className="rank-row"><div className="stripes"><span></span><span></span><span></span><span></span></div>선장 (Master)</div>
              <p className="note">상선 항해사 계급은 소매의 금줄 수로 구분됩니다. 줄이 많을수록 높은 직급입니다.</p>
            </div>
            <div className="aside-card">
              <h3>주요 항로</h3>
              <ul className="route-list">
                <li><span>부산</span><span>출항</span></li>
                <li><span>광양</span><span>기항</span></li>
                <li><span>홍콩</span><span>기항</span></li>
                <li><span>베트남</span><span>기항</span></li>
                <li><span>태국</span><span>기항</span></li>
                <li><span>부산</span><span>귀항</span></li>
              </ul>
              <p className="note">6개월 승선 / 1개월 휴가를 반복하는 컨테이너선 항로입니다.</p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
