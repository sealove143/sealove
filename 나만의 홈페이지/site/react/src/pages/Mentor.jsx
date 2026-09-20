import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import usePageMeta from '../hooks/usePageMeta.js'
import portrait2 from '../assets/portrait-2.jpg'

const PROFILE_FACTS = [
  '이름: 김승주 (선장, 1993.03.19 부산 출생)',
  '학력: 한국해양대학교 해사수송과학부 학사',
  '경력: 2016.02 삼등항해사로 첫 승선 → 이등항해사 → 2020.01 일등항해사 → 2021.04-2023.12 지마린서비스 일등항해사 → 2024.06-2025.04 코리아쉽메니져스 일등항해사 → 2025.04부터 코리아쉽메니져스 선장',
  '특이사항: 승선 회사 항해사 500명 중 여성은 단 3명뿐인 환경에서 커리어를 쌓음',
  '저서: 『나는 스물일곱, 2등 항해사입니다』, 『해운 무역의 리더 항해사』(청소년 진로 지침서), 『오진다 오력』(자기계발서)',
  '방송: 유 퀴즈 온 더 블럭, KBS 아침마당, CBS 라디오 출연',
].join('\n- ')

function errorCopy(code) {
  switch (code) {
    case 'not_granted': return '이 기능을 사용하려면 동의가 필요해요. 다시 시도해 주세요.'
    case 'rate_limited': return '지금 요청이 많아요. 잠시 후 다시 시도해 주세요.'
    case 'sampling_disabled': return '현재 계정에서는 AI 상담 기능을 사용할 수 없어요.'
    case 'session_expired': return '로그인이 만료되었어요. 다시 로그인 후 시도해 주세요.'
    case 'refused': return '이 질문에는 답변하기 어려워요. 다른 방식으로 다시 물어봐 주세요.'
    case 'empty_completion': return '답변을 생성하지 못했어요. 조금 더 구체적으로 질문해 주세요.'
    case 'cancelled': return ''
    default: return '잠시 문제가 생겼어요. 다시 시도해 주세요.'
  }
}

let bubbleId = 0

export default function Mentor() {
  usePageMeta(
    '항해 상담실 | 김승주 항해록',
    '김승주 선장의 실제 경력을 바탕으로 AI가 답하는 진로 상담, 그리고 자주 묻는 질문',
  )

  const [messages, setMessages] = useState([])
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [intakeLocked, setIntakeLocked] = useState(false)
  const [mGender, setMGender] = useState('')
  const [mAge, setMAge] = useState('20대')
  const [mSituation, setMSituation] = useState('')

  const turnsRef = useRef(null)
  const sampleFnRef = useRef(null)
  const chatLogRef = useRef(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.claude && typeof window.claude.use === 'function') {
      window.claude.use('sample')
        .then((fn) => { sampleFnRef.current = fn })
        .catch(() => { sampleFnRef.current = null })
    }
  }, [])

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight
    }
  }, [messages])

  async function handleSubmit(e) {
    e.preventDefault()
    if (busy) return
    const question = chatInput.trim()
    if (!question) return

    if (!sampleFnRef.current) {
      setStatus('이 브라우저 환경에서는 AI 상담 기능을 사용할 수 없어요. 아래 FAQ를 참고해 주세요.')
      return
    }

    setBusy(true)
    setChatInput('')
    setMessages((prev) => [...prev, { id: ++bubbleId, role: 'user', text: question }])

    if (!turnsRef.current) {
      const instruction =
        '당신은 김승주 선장입니다. 실제 프로필:\n- ' + PROFILE_FACTS +
        '\n\n말투는 담백하고 다정하며, 바다 경험에서 우러나온 비유를 가끔 사용합니다. ' +
        '방문자의 배경: 성별(' + (mGender || '비공개') + '), 나이대(' + mAge + ')' +
        (mSituation ? ', 상황: ' + mSituation : '') +
        '\n\n방문자의 질문에 선배 항해사이자 작가로서 3~6문장으로 진심 어린 조언을 건네주세요. ' +
        '실제 경력(예: 500명 중 3명뿐인 여성 항해사, 삼등항해사부터 9년 만에 선장이 된 경험)을 자연스럽게 녹여 공감과 현실적인 조언을 함께 담고, 마지막에 짧은 응원 한마디로 마무리하세요.'
      turnsRef.current = [{ role: 'user', content: instruction + '\n\n질문: ' + question }]
      setIntakeLocked(true)
    } else {
      turnsRef.current.push({ role: 'user', content: question })
    }

    setStatus('선장님이 답변을 준비 중이에요…')
    const targetId = ++bubbleId
    setMessages((prev) => [...prev, { id: targetId, role: 'captain', text: '' }])
    let started = false

    try {
      const result = await sampleFnRef.current(turnsRef.current, {
        modelTier: 'default',
        cache: false,
        onText: (u) => {
          started = true
          setStatus('')
          setMessages((prev) => prev.map((m) => (m.id === targetId ? { ...m, text: u.text } : m)))
        },
      })
      turnsRef.current.push({ role: 'assistant', content: result.text })
      if (result.truncated) setStatus('답변이 길어서 일부만 표시됐어요.')
    } catch (err) {
      if (!started) {
        setMessages((prev) => prev.filter((m) => m.id !== targetId))
      } else if (err && err.text) {
        setMessages((prev) => prev.map((m) => (m.id === targetId ? { ...m, text: err.text } : m)))
      }
      setStatus(errorCopy(err && err.code))
      if (err && err.code !== 'refused' && turnsRef.current) turnsRef.current.pop()
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className="section sea-texture" style={{ paddingTop: 56 }}>
        <div className="container">
          <div className="section-head">
            <div className="eyebrow">NAVIGATION CONSULTATION</div>
            <h2 className="section-title">항해 상담실</h2>
            <p className="section-sub">
              지금 상황을 몇 줄만 알려주시면, 김승주 선장의 실제 경력을 바탕으로 AI가 선장님을 대신해
              답해드립니다. 방문자 본인의 Claude 계정 사용량이 사용되며, 첫 질문 시 사용 동의를 한 번 확인합니다.
            </p>
          </div>
          <div className="mentor-panel">
            <div className="mentor-header">
              <div className="mentor-avatar"><img src={portrait2} alt="김승주 선장" /></div>
              <div>
                <div className="mentor-header-name">김승주 선장과의 항해 상담</div>
                <div className="mentor-header-sub">AI가 실제 경력을 바탕으로 답변합니다</div>
              </div>
            </div>
            <div className="mentor-intake" id="mentorIntake" style={intakeLocked ? { opacity: 0.5 } : undefined}>
              <div className="field-row">
                <div>
                  <label htmlFor="mGender">성별 (선택)</label>
                  <select id="mGender" value={mGender} disabled={intakeLocked} onChange={(e) => setMGender(e.target.value)}>
                    <option value="">응답하지 않음</option>
                    <option value="여성">여성</option>
                    <option value="남성">남성</option>
                    <option value="기타">기타</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="mAge">나이대</label>
                  <select id="mAge" value={mAge} disabled={intakeLocked} onChange={(e) => setMAge(e.target.value)}>
                    <option value="10대">10대</option>
                    <option value="20대">20대</option>
                    <option value="30대">30대</option>
                    <option value="40대 이상">40대 이상</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="mSituation">지금 상황이나 고민을 들려주세요</label>
                <textarea
                  id="mSituation"
                  placeholder="예: 해양대 진학을 고민 중인데 여성으로서 잘 적응할 수 있을지 걱정돼요."
                  value={mSituation}
                  disabled={intakeLocked}
                  onChange={(e) => setMSituation(e.target.value)}
                />
              </div>
            </div>
            <div className="chat-log" id="chatLog" ref={chatLogRef}>
              {messages.map((m) => (
                <div key={m.id} className={`chat-bubble ${m.role === 'user' ? 'user' : 'captain'}`}>
                  {m.role !== 'user' && <b className="who">김승주 선장 (AI)</b>}
                  <span>{m.text}</span>
                </div>
              ))}
            </div>
            <div className="chat-status" id="chatStatus">{status}</div>
            <form className="chat-composer" id="chatForm" onSubmit={handleSubmit}>
              <textarea
                id="chatInput"
                placeholder="선장님께 질문을 남겨보세요"
                required
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
              />
              <button className="btn btn-primary" type="submit" id="chatSubmit" disabled={busy}>질문하기</button>
            </form>
            <div className="mentor-note">답변은 참고용 AI 상담이며, 실제 김승주 선장의 답변이 아닙니다. 진로에 대한 중요한 결정은 실제 상담·강연을 통해 확인해 주세요.</div>
          </div>
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
              <p>한국해양대학교 해사수송과학부를 졸업하고 2016년 2월 삼등항해사로 첫 승선했습니다. 오빠가 같은 학교에 다니고 있었던 것이 진로에 자연스러운 영향을 주었습니다.</p>
            </details>
            <details className="faq-item">
              <summary>여성 항해사로 일하며 흔치 않았던 점은 무엇인가요?</summary>
              <p>승선 당시 회사 소속 항해사 500명 중 여성은 단 3명뿐이었습니다. 흔치 않은 환경이었지만 삼등항해사부터 선장까지 모든 계급을 차례로 거쳤습니다.</p>
            </details>
            <details className="faq-item">
              <summary>선장이 되기까지 얼마나 걸렸나요?</summary>
              <p>
                2016년 삼등항해사로 시작해 2025년 4월 선장이 되기까지 9년이 걸렸습니다. 계급별 승선 기록은{' '}
                <Link to="/career" style={{ color: 'var(--sea-bright)' }}>항해 일지</Link>에서 볼 수 있습니다.
              </p>
            </details>
            <details className="faq-item">
              <summary>책은 어떤 순서로 읽으면 좋을까요?</summary>
              <p>출간 순서대로 『나는 스물일곱, 2등 항해사입니다』 → 『오진다 오력』 → 『해운 무역의 리더 항해사』 순으로 읽으면 커리어의 흐름을 따라갈 수 있습니다.</p>
            </details>
            <details className="faq-item">
              <summary>이 AI 상담은 어떻게 작동하나요?</summary>
              <p>방문자가 남긴 상황을 바탕으로, 김승주 선장의 실제 경력 정보를 참고해 AI가 답변을 생성합니다. 방문자 본인의 Claude 계정 사용량이 사용되며, 실제 선장님이 직접 작성한 답변은 아닙니다.</p>
            </details>
          </div>
        </div>
      </section>
    </>
  )
}
