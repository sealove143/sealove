"use client";

import { useState, type FormEvent } from "react";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

export default function ContactForm() {
  const [cType, setCType] = useState("강연");
  const [cDate, setCDate] = useState("");
  const [cDetail, setCDetail] = useState("");
  const [cReply, setCReply] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const detail = cDetail.trim();
    const reply = cReply.trim();
    if (!detail || !reply || status.kind === "sending") return;

    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: cType, date: cDate, detail, reply, website }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus({ kind: "error", message: data.error ?? "메일 전송에 실패했어요. 잠시 후 다시 시도해 주세요." });
        return;
      }
      setStatus({ kind: "sent" });
      setCDetail("");
      setCDate("");
    } catch {
      setStatus({ kind: "error", message: "네트워크 연결에 문제가 있어요. 잠시 후 다시 시도해 주세요." });
    }
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="field-row">
        <div>
          <label htmlFor="cType">문의 종류</label>
          <select id="cType" value={cType} onChange={(e) => setCType(e.target.value)}>
            <option>강연</option>
            <option>방송 출연</option>
            <option>인터뷰</option>
            <option>기타</option>
          </select>
        </div>
        <div>
          <label htmlFor="cDate">희망 날짜</label>
          <input type="date" id="cDate" value={cDate} onChange={(e) => setCDate(e.target.value)} />
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="cDetail">문의 내용</label>
        <textarea
          id="cDetail"
          placeholder="행사 취지, 대상, 장소, 예산 등을 알려주세요"
          required
          maxLength={3000}
          value={cDetail}
          onChange={(e) => setCDetail(e.target.value)}
        />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label htmlFor="cReply">회신받을 연락처 (이메일 또는 전화)</label>
        <input
          type="text"
          id="cReply"
          placeholder="example@email.com"
          required
          maxLength={200}
          value={cReply}
          onChange={(e) => setCReply(e.target.value)}
        />
      </div>
      {/* 봇 차단용 숨김 필드 — 사람에게는 보이지 않는다. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", width: 1, height: 1, overflow: "hidden" }}>
        <label htmlFor="cWebsite">웹사이트</label>
        <input
          type="text"
          id="cWebsite"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      <button className="btn btn-primary" type="submit" disabled={status.kind === "sending"}>
        {status.kind === "sending" ? "보내는 중…" : "문의 보내기"}
      </button>
      {status.kind === "sent" && (
        <div className="form-status is-ok" role="status">
          <strong>✓ 발송이 완료되었습니다.</strong>
          검토 후 남겨주신 연락처로 회신드릴게요.
        </div>
      )}
      {status.kind === "error" && (
        <div className="form-status is-error" role="alert">
          <strong>✕ 발송이 완료되지 않았습니다.</strong>
          {status.message} 작성하신 내용은 그대로 남아 있으니 다시 보내주세요.
        </div>
      )}
    </form>
  );
}
