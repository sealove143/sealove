"use server";

import { refresh } from "next/cache";
import { headers } from "next/headers";

import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession } from "@/lib/auth/session";
import { isGender, NAME_MAX, NAME_MIN, PASSWORD_MAX, PASSWORD_MIN } from "@/lib/consult";
import { checkRateLimit } from "@/lib/rateLimit";
import { supabaseAdmin } from "@/lib/supabase/admin";

export type AuthState = { error?: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

const NOT_READY = "게시판을 준비하고 있어요. 잠시 후 다시 시도해 주세요.";
const WRONG_CREDENTIALS = "이메일 또는 비밀번호가 맞지 않아요.";

async function isRateLimited() {
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return !checkRateLimit(`auth:${ip}`).allowed;
}

// 비밀번호 확인란은 가입할 때만 받는다. 로그인은 저장된 해시와 비교하므로 필요 없다.
function readCredentials(formData: FormData, confirm: boolean): { email: string; password: string } | { error: string } {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!EMAIL_PATTERN.test(email) || email.length > 254) return { error: "이메일 주소를 정확히 입력해 주세요." };
  if (password.length < PASSWORD_MIN || password.length > PASSWORD_MAX) {
    return { error: `비밀번호는 ${PASSWORD_MIN}~${PASSWORD_MAX}자로 입력해 주세요.` };
  }
  if (confirm && password !== String(formData.get("passwordConfirm") ?? "")) {
    return { error: "비밀번호와 비밀번호 확인이 서로 달라요." };
  }
  return { email, password };
}

// 실제로 있는 날짜이고(2월 30일 같은 값 제외) 1900년부터 오늘 사이여야 한다.
function isValidBirthDate(value: string) {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
  return value >= "1900-01-01" && value <= new Date().toISOString().slice(0, 10);
}

// 이메일이 게시판에 드러나지 않도록 닉네임은 무작위로 만든다.
function randomNickname() {
  return `선원${String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0")}`;
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!supabaseAdmin) return { error: NOT_READY };
  // 봇 차단용 숨김 필드.
  if (formData.get("website")) return {};
  if (await isRateLimited()) return { error: "시도가 너무 잦아요. 1분 뒤에 다시 시도해 주세요." };

  const name = String(formData.get("name") ?? "").trim();
  const gender = formData.get("gender");
  if (name.length < NAME_MIN || name.length > NAME_MAX) return { error: `성명은 ${NAME_MIN}~${NAME_MAX}자로 입력해 주세요.` };
  if (!isGender(gender)) return { error: "성별을 선택해 주세요." };
  const birthDate = String(formData.get("birthDate") ?? "");
  if (!isValidBirthDate(birthDate)) return { error: "생년월일을 정확히 입력해 주세요." };

  const input = readCredentials(formData, true);
  if ("error" in input) return input;

  const passwordHash = await hashPassword(input.password);

  // 닉네임이 겹치면(unique 위반) 다른 닉네임으로 몇 번 더 시도한다.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from("users")
      .insert({ email: input.email, password_hash: passwordHash, nickname: randomNickname(), name, gender, birth_date: birthDate })
      .select("id")
      .single();

    if (data) {
      if (!(await createSession(data.id as string))) return { error: "가입은 됐지만 로그인하지 못했어요. 로그인해 주세요." };
      refresh();
      return {};
    }
    if (error?.code === "23505" && error.message.includes("email")) {
      return { error: "이미 가입된 이메일이에요. '로그인'으로 들어와 주세요." };
    }
    if (error?.code !== "23505") {
      console.error("[auth] sign up failed:", error);
      break;
    }
  }
  return { error: "가입하지 못했어요. 잠시 후 다시 시도해 주세요." };
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!supabaseAdmin) return { error: NOT_READY };
  if (formData.get("website")) return {};
  if (await isRateLimited()) return { error: "시도가 너무 잦아요. 1분 뒤에 다시 시도해 주세요." };

  const input = readCredentials(formData, false);
  if ("error" in input) return input;

  const { data } = await supabaseAdmin
    .from("users")
    .select("id, password_hash, failed_logins, locked_until")
    .eq("email", input.email)
    .maybeSingle();
  const user = data as { id: string; password_hash: string; failed_logins: number; locked_until: string | null } | null;

  // 없는 이메일과 틀린 비밀번호를 같은 문장으로 답해, 가입 여부를 알아낼 수 없게 한다.
  if (!user) return { error: WRONG_CREDENTIALS };
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return { error: `비밀번호를 여러 번 틀려 잠시 잠겼어요. ${LOCK_MINUTES}분 뒤에 다시 시도해 주세요.` };
  }

  if (!(await verifyPassword(input.password, user.password_hash))) {
    const failed = user.failed_logins + 1;
    const locked = failed >= MAX_FAILED_LOGINS;
    await supabaseAdmin
      .from("users")
      .update({
        failed_logins: locked ? 0 : failed,
        locked_until: locked ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString() : null,
      })
      .eq("id", user.id);
    return { error: WRONG_CREDENTIALS };
  }

  if (user.failed_logins > 0 || user.locked_until) {
    await supabaseAdmin.from("users").update({ failed_logins: 0, locked_until: null }).eq("id", user.id);
  }
  if (!(await createSession(user.id))) return { error: "로그인하지 못했어요. 잠시 후 다시 시도해 주세요." };

  refresh();
  return {};
}

export async function signOut() {
  await destroySession();
  refresh();
}
