// 클라이언트(MentorChat)와 서버(API Route)가 함께 사용하는 타입이라
// "server-only" 코드(lib/profile.ts, lib/anthropic.ts)와는 분리해 둔다.

export type ChatRole = "user" | "assistant";

export interface ChatTurn {
  role: ChatRole;
  content: string;
}

export interface MentorProfile {
  gender?: string;
  age?: string;
  situation?: string;
}
