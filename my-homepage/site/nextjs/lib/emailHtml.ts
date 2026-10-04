import "server-only";

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface EmailLayout {
  eyebrow: string;
  heading: string;
  footer: string;
  rows: [label: string, valueHtml: string][];
}

// 메일 클라이언트(Gmail 등)는 외부 CSS를 지원하지 않아 표 레이아웃과 인라인 스타일만 사용한다.
export function buildEmailHtml({ eyebrow, heading, footer, rows }: EmailLayout) {
  const rowsHtml = rows
    .map(
      ([label, value], i) => `
        <tr>
          <th align="left" valign="top" width="120" style="padding:14px 16px;background:#f3eee1;color:#425468;font-size:13px;font-weight:600;border-top:${i === 0 ? "0" : "1px solid #e4dccb"}">${label}</th>
          <td valign="top" style="padding:14px 16px;color:#132234;font-size:14px;line-height:1.7;border-top:${i === 0 ? "0" : "1px solid #e4dccb"}">${value}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="ko">
<body style="margin:0;padding:0;background:#f5f5f2">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f2;padding:32px 12px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e4dccb;border-radius:8px;overflow:hidden;font-family:'Apple SD Gothic Neo','Malgun Gothic','Noto Sans KR',sans-serif">
        <tr>
          <td style="background:#0e3a5c;padding:22px 24px">
            <div style="color:#c99a4f;font-size:11px;letter-spacing:2px;font-weight:600">${eyebrow}</div>
            <div style="color:#ffffff;font-size:19px;font-weight:700;margin-top:6px">${heading}</div>
          </td>
        </tr>
        <tr><td style="padding:0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rowsHtml}
          </table>
        </td></tr>
        <tr>
          <td style="padding:14px 24px;background:#fafaf7;border-top:1px solid #e4dccb;color:#6b7c8d;font-size:12px">
            ${footer}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
