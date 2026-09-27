import type { MetadataRoute } from "next";

// 배포 후 실제 도메인을 Vercel 환경변수 NEXT_PUBLIC_SITE_URL로 설정하면
// sitemap이 그 값을 사용하도록 되어 있다 (.env.local.example 참고).
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

const ROUTES = ["", "/about", "/career", "/books", "/media", "/mentor", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return ROUTES.map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified,
  }));
}
