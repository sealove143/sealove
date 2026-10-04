"use client";

import { useActionState, useState, useTransition } from "react";

import {
  deleteQuestion,
  moderateQuestion,
  reportQuestion,
  saveAnswer,
  type ActionState,
} from "@/app/mentor/actions";

function StatusMessage({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <div className="form-status is-error" role="alert">
        <strong>✕ {state.error}</strong>
      </div>
    );
  }
  if (state.ok) {
    return (
      <div className="form-status is-ok" role="status">
        <strong>✓ {state.ok}</strong>
      </div>
    );
  }
  return null;
}

export function DeleteQuestionButton({ questionId }: { questionId: number }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState>({});

  function handleClick() {
    if (!window.confirm("이 질문을 삭제할까요? 삭제한 질문은 되돌릴 수 없어요.")) return;
    startTransition(async () => {
      setState(await deleteQuestion(questionId));
    });
  }

  return (
    <>
      <button type="button" className="btn btn-ghost btn-danger" disabled={pending} onClick={handleClick}>
        {pending ? "삭제 중…" : "삭제"}
      </button>
      {state.error && <StatusMessage state={state} />}
    </>
  );
}

export function ReportForm({ questionId }: { questionId: number }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [state, formAction, pending] = useActionState<ActionState, FormData>(reportQuestion, {});

  if (state.ok) return <StatusMessage state={state} />;

  if (!open) {
    return (
      <button type="button" className="board-text-btn report-toggle" onClick={() => setOpen(true)}>
        이 질문 신고하기
      </button>
    );
  }

  return (
    <form action={formAction} className="report-form">
      <input type="hidden" name="questionId" value={questionId} />
      <label htmlFor="reportReason">신고 사유</label>
      <input
        type="text"
        id="reportReason"
        name="reason"
        required
        minLength={2}
        maxLength={500}
        placeholder="예) 광고, 욕설, 개인정보 노출"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />
      <div className="board-actions" style={{ marginTop: 10 }}>
        <button type="button" className="btn btn-ghost" onClick={() => setOpen(false)}>
          취소
        </button>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "접수 중…" : "신고하기"}
        </button>
      </div>
      <StatusMessage state={state} />
    </form>
  );
}

export function AdminAnswerForm({ questionId, initialBody }: { questionId: number; initialBody: string }) {
  const [body, setBody] = useState(initialBody);
  const [state, formAction, pending] = useActionState<ActionState, FormData>(saveAnswer, {});

  return (
    <form action={formAction}>
      <input type="hidden" name="questionId" value={questionId} />
      <label htmlFor="answerBody">{initialBody ? "답변 고치기" : "답변 달기"}</label>
      <textarea
        id="answerBody"
        name="body"
        required
        maxLength={10000}
        style={{ minHeight: 180 }}
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="board-actions" style={{ marginTop: 10 }}>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? "저장 중…" : "답변 저장"}
        </button>
      </div>
      <StatusMessage state={state} />
    </form>
  );
}

export function AdminModeration({ questionId, hidden }: { questionId: number; hidden: boolean }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState>({});

  function toggle() {
    startTransition(async () => {
      setState(await moderateQuestion(questionId, hidden ? "unhide" : "hide"));
    });
  }

  return (
    <div style={{ marginTop: 22 }}>
      <button type="button" className="btn btn-ghost" disabled={pending} onClick={toggle}>
        {hidden ? "숨김 해제" : "이 질문 숨기기"}
      </button>
      <StatusMessage state={state} />
    </div>
  );
}
