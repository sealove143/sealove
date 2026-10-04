"use client";

import { useActionState, useState } from "react";

import { createQuestion, type ActionState } from "@/app/mentor/actions";
import { BODY_MAX, BODY_MIN, CATEGORIES, GENDERS, TITLE_MAX, type Gender } from "@/lib/consult";

interface Props {
  nickname: string;
  email: string;
  /** 가입 때 고른 성별. 미리 골라 두되 질문마다 바꿀 수 있다. */
  defaultGender: Gender | null;
}

export default function QuestionForm({ nickname, email, defaultGender }: Props) {
  // React는 액션이 끝나면 폼을 비운다. 실패했을 때 쓴 내용이 사라지지 않도록 값을 직접 들고 있는다.
  const [title, setTitle] = useState("");
  const [gender, setGender] = useState<string>(defaultGender ?? "");
  const [category, setCategory] = useState("career");
  const [visibility, setVisibility] = useState("public");
  const [body, setBody] = useState("");

  const [state, formAction, pending] = useActionState<ActionState, FormData>(async (prev, formData) => {
    const result = await createQuestion(prev, formData);
    // 올라간 뒤에는 다음 질문을 쓸 수 있게 비운다.
    if (result.ok) {
      setTitle("");
      setGender(defaultGender ?? "");
      setVisibility("public");
      setBody("");
    }
    return result;
  }, {});

  return (
    <form className="board-form" action={formAction}>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="qTitle">자신의 궁금증을 한마디로 표현하면 무엇일까?</label>
        <input
          type="text"
          id="qTitle"
          name="title"
          required
          minLength={2}
          maxLength={TITLE_MAX}
          placeholder="예) 비전공자도 해기사가 될 수 있을까요?"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="field-row">
        <fieldset className="visibility-field">
          <legend>성별 (필수 · 선장님에게만 보여요)</legend>
          {Object.entries(GENDERS).map(([key, label]) => (
            <label key={key} className="radio">
              <input
                type="radio"
                name="gender"
                value={key}
                required
                checked={gender === key}
                onChange={() => setGender(key)}
              />
              {label}
            </label>
          ))}
        </fieldset>
        <fieldset className="visibility-field">
          <legend>공개 설정</legend>
          <label className="radio">
            <input type="radio" name="visibility" value="public"
              checked={visibility === "public"}
              onChange={() => setVisibility("public")}
            />
            공개
          </label>
          <label className="radio">
            <input type="radio" name="visibility" value="private"
              checked={visibility === "private"}
              onChange={() => setVisibility("private")}
            />
            🔒 비공개 (나와 선장님만)
          </label>
        </fieldset>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="qCategory">분류</label>
        <select id="qCategory" name="category" value={category} onChange={(e) => setCategory(e.target.value)}>
          {Object.entries(CATEGORIES).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div style={{ marginBottom: 6 }}>
        <label htmlFor="qBody">내용</label>
        <textarea
          id="qBody"
          name="body"
          required
          minLength={BODY_MIN}
          maxLength={BODY_MAX}
          style={{ minHeight: 200 }}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </div>
      <div className="board-count">
        {body.length} / {BODY_MAX}
      </div>
      {/* 봇 차단용 숨김 필드 — 사람에게는 보이지 않는다. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="qWebsite">웹사이트</label>
        <input type="text" id="qWebsite" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <p className="board-note">
        <b>{nickname}</b> 이름으로 올라가요. 답변은 이 게시판에 달리고, 가입하신 이메일(<b>{email}</b>)로 답장이 갈
        수도 있어요. 욕설·광고·도배 글은 예고 없이 숨겨지고, 반복되면 이용이 제한됩니다.
      </p>
      <button className="btn btn-primary" type="submit" disabled={pending}>
        {pending ? "올리는 중…" : "질문 올리기"}
      </button>
      {state.ok && (
        <div className="form-status is-ok" role="status">
          <strong>✓ {state.ok}</strong>
        </div>
      )}
      {state.error && (
        <div className="form-status is-error" role="alert">
          <strong>✕ 질문이 올라가지 않았어요.</strong>
          {state.error}
        </div>
      )}
    </form>
  );
}
