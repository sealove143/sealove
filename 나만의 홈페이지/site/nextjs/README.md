# 김승주 항해록 — Next.js

`site/vanila`, `site/react`에 이어 만든 Next.js(App Router) 버전입니다. 자세한 마이그레이션
계획은 상위 폴더의 [`plan.md`](../../plan.md)를 참고하세요.

## 시작하기

```bash
npm install
cp .env.local.example .env.local   # ANTHROPIC_API_KEY 등을 채워 넣으세요
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 환경 변수

| 변수 | 필수 | 설명 |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | 항해 상담실(`/mentor`) AI 챗봇이 사용하는 Anthropic API 키. 없으면 상담 기능이 비활성화 메시지를 보여줍니다. |
| `ANTHROPIC_MODEL` | 선택 | 기본값 `claude-sonnet-5`. |
| `RESEND_API_KEY` | ✅ | 섭외 문의(`/contact`) 폼 메일 발송에 쓰는 Resend API 키. 없으면 폼이 발송 불가 메시지를 보여줍니다. |
| `CONTACT_TO_EMAIL` | 선택 | 문의 메일 수신 주소. 기본값 `powertmdwn351@gmail.com`. |
| `CONTACT_FROM_EMAIL` | 선택 | 발신 주소. 기본값 `onboarding@resend.dev` (도메인 인증 전에는 이 주소만 가능). |
| `NEXT_PUBLIC_SITE_URL` | 선택 | `sitemap.xml`/`robots.txt`에 사용할 실제 배포 도메인. |

## 페이지 구성

| 경로 | 설명 |
|---|---|
| `/` | 홈 (히어로, 대시보드 카드) |
| `/about` | 프로필 |
| `/career` | 항해 일지 |
| `/books` | 저서 |
| `/media` | 미디어·채널 |
| `/mentor` | 항해 상담실 (AI 챗봇, `app/api/mentor` 서버 연동) |
| `/contact` | 섭외 문의 (Resend 메일 발송, `app/api/contact` 서버 연동) |

## 항해 상담실 아키텍처

`components/MentorChat.tsx`(클라이언트)가 `/api/mentor`(서버, `app/api/mentor/route.ts`)로
전체 대화 이력과 방문자 배경 정보를 POST하면, 서버가 Anthropic API를 스트리밍으로 호출해
Server-Sent Events 형태로 텍스트 조각을 되돌려줍니다. 시스템 프롬프트는 `lib/profile.ts`에서
빌드되며, 이 파일은 `server-only`로 보호되어 클라이언트 번들에 절대 포함되지 않습니다.

남용 방지를 위해 `lib/rateLimit.ts`의 간단한 인메모리 IP rate limit(분당 6회), 질문 길이 제한
(500자), 세션당 질문 횟수 제한(6회)이 적용되어 있습니다. 트래픽이 늘어나면 Upstash Redis 등
외부 스토어 기반 rate limit으로 교체하는 것을 권장합니다.

## 빌드

```bash
npm run build
npm start
```

## 배포

Vercel에 `site/nextjs`를 프로젝트 루트로 지정해 배포하고, 프로젝트 환경변수에
`ANTHROPIC_API_KEY`·`RESEND_API_KEY`(필수)와 필요 시 `ANTHROPIC_MODEL`, `NEXT_PUBLIC_SITE_URL`을 등록하세요.

`npm run build`는 Turbopack 대신 Webpack(`next build --webpack`)을 쓴다. Vercel은 저장소 루트를
추적 기준으로 삼아 `나만의 홈페이지/…` 같은 한글 경로가 산출물 이름에 들어가는데, Next.js 16.3의
Turbopack이 이 경로를 바이트 단위로 자르다 패닉(`is not a char boundary`)을 일으키기 때문이다.
폴더 이름을 영문으로 바꾸거나 Turbopack 버그가 고쳐지면 `--webpack`을 빼도 된다.
