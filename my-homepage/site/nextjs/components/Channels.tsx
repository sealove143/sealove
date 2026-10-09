export const CHANNELS = [
  {
    name: "유튜브",
    desc: "꿈꾸는 항해사 채널 바로가기",
    href: "https://www.youtube.com/channel/UCIrObaBJ-x-XQ406oOEx8ug",
    icon: (
      <>
        <rect x="2" y="5" width="20" height="14" rx="3" />
        <path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    name: "인스타그램",
    desc: "@sealove_ksj",
    href: "https://www.instagram.com/sealove_ksj",
    icon: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    name: "블로그",
    desc: "항해 기록 & 진로 이야기",
    href: "https://blog.naver.com/powertmdwn",
    icon: <path d="M4 19h16M4 15l5-5 3 3 6-6" />,
  },
];

export function ChannelIcon({ icon, size }: { icon: React.ReactNode; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      {icon}
    </svg>
  );
}

// 모든 페이지 아래쪽(푸터 바로 위)에 놓이는 채널 안내 구역.
export default function Channels() {
  return (
    <section id="channels" className="section channels-section" aria-labelledby="channels-title">
      <div className="container">
        <div className="section-head">
          <div className="eyebrow">CHANNELS</div>
          <h2 className="section-title" id="channels-title">
            채널에서 더 만나기
          </h2>
          <p className="section-sub">승선 중의 일상과 항해 기록을 조금 더 가까이에서 나눕니다.</p>
        </div>
        <div className="social-grid">
          {CHANNELS.map((channel) => (
            <a key={channel.href} className="social-card" href={channel.href} target="_blank" rel="noopener">
              <ChannelIcon icon={channel.icon} size={26} />
              <span>
                <b>{channel.name}</b>
                <small>{channel.desc}</small>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
