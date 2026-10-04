-- 회원가입 때 성명과 성별을 받는다.
-- Supabase 대시보드 > SQL Editor에 이 파일 전체를 붙여 넣고 한 번 실행한다.
--
-- 둘 다 선장(관리자)에게만 보인다. 이 변경 전에 가입한 계정은 값이 비어 있을 수 있어
-- 컬럼은 비워 둘 수 있게 하고, 필수 여부는 가입 폼과 서버 액션이 확인한다.
alter table public.users
  add column if not exists name   text check (char_length(name) between 2 and 30),
  add column if not exists gender public.user_gender;
