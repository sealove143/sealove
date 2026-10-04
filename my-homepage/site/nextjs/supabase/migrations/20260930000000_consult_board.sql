-- 항해 상담실 게시판
-- Supabase 대시보드 > SQL Editor에 이 파일 전체를 붙여 넣고 한 번 실행한다.
--
-- RLS와 Supabase Auth는 쓰지 않는다. 테이블은 서버(Next.js)가 secret 키로만 접근하고,
-- 누가 무엇을 볼 수 있는지는 lib/consultDb.ts가 판단한다. 대신 공개(anon) 키로는
-- 아무것도 못 하도록 아래에서 권한을 전부 회수한다.

-- ───────── 예전 버전 정리 (다시 실행해도 안전하도록) ─────────
drop view  if exists public.question_list;
drop table if exists public.moderation_logs, public.question_reports, public.answers,
                     public.questions, public.sessions, public.users, public.profiles cascade;
drop function if exists public.is_admin(), public.is_client_request(), public.handle_new_user(),
                        public.questions_before_insert(), public.questions_before_update(),
                        public.answers_sync_status(), public.touch_updated_at(),
                        public.reports_auto_hide(), public.increment_question_view(bigint),
                        public.delete_own_question(bigint) cascade;
drop type if exists public.user_role, public.user_gender, public.question_visibility,
                    public.question_status, public.question_category cascade;

-- ───────── 열거형 ─────────
create type public.user_role as enum ('user', 'admin');
create type public.user_gender as enum ('male', 'female', 'other');
create type public.question_visibility as enum ('public', 'private');
create type public.question_status as enum ('open', 'answered', 'hidden', 'deleted');
create type public.question_category as enum ('career', 'school', 'onboard', 'license', 'life', 'etc');

-- ───────── 테이블 ─────────
create table public.users (
  id            uuid primary key default gen_random_uuid(),
  -- 소문자로 정규화해 저장한다. 게시판에는 드러나지 않고 답장을 보낼 때만 쓴다.
  email         text not null unique check (email = lower(email) and char_length(email) <= 254),
  -- scrypt 해시 ("salt:hash"). 원문 비밀번호는 어디에도 저장하지 않는다.
  password_hash text not null,
  nickname      text not null unique check (char_length(nickname) between 2 and 20),
  role          public.user_role not null default 'user',
  is_banned     boolean not null default false,
  banned_reason text,
  -- 비밀번호 무차별 대입 방어
  failed_logins integer not null default 0,
  locked_until  timestamptz,
  created_at    timestamptz not null default now()
);

create table public.sessions (
  -- 쿠키에 담긴 토큰의 SHA-256. DB가 새어도 로그인 쿠키를 만들어 낼 수 없다.
  token_hash text primary key,
  user_id    uuid not null references public.users(id) on delete cascade,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index sessions_user_idx on public.sessions (user_id);

create table public.questions (
  id          bigint generated always as identity primary key,
  author_id   uuid not null references public.users(id) on delete cascade,
  category    public.question_category not null default 'etc',
  title       text not null check (char_length(title) between 2 and 100),
  body        text not null check (char_length(body) between 10 and 5000),
  -- 선장(관리자)에게만 보인다.
  gender      public.user_gender not null,
  visibility  public.question_visibility not null default 'public',
  status      public.question_status not null default 'open',
  view_count  integer not null default 0,
  -- 공격 대응용. 원본 IP는 저장하지 않고 서버 비밀 솔트로 만든 해시만 남긴다.
  ip_hash     text,
  user_agent  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  deleted_at  timestamptz
);

create index questions_list_idx   on public.questions (status, created_at desc);
create index questions_author_idx on public.questions (author_id, created_at desc);
create index questions_ip_idx     on public.questions (ip_hash, created_at desc);

create table public.answers (
  id          bigint generated always as identity primary key,
  question_id bigint not null unique references public.questions(id) on delete cascade,
  author_id   uuid not null references public.users(id),
  body        text not null check (char_length(body) between 1 and 10000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.question_reports (
  id          bigint generated always as identity primary key,
  question_id bigint not null references public.questions(id) on delete cascade,
  reporter_id uuid not null references public.users(id) on delete cascade,
  reason      text not null check (char_length(reason) between 2 and 500),
  created_at  timestamptz not null default now(),
  unique (question_id, reporter_id)
);

create table public.moderation_logs (
  id          bigint generated always as identity primary key,
  admin_id    uuid not null references public.users(id),
  target_type text not null check (target_type in ('question', 'user')),
  target_id   text not null,
  action      text not null,
  note        text,
  created_at  timestamptz not null default now()
);

-- ───────── 질문: 쓰기 방어 트리거 ─────────
-- 서버 코드에 실수가 있어도 차단 계정의 글쓰기와 도배는 DB가 막는다.
create function public.questions_before_insert() returns trigger
language plpgsql set search_path = public as $$
begin
  if exists (select 1 from users where id = new.author_id and is_banned) then
    raise exception 'banned' using errcode = 'P0001';
  end if;
  if (select count(*) from questions
      where author_id = new.author_id and created_at > now() - interval '10 minutes') >= 3 then
    raise exception 'rate_limited_short' using errcode = 'P0001';
  end if;
  if (select count(*) from questions
      where author_id = new.author_id and created_at > now() - interval '1 day') >= 10 then
    raise exception 'rate_limited_daily' using errcode = 'P0001';
  end if;

  new.status     := 'open';
  new.view_count := 0;
  new.created_at := now();
  new.updated_at := now();
  new.deleted_at := null;
  return new;
end;
$$;

create trigger questions_before_insert
  before insert on public.questions
  for each row execute function public.questions_before_insert();

create function public.questions_before_update() returns trigger
language plpgsql as $$
begin
  if new.status = 'deleted' and old.status <> 'deleted' then
    new.deleted_at := now();
  end if;
  -- 조회수만 오른 경우에는 수정 시각을 건드리지 않는다.
  if new.view_count = old.view_count then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger questions_before_update
  before update on public.questions
  for each row execute function public.questions_before_update();

-- ───────── 답변이 달리거나 지워지면 질문 상태를 맞춘다 ─────────
create function public.answers_sync_status() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    update questions set status = 'answered' where id = new.question_id and status = 'open';
    return new;
  end if;
  update questions set status = 'open' where id = old.question_id and status = 'answered';
  return old;
end;
$$;

create trigger answers_after_change
  after insert or delete on public.answers
  for each row execute function public.answers_sync_status();

create function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger answers_before_update
  before update on public.answers
  for each row execute function public.touch_updated_at();

-- ───────── 신고가 3건 쌓이면 자동으로 숨긴다 ─────────
create function public.reports_auto_hide() returns trigger
language plpgsql set search_path = public as $$
begin
  if (select count(*) from question_reports where question_id = new.question_id) >= 3 then
    update questions set status = 'hidden'
    where id = new.question_id and status in ('open', 'answered');
  end if;
  return new;
end;
$$;

create trigger reports_after_insert
  after insert on public.question_reports
  for each row execute function public.reports_auto_hide();

-- ───────── 조회수 ─────────
-- 동시에 여러 명이 열어도 숫자가 빠지지 않도록 DB에서 한 번에 올린다.
-- 볼 권한이 있는지는 호출하는 서버 코드가 먼저 확인한다.
create function public.increment_question_view(p_id bigint) returns void
language sql set search_path = public as $$
  update questions set view_count = view_count + 1
  where id = p_id and status in ('open', 'answered');
$$;

-- ───────── 권한: 서버(secret 키 = service_role)만 접근 ─────────
-- RLS를 켜지 않았으므로, 공개 키(anon)와 로그인 사용자(authenticated) 역할의 권한을
-- 전부 회수해 Data API로 테이블을 직접 읽고 쓰지 못하게 한다.
revoke all on all tables    in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

-- 나중에 만드는 테이블·함수에도 같은 규칙이 적용되도록 기본 권한도 바꾼다.
alter default privileges in schema public revoke all on tables    from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon, authenticated;

grant all on all tables    in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- ───────── 관리자 지정 ─────────
-- 사이트에서 선장님 이메일로 가입한 뒤 아래 줄을 실행한다. (이메일 인증이 없으므로
-- 이메일만 보고 자동으로 관리자를 주지 않는다.)
-- update public.users set role = 'admin' where email = 'powertmdwn351@gmail.com';

-- ───────── 운영에 쓰는 쿼리 ─────────
-- 사용자 차단:      update public.users set is_banned = true, banned_reason = '...' where nickname = '선원000000';
-- 로그인 잠금 해제: update public.users set failed_logins = 0, locked_until = null where email = '...';
-- 비밀번호 초기화:  해당 사용자의 행을 지우면(글도 함께 지워짐) 같은 이메일로 다시 가입할 수 있다.
--                   글을 남기려면 서버에서 새 해시를 만들어 password_hash에 넣는다.
-- 만료 세션 청소:   delete from public.sessions where expires_at < now();
