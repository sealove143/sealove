"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { NAV } from "@/lib/nav";

export default function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPathname, setLastPathname] = useState(pathname);

  // 라우트가 바뀌면 모바일 메뉴를 자동으로 닫는다. (렌더링 중 상태 조정 —
  // React 공식 문서가 권장하는, effect 없이 prop 변화에 반응하는 패턴)
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setOpen(false);
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand" href="/">
          <span className="rank-dot" />
          김승주 항해록
        </Link>
        <nav className={`primary-nav${open ? " open" : ""}`} id="primaryNav">
          {NAV.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href} aria-current={isActive ? "page" : undefined}>
                {item.label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={open}
          aria-controls="primaryNav"
          aria-label="메뉴 열기"
          onClick={() => setOpen((prev) => !prev)}
        >
          ☰
        </button>
      </div>
    </header>
  );
}
