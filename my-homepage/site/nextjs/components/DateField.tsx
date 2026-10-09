"use client";

import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";
import { ko } from "react-day-picker/locale";

import "react-day-picker/style.css";

interface Props {
  id: string;
  /** 넘기면 폼 전송에 YYYY-MM-DD 값이 함께 실린다. */
  name?: string;
  /** YYYY-MM-DD, 비어 있으면 미선택 */
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  /** future: 오늘 이후만 고르는 일정용, birth: 연·월을 바로 고르는 생년월일용 */
  variant?: "future" | "birth";
  /** 달력 머리띠에 적히는 이름 */
  title?: string;
  placeholder?: string;
}

const BIRTH_START = new Date(1900, 0);
// 고른 날짜가 머리띠에 찍히는 것을 보여 준 뒤 닫는다.
const CLOSE_DELAY = 260;

function parse(value: string): Date | undefined {
  const [y, m, d] = value.split("-").map(Number);
  return y && m && d ? new Date(y, m - 1, d) : undefined;
}

function format(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// 브라우저 기본 date 입력 대신 쓰는 날짜 선택 칸. 달력은 react-day-picker로 그리고 항해 일지 톤으로 꾸민다.
export default function DateField({
  id,
  name,
  value,
  onChange,
  required,
  variant = "future",
  title = "날짜",
  placeholder = "날짜 선택",
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [open, setOpen] = useState(false);
  const selected = parse(value);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      clearTimeout(closeTimer.current);
    };
  }, [open]);

  function pick(date: Date) {
    onChange(format(date));
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => {
      setOpen(false);
      triggerRef.current?.focus();
    }, CLOSE_DELAY);
  }

  const today = new Date();
  const isBirth = variant === "birth";

  return (
    <div className="pop-field date-field" ref={rootRef}>
      {/* 값 전송과 required 검사를 브라우저에 맡기기 위한 입력. 화면에는 보이지 않는다. */}
      {(name || required) && (
        <input
          className="pop-native"
          type="text"
          name={name}
          value={value}
          required={required}
          tabIndex={-1}
          aria-hidden="true"
          onChange={() => {}}
          onFocus={() => triggerRef.current?.focus()}
        />
      )}
      <button
        type="button"
        id={id}
        ref={triggerRef}
        className={`pop-trigger${selected ? "" : " is-empty"}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          {selected
            ? selected.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
            : placeholder}
        </span>
        <svg className="pop-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <rect x="3.5" y="5" width="17" height="15.5" rx="2" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
      </button>
      {open && (
        <div className="pop-panel date-panel" role="dialog" aria-label={`${title} 선택`}>
          <div className="date-head">
            <span className="date-head-eyebrow">
              {title}
              {selected && <b>{selected.getFullYear()}</b>}
            </span>
            {/* key를 바꿔 날짜가 바뀔 때마다 등장 애니메이션이 다시 돈다. */}
            <strong key={value}>
              {selected
                ? selected.toLocaleDateString("ko-KR", { month: "long", day: "numeric", weekday: "long" })
                : "날짜를 골라 주세요"}
            </strong>
          </div>
          <div className="date-body">
            <DayPicker
              mode="single"
              locale={ko}
              autoFocus
              animate
              showOutsideDays
              fixedWeeks
              selected={selected}
              defaultMonth={selected}
              onSelect={(date) => date && pick(date)}
              captionLayout={isBirth ? "dropdown" : "label"}
              startMonth={isBirth ? BIRTH_START : today}
              endMonth={isBirth ? today : undefined}
              disabled={isBirth ? { after: today } : { before: today }}
              modifiers={{ sunday: { dayOfWeek: [0] }, saturday: { dayOfWeek: [6] } }}
              modifiersClassNames={{ sunday: "is-sun", saturday: "is-sat" }}
            />
          </div>
          <div className="date-foot">
            <span className="date-legend">오늘</span>
            <span className="date-foot-actions">
              {!isBirth && (
                <button type="button" onClick={() => pick(today)}>
                  오늘로
                </button>
              )}
              {value && !required && (
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  지우기
                </button>
              )}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
