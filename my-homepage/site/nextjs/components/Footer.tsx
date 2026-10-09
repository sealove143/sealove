import { CHANNELS, ChannelIcon } from "@/components/Channels";

export default function Footer() {
  return (
    <footer>
      <div className="footer-inner">
        <span className="brand">김승주 항해록</span>
        <span>© 2025 Kim Seung-ju. 본 페이지는 팬·미디어 소통을 위한 개인 브랜딩 사이트입니다.</span>
        <nav className="footer-channels" aria-label="채널">
          {CHANNELS.map((channel) => (
            <a key={channel.href} href={channel.href} target="_blank" rel="noopener" aria-label={channel.name} title={channel.name}>
              <ChannelIcon icon={channel.icon} size={20} />
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
