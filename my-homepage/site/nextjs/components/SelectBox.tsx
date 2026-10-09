"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

interface Props {
  id: string;
  /** 넘기면 숨김 input으로 폼 전송에 함께 실린다. */
  name?: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
}

// 브라우저 기본 select 대신 쓰는 선택 상자. 펼친 목록의 모양을 사이트 톤에 맞추려고 직접 그린다.
export default function SelectBox({ id, name, value, options, onChange }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === value));
  const [active, setActive] = useState(selectedIndex);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function openList() {
    setActive(selectedIndex);
    setOpen(true);
  }

  function choose(index: number) {
    onChange(options[index].value);
    setOpen(false);
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Escape") {
      if (open) e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "Tab") {
      setOpen(false);
      return;
    }
    const last = options.length - 1;
    const moves: Record<string, number> = {
      ArrowDown: Math.min(last, active + 1),
      ArrowUp: Math.max(0, active - 1),
      Home: 0,
      End: last,
    };
    if (e.key in moves) {
      e.preventDefault();
      if (open) setActive(moves[e.key]);
      else openList();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (open) choose(active);
      else openList();
    }
  }

  return (
    <div className="pop-field" ref={rootRef}>
      {name && <input type="hidden" name={name} value={value} />}
      <button
        type="button"
        id={id}
        className="pop-trigger"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span>{options[selectedIndex]?.label}</span>
        <svg className="pop-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className="pop-panel select-panel" id={`${id}-list`} role="listbox" aria-labelledby={id}>
          {options.map((option, index) => (
            <div
              key={option.value}
              id={`${id}-opt-${index}`}
              className={`select-option${index === active ? " is-active" : ""}`}
              role="option"
              aria-selected={index === selectedIndex}
              onPointerEnter={() => setActive(index)}
              onClick={() => choose(index)}
            >
              {option.label}
              {index === selectedIndex && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                </svg>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
