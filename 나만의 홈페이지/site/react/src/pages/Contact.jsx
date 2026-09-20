import { useState } from 'react'
import usePageMeta from '../hooks/usePageMeta.js'

const TO = 'powertmdwn@naver.com'

export default function Contact() {
  usePageMeta(
    '섭외 문의 | 김승주 항해록',
    '김승주 선장 강연·방송 섭외 문의 — 연락처는 페이지에 공개되지 않습니다',
  )

  const [cType, setCType] = useState('강연')
  const [cDate, setCDate] = useState('')
  const [cDetail, setCDetail] = useState('')
  const [cReply, setCReply] = useState('')
  const [fallbackVisible, setFallbackVisible] = useState(false)
  const [fallbackText, setFallbackText] = useState('')
  const [copyLabel, setCopyLabel] = useState('문의 내용 복사')

  function handleSubmit(e) {
    e.preventDefault()
    const detail = cDetail.trim()
    const reply = cReply.trim()
    if (!detail || !reply) return

    const date = cDate || '날짜 미정'
    const subject = `[${cType}] 김승주 선장 섭외 문의 (${date})`
    const body = `문의 종류: ${cType}\n희망 날짜: ${date}\n\n문의 내용:\n${detail}\n\n회신받을 연락처: ${reply}`

    window.location.href = `mailto:${TO}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

    setFallbackText(`받는 사람: ${TO}\n제목: ${subject}\n\n${body}`)
    setFallbackVisible(true)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(fallbackText)
      setCopyLabel('복사됨')
      setTimeout(() => setCopyLabel('문의 내용 복사'), 1800)
    } catch {
      // clipboard API unavailable; textarea is already selectable for manual copy
    }
  }

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
            <form className="contact-form" id="contactForm" onSubmit={handleSubmit}>
              <div className="field-row">
                <div>
                  <label htmlFor="cType">문의 종류</label>
                  <select id="cType" value={cType} onChange={(e) => setCType(e.target.value)}>
                    <option>강연</option>
                    <option>방송 출연</option>
                    <option>인터뷰</option>
                    <option>기타</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="cDate">희망 날짜</label>
                  <input type="date" id="cDate" value={cDate} onChange={(e) => setCDate(e.target.value)} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label htmlFor="cDetail">문의 내용</label>
                <textarea
                  id="cDetail"
                  placeholder="행사 취지, 대상, 장소, 예산 등을 알려주세요"
                  required
                  value={cDetail}
                  onChange={(e) => setCDetail(e.target.value)}
                />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label htmlFor="cReply">회신받을 연락처 (이메일 또는 전화)</label>
                <input
                  type="text"
                  id="cReply"
                  placeholder="example@email.com"
                  required
                  value={cReply}
                  onChange={(e) => setCReply(e.target.value)}
                />
              </div>
              <button className="btn btn-primary" type="submit">메일로 보내기</button>
              {fallbackVisible && (
                <div className="fallback" id="fallbackBox">
                  <div>메일 앱이 자동으로 열리지 않으면, 아래 내용을 복사해 직접 보내주세요.</div>
                  <textarea id="fallbackText" readOnly value={fallbackText} />
                  <div className="fallback-actions">
                    <button type="button" className="btn btn-ghost" id="copyFallback" onClick={handleCopy}>{copyLabel}</button>
                  </div>
                </div>
              )}
            </form>
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
          <div className="faq-list">
            <details className="faq-item">
              <summary>어떤 주제로 강연이 가능한가요?</summary>
              <p>청소년·청년 대상 해양산업 진로 강연을 중심으로 진행합니다.</p>
            </details>
            <details className="faq-item">
              <summary>온라인(줌) 강연도 가능한가요?</summary>
              <p>네, 오프라인 강연 외에 줌 특강 형태로도 다수 진행해왔습니다.</p>
            </details>
            <details className="faq-item">
              <summary>방송·인터뷰 문의도 받으시나요?</summary>
              <p>네, 방송·인터뷰는 일정 확인 후 개별로 회신드립니다.</p>
            </details>
            <details className="faq-item">
              <summary>회신은 얼마나 걸리나요?</summary>
              <p>승선 일정에 따라 회신이 다소 지연될 수 있습니다. 6개월 승선 / 1개월 휴가 주기로 근무하고 있어 휴가 기간에 확인이 더 원활합니다.</p>
            </details>
            <details className="faq-item">
              <summary>연락처를 바로 알 수 있나요?</summary>
              <p>페이지에는 연락처를 공개하지 않습니다. 문의 폼을 제출하시면 남겨주신 연락처로만 회신드립니다.</p>
            </details>
          </div>
        </div>
      </section>
    </>
  )
}
