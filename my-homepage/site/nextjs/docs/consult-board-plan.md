# 항해 상담실 질문 게시판 — 구현 계획

작성일: 2026-10-04 (2차 개정: 로그인을 이메일·비밀번호 방식으로 변경)
상태: 코드 구현 완료. Supabase URL 입력과 SQL 실행이 남아 있음
대상: `my-homepage/site/nextjs` (Next.js 16.3.6, React 19)
배포 주소: https://react-five-lemon.vercel.app

## 1. 목표

항해 상담실(`/mentor`)을 "방문자가 질문을 남기고 선장이 직접 답하는 게시판"으로 완성한다.

| # | 요구사항 | 구현 방향 |
|---|---|---|
| 1 | 챗봇 대신 직접 답변 | 관리자(선장) 계정만 답변 작성 |
| 2 | 작성 전 로그인 필수 | 비로그인 상태에서는 작성 폼 대신 로그인·가입 폼 표시 |
| 3 | 로그인 방식 | 이메일 + 비밀번호 (처음 입력한 비밀번호로 가입, 이후 같은 계정으로 로그인) |
| 4 | 성별 필수 | 질문마다 남성/여성/기타 중 선택, 서버에서도 검증. 선장에게만 보임 |
| 5 | 작성하면 아래 목록에 표시, 다른 방문자도 열람 | `/mentor` 한 페이지에 폼(위) + 목록(아래) |
| 6 | 공개/비공개 선택 | 비공개 글은 목록에 자물쇠 자리만, 내용은 작성자와 선장만 |
| 7 | 제목 질문 변경 | 라벨을 "자신의 궁금증을 한마디로 표현하면 무엇일까?"로 |
| 8 | 질문 등록 시 Gmail 알림, 메일 제목 = 한마디 | 기존 Resend로 `powertmdwn351@gmail.com`에 발송 |
| 9 | 이메일 답장 안내 | 질문 폼과 섭외 문의 폼에 "답장은 이메일로 갑니다" 문구 |
| 10 | DB는 Supabase (과제 요건) | 사용자·세션·질문·답변 모두 Supabase Postgres에 저장 |
| 11 | RLS 미사용, 서버에서만 Supabase 호출 | secret 키를 쓰는 서버 전용 클라이언트 |
| 12 | Supabase Auth 미사용 | 자체 `users`·`sessions` 테이블과 세션 쿠키 |

## 2. 현재 상태와 바뀌는 점

지금 작업 트리(미커밋)에는 **Supabase Auth(카카오·구글) + RLS 기반** 게시판이 들어 있다. 화면과 서버 액션의 뼈대는 그대로 쓰고, 인증과 DB 접근 계층을 교체한다.

| 구분 | 지금 | 변경 후 |
|---|---|---|
| 로그인 | Supabase Auth OAuth (`/auth/callback`) | 이메일·비밀번호, 서버 액션으로 처리 |
| 세션 | Supabase 쿠키 + `proxy.ts`에서 갱신 | `sessions` 테이블 + httpOnly 쿠키 |
| DB 키 | `NEXT_PUBLIC_SUPABASE_ANON_KEY` (브라우저 노출) | `SUPABASE_SECRET_KEY` (서버 전용) |
| 권한 검사 | RLS 정책, `auth.uid()`, `is_admin()` | 서버 코드(`lib/consultDb.ts`) |
| 사용자 테이블 | `profiles` → `auth.users` 참조 | 독립된 `users` 테이블 |
| 질문 작성 화면 | `/mentor/new` 별도 페이지 | `/mentor` 상단에 폼 내장 |
| 알림 메일 | 없음 | 질문 등록 직후 발송 |

## 3. 설계

### 3.1 로그인 (이메일·비밀번호)

구글·카카오 대신 이 방식을 택한 이유: 외부 OAuth 앱 설정이 필요 없고, 답장을 보낼 이메일을 모든 작성자에게서 받을 수 있다(카카오는 이메일 제공에 비즈 앱 전환이 필요하다).

- 폼 하나로 가입과 로그인을 겸한다: 이메일 + 비밀번호 입력 → 처음 보는 이메일이면 계정 생성, 있는 이메일이면 비밀번호 확인.
  - 화면은 "로그인 / 회원가입" 탭으로 나누고, 비밀번호 확인란은 회원가입 탭에만 둔다. 가입 때는 서버도 두 값이 같은지 확인한다.
- 비밀번호: 8자 이상. `node:crypto`의 `scrypt` + 사용자별 무작위 salt로 해시해 `password_hash` 한 컬럼에 `salt:hash` 형식으로 저장하고, 비교는 `timingSafeEqual`. 원문은 어디에도 남기지 않는다.
- 세션: 로그인 성공 시 무작위 토큰(32바이트)을 만들어 **SHA-256 해시만** `sessions` 테이블에 저장하고, 원문은 쿠키(`httpOnly`, `secure`, `sameSite=lax`, 30일)에 담는다. 로그아웃은 해당 행 삭제.
- 무차별 대입 방어: 기존 `lib/rateLimit.ts`로 IP당 로그인 시도 제한 + 계정당 연속 실패 횟수를 `users`에 기록해 일정 횟수 초과 시 잠시 잠금.
- 닉네임: 가입 시 `선원000000` 형식으로 서버가 만든다. 이메일은 게시판 어디에도 표시하지 않는다.
- 관리자 지정: 이메일 주소로 자동 판정하지 **않는다**. 이메일 인증이 없어 누구든 선장 이메일로 먼저 가입할 수 있기 때문이다. 선장이 가입한 뒤 Supabase SQL Editor에서 한 번 실행한다.
  `update users set role = 'admin' where email = 'powertmdwn351@gmail.com';`

이 방식의 한계 (알고 가는 것):

- 이메일 인증을 하지 않으므로 오타가 난 주소로 가입하면 답장을 받을 수 없다. 가입 화면에 "답장이 이 주소로 갑니다. 정확히 입력해 주세요" 문구로 보완한다.
- 비밀번호를 잊었을 때 자동 재설정 메일을 보낼 수 없다. Resend는 도메인 인증 전에는 계정 주인의 이메일로만 발송되기 때문이다. 당분간은 섭외 문의로 요청받아 선장이 SQL로 초기화한다.
- 나중에 도메인을 연결하면 이메일 인증, 비밀번호 재설정, 답변 자동 알림을 추가할 수 있다.

### 3.2 DB 접근

- `lib/supabase/admin.ts`: `import "server-only"` + `createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, { auth: { persistSession: false } })`.
- 브라우저용 클라이언트와 `@supabase/ssr`는 제거한다. `NEXT_PUBLIC_` 접두사가 붙은 Supabase 변수는 남기지 않는다.
- 모든 조회·쓰기는 `lib/consultDb.ts`의 함수로 모은다. 이 파일이 RLS가 하던 일을 대신한다.

| 함수 | 권한 규칙 (코드로 강제) |
|---|---|
| `listQuestions(viewer, category, page)` | `status in ('open','answered')`만. 남의 비공개 글은 제목을 `null`로 치환 |
| `getQuestion(viewer, id)` | 공개 글은 누구나, 비공개·숨김 글은 작성자와 관리자만 |
| `createQuestion(viewer, input)` | 로그인 필수, `author_id`는 항상 세션 값 |
| `deleteQuestion(viewer, id)` | 작성자 본인만, 소프트 삭제 |
| `saveAnswer(viewer, id, body)` | 관리자만 |
| `moderateQuestion(viewer, id, action)` | 관리자만 |
| `reportQuestion(viewer, id, reason)` | 로그인 필수, 볼 수 있는 글만 |

- `gender`, 작성자 `email`, `ip_hash`, `user_agent`는 관리자가 아닐 때 select하지 않는다. 화면에서 숨기는 것이 아니라 서버가 아예 가져오지 않는다.

### 3.3 RLS 없이 테이블을 지키는 방법

RLS를 끄면 Supabase가 자동 발급하는 공개(anon) 키로 Data API를 호출해 테이블 전체를 읽고 쓸 수 있다. 특히 `users`에는 이메일과 비밀번호 해시가 있으므로 반드시 막는다.

- 마이그레이션에서 `revoke all on <모든 테이블·함수> from anon, authenticated;` 실행.
- `alter default privileges in schema public revoke all on tables from anon, authenticated;`로 이후 만들 객체에도 적용.
- 결과: secret 키(`service_role`)로 들어오는 서버 요청만 통과한다.

### 3.4 스키마 (`supabase/migrations/`)

기존 `20260930000000_consult_board.sql`을 새 내용으로 교체한다. 예전 SQL을 이미 실행했더라도 문제없도록 파일 맨 앞에서 옛 객체(`question_list` 뷰, `profiles`, 옛 함수·트리거·타입)를 `drop ... if exists ... cascade`로 정리한다. 게시판에 실제 데이터가 아직 없으므로 지우고 다시 만드는 것이 안전하다.

```sql
create type user_role   as enum ('user', 'admin');
create type user_gender as enum ('male', 'female', 'other');

create table users (
  id             uuid primary key default gen_random_uuid(),
  email          text not null unique,          -- 소문자로 정규화해 저장
  password_hash  text not null,                 -- scrypt, "salt:hash"
  nickname       text not null unique,
  role           user_role not null default 'user',
  is_banned      boolean not null default false,
  failed_logins  integer not null default 0,
  locked_until   timestamptz,
  created_at     timestamptz not null default now()
);

create table sessions (
  token_hash  text primary key,                 -- 쿠키 토큰의 SHA-256
  user_id     uuid not null references users(id) on delete cascade,
  expires_at  timestamptz not null,
  created_at  timestamptz not null default now()
);

-- questions: author_id → users(id), gender user_gender not null 추가
```

- 유지: `questions`, `answers`, `question_reports`, `moderation_logs` 구조, 도배 방지 트리거(10분 3건·하루 10건), 답변 시 상태 동기화 트리거, 신고 3건 자동 숨김 트리거. `auth.uid()`를 쓰지 않아 그대로 동작한다.
- 제거: `profiles`, `on_auth_user_created` 트리거, `is_admin()`, `is_client_request()`, `questions_before_update`의 클라이언트 분기, `delete_own_question()`, `question_list` 뷰, 모든 `create policy`·`enable row level security`·컬럼 단위 grant.
- 조회수 증가는 원자적 갱신이 필요하므로 `increment_question_view(p_id)` 함수만 `auth.uid()` 조건을 뺀 형태로 남긴다(권한 검사는 호출 전 서버 코드에서).

### 3.5 화면

`/mentor` 한 페이지 구성 (위에서 아래로):

1. 소개 문구
2. 작성 영역
   - 비로그인: 로그인(이메일·비밀번호) / 회원가입(성명·성별·이메일·비밀번호·비밀번호 확인) 폼
   - 로그인: 질문 폼
3. 분류 탭 + 질문 목록 + 페이지 번호 (누구나 열람)
4. FAQ

질문 폼 필드:

| 필드 | 라벨 | 규칙 |
|---|---|---|
| `title` | **자신의 궁금증을 한마디로 표현하면 무엇일까?** | 필수, 2~100자 |
| `gender` | 성별 | 필수, 남성/여성/기타 라디오. 기본 선택 없음. 질문마다 선택 |
| `category` | 분류 | 필수, 기존 6종 |
| `visibility` | 공개 설정 | 공개(기본) / 🔒 비공개 |
| `body` | 내용 | 필수, 10~5000자 |
| `website` | (숨김) | 봇 차단용 허니팟 |

- 등록 성공 시 목록을 다시 불러오고(`refresh()`), 폼을 비운 뒤 "질문이 올라갔어요"를 표시한다. 새 글이 바로 아래 목록 맨 위에 보인다.
- "질문하기" 버튼(`BoardViewerBar`)과 `/mentor/new`, `/login` 페이지는 제거한다.
- 비공개 질문은 목록에 "🔒 비공개 질문입니다"로 자리만 보이고 링크가 걸리지 않는다. 주소를 직접 입력해도 작성자 본인과 선장이 아니면 `notFound()`로 처리한다.
- 성별은 선장의 상세 화면과 알림 메일에만 표시된다. 작성자 본인 화면에도 다시 나오지 않는다.

안내 문구:

- 질문 폼: "답변은 이 게시판에 올라오고, 가입하신 이메일(○○@…)로도 답장이 갈 수 있어요. 성별은 선장님에게만 보입니다."
- 섭외 문의 폼(`components/ContactForm.tsx`): "답장은 적어 주신 이메일로 보내 드립니다."
- FAQ의 "답변은 언제쯤 달리나요?" 항목에 이메일 답장 안내 추가.

### 3.6 메일

- `lib/notifyQuestion.ts`: 기존 `lib/resend.ts`의 `resend`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` 재사용.
- 제목: 질문의 `title` 그대로.
- 본문: 닉네임, 작성자 이메일, 성별, 분류, 공개 여부, 내용, 상세 링크(`https://react-five-lemon.vercel.app/mentor/{id}`).
- `replyTo`를 작성자 이메일로 지정한다. 선장이 Gmail에서 "답장"을 누르면 바로 질문자에게 간다. 이것이 "이메일로 답장"의 실제 경로다(도메인 인증 없이 가능).
- `createQuestion` 액션에서 DB 저장이 끝난 뒤 `after()`(next/server)로 발송한다. 메일이 실패해도 질문 등록은 성공으로 처리하고 서버 로그만 남긴다.

### 3.7 추가 변경 (2026-10-04, 배포 후)

- 회원가입에 성명(2~30자)과 성별(필수)을 추가했다. `users.name`, `users.gender` 컬럼은 `20261004000000_user_name_gender.sql`로 추가한다. 로그인 탭에는 두 항목이 없다(이미 저장된 값이므로).
- 성명은 성별·이메일과 마찬가지로 선장의 상세 화면과 알림 메일에만 나온다.
- 회원가입에 생년월일(필수)을 추가했다. `users.birth_date` 컬럼은 `20261004010000_user_birth_date.sql`로 추가하며, 성명과 같은 범위(선장의 상세 화면과 알림 메일)에만 나온다.
- 질문 폼의 성별은 가입 때 고른 값이 미리 선택되어 있고, 질문마다 바꿀 수 있다.
- 내용 입력란의 "개인정보는 적지 말아 주세요" 문구를 뺐다.

## 4. 파일 변경 목록

**추가**

- `lib/supabase/admin.ts` — 서버 전용 클라이언트
- `lib/auth/password.ts` — scrypt 해시·검증
- `lib/auth/session.ts` — 세션 생성·조회·삭제, `getViewer()`
- `lib/emailHtml.ts` — 섭외 문의와 질문 알림이 함께 쓰는 메일 템플릿(기존 `app/api/contact/route.ts`에서 분리)
- `app/mentor/authActions.ts` — `signUp`, `signIn`, `signOut` 서버 액션
- `components/AuthForm.tsx` — 로그인 / 회원가입 폼
- `lib/consultDb.ts` — 권한 검사를 포함한 데이터 함수
- `lib/notifyQuestion.ts`

**수정**

- `app/mentor/page.tsx` — 폼 내장, 조회를 `listQuestions`로, FAQ 문구
- `app/mentor/[id]/page.tsx` — 조회를 `getQuestion`으로, 관리자에게만 성별·이메일 표시
- `app/mentor/actions.ts` — `consultDb` 호출, 성별 검증, 메일 발송
- `components/QuestionForm.tsx` — 제목 라벨, 성별 필드, 안내 문구, 성공 시 초기화
- `components/BoardViewerBar.tsx` — "질문하기" 버튼 제거, 로그아웃을 서버 액션으로
- `components/QuestionActions.tsx` — 바뀐 액션 시그니처 반영
- `components/ContactForm.tsx` — 이메일 답장 안내 문구
- `lib/consult.ts` — `Gender` 타입·라벨 추가, 타입 정리
- `supabase/migrations/20260930000000_consult_board.sql`, `.env.local.example`, `README.md`, `package.json`

**삭제**

- `proxy.ts`, `app/auth/`, `app/login/`, `app/mentor/new/`, `components/LoginButtons.tsx`, `lib/supabase/client.ts`, `lib/supabase/config.ts`, `lib/supabase/server.ts`, `lib/safeNextPath.ts`(다른 사용처가 없을 때)
- 의존성 `@supabase/ssr`

새로 설치할 패키지는 없다.

## 5. 환경변수

| 이름 | 용도 |
|---|---|
| `SUPABASE_URL` | 프로젝트 URL |
| `SUPABASE_SECRET_KEY` | secret(service_role) 키. 서버 전용, `NEXT_PUBLIC_` 금지 |
| `IP_HASH_SALT` | 기존 유지 |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | 기존 유지 |
| `NEXT_PUBLIC_SITE_URL` | `https://react-five-lemon.vercel.app` |

삭제: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## 6. 외부 설정 (직접 해야 하는 일)

1. **Supabase 키 복사**: 프로젝트(`sealove143's Project`) → Project Settings → API Keys에서 secret 키, Data API에서 Project URL을 복사해 `.env.local`에 넣는다.
2. **SQL 실행**: SQL Editor에 마이그레이션 파일 전체를 붙여 넣고 실행한다.
3. **관리자 지정**: 사이트에서 선장 이메일로 가입한 뒤 SQL Editor에서 3.1의 `update users ...` 한 줄을 실행한다.
4. **Vercel**(프로젝트 `react`): 5장의 환경변수를 등록하고 재배포한다.

구글·카카오 개발자 콘솔 설정은 필요 없다.

## 7. 작업 순서

1. `node_modules/next/dist/docs/`에서 Next 16의 쿠키·서버 액션 규칙 확인
2. 마이그레이션 SQL 재작성
3. `lib/supabase/admin.ts`, `lib/auth/*`
4. 가입·로그인·로그아웃 액션과 `AuthForm`
5. `lib/consultDb.ts`, `actions.ts`를 새 계층으로 교체
6. `/mentor` 페이지에 폼 내장, 라벨·성별·안내 문구 반영, 옛 페이지 제거
7. 알림 메일
8. 옛 Supabase Auth 파일·환경변수 정리, README·`.env.local.example` 갱신
9. 검증 (8장)

## 8. 검증

- `npm run lint`, `npm run build`
- 권한 시나리오를 로컬 Postgres(PGlite)와 `consultDb` 함수 단위로 확인
  - 비로그인: 목록 열람 가능, 작성·신고 불가, 비공개 글 상세 접근 불가
  - 일반 사용자: 본인 글 작성·삭제, 남의 비공개 글 열람 불가, 답변 작성 불가, 응답에 `gender` 없음
  - 관리자: 답변·숨김 가능, 성별·이메일 조회 가능
  - 도배 제한(10분 3건), 신고 3건 자동 숨김
  - 틀린 비밀번호 반복 시 잠금, 로그아웃 후 세션 무효
  - anon 키로 Data API를 직접 호출하면 권한 오류가 나는지
- 수동: 가입 → 성별 미선택 시 제출 차단 → 등록 후 아래 목록에 표시 → 다른 브라우저(비로그인)에서도 보임, 비공개 글은 자물쇠만 → Gmail에 "한마디" 제목으로 메일 도착 → 답장 버튼의 받는 사람이 질문자 이메일인지

## 9. 확정된 결정

| 항목 | 결정 |
|---|---|
| 로그인 | 이메일·비밀번호 (구글·카카오는 도메인 연결 후 필요하면 추가) |
| 공개/비공개 | 작성자가 질문마다 선택. 비공개 글은 목록에 자물쇠 자리만, 내용은 작성자와 선장만 |
| 성별 | 남성/여성/기타, 질문마다 필수, 선장에게만 표시 |
| 관리자 계정 | `powertmdwn351@gmail.com`, 가입 후 SQL로 지정 |
| 알림 메일 수신 | `powertmdwn351@gmail.com` (Resend 계정 이메일과 동일) |
| 이메일 답장 | 알림 메일의 답장 주소를 질문자 이메일로 설정, 선장이 Gmail에서 직접 답장 |
| 범위 제외 | 이메일 인증, 비밀번호 자동 재설정, 답변 자동 알림 (도메인 인증 후) |
