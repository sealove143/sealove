import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 항해 일지는 프로필에, 미디어·채널은 저서에 한 섹션으로 합쳤다. 예전 링크·검색 결과는 그 섹션으로 보낸다.
  async redirects() {
    return [
      { source: "/career", destination: "/about#log", permanent: true },
      { source: "/media", destination: "/books#media", permanent: true },
    ];
  },
};

export default nextConfig;
