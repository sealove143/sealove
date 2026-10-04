# 김승주 항해록 — Next.js

`site/vanila`, `site/react`에 이어 만든 Next.js(App Router) 버전입니다. 자세한 마이그레이션
계획은 상위 폴더의 [`plan.md`](../../plan.md)를 참고하세요.

## 시작하기

```bash
npm install
cp .env.local.example .env.local   # Supabase·Resend 키를 채워 넣으세요
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 환경 변수

| 변수 | 필수 | 설명 |
|---|---|---|
| `SUPABASE_URL` | ✅ | 항해 상담실 게시판에 쓰는 Supabase 프로젝트 URL. 없으면 게시판이 "준비 중"으로 표시됩니다. |
| `SUPABASE_SECRET_KEY` | ✅ | Supabase secret 키(`sb_secret_...`). 서버에서만 쓰며 브라우저로 나가지 않습니다. |
| `IP_HASH_SALT` | 권장 | 질문 작성자 IP를 해시로 남길 때 쓰는 비밀 솔트. 비우면 IP 해시를 남기지 않습니다. |
| `RESEND_API_KEY` | ✅ | 섭외 문의(`/contact`)와 새 질문 알림 메일 발송에 쓰는 Resend API 키. 없으면 문의 폼이 발송 불가 메시지를 보여주고, 질문 알림은 가지 않습니다. |
| `CONTACT_TO_EMAIL` | 선택 | 문의·질문 알림 메일 수신 주소. 기본값 `powertmdwn351@gmail.com`. |
| `CONTACT_FROM_EMAIL` | 선택 | 발신 주소. 기본값 `onboarding@resend.dev` (도메인 인증 전에는 이 주소만 가능). |
| `NEXT_PUBLIC_SITE_URL` | 선택 | `sitemap.xml`/`robots.txt`와 질문 알림 메일의 링크에 사용할 실제 배포 주소. |

## 페이지 구성

| 경로 | 설명 |
|---|---|
| `/` | 홈 (히어로, 대시보드 카드) |
| `/about` | 프로필·항해 일지 (선교 시점 항해 영상 워터마크, `/career`는 `/about#log`로 리다이렉트) |
| `/books` | 저서·미디어 (책 표지, 방송·강연, 채널. `/media`는 `/books#media`로 리다이렉트) |
| `/mentor` | 항해 상담실 질문 게시판 (로그인·질문 작성 폼 + 목록·분류·페이지) |
| `/mentor/[id]` | 질문 상세·답변 (관리자는 답변 작성·숨김, 성별·이메일 열람) |
| `/contact` | 섭외 문의 (Resend 메일 발송, `app/api/contact` 서버 연동) |

## 항해 상담실 게시판

구현 계획과 설계 배경은 [`docs/consult-board-plan.md`](docs/consult-board-plan.md)에 있습니다.

- **DB**: Supabase(Postgres). 스키마는 [`supabase/migrations/`](supabase/migrations/)에 있고,
  Supabase SQL Editor에서 한 번 실행하면 됩니다. RLS와 Supabase Auth는 쓰지 않습니다.
- **서버에서만 접근**: `lib/supabase/admin.ts`가 secret 키로 접속하고, 게시판의 모든 조회·쓰기는
  `lib/consultDb.ts`를 거칩니다. 비공개 글 차단, 남의 비공개 글 제목 가림, 성별·이메일을 관리자에게만
  내려보내는 규칙이 이 파일에 있습니다. 공개(anon) 키로는 아무것도 못 하도록 SQL에서 권한을 회수합니다.
- **로그인**: 이메일·비밀번호(`app/mentor/authActions.ts`). 비밀번호는 scrypt 해시로 `users`에,
  로그인 상태는 토큰 해시로 `sessions`에 저장하고 브라우저에는 httpOnly 쿠키만 둡니다.
  비밀번호를 5번 틀리면 15분 잠깁니다. 게시판에는 자동 생성 닉네임(`선원123456`)만 보입니다.
- **질문 작성**: 궁금증 한마디(제목)·성별(필수)·분류·공개 설정·내용. 성별은 관리자에게만 보입니다.
- **알림 메일**: 질문이 올라오면 `CONTACT_TO_EMAIL`로 메일이 갑니다. 메일 제목은 궁금증 한마디이고,
  답장 주소가 질문자 이메일이라 메일 앱에서 바로 답장할 수 있습니다.
- **DB 트리거**: 도배 제한(10분 3건·하루 10건), 차단 계정 글쓰기 금지, 신고 3건 시 자동 숨김,
  답변 시 상태 변경.
- **관리자 지정**: 사이트에서 선장님 이메일로 가입한 뒤 SQL Editor에서
  `update users set role = 'admin' where email = '<이메일>';`
- **사용자 차단**: `update users set is_banned = true, banned_reason = '...' where nickname = '<닉네임>';`
- **한계**: 이메일 인증과 비밀번호 자동 재설정이 없습니다(Resend 도메인 인증 전에는 방문자에게 메일을
  보낼 수 없음). 운영용 SQL은 마이그레이션 파일 끝에 적혀 있습니다.

## 빌드

```bash
npm run build
npm start
```

## 배포

Vercel에 `my-homepage/site/nextjs`를 프로젝트 루트(Root Directory)로 지정해 배포하고, 프로젝트 환경변수에
위 표의 필수 값과 필요 시 `NEXT_PUBLIC_SITE_URL`을 등록하세요.

이 경로에는 한글이나 공백을 넣지 마세요. Vercel은 저장소 루트 기준 경로로 서버 함수 이름을 만드는데
공백이 있으면 배포를 거부하고("Serverless Function has an invalid name"), 한글이 있으면 Next.js 16.3의
Turbopack 빌드가 패닉("is not a char boundary")을 일으킵니다.
