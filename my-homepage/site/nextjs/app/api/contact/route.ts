import type { NextRequest } from "next/server";

import { buildEmailHtml, escapeHtml } from "@/lib/emailHtml";
import { checkRateLimit } from "@/lib/rateLimit";
import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, resend } from "@/lib/resend";

export const runtime = "nodejs";

const CONTACT_TYPES = ["강연", "방송 출연", "인터뷰", "기타"];
const MAX_DETAIL_LENGTH = 3000;
const MAX_REPLY_LENGTH = 200;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

interface ContactRequestBody {
  type?: string;
  date?: string;
  detail?: string;
  reply?: string;
  // 봇 차단용 숨김 필드. 사람은 비워두고, 자동 입력 봇만 값을 채운다.
  website?: string;
}

function json(payload: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

export async function POST(req: NextRequest) {
  if (!resend) {
    return json({ error: "현재 문의 메일 발송 기능을 사용할 수 없어요. (서버에 메일 설정이 되어 있지 않습니다)" }, 503);
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || "unknown";
  const rate = checkRateLimit(`contact:${clientIp}`);
  if (!rate.allowed) {
    return json({ error: "문의가 너무 자주 전송되었어요. 잠시 후 다시 시도해 주세요." }, 429);
  }

  let body: ContactRequestBody;
  try {
    body = (await req.json()) as ContactRequestBody;
  } catch {
    return json({ error: "요청 형식이 올바르지 않습니다." }, 400);
  }

  // 봇이 숨김 필드를 채웠다면 성공한 것처럼 응답하고 메일은 보내지 않는다.
  if (body.website) {
    return json({ ok: true }, 200);
  }

  const type = CONTACT_TYPES.includes(body.type ?? "") ? body.type! : "기타";
  const date = DATE_PATTERN.test(body.date ?? "") ? body.date! : "날짜 미정";
  const detail = (body.detail ?? "").trim();
  const reply = (body.reply ?? "").trim();

  if (!detail || !reply) {
    return json({ error: "문의 내용과 회신받을 연락처를 모두 입력해 주세요." }, 400);
  }
  if (detail.length > MAX_DETAIL_LENGTH) {
    return json({ error: `문의 내용은 ${MAX_DETAIL_LENGTH}자 이내로 입력해 주세요.` }, 400);
  }
  if (reply.length > MAX_REPLY_LENGTH) {
    return json({ error: "회신받을 연락처가 너무 깁니다." }, 400);
  }

  const subject = `[${type}] 김승주 선장 섭외 문의 (${date})`;
  const receivedAt = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "long", timeStyle: "short" });
  const text = `문의 종류: ${type}\n희망 날짜: ${date}\n접수 시각: ${receivedAt}\n\n문의 내용:\n${detail}\n\n회신받을 연락처: ${reply}`;
  const replyIsEmail = EMAIL_PATTERN.test(reply);
  const replyHtml = replyIsEmail
    ? `<a href="mailto:${escapeHtml(reply)}" style="color:#1c6e8c;text-decoration:none">${escapeHtml(reply)}</a>`
    : escapeHtml(reply);
  const html = buildEmailHtml({
    eyebrow: "CHARTER REQUEST",
    heading: "새 섭외 문의가 도착했습니다",
    footer: "김승주 항해록 웹사이트의 섭외 문의 폼에서 자동 발송된 메일입니다.",
    rows: [
      ["문의 종류", escapeHtml(type)],
      ["희망 날짜", escapeHtml(date)],
      ["회신 연락처", replyHtml],
      ["접수 시각", escapeHtml(receivedAt)],
      ["문의 내용", `<div style="white-space:pre-wrap">${escapeHtml(detail)}</div>`],
    ],
  });

  try {
    const { error } = await resend.emails.send({
      from: CONTACT_FROM_EMAIL,
      to: CONTACT_TO_EMAIL,
      subject,
      text,
      html,
      // 연락처가 이메일이면 메일 앱에서 바로 '답장'으로 회신할 수 있다.
      replyTo: replyIsEmail ? reply : undefined,
    });

    if (error) {
      console.error("[contact] Resend error:", error);
      return json({ error: "메일 전송에 실패했어요. 잠시 후 다시 시도해 주세요." }, 502);
    }
  } catch (err) {
    console.error("[contact] Resend request failed:", err);
    return json({ error: "메일 전송에 실패했어요. 잠시 후 다시 시도해 주세요." }, 502);
  }

  return json({ ok: true }, 200);
}
