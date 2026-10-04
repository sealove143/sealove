import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { cookies } from "next/headers";
import { cache } from "react";

import { supabaseAdmin } from "@/lib/supabase/admin";

const SESSION_COOKIE = "consult_session";
const SESSION_DAYS = 30;

export interface Viewer {
  id: string;
  email: string;
  nickname: string;
  isAdmin: boolean;
}

// DB에는 토큰의 해시만 둔다. 쿠키의 원문 토큰은 서버 어디에도 저장하지 않는다.
function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string) {
  if (!supabaseAdmin) return false;

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const { error } = await supabaseAdmin
    .from("sessions")
    .insert({ token_hash: hashToken(token), user_id: userId, expires_at: expiresAt.toISOString() });
  if (error) {
    console.error("[auth] session insert failed:", error);
    return false;
  }

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return true;
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token && supabaseAdmin) {
    await supabaseAdmin.from("sessions").delete().eq("token_hash", hashToken(token));
  }
  cookieStore.delete(SESSION_COOKIE);
}

/** 로그인한 방문자. 비로그인이거나 세션이 만료됐으면 null. 한 요청 안에서는 한 번만 조회한다. */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  // 설정 여부와 상관없이 쿠키를 먼저 읽어, 이 함수를 쓰는 페이지가 빌드 때 정적으로 굳지 않게 한다.
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || !supabaseAdmin) return null;

  const { data } = await supabaseAdmin
    .from("sessions")
    .select("expires_at, users(id, email, nickname, role)")
    .eq("token_hash", hashToken(token))
    .maybeSingle();
  const session = data as unknown as {
    expires_at: string;
    users: { id: string; email: string; nickname: string; role: "user" | "admin" } | null;
  } | null;

  if (!session?.users || new Date(session.expires_at) <= new Date()) return null;

  const { id, email, nickname, role } = session.users;
  return { id, email, nickname, isAdmin: role === "admin" };
});
