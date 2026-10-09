"use client";

import { useEffect, useRef, useState } from "react";

import { CHANNELS, ChannelIcon } from "@/components/Channels";

const SHORT_NAMES: Record<string, string> = { 인스타그램: "인스타" };

// 스크롤을 따라오는 움직임: 스크롤하는 동안 살짝 끌려가 있다가, 멈추면 한 번 가볍게 넘쳤다 제자리에 선다.
const DRAG = 0.1; // 스크롤 1px당 끌려가는 거리(px)
const MAX_SHIFT = 12; // 가장 멀리 끌려가는 거리(px)
const STIFFNESS = 0.1; // 제자리로 당기는 힘
const DAMPING = 0.74; // 흔들림이 잦아드는 정도 (1에 가까울수록 오래 출렁인다)

// 화면 오른쪽에 붙어 스크롤을 따라다니는 세로 채널 배너.
// 좁은 화면에서는 본문을 가리지 않도록 둥근 버튼으로 접혀 있다가 누르면 펼쳐진다.
export default function ChannelRail() {
  const railRef = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let lastY = window.scrollY;
    let pull = 0; // 방금 스크롤이 배너를 끌어당긴 거리
    let shift = 0;
    let speed = 0;
    let frame = 0;

    function tick() {
      speed = (speed + (pull - shift) * STIFFNESS) * DAMPING;
      shift += speed;
      pull *= 0.82;
      rail!.style.setProperty("--rail-shift", `${shift.toFixed(2)}px`);
      const settled = Math.abs(shift) < 0.05 && Math.abs(speed) < 0.05 && Math.abs(pull) < 0.05;
      frame = settled ? 0 : requestAnimationFrame(tick);
    }

    function onScroll() {
      const y = window.scrollY;
      // 아래로 내리면 배너가 위로 끌려갔다가 뒤따라 내려온다.
      pull = Math.max(-MAX_SHIFT, Math.min(MAX_SHIFT, pull - (y - lastY) * DRAG));
      lastY = y;
      if (!frame) frame = requestAnimationFrame(tick);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <aside
      ref={railRef}
      className={`channel-rail${open ? " is-open" : ""}`}
      aria-label="채널 바로가기"
    >
      <div className="rail-body" id="channelRailBody">
        <span className="rail-title">채널에서 더 만나기</span>
        {CHANNELS.map((channel) => (
          <a key={channel.href} className="rail-link" href={channel.href} target="_blank" rel="noopener" aria-label={channel.name}>
            <ChannelIcon icon={channel.icon} size={22} />
            <span>{SHORT_NAMES[channel.name] ?? channel.name}</span>
          </a>
        ))}
      </div>
      <button type="button" className="rail-toggle" aria-expanded={open} aria-controls="channelRailBody" onClick={() => setOpen((v) => !v)}>
        {open ? "닫기" : "채널"}
      </button>
    </aside>
  );
}
