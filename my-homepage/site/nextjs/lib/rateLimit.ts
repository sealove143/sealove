import "server-only";

interface Bucket {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 6;

const buckets = new Map<string, Bucket>();

/**
 * 아주 단순한 인메모리 IP 기반 rate limit이다. Vercel 같은 서버리스 환경에서는
 * 인스턴스가 여러 개로 나뉘거나 재시작될 수 있어 완벽하게 동작하지 않는다.
 * 방문자가 늘어나면 Upstash Redis 등 외부 스토어 기반으로 교체할 것을 권장한다.
 */
export function checkRateLimit(
  key: string,
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const now = Date.now();

  // 메모리 누수를 막기 위해 가끔 만료된 항목을 정리한다.
  if (buckets.size > 5000) {
    for (const [bucketKey, bucket] of buckets) {
      if (now > bucket.resetAt) buckets.delete(bucketKey);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (bucket.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true };
}
