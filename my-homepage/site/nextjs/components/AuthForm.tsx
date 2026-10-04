"use client";

import { useActionState, useState } from "react";

import { signIn, signUp, type AuthState } from "@/app/mentor/authActions";
import { PASSWORD_MAX, PASSWORD_MIN } from "@/lib/consult";

type Mode = "signin" | "signup";

export default function AuthForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [signInState, signInAction, signInPending] = useActionState<AuthState, FormData>(signIn, {});
  const [signUpState, signUpAction, signUpPending] = useActionState<AuthState, FormData>(signUp, {});
  // React는 액션이 끝나면 폼을 비운다. 실패했을 때 이메일을 다시 치지 않도록 값을 직접 들고 있는다.
  const [email, setEmail] = useState("");

  const isSignUp = mode === "signup";
  const state = isSignUp ? signUpState : signInState;
  const pending = signInPending || signUpPending;

  return (
    <form className="board-form auth-form" action={isSignUp ? signUpAction : signInAction}>
      <p className="board-note">
        질문을 남기려면 먼저 로그인해 주세요. 처음이라면 이메일과 비밀번호만 정하면 바로 가입됩니다.
      </p>
      <div className="auth-tabs" role="tablist" aria-label="로그인 또는 회원가입">
        <button type="button" role="tab" aria-selected={!isSignUp} onClick={() => setMode("signin")}>
          로그인
        </button>
        <button type="button" role="tab" aria-selected={isSignUp} onClick={() => setMode("signup")}>
          회원가입
        </button>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="authEmail">이메일</label>
        <input
          type="email"
          id="authEmail"
          name="email"
          required
          maxLength={254}
          autoComplete="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="field-row">
        <div>
          <label htmlFor="authPassword">비밀번호</label>
          <input
            type="password"
            id="authPassword"
            name="password"
            required
            minLength={PASSWORD_MIN}
            maxLength={PASSWORD_MAX}
            autoComplete={isSignUp ? "new-password" : "current-password"}
          />
        </div>
        <div>
          <label htmlFor="authPasswordConfirm">비밀번호 확인</label>
          <input
            type="password"
            id="authPasswordConfirm"
            name="passwordConfirm"
            required
            minLength={PASSWORD_MIN}
            maxLength={PASSWORD_MAX}
            autoComplete={isSignUp ? "new-password" : "current-password"}
          />
        </div>
      </div>
      {/* 봇 차단용 숨김 필드 — 사람에게는 보이지 않는다. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="authWebsite">웹사이트</label>
        <input type="text" id="authWebsite" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <p className="board-note">
        {isSignUp
          ? `비밀번호는 ${PASSWORD_MIN}자 이상으로 정해 주세요. 답장이 이 이메일로 갈 수 있으니 주소를 정확히 적어 주세요. 이메일은 게시판에 공개되지 않습니다.`
          : "비밀번호를 잊으셨다면 섭외 문의 페이지로 알려 주세요."}
      </p>
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "확인 중…" : isSignUp ? "가입하고 질문 쓰기" : "로그인"}
      </button>
      {state.error && (
        <div className="form-status is-error" role="alert">
          <strong>✕ {state.error}</strong>
        </div>
      )}
    </form>
  );
}
