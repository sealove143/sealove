# 김승주 항해록 — Next.js 전환 계획

> 기존 `site/vanila`(순수 HTML/CSS/JS)와 `site/react`(Vite + React Router) 버전을
> 대체할 **Next.js 버전**을 `site/nextjs`에 새로 구축한다. 두 기존 버전은 참고/백업용으로
> 그대로 남겨두고, 신규 작업은 전부 `site/nextjs` 하위에서 진행한다.
>
> 이 문서는 "화면 구조를 옮기는 것"에서 끝나지 않고, `site/react`에 있던 **모든 기능**
> (라우팅, 반응형 내비게이션, SEO 메타데이터, 항해 상담실 AI 챗봇, 섭외 문의 메일 폼,
> FAQ 아코디언 등)을 Next.js 안에서 하나도 빠짐없이 실제로 동작하도록 구현하는 것을
> 목표로 한다.

## 0. 현재 상태 요약 (site/react 기준 분석 완료)

| 페이지 | 경로 | 주요 기능 |
|---|---|---|
| Home | `/` | 히어로(사진+SVG 나침반 애니메이션), 6개 대시보드 카드 네비게이션 |
| About | `/about` | 프로필 텍스트, 프로필 카드(mono 스타일), 브릿지 사진 |
| Career | `/career` | 항해 일지 타임라인(4단계), 계급장 안내, 주요 항로 리스트 |
| Books | `/books` | 저서 3권 소개 + 외부 구매/정보 링크 |
| Media | `/media` | 방송·인터뷰 리스트 + 소셜/채널 카드(유튜브·인스타·블로그) |
| Mentor | `/mentor` | **AI 채팅 상담** (현재 `window.claude.use('sample')`로 동작 — 실제 배포 환경에서는 동작 안 함) + FAQ 아코디언 |
| Contact | `/contact` | 섭외 문의 폼 → `mailto:` 링크 생성 + 클립보드 복사 폴백 + FAQ |

공통 요소: `Header`(반응형 햄버거 메뉴), `Footer`, `usePageMeta`(페이지별 `document.title`/description 수동 설정), 전역 `style.css`(483줄, CSS 변수 기반 라이트/다크 테마), Google Fonts(Gowun Batang, Noto Sans KR, IBM Plex Mono), 이미지 4장(hero, bridge, portrait-1, portrait-2).

**핵심 이슈**: `Mentor.jsx`는 Claude 아티팩트 샌드박스 전용 API(`window.claude`)에 의존하므로, 이 기능은 Next.js로 그대로 "이식"할 수 없고 **서버 API로 재설계**해야 한다.

→ 사용자 확인 결과: **Anthropic API를 서버(Route Handler)에서 직접 호출하는 방식**으로 재구현한다 (아래 6장 참고).

---

## 구현 현황 (2026-09-23 기준)

**`site/nextjs`에 Phase 0~6이 구현 완료되었고, `npm run build` / `npm run lint` 모두 통과했습니다.**
7개 페이지 전부와 항해 상담실 AI 챗봇(서버 연동)까지 실제 코드로 존재합니다. 아래는 사용자가
직접 해야 하는 남은 작업입니다.

- [ ] **`ANTHROPIC_API_KEY` 발급 및 `.env.local`에 등록** — 키가 없으면 `/mentor` 페이지가
      "AI 상담 기능을 사용할 수 없어요" 메시지만 보여줍니다 (정상 동작 확인함). 키를 넣은 뒤
      `npm run dev`로 실제 스트리밍 답변이 오는지 확인해 주세요.
- [ ] **브라우저로 시각 QA** — 이번 구현에서는 빌드 성공 + 각 경로 HTTP 200 응답까지만
      자동으로 확인했습니다. 실제 레이아웃·다크모드·모바일 메뉴 등은 브라우저로 직접 봐야 합니다.
- [ ] **Vercel 배포 및 환경변수 등록** (Phase 8) — 아직 진행하지 않았습니다.

---

## 1. 목표 및 범위

- [ ] `site/react`의 7개 페이지 + 모든 인터랙션을 Next.js(App Router)로 100% 재구현
- [ ] 항해 상담실의 AI 응답을 실제로 동작하는 서버 기능으로 교체 (Anthropic API 연동, 스트리밍)
- [ ] SEO: 페이지별 `<title>`/description을 Next.js Metadata API로 대체, OG 태그·sitemap·robots 추가
- [ ] 접근성/반응형: 기존 CSS의 라이트/다크 테마, 모바일 내비게이션 동작 그대로 유지
- [ ] 이미지 최적화: `next/image` 적용
- [ ] 폰트 최적화: `next/font/google`로 self-host
- [ ] Vercel 배포 (기존 `vercel.json`의 SPA rewrite는 Next.js에서는 불필요 → 제거)
- [ ] 타입스크립트로 작성 (컴포넌트/데이터/응답 타입 명시)

## 2. 기술 스택

| 항목 | 선택 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 15 (App Router) | 최신 안정 버전 기준, `create-next-app` 사용 |
| 언어 | TypeScript | `site/react`는 JS였지만 신규 프로젝트는 TS로 전환 |
| React | 19 (Next 15 기본값) | |
| 스타일링 | 기존 `style.css`를 전역 CSS로 이식 (Tailwind 등으로 재작성하지 않음) | 디자인 변경 없이 프레임워크만 교체하는 것이 목적 |
| 폰트 | `next/font/google` (Gowun Batang, Noto Sans KR, IBM Plex Mono) | CSS 변수(`--font-display` 등)에 연결 |
| 이미지 | `next/image` + `public/` 정적 자산 | |
| AI 연동 | `@anthropic-ai/sdk` (서버 전용, Route Handler) | 모델: 기본 `claude-sonnet-5` (비용·응답속도 균형, 3~6문장 상담 답변에 적합). `.env`의 `ANTHROPIC_MODEL`로 교체 가능하게 구성 |
| 배포 | Vercel | 기존 계정/프로젝트 설정 재사용 가능 |
| 패키지 매니저 | npm (기존 `site/react`와 동일하게 유지) | |

> 모델 선택 참고: Anthropic API 가이드상 기본값은 `claude-opus-5`이지만, 개인 홈페이지의 짧은 상담 챗봇 용도로는 비용 대비 `claude-sonnet-5`가 더 합리적이라 기본값으로 제안합니다. 필요시 환경변수 하나로 `claude-opus-5`로 즉시 전환 가능하도록 설계합니다.

---

## 3. 폴더 구조 (제안)

```
나만의 홈페이지/
└─ site/
   └─ nextjs/
      ├─ app/
      │  ├─ layout.tsx              # 전역 레이아웃, 폰트, 메타데이터 기본값
      │  ├─ globals.css             # style.css 이식본
      │  ├─ page.tsx                # Home (/)
      │  ├─ about/page.tsx
      │  ├─ career/page.tsx
      │  ├─ books/page.tsx
      │  ├─ media/page.tsx
      │  ├─ mentor/page.tsx         # 상담실 UI (client component)
      │  ├─ contact/page.tsx
      │  ├─ sitemap.ts
      │  ├─ robots.ts
      │  └─ api/
      │     └─ mentor/route.ts      # AI 상담 스트리밍 API (server only)
      ├─ components/
      │  ├─ Header.tsx              # "use client" (모바일 메뉴 토글)
      │  ├─ Footer.tsx
      │  ├─ CompassSVG.tsx          # Home 히어로의 나침반 SVG 분리
      │  ├─ DashboardCard.tsx
      │  ├─ FaqList.tsx
      │  └─ MentorChat.tsx          # "use client" 채팅 위젯 (Mentor 페이지에서 사용)
      ├─ lib/
      │  ├─ nav.ts                  # NAV 배열 (경로/라벨)
      │  ├─ profile.ts              # PROFILE_FACTS, 시스템 프롬프트 빌더 (서버 전용)
      │  ├─ anthropic.ts            # Anthropic 클라이언트 초기화
      │  └─ rateLimit.ts            # 간단한 IP 기반 rate limit 유틸
      ├─ public/
      │  └─ images/
      │     ├─ hero.jpg
      │     ├─ bridge.jpg
      │     ├─ portrait-1.jpg
      │     └─ portrait-2.jpg
      ├─ .env.local.example
      ├─ package.json
      ├─ tsconfig.json
      ├─ next.config.ts
      └─ vercel.json (필요 시 헤더/리전 설정만, rewrite 없음)
```

---

## 4. 라우팅 & 페이지 매핑

| 기존 (`react-router-dom`) | Next.js App Router | 렌더링 방식 |
|---|---|---|
| `<Route path="/" element={<Home/>}/>` | `app/page.tsx` | 정적(Server Component) |
| `/about` | `app/about/page.tsx` | 정적 |
| `/career` | `app/career/page.tsx` | 정적 |
| `/books` | `app/books/page.tsx` | 정적 |
| `/media` | `app/media/page.tsx` | 정적 |
| `/mentor` | `app/mentor/page.tsx` (정적 셸) + `MentorChat`(client) + `app/api/mentor/route.ts`(server) | 하이브리드 |
| `/contact` | `app/contact/page.tsx` (form은 client component) | 하이브리드 |
| `<Layout>` (Header/Footer + `<Outlet/>`) | `app/layout.tsx` | 모든 페이지 공통 |
| `NavLink` 활성 스타일 | `usePathname()` 훅으로 대체 | Header client component |
| `usePageMeta` | Next.js `export const metadata` (정적 페이지) | Home/About/Career/Books/Media/Contact는 정적이라 `metadata` export로 충분 |

---

## 5. 단계별 작업 계획

### Phase 0 — 프로젝트 부트스트랩
- [x] `site/nextjs`에 `create-next-app`으로 TypeScript + App Router 프로젝트 생성 (ESLint 포함, Tailwind는 제외 — 기존 CSS 그대로 사용)
- [x] `package.json` 스크립트 확인 (`dev`, `build`, `start`, `lint`)
- [x] Git에서 `site/nextjs`가 추적되도록 확인 (`.gitignore`에 `node_modules`, `.next`, `.env*` 포함 — create-next-app 기본값 그대로 사용)

### Phase 1 — 공통 레이아웃 & 스타일 이식
- [x] `src/styles/style.css` → `app/globals.css`로 복사 후 `app/layout.tsx`에서 import
- [x] Google Fonts(Gowun Batang / Noto Sans KR / IBM Plex Mono)를 `app/layout.tsx`의 `<head>`에서 로드, CSS 변수(`--font-display` 등)에 매핑 — *변경: `next/font/google`은 이 두 한국어 폰트의 정확한 subset 값을 오프라인에서 검증할 수 없어, 기존 `site/react`와 동일한 `<link>` 방식을 그대로 사용함 (동작은 동일, 최적화는 후속 과제로 8절에 기록)*
- [x] `index.html`의 `<title>`, favicon(SVG), OG 메타 → `app/layout.tsx`의 `metadata` 객체 + `app/icon.svg`로 이식
- [x] `lib/nav.ts`에 NAV 배열 정의 (홈/프로필/항해 일지/저서/미디어·채널/항해 상담실/섭외 문의)
- [x] `components/Header.tsx` 구현: `"use client"`, `usePathname()`으로 활성 링크 판단, 모바일 햄버거 토글 상태 유지, 라우트 변경 시 메뉴 자동 닫힘 — *ESLint의 `react-hooks/set-state-in-effect` 규칙 때문에 `useEffect` 대신 React 공식 문서가 권장하는 "렌더링 중 상태 조정" 패턴으로 구현*
- [x] `components/Footer.tsx` 구현 (정적 서버 컴포넌트)
- [x] `app/layout.tsx`에서 `<Header/> {children} <Footer/>` 구성

### Phase 2 — 정적 콘텐츠 페이지 이식
- [x] Home(`app/page.tsx`): 히어로 섹션, 나침반 SVG(`components/CompassBadge.tsx`로 분리해 로직 그대로 이식), 6개 대시보드 카드 → `next/link` 사용
- [x] About(`app/about/page.tsx`): 프로필 텍스트, `next/image`로 bridge/portrait-1 이미지 교체, 내부 링크(`/career`, `/books` 등) 유지
- [x] Career(`app/career/page.tsx`): 로그북 타임라인 4개 항목, 계급장 줄무늬 표시(`stripes`), 항로 리스트, aside 카드
- [x] Books(`app/books/page.tsx`): 3개 도서 카드, 외부 링크(`target="_blank" rel="noopener"`) 그대로 유지
- [x] Media(`app/media/page.tsx`): 방송/인터뷰 리스트, 소셜 채널 카드 3개(유튜브/인스타/블로그) — 링크 URL 그대로 이식
- [x] 각 정적 페이지에 `export const metadata: Metadata = { title, description }` 추가 (기존 `usePageMeta` 인자값 그대로 사용)
- [x] 이미지 4장을 `public/images/`로 이동, `next/image`의 `fill` 속성 사용 (관련 컨테이너에 `position: relative` 보강)

### Phase 3 — 섭외 문의(Contact) 폼
- [x] `components/ContactForm.tsx` (`"use client"`)로 기존 상태 로직(`cType`, `cDate`, `cDetail`, `cReply`, `fallbackVisible` 등) 그대로 이식
- [x] 제출 시 `mailto:` 링크 생성 로직 유지 (수신 이메일 주소는 기존과 동일하게 컴포넌트 내 상수로 유지, 페이지에는 노출되지 않음)
- [x] 클립보드 복사 폴백(`navigator.clipboard`) + "복사됨" 상태 타이머 이식
- [x] FAQ 아코디언은 순수 HTML `<details>/<summary>`라 서버 컴포넌트로 그대로 이식

### Phase 4 — 항해 상담실(Mentor) AI 챗봇 재구현 ⭐ 핵심 작업
> 기존 `window.claude.use('sample')` 방식은 제거하고, Next.js 서버에서 Anthropic API를 직접 호출하는 구조로 전면 재설계.

- [x] `lib/profile.ts`: 기존 `PROFILE_FACTS`, 시스템 프롬프트 빌더 함수(`buildMentorSystemPrompt`)를 **서버 전용**(`import "server-only"`) 모듈로 이전
- [x] `lib/anthropic.ts`: `new Anthropic()` 클라이언트 초기화 (환경변수 `ANTHROPIC_API_KEY` 자동 인식, `ANTHROPIC_MODEL`로 모델 교체 가능)
- [x] `app/api/mentor/route.ts` (Route Handler, `runtime = 'nodejs'`):
  - 요청 바디: `{ messages: {role, content}[], profile }` (매 요청마다 전체 대화 이력 전송 — 서버는 무상태)
  - `buildMentorSystemPrompt`로 system 프롬프트 구성 후 `anthropic.messages.stream({ model, max_tokens: 700, system, messages })` 호출
  - 응답은 SSE(`data: {...}\n\n`)로 `{type:'text',delta}` / `{type:'error',message}` / `{type:'done'}` 이벤트를 스트리밍
  - 에러 처리: `Anthropic.RateLimitError` / `AuthenticationError` / `APIConnectionError` / `APIError`를 각각 한국어 메시지로 매핑, `stop_reason === 'refusal'` 케이스도 처리
  - 입력 길이 제한(질문 500자), 세션당 질문 6턴 제한 적용
- [x] `lib/rateLimit.ts`: IP 기반 인메모리 rate limit (분당 6회) — 운영 단계에서 Upstash Redis 등으로 교체 권장 주석 포함
- [x] `components/MentorChat.tsx` (`"use client"`):
  - 기존 `mGender`/`mAge`/`mSituation`/`intakeLocked`/`messages`/`status`/`busy` 상태 로직 이식
  - `window.claude.use('sample')` 대신 `fetch('/api/mentor', {...})` + `response.body.getReader()`로 SSE 스트림을 직접 파싱해 말풍선을 실시간 갱신
  - HTTP 에러(429/503/400 등)와 네트워크 실패, 스트림 중 에러 이벤트를 모두 구분해 한국어 메시지로 `status`에 표시
- [x] `app/mentor/page.tsx`: 인트로 섹션 + `<MentorChat/>` + FAQ 섹션(서버 컴포넌트로 유지) 조합. FAQ와 인트로 문구 중 "방문자 본인의 Claude 계정 사용량이 사용되며" 등 예전 아키텍처(`window.claude`)를 전제로 한 문장은 서버 API 방식에 맞게 새로 작성함
- [x] 면책 문구("답변은 참고용 AI 상담이며, 실제 김승주 선장의 답변이 아닙니다") 그대로 유지

### Phase 5 — SEO / 메타데이터 / 정적 자산
- [x] `app/layout.tsx`에 기본 `metadata`(title template, description, OG, `lang="ko"`) 설정
- [x] `app/sitemap.ts`, `app/robots.ts` 추가 (`NEXT_PUBLIC_SITE_URL` 미설정 시 `https://example.com` 플레이스홀더 — 배포 후 실제 도메인으로 교체 필요)
- [x] `app/icon.svg` (기존 favicon의 ⚓ 이모지 SVG 이식)
- [x] Open Graph 이미지: `metadata.openGraph.images`에 `/images/hero.jpg` 지정 (별도 `opengraph-image` 생성 규칙까지는 사용하지 않음 — 필요시 후속 개선)

### Phase 6 — 환경변수 & 보안
- [x] `.env.local.example` 작성: `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `NEXT_PUBLIC_SITE_URL`
- [x] `.env.local`이 `.gitignore`에 포함되어 커밋되지 않음을 확인 (create-next-app 기본 `.gitignore`가 `.env*`를 이미 제외)
- [x] Vercel 환경변수 등록 방법을 `README.md`에 문서화 (실제 등록은 Phase 8에서 사용자가 진행)
- [x] 상담실 API 남용 방지: 질문 길이 제한, 세션당 턴 수 제한, IP rate limit 적용

### Phase 7 — 빌드 검증 & 수동 QA
- [x] `npm run build` 로컬 성공 확인 (타입 에러 0건), `npm run lint` 통과
- [x] 프로덕션 빌드를 로컬에서 기동해 7개 페이지 전부 HTTP 200, 이미지 4장 200, `/icon.svg`·`/sitemap.xml`·`/robots.txt` 200, `/api/mentor`가 키 미설정 시 안내 메시지를 정상 반환하는 것까지 자동으로 확인함
- [ ] 페이지별 브라우저 수동 확인 (**사용자 확인 필요** — 이번 세션은 CLI 환경이라 스크린샷/실제 브라우저 렌더링은 검증하지 못함)
  - [ ] Home: 나침반 SVG 렌더링, 히어로 CTA 링크, 6개 카드 이동 정상
  - [ ] About/Career/Books/Media: 텍스트·이미지·외부 링크 정상, 다크모드(`prefers-color-scheme`) 확인
  - [ ] Mentor: `ANTHROPIC_API_KEY` 등록 후 실제 질문 입력 → 스트리밍 답변 도착 → 에러 케이스(빈 질문, 네트워크 오류) 처리 확인, FAQ 아코디언 동작
  - [ ] Contact: 폼 제출 시 메일 클라이언트 열림 + 폴백 텍스트/복사 버튼 동작
  - [ ] 모바일 뷰(360~430px)에서 햄버거 메뉴 개폐, 반응형 레이아웃 확인
  - [ ] 라이트/다크 시스템 테마 전환 시 색상 토큰 정상 반영
- [ ] Lighthouse 등으로 성능/접근성 간단 점검 (이미지 최적화, 폰트 로딩)

### Phase 8 — 배포
- [ ] Vercel에 `site/nextjs`를 프로젝트 루트로 지정해 새 배포 연결 (또는 기존 `site/react` Vercel 프로젝트를 교체)
- [ ] 환경변수(`ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`) Vercel 대시보드에 등록
- [ ] 배포 후 프로덕션 URL에서 Phase 7 체크리스트 재확인 (특히 Mentor API는 로컬과 프로덕션에서 별도 확인 필요)
- [ ] 기존 `site/react` 배포와의 전환 계획 확정 (도메인 연결 교체 시점 등은 사용자 결정 필요)

---

## 6. 항해 상담실 AI 아키텍처 상세

```
[MentorChat.tsx] --POST /api/mentor (messages[], profile)--> [route.ts]
                                                                 │
                                                   buildSystemPrompt(profile)
                                                                 │
                                                   Anthropic.messages.stream({
                                                     model, system, messages, max_tokens
                                                   })
                                                                 │
                                              텍스트 델타 스트림 (ReadableStream)
                                                                 │
[MentorChat.tsx] <--- 실시간 텍스트 청크 수신, 말풍선 업데이트 ---┘
```

- **상태 보관 위치**: 서버는 무상태(stateless). 매 요청마다 클라이언트가 전체 대화 이력을 전송한다 (기존 `turnsRef` 방식과 동일한 개념을 클라이언트 state로 유지).
- **시스템 프롬프트**: 기존 `PROFILE_FACTS` + 방문자 성별/나이대/상황을 조합하는 로직을 그대로 서버로 이전.
- **비용/남용 방지**: 방문자 개인 Claude 계정을 쓰던 기존 방식과 달리, 이제 **사이트 운영자(사용자)의 API 키 비용**이 발생하므로 아래를 반드시 적용한다.
  - 입력 길이 제한(질문 1건당 최대 글자 수)
  - `max_tokens` 캡(예: 600~800) — 3~6문장 답변이라는 기존 톤 유지
  - IP 기반 rate limit (분당/시간당 횟수 제한)
  - 대화 turn 수 상한(예: 최대 6턴) — 이후에는 새로고침 유도
- **면책 문구**는 실제 API 사용으로 전환되어도 그대로 유지 (법적/신뢰성 이유로 오히려 더 중요해짐).

---

## 7. 리스크 및 사용자 확인이 필요한 후속 결정 사항

- **AI 상담 API 비용**: Anthropic API 키는 사용자 본인이 발급/등록해야 하며, 트래픽에 비례해 비용이 발생합니다. Phase 6에서 키 발급 및 등록을 진행할 때 다시 확인합니다.
- **Rate limit 저장소**: 트래픽이 거의 없는 개인 홈페이지 초기 단계라면 인메모리 rate limit으로 충분하지만, 방문자가 늘면 Upstash Redis 등 외부 스토어 도입을 권장합니다(별도 계정/설정 필요 — 필요 시점에 재논의).
- **기존 `site/react` 배포 처리**: 그대로 유지할지, Next.js 버전으로 완전히 교체(도메인 전환)할지는 Phase 8에서 결정합니다.
- **연락처 이메일 주소 하드코딩**: 기존 코드처럼 `TO` 상수에 그대로 둘지, 환경변수로 분리할지는 취향 문제 — 기본적으로는 기존과 동일하게 코드 내 상수로 유지하되 원하면 `.env`로 옮길 수 있음.
- **폰트 로딩 방식**: 계획 초안에서는 `next/font/google`로 self-host할 예정이었으나, Gowun Batang·Noto Sans KR 같은 한글 폰트의 정확한 Google Fonts subset 값을 이 세션에서 오프라인으로 검증할 수 없어 위험을 피하고자 기존 `<link>` 태그 방식으로 구현했습니다. 기능·디자인상 차이는 없고, 다만 폰트가 self-host가 아니라 Google 서버에서 로드됩니다. 원하면 추후 `next/font/google`로 교체할 수 있습니다(각 폰트의 지원 subset을 Google Fonts에서 직접 확인 필요).
- **OG 이미지**: 현재 `hero.jpg`를 정적으로 지정했습니다. 텍스트가 합성된 전용 OG 이미지가 필요하면 Next.js의 `opengraph-image.tsx` 생성 규칙을 추가로 도입할 수 있습니다.

---

## 8. 작업 시작 방법

이 계획을 실행할 준비가 되면, Phase 0부터 순서대로 진행하며 각 Phase가 끝날 때마다 `npm run build`/`npm run dev`로 중간 검증합니다. 실제 구현을 시작할 때 이 `plan.md`의 체크박스를 하나씩 갱신해 진행 상황을 추적하는 것을 권장합니다.

## 9. 실행 결과 (2026-09-23)

`site/nextjs`에 Phase 0~6이 코드로 구현되어 있고 `npm run build`·`npm run lint`가 모두
통과합니다. 다음 명령으로 바로 확인할 수 있습니다.

```bash
cd "site/nextjs"
npm install                     # 이미 설치되어 있다면 생략 가능
cp .env.local.example .env.local
# .env.local에 ANTHROPIC_API_KEY를 채워 넣으세요
npm run dev
```

남은 것은 위 "구현 현황" 섹션과 Phase 7(수동 QA)·Phase 8(배포)의 미체크 항목들이며, 전부
사람이 직접 확인하거나(브라우저 QA) 계정/키가 필요한(API 키 발급, Vercel 배포) 작업입니다.
