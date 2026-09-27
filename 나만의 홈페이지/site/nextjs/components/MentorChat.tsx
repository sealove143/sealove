"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";

import type { ChatTurn } from "@/lib/types";

interface Bubble {
  id: number;
  role: "user" | "captain";
  text: string;
}

interface StreamPayload {
  type: "text" | "error" | "done";
  delta?: string;
  message?: string;
}

let bubbleId = 0;

export default function MentorChat() {
  const [messages, setMessages] = useState<Bubble[]>([]);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [intakeLocked, setIntakeLocked] = useState(false);
  const [mGender, setMGender] = useState("");
  const [mAge, setMAge] = useState("20대");
  const [mSituation, setMSituation] = useState("");

  const turnsRef = useRef<ChatTurn[]>([]);
  const chatLogRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const question = chatInput.trim();
    if (!question) return;

    setBusy(true);
    setChatInput("");
    setStatus("");
    setIntakeLocked(true);
    setMessages((prev) => [...prev, { id: ++bubbleId, role: "user", text: question }]);

    turnsRef.current = [...turnsRef.current, { role: "user", content: question }];

    const targetId = ++bubbleId;
    setMessages((prev) => [...prev, { id: targetId, role: "captain", text: "" }]);
    setStatus("선장님이 답변을 준비 중이에요…");

    let accumulated = "";
    let receivedText = false;

    const rollbackLastUserTurn = () => {
      turnsRef.current = turnsRef.current.slice(0, -1);
    };

    try {
      const res = await fetch("/api/mentor", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: turnsRef.current,
          profile: { gender: mGender, age: mAge, situation: mSituation },
        }),
      });

      if (!res.ok || !res.body) {
        let message = "잠시 문제가 생겼어요. 다시 시도해 주세요.";
        try {
          const data = (await res.json()) as { error?: string };
          if (data?.error) message = data.error;
        } catch {
          // 응답 본문이 JSON이 아닌 경우 기본 메시지를 사용한다.
        }
        setMessages((prev) => prev.filter((m) => m.id !== targetId));
        rollbackLastUserTurn();
        setStatus(message);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const line = frame.trim();
          if (!line.startsWith("data:")) continue;
          const jsonText = line.slice(5).trim();
          if (!jsonText) continue;

          let payload: StreamPayload;
          try {
            payload = JSON.parse(jsonText) as StreamPayload;
          } catch {
            continue;
          }

          if (payload.type === "text" && payload.delta) {
            receivedText = true;
            accumulated += payload.delta;
            setStatus("");
            setMessages((prev) =>
              prev.map((m) => (m.id === targetId ? { ...m, text: accumulated } : m)),
            );
          } else if (payload.type === "error") {
            if (!receivedText) {
              setMessages((prev) => prev.filter((m) => m.id !== targetId));
              rollbackLastUserTurn();
            }
            setStatus(payload.message || "잠시 문제가 생겼어요. 다시 시도해 주세요.");
          }
        }
      }

      if (receivedText) {
        turnsRef.current = [...turnsRef.current, { role: "assistant", content: accumulated }];
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== targetId));
      rollbackLastUserTurn();
      setStatus("네트워크 연결에 문제가 있어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mentor-panel">
      <div className="mentor-header">
        <div className="mentor-avatar">
          <Image src="/images/portrait-2.jpg" alt="김승주 선장" fill sizes="52px" style={{ objectFit: "cover" }} />
        </div>
        <div>
          <div className="mentor-header-name">김승주 선장과의 항해 상담</div>
          <div className="mentor-header-sub">AI가 실제 경력을 바탕으로 답변합니다</div>
        </div>
      </div>

      <div className="mentor-intake" style={intakeLocked ? { opacity: 0.5 } : undefined}>
        <div className="field-row">
          <div>
            <label htmlFor="mGender">성별 (선택)</label>
            <select
              id="mGender"
              value={mGender}
              disabled={intakeLocked}
              onChange={(e) => setMGender(e.target.value)}
            >
              <option value="">응답하지 않음</option>
              <option value="여성">여성</option>
              <option value="남성">남성</option>
              <option value="기타">기타</option>
            </select>
          </div>
          <div>
            <label htmlFor="mAge">나이대</label>
            <select id="mAge" value={mAge} disabled={intakeLocked} onChange={(e) => setMAge(e.target.value)}>
              <option value="10대">10대</option>
              <option value="20대">20대</option>
              <option value="30대">30대</option>
              <option value="40대 이상">40대 이상</option>
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="mSituation">지금 상황이나 고민을 들려주세요</label>
          <textarea
            id="mSituation"
            placeholder="예: 해양대 진학을 고민 중인데 여성으로서 잘 적응할 수 있을지 걱정돼요."
            value={mSituation}
            disabled={intakeLocked}
            onChange={(e) => setMSituation(e.target.value)}
          />
        </div>
      </div>

      <div className="chat-log" ref={chatLogRef}>
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble ${m.role === "user" ? "user" : "captain"}`}>
            {m.role !== "user" && <b className="who">김승주 선장 (AI)</b>}
            <span>{m.text}</span>
          </div>
        ))}
      </div>

      <div className="chat-status">{status}</div>

      <form className="chat-composer" onSubmit={handleSubmit}>
        <textarea
          placeholder="선장님께 질문을 남겨보세요"
          required
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
        />
        <button className="btn btn-primary" type="submit" disabled={busy}>
          질문하기
        </button>
      </form>

      <div className="mentor-note">
        답변은 참고용 AI 상담이며, 실제 김승주 선장의 답변이 아닙니다. 진로에 대한 중요한 결정은 실제
        상담·강연을 통해 확인해 주세요.
      </div>
    </div>
  );
}
