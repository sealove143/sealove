"use client";

import gsap from "gsap";
import { useRef, useState, type ReactNode } from "react";

interface Props {
  items: { question: string; answer: ReactNode }[];
}

// 답변이 아래로 튕기며 펼쳐지는 아코디언. 높이가 살짝 넘쳤다가 제자리로 돌아오는 반동은 GSAP로 준다.
export default function FaqList({ items }: Props) {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const panels = useRef<(HTMLDivElement | null)[]>([]);

  function toggle(index: number) {
    const willOpen = !openIndexes.includes(index);
    setOpenIndexes((prev) => (willOpen ? [...prev, index] : prev.filter((i) => i !== index)));

    const panel = panels.current[index];
    const text = panel?.firstElementChild;
    if (!panel || !text) return;
    gsap.killTweensOf([panel, text]);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(panel, { height: willOpen ? "auto" : 0 });
      gsap.set(text, { y: 0, opacity: 1 });
      return;
    }
    if (willOpen) {
      gsap.to(panel, { height: "auto", duration: 1.1, ease: "elastic.out(1, 0.5)" });
      gsap.fromTo(text, { y: -26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75, delay: 0.06, ease: "back.out(2.4)" });
    } else {
      gsap.to(text, { y: -10, opacity: 0, duration: 0.25, ease: "power2.in" });
      gsap.to(panel, { height: 0, duration: 0.5, ease: "back.in(1.4)" });
    }
  }

  return (
    <div className="faq-list">
      {items.map((item, index) => {
        const isOpen = openIndexes.includes(index);
        return (
          <div key={item.question} className={`faq-item${isOpen ? " is-open" : ""}`}>
            <h3>
              <button type="button" id={`faq-q-${index}`} aria-expanded={isOpen} aria-controls={`faq-a-${index}`} onClick={() => toggle(index)}>
                <span className="faq-question">{item.question}</span>
                <span className="faq-mark" aria-hidden="true" />
              </button>
            </h3>
            <div
              className="faq-answer"
              id={`faq-a-${index}`}
              role="region"
              aria-labelledby={`faq-q-${index}`}
              inert={!isOpen}
              ref={(el) => {
                panels.current[index] = el;
              }}
            >
              <p>{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
