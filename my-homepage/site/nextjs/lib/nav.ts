export interface NavItem {
  href: string;
  label: string;
}

export const NAV: NavItem[] = [
  { href: "/", label: "홈" },
  { href: "/about", label: "프로필" },
  { href: "/career", label: "항해 일지" },
  { href: "/books", label: "저서" },
  { href: "/media", label: "미디어·채널" },
  { href: "/mentor", label: "항해 상담실" },
  { href: "/contact", label: "섭외 문의" },
];
