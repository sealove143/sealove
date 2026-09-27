import "server-only";

import { Resend } from "resend";

// 문의 메일을 받을 주소. 페이지에는 노출되지 않고 서버에서만 사용된다.
export const CONTACT_TO_EMAIL = process.env.CONTACT_TO_EMAIL || "powertmdwn351@gmail.com";

// Resend에서 도메인을 인증하기 전에는 onboarding@resend.dev 로만 발송할 수 있다.
export const CONTACT_FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "김승주 항해록 <onboarding@resend.dev>";

export const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
