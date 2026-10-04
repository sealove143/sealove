import "server-only";

import type { Viewer } from "@/lib/auth/session";
import { CATEGORIES, GENDERS, type Category, type Gender, type Visibility } from "@/lib/consult";
import { buildEmailHtml, escapeHtml } from "@/lib/emailHtml";
import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, resend } from "@/lib/resend";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://react-five-lemon.vercel.app").replace(/\/$/, "");

interface NewQuestionMail {
  id: number;
  title: string;
  body: string;
  category: Category;
  gender: Gender;
  visibility: Visibility;
}

/** 새 질문이 올라오면 선장에게 메일로 알린다. 실패해도 예외를 던지지 않는다. */
export async function notifyNewQuestion(author: Viewer, question: NewQuestionMail) {
  if (!resend) return;

  const link = `${SITE_URL}/mentor/${question.id}`;
  const category = CATEGORIES[question.category];
  const gender = GENDERS[question.gender];
  const visibility = question.visibility === "private" ? "비공개" : "공개";
  const receivedAt = new Date().toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    dateStyle: "long",
    timeStyle: "short",
  });

  const text = `작성자: ${author.nickname} <${author.email}>\n성별: ${gender}\n분류: ${category}\n공개 설정: ${visibility}\n접수 시각: ${receivedAt}\n\n${question.body}\n\n게시판에서 답변하기: ${link}\n(이 메일에 답장하면 질문자 이메일로 바로 갑니다.)`;
  const html = buildEmailHtml({
    eyebrow: "NAVIGATION CONSULTATION",
    heading: "항해 상담실에 새 질문이 올라왔습니다",
    footer: "이 메일에 답장하면 질문자의 이메일로 바로 전송됩니다.",
    rows: [
      ["작성자", `${escapeHtml(author.nickname)} &lt;${escapeHtml(author.email)}&gt;`],
      ["성별", escapeHtml(gender)],
      ["분류", escapeHtml(category)],
      ["공개 설정", visibility],
      ["접수 시각", escapeHtml(receivedAt)],
      ["내용", `<div style="white-space:pre-wrap">${escapeHtml(question.body)}</div>`],
      ["게시판", `<a href="${link}" style="color:#1c6e8c">${link}</a>`],
    ],
  });

  try {
    const { error } = await resend.emails.send({
      from: CONTACT_FROM_EMAIL,
      to: CONTACT_TO_EMAIL,
      // 제목은 질문자가 적은 "궁금증 한마디" 그대로.
      subject: question.title,
      text,
      html,
      replyTo: author.email,
    });
    if (error) console.error("[consult] notify mail error:", error);
  } catch (err) {
    console.error("[consult] notify mail failed:", err);
  }
}
