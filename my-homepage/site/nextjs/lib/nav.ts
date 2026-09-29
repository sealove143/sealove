export interface NavItem {
  href: string;
  label: string;
}

export const NAV: NavItem[] = [
  { href: "/", label: "홈" },
  { href: "/about", label: "프로필·항해 일지" },
  { href: "/books", label: "저서·미디어" },
  { href: "/mentor", label: "항해 상담실" },
  { href: "/contact", label: "섭외 문의" },
];
