import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";

import { anthropic, MENTOR_MAX_TOKENS, MENTOR_MODEL } from "@/lib/anthropic";
import { buildMentorSystemPrompt } from "@/lib/profile";
import { checkRateLimit } from "@/lib/rateLimit";
import type { ChatTurn, MentorProfile } from "@/lib/types";

export const runtime = "nodejs";

const MAX_QUESTION_LENGTH = 500;
const MAX_USER_TURNS = 6;

interface MentorRequestBody {
  messages?: ChatTurn[];
  profile?: MentorProfile;
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function sseEvent(payload: Record<string, unknown>) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

function friendlyErrorMessage(err: unknown): string {
  if (err instanceof Anthropic.RateLimitError) {
    return "지금 요청이 많아요. 잠시 후 다시 시도해 주세요.";
  }
  if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
    return "서버 설정 문제로 상담 기능을 사용할 수 없어요. 관리자에게 문의해 주세요.";
  }
  if (err instanceof Anthropic.APIConnectionError) {
    return "네트워크 연결에 문제가 있어요. 잠시 후 다시 시도해 주세요.";
  }
  if (err instanceof Anthropic.APIError) {
    return "잠시 문제가 생겼어요. 다시 시도해 주세요.";
  }
  return "잠시 문제가 생겼어요. 다시 시도해 주세요.";
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError(
      "현재 이 사이트에서는 AI 상담 기능을 사용할 수 없어요. (서버에 API 키가 설정되지 않았습니다)",
      503,
    );
  }

  const forwardedFor = req.headers.get("x-forwarded-for");
  const clientIp = forwardedFor?.split(",")[0]?.trim() || "unknown";
  const rate = checkRateLimit(clientIp);
  if (!rate.allowed) {
    return jsonError("지금 요청이 많아요. 잠시 후 다시 시도해 주세요.", 429);
  }

  let body: MentorRequestBody;
  try {
    body = (await req.json()) as MentorRequestBody;
  } catch {
    return jsonError("요청 형식이 올바르지 않습니다.", 400);
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  const lastTurn = messages[messages.length - 1];
  const userTurnCount = messages.filter((m) => m.role === "user").length;

  if (!lastTurn || lastTurn.role !== "user" || !lastTurn.content?.trim()) {
    return jsonError("질문을 입력해 주세요.", 400);
  }
  if (lastTurn.content.length > MAX_QUESTION_LENGTH) {
    return jsonError(`질문은 ${MAX_QUESTION_LENGTH}자 이내로 입력해 주세요.`, 400);
  }
  if (userTurnCount > MAX_USER_TURNS) {
    return jsonError(
      `상담은 한 세션에 최대 ${MAX_USER_TURNS}번까지 질문할 수 있어요. 새로고침 후 다시 시작해 주세요.`,
      400,
    );
  }

  const system = buildMentorSystemPrompt(body.profile ?? {});
  const anthropicMessages = messages
    .filter((m): m is ChatTurn => m.role === "user" || m.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let sentAnyText = false;
      try {
        const anthropicStream = anthropic.messages.stream({
          model: MENTOR_MODEL,
          max_tokens: MENTOR_MAX_TOKENS,
          system,
          messages: anthropicMessages,
        });

        anthropicStream.on("text", (delta) => {
          sentAnyText = true;
          controller.enqueue(encoder.encode(sseEvent({ type: "text", delta })));
        });

        const finalMessage = await anthropicStream.finalMessage();

        if (!sentAnyText && finalMessage.stop_reason === "refusal") {
          controller.enqueue(
            encoder.encode(
              sseEvent({
                type: "error",
                message: "이 질문에는 답변하기 어려워요. 다른 방식으로 다시 물어봐 주세요.",
              }),
            ),
          );
        } else if (!sentAnyText) {
          controller.enqueue(
            encoder.encode(
              sseEvent({
                type: "error",
                message: "답변을 생성하지 못했어요. 조금 더 구체적으로 질문해 주세요.",
              }),
            ),
          );
        } else {
          controller.enqueue(encoder.encode(sseEvent({ type: "done" })));
        }
      } catch (err) {
        controller.enqueue(
          encoder.encode(sseEvent({ type: "error", message: friendlyErrorMessage(err) })),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream; charset=utf-8",
      "cache-control": "no-store",
      connection: "keep-alive",
    },
  });
}
