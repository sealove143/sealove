"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect, useRef } from "react";

import Starfield from "@/components/Starfield";
import { FINALE_START, OPENING_END, RANKS, SCENES } from "@/lib/prologueScenes";

gsap.registerPlugin(ScrollTrigger);

const OPENING_LINES = ["가장 어두운 바다에서,", "별은 가장 밝았다."];

export default function Prologue({ skipTo }: { skipTo: string }) {
  const rootRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = gsap.context(() => {
      // 오프닝 문장: 스크롤과 무관하게 첫 진입 때 한 글자씩 떠오른다.
      if (!reduceMotion) {
        gsap.from(".pl-opening .ch", {
          opacity: 0,
          y: 8,
          filter: "blur(6px)",
          duration: 1.1,
          ease: "power2.out",
          stagger: 0.06,
          delay: 0.4,
        });
        gsap.from(".pl-opening .pl-hint, .pl-skip", { opacity: 0, duration: 1.2, delay: 2.6 });
      }

      // 스크롤 진행도(0~1)에 맞춰 장면을 넘긴다. 타임라인 전체 길이를 1로 두어
      // 위치값이 곧 lib/prologueScenes의 start/end와 같도록 맞췄다.
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
          onUpdate: (self) => {
            progressRef.current = self.progress;
          },
        },
      });

      tl.to(".pl-opening", { opacity: 0, y: -30, duration: 0.04 }, OPENING_END - 0.04).fromTo(
        ".pl-rank",
        { opacity: 0 },
        { opacity: 1, duration: 0.03 },
        SCENES[0].start + 0.02,
      );

      // 연표의 불빛은 지금 계급 하나에만 켜지고, 계급이 오를 때마다 다음 줄로 옮겨 간다.
      let prevLabel = ".pl-rank-cadet";
      let prevStep = ".pl-step-cadet";
      for (const scene of SCENES) {
        const sel = `.pl-scene-${scene.key}`;
        tl.fromTo(sel, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.03 }, scene.start + 0.015).to(
          sel,
          { opacity: 0, y: -30, duration: 0.025 },
          scene.end - 0.035,
        );

        if (scene.rank !== undefined) {
          const r = scene.rank;
          const at = scene.start + 0.03;
          tl.to(prevLabel, { opacity: 0, duration: 0.015 }, at)
            .fromTo(`.pl-rank-l${r}`, { opacity: 0 }, { opacity: 1, duration: 0.015 }, at + 0.01)
            .fromTo(`.pl-stripe-${r}`, { scaleX: 0 }, { scaleX: 1, duration: 0.03, ease: "power2.out" }, at + 0.01)
            .to(prevStep, { opacity: 0.3, duration: 0.015 }, at)
            .fromTo(`.pl-step-${r}`, { opacity: 0.3 }, { opacity: 1, duration: 0.015 }, at + 0.01);
          prevLabel = `.pl-rank-l${r}`;
          prevStep = `.pl-step-${r}`;
        }
      }

      tl.to(".pl-skip", { autoAlpha: 0, duration: 0.02 }, FINALE_START)
        .fromTo(".pl-finale", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.04 }, FINALE_START + 0.02)
        .fromTo(".pl-board", { boxShadow: "0 0 0 rgba(240,213,143,0)" }, { boxShadow: "0 0 28px rgba(240,213,143,.35)", duration: 0.04 }, FINALE_START + 0.02)
        .set({}, {}, 1);
    }, root);

    return () => ctx.revert();
  }, []);

  const skip = () => {
    document.getElementById(skipTo)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section ref={rootRef} className="prologue" aria-label="김승주 선장의 이야기">
      <div className="pl-stage">
        <Starfield progressRef={progressRef} />
        <div className="pl-vignette" aria-hidden="true" />

        <div className="pl-opening">
          <p className="pl-kicker">PROLOGUE · 김승주 항해록</p>
          <p className="pl-title" aria-label={OPENING_LINES.join(" ")}>
            {OPENING_LINES.map((line) => (
              <span key={line} className="line" aria-hidden="true">
                {Array.from(line).map((ch, i) => (
                  <span key={i} className="ch">
                    {ch === " " ? " " : ch}
                  </span>
                ))}
              </span>
            ))}
          </p>
          <p className="pl-hint">SCROLL TO SET SAIL ↓</p>
        </div>

        {SCENES.map((scene) => (
          <article key={scene.key} className={`pl-scene pl-scene-${scene.key} is-${scene.placement}`}>
            <p className="pl-chapter">{scene.chapter}</p>
            <h2>{scene.title}</h2>
            <p>
              {scene.lines.map((line, i) => (
                <span key={i} className="line">
                  {line}
                </span>
              ))}
            </p>
          </article>
        ))}

        <div className="pl-finale">
          <p className="pl-kicker">MASTER MARINER · 코리아쉽메니져스</p>
          <h1 className="pl-name">김승주</h1>
          <p className="pl-finale-lede">가장 어두운 바다를 건너, 이제 다른 이의 항로를 비춥니다.</p>
          <p className="pl-hint">어떤 항로로 오셨나요? ↓</p>
        </div>

        <aside className="pl-rank" aria-label="계급 여정">
          <div className="pl-board" aria-hidden="true">
            {RANKS.map((r, i) => (
              <span key={r.year} className="pl-track">
                <span className={`pl-stripe pl-stripe-${i}`} />
              </span>
            ))}
          </div>
          <div className="pl-rank-label">
            <span className="pl-rank-cadet">해사 생도</span>
            {RANKS.map((r, i) => (
              <span key={r.year} className={`pl-rank-l${i}`}>
                {r.label}
              </span>
            ))}
          </div>
          <ol className="pl-steps">
            <li className="pl-step pl-step-cadet">
              <b>2012</b> 해사 생도
            </li>
            {RANKS.map((r, i) => (
              <li key={r.year} className={`pl-step pl-step-${i}`}>
                <b>{r.year}</b> {r.label}
              </li>
            ))}
          </ol>
        </aside>

        <button type="button" className="pl-skip" onClick={skip}>
          건너뛰기 ↓
        </button>
      </div>
    </section>
  );
}
