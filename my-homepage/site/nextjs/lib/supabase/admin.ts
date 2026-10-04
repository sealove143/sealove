import "server-only";

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

/**
 * 서버 전용 Supabase 클라이언트. secret 키로 접속하므로 모든 테이블을 읽고 쓸 수 있다.
 * RLS를 쓰지 않기 때문에 "누가 무엇을 볼 수 있는가"는 이 클라이언트를 부르는 쪽
 * (lib/consultDb.ts, lib/auth/)이 책임진다. 환경변수가 없으면 null이다.
 */
export const supabaseAdmin =
  SUPABASE_URL && SUPABASE_SECRET_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
